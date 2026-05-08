const { Bill, BillingEpisode, Patient, Hospital, User, BillCharge, ChargeMaster, OpdVisit, IpdAdmission, PaymentAdvance, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateSequentialNumber } = require('../utils/numberGenerator');

class BillController {
  // Generate bill from episode charges
  static async generateBill(req, res) {
    const t = await sequelize.transaction();
    try {
      const { episode_id, discount_amount = 0, generated_by, hospital_id } = req.body;
      
      if (!episode_id || !generated_by || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'episode_id, generated_by, and hospital_id are required'
        });
      }

      // Get episode details
      const episode = await BillingEpisode.findByPk(episode_id, {
        include: [
          { model: Patient, as: 'patient' },
          { model: OpdVisit, as: 'opdVisit' },
          { model: IpdAdmission, as: 'ipdAdmission' }
        ],
        transaction: t
      });

      if (!episode) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Episode not found' });
      }

      // Prevent duplicate bill for the same episode
      const existingBill = await Bill.findOne({
        where: { episode_id, is_active: true },
        transaction: t
      });
      if (existingBill) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Bill already exists for this episode: ${existingBill.bill_number}`,
          data: existingBill
        });
      }

      // Get all charges for this episode
      const charges = await BillCharge.findAll({
        where: { episode_id, is_active: true },
        transaction: t
      });

      if (charges.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'No charges found for this episode' });
      }

      // Calculate totals
      const gross_amount = charges.reduce((sum, charge) => sum + parseFloat(charge.net_amount), 0);
      const disc_amount = parseFloat(discount_amount) || 0;
      const taxable_amount = gross_amount - disc_amount;
      const tax_amount = charges.reduce((sum, charge) => sum + parseFloat(charge.gst_amount || 0), 0);
      const net_amount = taxable_amount + tax_amount;

      // Get advance payments for IPD with lock
      let advance_adjusted = 0;
      let advances = [];
      if (episode.episode_type === 'IPD' && episode.admission_id) {
        advances = await PaymentAdvance.findAll({
          where: {
            admission_id: episode.admission_id,
            is_active: true,
            balance_amount: { [Op.gt]: 0 }
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        advance_adjusted = advances.reduce((sum, adv) => sum + parseFloat(adv.balance_amount), 0);
      }

      const balance_amount = net_amount - advance_adjusted;
      const payment_status = balance_amount <= 0 ? 'Paid' : 'Unpaid';

      const bill_number = await generateSequentialNumber({
        model: Bill,
        field: 'bill_number',
        prefix: 'BILL',
        hospitalId: hospital_id,
        transaction: t
      });

      const bill = await Bill.create({
        bill_number,
        episode_id,
        patient_id: episode.patient_id,
        uhid: episode.uhid,
        bill_type: episode.episode_type,
        generated_by,
        hospital_id,
        gross_amount,
        discount_amount: disc_amount,
        taxable_amount,
        tax_amount,
        net_amount,
        advance_adjusted,
        balance_amount,
        payment_status
      }, { transaction: t });

      // Consume advances (already locked above)
      let remainingToAdjust = advance_adjusted;
      for (const advance of advances) {
        if (remainingToAdjust <= 0) break;
        const adjustAmount = Math.min(remainingToAdjust, parseFloat(advance.balance_amount));
        await advance.update({
          utilized_amount: parseFloat(advance.utilized_amount) + adjustAmount,
          balance_amount: parseFloat(advance.balance_amount) - adjustAmount
        }, { transaction: t });
        remainingToAdjust -= adjustAmount;
      }

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Bill generated successfully',
        data: {
          ...bill.toJSON(),
          patient: episode.patient,
          charges: charges.length
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const { episode_id, patient_id, bill_type, generated_by, hospital_id, gross_amount, discount_amount, tax_amount, advance_adjusted, paid_amount, ...otherData } = req.body;

      if (!episode_id || !patient_id || !bill_type || !generated_by || !hospital_id || gross_amount === undefined) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'episode_id, patient_id, bill_type, generated_by, hospital_id, and gross_amount are required'
        });
      }

      const bill_number = await generateSequentialNumber({
        model: Bill,
        field: 'bill_number',
        prefix: 'BILL',
        hospitalId: hospital_id,
        transaction: t
      });

      // Calculate amounts
      const disc_amount = discount_amount || 0;
      const taxable_amount = gross_amount - disc_amount;
      const tax_amt = tax_amount || 0;
      const net_amount = taxable_amount + tax_amt;
      const adv_adjusted = advance_adjusted || 0;
      const paid_amt = paid_amount || 0;
      const balance_amount = net_amount - adv_adjusted - paid_amt;
      
      // Determine payment status
      let payment_status = 'Unpaid';
      if (balance_amount <= 0) payment_status = 'Paid';
      else if (paid_amt > 0 || adv_adjusted > 0) payment_status = 'Partial';

      const bill = await Bill.create({
        bill_number,
        episode_id,
        patient_id,
        bill_type,
        generated_by,
        hospital_id,
        ...otherData,
        gross_amount,
        discount_amount: disc_amount,
        taxable_amount,
        tax_amount: tax_amt,
        net_amount,
        advance_adjusted: adv_adjusted,
        paid_amount: paid_amt,
        balance_amount,
        payment_status
      }, { transaction: t });

      await t.commit();

      const episode = await BillingEpisode.findByPk(episode_id);
      const patient = await Patient.findByPk(patient_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const user = await User.findByPk(generated_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({ 
        success: true, 
        message: 'Bill created successfully',
        data: {
          ...bill.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          generatedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get bill with detailed charges
  static async getBillWithCharges(req, res) {
    try {
      const bill = await Bill.findByPk(req.params.id, {
        include: [
          { 
            model: BillingEpisode, 
            as: 'billingEpisode',
            include: [
              { model: Patient, as: 'patient' },
              { model: OpdVisit, as: 'opdVisit' },
              { model: IpdAdmission, as: 'ipdAdmission' }
            ]
          },
          { model: Patient, as: 'patient' },
          { model: Hospital, as: 'hospital' },
          { model: User, as: 'generatedBy', attributes: { exclude: ['password'] } }
        ]
      });
      
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      // Get charges for this episode
      const charges = await BillCharge.findAll({
        where: { episode_id: bill.episode_id, is_active: true },
        order: [['charge_date', 'ASC']]
      });

      res.json({ 
        success: true, 
        data: {
          ...bill.toJSON(),
          charges
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { payment_status, bill_type, patient_id, uhid, search } = req.query;
      const where = { is_active: true };
      
      if (payment_status) where.payment_status = payment_status;
      if (bill_type) where.bill_type = bill_type;
      if (patient_id) where.patient_id = patient_id;
      if (uhid) where.uhid = { [Op.like]: `%${uhid}%` };

      const bills = await Bill.findAll({ 
        where,
        include: [
          { 
            model: Patient, 
            as: 'patient',
            where: search ? {
              [Op.or]: [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { uhid: { [Op.like]: `%${search}%` } }
              ]
            } : undefined
          },
          { model: BillingEpisode, as: 'billingEpisode' },
          { model: Hospital, as: 'hospital' },
          { model: User, as: 'generatedBy', attributes: { exclude: ['password'] } }
        ],
        order: [['bill_date', 'DESC']]
      });

      res.json({ success: true, data: bills });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const bill = await Bill.findOne({ where: { bill_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const episode = await BillingEpisode.findByPk(bill.episode_id);
      const patient = await Patient.findByPk(bill.patient_id);
      const hospital = await Hospital.findByPk(bill.hospital_id);
      const user = await User.findByPk(bill.generated_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...bill.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          generatedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, gross_amount, discount_amount, tax_amount, advance_adjusted, paid_amount, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await Bill.update(
          { is_active: false },
          { where: { bill_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        const deactivatedBill = await Bill.findOne({ where: { bill_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Bill deactivated successfully', data: deactivatedBill });
      }

      const existingBill = await Bill.findOne({ where: { bill_id: req.params.id, hospital_id: req.hospitalId } });
      if (!existingBill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const gross_amt = gross_amount !== undefined ? gross_amount : existingBill.gross_amount;
      const disc_amount = discount_amount !== undefined ? discount_amount : existingBill.discount_amount;
      const taxable_amount = gross_amt - disc_amount;
      const tax_amt = tax_amount !== undefined ? tax_amount : existingBill.tax_amount;
      const net_amount = taxable_amount + tax_amt;
      const adv_adjusted = advance_adjusted !== undefined ? advance_adjusted : existingBill.advance_adjusted;
      const paid_amt = paid_amount !== undefined ? paid_amount : existingBill.paid_amount;
      const balance_amount = net_amount - adv_adjusted - paid_amt;
      
      let payment_status = 'Unpaid';
      if (balance_amount <= 0) payment_status = 'Paid';
      else if (paid_amt > 0 || adv_adjusted > 0) payment_status = 'Partial';

      const [updated] = await Bill.update(
        { 
          ...updateData,
          gross_amount: gross_amt,
          discount_amount: disc_amount,
          taxable_amount,
          tax_amount: tax_amt,
          net_amount,
          advance_adjusted: adv_adjusted,
          paid_amount: paid_amt,
          balance_amount,
          payment_status,
          is_active: is_active !== undefined ? is_active : true 
        },
        { where: { bill_id: req.params.id, hospital_id: req.hospitalId } }
      );

      const updatedBill = await Bill.findOne({ where: { bill_id: req.params.id, hospital_id: req.hospitalId } });
      const episode = await BillingEpisode.findByPk(updatedBill.episode_id);
      const patient = await Patient.findByPk(updatedBill.patient_id);
      const hospital = await Hospital.findByPk(updatedBill.hospital_id);
      const user = await User.findByPk(updatedBill.generated_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...updatedBill.toJSON(),
          billingEpisode: episode ? { episode_id: episode.episode_id, episode_type: episode.episode_type, status: episode.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          generatedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Bill.destroy({
        where: { bill_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      res.json({ success: true, message: 'Bill permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get pending bills for payment
  static async getPendingBills(req, res) {
    try {
      const { patient_id, uhid } = req.query;
      const where = { 
        is_active: true,
        payment_status: { [Op.in]: ['Unpaid', 'Partial'] }
      };
      
      if (patient_id) where.patient_id = patient_id;
      if (uhid) where.uhid = uhid;

      const bills = await Bill.findAll({ 
        where,
        include: [
          { model: Patient, as: 'patient' },
          { model: BillingEpisode, as: 'billingEpisode' }
        ],
        order: [['bill_date', 'DESC']]
      });

      res.json({ success: true, data: bills });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get billing summary
  static async getBillingSummary(req, res) {
    try {
      const { start_date, end_date, bill_type } = req.query;
      const where = { is_active: true };
      
      if (start_date && end_date) {
        where.bill_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }
      if (bill_type) where.bill_type = bill_type;

      const summary = await Bill.findAll({
        where,
        attributes: [
          'payment_status',
          [Bill.sequelize.fn('COUNT', Bill.sequelize.col('bill_id')), 'count'],
          [Bill.sequelize.fn('SUM', Bill.sequelize.col('gross_amount')), 'gross_total'],
          [Bill.sequelize.fn('SUM', Bill.sequelize.col('net_amount')), 'net_total'],
          [Bill.sequelize.fn('SUM', Bill.sequelize.col('paid_amount')), 'paid_total'],
          [Bill.sequelize.fn('SUM', Bill.sequelize.col('balance_amount')), 'balance_total']
        ],
        group: ['payment_status']
      });

      const totalBills = await Bill.count({ where });
      const totalRevenue = await Bill.sum('net_amount', { where });
      const totalCollected = await Bill.sum('paid_amount', { where });
      const totalPending = await Bill.sum('balance_amount', { where });

      res.json({ 
        success: true, 
        data: {
          summary,
          totals: {
            total_bills: totalBills,
            total_revenue: totalRevenue || 0,
            total_collected: totalCollected || 0,
            total_pending: totalPending || 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get bill by episode ID
  static async getByEpisodeId(req, res) {
    try {
      const bill = await Bill.findOne({
        where: { 
          episode_id: req.params.episodeId,
          is_active: true 
        },
        include: [
          { model: Patient, as: 'patient' },
          { model: BillingEpisode, as: 'billingEpisode' },
          { model: Hospital, as: 'hospital' },
          { model: User, as: 'generatedBy', attributes: { exclude: ['password'] } }
        ],
        order: [['bill_date', 'DESC']]
      });

      if (!bill) {
        return res.status(404).json({ 
          success: false, 
          message: 'No bill found for this episode' 
        });
      }

      res.json({ success: true, data: bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByAdmissionId(req, res) {
    try {
      const { admissionId } = req.params;
      // Find billing episode for this admission
      const episode = await BillingEpisode.findOne({
        where: { admission_id: admissionId, is_active: true }
      });

      if (!episode) {
        return res.status(404).json({ success: false, message: 'No billing episode found for this admission' });
      }

      const bill = await Bill.findOne({
        where: { episode_id: episode.episode_id, is_active: true },
        order: [['bill_date', 'DESC']]
      });

      if (!bill) {
        return res.status(404).json({ success: false, message: 'No bill generated yet for this admission' });
      }

      res.json({ success: true, data: bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = BillController;
