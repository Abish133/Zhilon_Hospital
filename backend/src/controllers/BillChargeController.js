const { BillCharge, BillingEpisode, Hospital, ChargeMaster, sequelize } = require('../models');
const { Op } = require('sequelize');

class BillChargeController {
  // Add charge from charge master with transaction support
  static async addChargeFromMaster(req, res) {
    const t = await sequelize.transaction();
    try {
      const { episode_id, charge_master_id, quantity = 1, hospital_id, discount_percent = 0 } = req.body;
      
      if (!episode_id || !charge_master_id || !hospital_id) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'episode_id, charge_master_id, and hospital_id are required' 
        });
      }

      // Lock the episode for atomic operation
      const episode = await BillingEpisode.findByPk(episode_id, { 
        lock: t.LOCK.UPDATE,
        transaction: t 
      });

      if (!episode) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Episode not found' });
      }

      // Get charge master details
      const chargeMaster = await ChargeMaster.findByPk(charge_master_id, { transaction: t });
      if (!chargeMaster) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Charge master not found' });
      }

      const qty = parseInt(quantity);
      const rate = parseFloat(chargeMaster.amount);
      const amount = qty * rate;
      const disc_percent = parseFloat(discount_percent);
      const discount_amount = (amount * disc_percent) / 100;
      const taxable_amount = amount - discount_amount;
      const gst_pct = parseFloat(chargeMaster.gst_percentage || 0);
      const gst_amount = (taxable_amount * gst_pct) / 100;
      const net_amount = taxable_amount + gst_amount;

      const billCharge = await BillCharge.create({
        episode_id,
        hospital_id,
        service_type: chargeMaster.category,
        service_id: charge_master_id,
        description: chargeMaster.charge_name,
        quantity: qty,
        rate,
        amount,
        discount_percent: disc_percent,
        discount_amount,
        taxable_amount,
        gst_percent: gst_pct,
        gst_amount,
        net_amount,
        payment_status: 'Unpaid',
        paid_amount: 0,
        balance_amount: net_amount
      }, { transaction: t });

      // Verify episode is still open (Open/Closed are the only episode states)
      if (episode.status !== 'Open') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Episode is not open'
        });
      }

      // Update episode total amount
      const currentTotal = parseFloat(episode.total_amount || 0);
      await episode.update(
        { total_amount: currentTotal + net_amount },
        { transaction: t }
      );

      const hospital = await Hospital.findByPk(hospital_id, { transaction: t });

      await t.commit();

      res.status(201).json({ 
        success: true, 
        message: 'Charge added successfully',
        data: {
          ...billCharge.toJSON(),
          chargeMaster: {
            charge_code: chargeMaster.charge_code,
            charge_name: chargeMaster.charge_name,
            category: chargeMaster.category
          },
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status, total_amount: episode.total_amount } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { episode_id, service_type, rate, quantity, hospital_id, discount_percent, gst_percent, ...otherData } = req.body;
      
      if (!episode_id || !service_type || !rate || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'episode_id, service_type, rate, and hospital_id are required' 
        });
      }

      const qty = quantity || 1;
      const amount = qty * rate;
      const disc_percent = discount_percent || 0;
      const discount_amount = (amount * disc_percent) / 100;
      const taxable_amount = amount - discount_amount;
      const gst_pct = gst_percent || 0;
      const gst_amount = (taxable_amount * gst_pct) / 100;
      const net_amount = taxable_amount + gst_amount;

      const billCharge = await BillCharge.create({
        episode_id,
        service_type,
        rate,
        hospital_id,
        ...otherData,
        quantity: qty,
        amount,
        discount_percent: disc_percent,
        discount_amount,
        taxable_amount,
        gst_percent: gst_pct,
        gst_amount,
        net_amount,
        payment_status: 'Unpaid',
        paid_amount: 0,
        balance_amount: net_amount
      });

      const episode = await BillingEpisode.findByPk(episode_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Bill charge created successfully',
        data: {
          ...billCharge.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get charges by episode with totals
  static async getChargesByEpisode(req, res) {
    try {
      const { episode_id } = req.params;
      
      const charges = await BillCharge.findAll({
        where: { episode_id, is_active: true },
        order: [['charge_date', 'ASC']]
      });

      const totals = {
        gross_amount: charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0),
        discount_amount: charges.reduce((sum, charge) => sum + parseFloat(charge.discount_amount), 0),
        taxable_amount: charges.reduce((sum, charge) => sum + parseFloat(charge.taxable_amount), 0),
        tax_amount: charges.reduce((sum, charge) => sum + parseFloat(charge.gst_amount || 0), 0),
        net_amount: charges.reduce((sum, charge) => sum + parseFloat(charge.net_amount), 0)
      };

      res.json({ 
        success: true, 
        data: {
          charges,
          totals,
          count: charges.length
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get department summary grouping active charges by episode
  static async getDepartmentSummary(req, res) {
    try {
      const { type } = req.query; // 'Pharmacy', 'Investigation', 'Consultation', etc.
      const hospital_id = req.user?.hospital_id || req.hospitalId;

      if (!type) {
        return res.status(400).json({ success: false, message: 'Department type filter is required' });
      }

      // We only care about active charges for the specific department that still have a balance > 0
      const charges = await BillCharge.findAll({
        where: {
          hospital_id,
          service_type: type,
          is_active: true,
          balance_amount: { [require('sequelize').Op.gt]: 0 }
        },
        order: [['charge_date', 'ASC']]
      });

      // Group by episode_id
      const episodeGroups = {};
      for (const charge of charges) {
        const epId = charge.episode_id;
        if (!episodeGroups[epId]) {
          episodeGroups[epId] = {
            episode_id: epId,
            charges: [],
            department_net_amount: 0,
            department_paid_amount: 0,
            department_balance_amount: 0
          };
        }
        episodeGroups[epId].charges.push(charge);
        episodeGroups[epId].department_net_amount += parseFloat(charge.net_amount || 0);
        episodeGroups[epId].department_paid_amount += parseFloat(charge.paid_amount || 0);
        episodeGroups[epId].department_balance_amount += parseFloat(charge.balance_amount || 0);
      }

      // Fetch patient and episode details for each grouped episode
      const { Patient } = require('../models');
      const results = [];
      for (const epId in episodeGroups) {
        const group = episodeGroups[epId];
        const episode = await BillingEpisode.findByPk(epId);
        let patient = null;
        if (episode) {
          patient = await Patient.findByPk(episode.patient_id);
        }
        results.push({
          ...group,
          episode_type: episode?.episode_type,
          start_date: episode?.start_date,
          status: episode?.status,
          patient: patient ? {
            first_name: patient.first_name,
            last_name: patient.last_name,
            uhid: patient.uhid,
            mobile_number: patient.mobile_number
          } : null
        });
      }

      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { episode_id, service_type } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (episode_id) where.episode_id = episode_id;
      if (service_type) where.service_type = service_type;

      const charges = await BillCharge.findAll({ 
        where,
        order: [['charge_date', 'DESC']]
      });

      const chargesWithDetails = await Promise.all(
        charges.map(async (charge) => {
          const episode = await BillingEpisode.findByPk(charge.episode_id);
          const hospital = await Hospital.findByPk(charge.hospital_id);
          
          return {
            ...charge.toJSON(),
            billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: chargesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const billCharge = await BillCharge.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!billCharge) {
        return res.status(404).json({ success: false, message: 'Bill charge not found' });
      }

      const episode = await BillingEpisode.findByPk(billCharge.episode_id);
      const hospital = await Hospital.findByPk(billCharge.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...billCharge.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, quantity, rate, discount_percent, gst_percent, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await BillCharge.update(
          { is_active: false },
          { where: { charge_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Bill charge not found' });
        }
        const deactivatedCharge = await BillCharge.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Bill charge deactivated successfully', data: deactivatedCharge });
      }

      const existingCharge = await BillCharge.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
      if (!existingCharge) {
        return res.status(404).json({ success: false, message: 'Bill charge not found' });
      }

      const qty = quantity !== undefined ? quantity : existingCharge.quantity;
      const rateValue = rate !== undefined ? rate : existingCharge.rate;
      const amount = qty * rateValue;
      const disc_percent = discount_percent !== undefined ? discount_percent : existingCharge.discount_percent;
      const discount_amount = (amount * disc_percent) / 100;
      const taxable_amount = amount - discount_amount;
      const gst_pct = gst_percent !== undefined ? gst_percent : existingCharge.gst_percent;
      const gst_amount = (taxable_amount * gst_pct) / 100;
      const net_amount = taxable_amount + gst_amount;
      
      const balance_amount = net_amount - parseFloat(existingCharge.paid_amount || 0);
      let payment_status = 'Unpaid';
      if (balance_amount <= 0) payment_status = 'Paid';
      else if (parseFloat(existingCharge.paid_amount || 0) > 0) payment_status = 'Partial';

      const [updated] = await BillCharge.update(
        { 
          ...updateData, 
          quantity: qty,
          rate: rateValue,
          amount,
          discount_percent: disc_percent,
          discount_amount,
          taxable_amount,
          gst_percent: gst_pct,
          gst_amount,
          net_amount,
          balance_amount,
          payment_status,
          is_active: is_active !== undefined ? is_active : true 
        },
        { where: { charge_id: req.params.id, hospital_id: req.hospitalId } }
      );

      const updatedCharge = await BillCharge.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
      const episode = await BillingEpisode.findByPk(updatedCharge.episode_id);
      const hospital = await Hospital.findByPk(updatedCharge.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedCharge.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    const t = await sequelize.transaction();
    try {
      const charge = await BillCharge.findOne({
        where: { charge_id: req.params.id, hospital_id: req.hospitalId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!charge) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Bill charge not found' });
      }

      const episode = await BillingEpisode.findByPk(charge.episode_id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (episode && episode.status !== 'Open') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot delete charge: episode is not open'
        });
      }

      const chargeNet = parseFloat(charge.net_amount || 0);

      await charge.destroy({ transaction: t });

      if (episode) {
        const currentTotal = parseFloat(episode.total_amount || 0);
        const newTotal = Math.max(0, currentTotal - chargeNet);
        await episode.update({ total_amount: newTotal }, { transaction: t });
      }

      await t.commit();
      res.json({ success: true, message: 'Bill charge permanently deleted' });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = BillChargeController;
