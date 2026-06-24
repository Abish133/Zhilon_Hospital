const { PharmacySale, PharmacySaleDetail, Patient, Medicine, MedicineBatch, OpdPrescription, BillingEpisode, BillCharge, Hospital } = require('../models');
const { Op } = require('sequelize');

class PharmacySaleController {
  static async dispenseMedicine(req, res) {
    const transaction = await PharmacySale.sequelize.transaction();
    try {
      const { uhid, prescription_id, prescription_ids, admission_id, medicines, dispensed_by, hospital_id, payment_mode } = req.body;

      if (!uhid || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !hospital_id) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'uhid, medicines array, and hospital_id are required' });
      }

      const patient = await Patient.findOne({ where: { uhid, hospital_id } });
      if (!patient) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      // Self-purchase pharmacies: the patient buys & pays at the counter, so the
      // dispensed medicines are NOT posted to the hospital bill (OPD/IPD episode).
      const hospital = await Hospital.findByPk(hospital_id, { transaction });
      const selfPurchase = hospital?.pharmacy_mode === 'self_purchase';
      // Hospital-wide default GST (Settings → Tax Rate). Applied to medicines that
      // don't carry their own gst_percentage; an explicit 0 stays exempt.
      const defaultGst = parseFloat(hospital?.settings?.tax_rate) || 0;

      let prescription = null;
      let visit_type = 'Walk-in';
      let visit_id = null;

      if (admission_id) {
        visit_type = 'IPD';
        visit_id = admission_id;
      } else if (prescription_id) {
        prescription = await OpdPrescription.findByPk(prescription_id);
        if (prescription) {
          visit_type = 'OPD';
          visit_id = prescription.visit_id;
        }
      }

      let totalAmount = 0;     // gross before tax
      let totalTax = 0;        // accumulated GST across line items
      const saleDetails = [];

      for (const med of medicines) {
        const { medicine_id, quantity } = med;

        const medicine = await Medicine.findByPk(medicine_id);
        if (!medicine) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Medicine ID ${medicine_id} not found` });
        }

        const today = new Date().toISOString().slice(0, 10);
        const batch = await MedicineBatch.findOne({
          where: {
            medicine_id,
            available_quantity: { [Op.gte]: quantity },
            is_active: true,
            hospital_id,
            // Never dispense expired stock; FEFO still picks the nearest valid expiry.
            expiry_date: { [Op.gte]: today }
          },
          order: [['expiry_date', 'ASC']],
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (!batch) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: `No in-stock, non-expired batch available for ${medicine.medicine_name}` });
        }

        const rate = parseFloat(batch.mrp || batch.selling_rate || medicine.mrp || 0);
        if (!rate || rate <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Price not set for ${medicine.medicine_name}. Please set MRP or selling rate on batch.`
          });
        }
        const amount = rate * quantity;
        const gstPct = medicine.gst_percentage != null ? parseFloat(medicine.gst_percentage) : defaultGst;
        const lineTax = +(amount * gstPct / 100).toFixed(2);
        totalAmount += amount;
        totalTax += lineTax;

        saleDetails.push({
          medicine_id,
          batch_id: batch.batch_id,
          medicine_name: medicine.medicine_name,
          quantity,
          rate,
          amount,
          gst_percentage: gstPct,
          hospital_id
        });

        batch.available_quantity -= quantity;
        await batch.save({ transaction });
      }

      totalTax = +totalTax.toFixed(2);
      const netAmount = +(totalAmount + totalTax).toFixed(2);

      const pharmacySale = await PharmacySale.create({
        patient_id: patient.patient_id,
        uhid,
        visit_type,
        visit_id,
        prescription_id: prescription_id || null,
        sale_date: new Date(),
        total_amount: totalAmount,
        discount_amount: 0,
        tax_amount: totalTax,
        net_amount: netAmount,
        // Payment mode at the point of sale:
        //  - self-purchase pharmacy: the patient always pays at the counter (any
        //    visit type), so use the passed mode (default Cash).
        //  - in-house pharmacy: only walk-in counter sales settle here; OPD/IPD
        //    sales are collected by the billing module, so they stay 'Pending'.
        payment_mode: selfPurchase
          ? (payment_mode || 'Cash')
          : ((visit_type === 'Walk-in' && payment_mode) ? payment_mode : 'Pending'),
        dispensed_by,
        hospital_id
      }, { transaction });

      for (const detail of saleDetails) {
        await PharmacySaleDetail.create({
          sale_id: pharmacySale.sale_id,
          ...detail
        }, { transaction });
      }

      if (!selfPurchase && (visit_type === 'OPD' || visit_type === 'IPD') && visit_id) {
        const episodeWhere = visit_type === 'IPD'
          ? { admission_id: visit_id, status: 'Open' }
          : { opd_visit_id: visit_id, status: 'Open' };
        const billingEpisode = await BillingEpisode.findOne({ where: episodeWhere, transaction });

        if (billingEpisode) {
          // Effective GST % = totalTax / totalAmount * 100 (weighted average across line items)
          const effectiveGstPct = totalAmount > 0 ? +((totalTax / totalAmount) * 100).toFixed(2) : 0;
          await BillCharge.create({
            episode_id: billingEpisode.episode_id,
            hospital_id,
            charge_date: new Date(),
            service_type: 'Pharmacy',
            service_id: pharmacySale.sale_id,
            description: 'Pharmacy charges',
            quantity: 1,
            rate: totalAmount,
            amount: totalAmount,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: totalAmount,
            gst_percent: effectiveGstPct,
            gst_amount: totalTax,
            net_amount: netAmount,
            payment_status: 'Unpaid',
            paid_amount: 0,
            balance_amount: netAmount
          }, { transaction });
        }
      }

      // Mark dispensed prescription lines so they drop off the dispense screen.
      // Accept an array (preferred) or fall back to the single linked prescription.
      const toMark = Array.isArray(prescription_ids) && prescription_ids.length
        ? prescription_ids
        : (prescription_id ? [prescription_id] : []);
      if (toMark.length) {
        await OpdPrescription.update(
          { dispense_status: 'Dispensed' },
          { where: { prescription_id: toMark, hospital_id }, transaction }
        );
      }

      await transaction.commit();

      const saleWithDetails = await PharmacySale.findByPk(pharmacySale.sale_id, {
        include: [{ model: PharmacySaleDetail, as: 'details' }]
      });

      res.status(201).json({ 
        success: true, 
        message: 'Medicine dispensed successfully',
        data: saleWithDetails
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createSale(req, res) {
    try {
      const sale = await PharmacySale.create(req.body);
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllSales(req, res) {
    try {
      const { uhid, patient_id, start_date, end_date } = req.query;
      const where = { is_active: true };

      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      if (uhid) where.uhid = uhid;
      if (patient_id) where.patient_id = patient_id;
      if (start_date && end_date) {
        where.sale_date = { [Op.between]: [start_date, end_date] };
      }

      const sales = await PharmacySale.findAll({ 
        where,
        include: [
          { model: PharmacySaleDetail, as: 'details' },
          { model: Patient, as: 'patient' },
          { model: Hospital, as: 'hospital' }
        ],
        order: [['sale_date', 'DESC']]
      });

      res.json({ success: true, data: sales });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSaleById(req, res) {
    try {
      const sale = await PharmacySale.findOne({
        where: { sale_id: req.params.id, hospital_id: req.hospitalId },
        include: [
          { model: PharmacySaleDetail, as: 'details' },
          { model: Patient, as: 'patient' },
          { model: Hospital, as: 'hospital' }
        ]
      });

      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSale(req, res) {
    try {
      const [updated] = await PharmacySale.update(req.body, {
        where: { sale_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      const sale = await PharmacySale.findOne({ where: { sale_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteSale(req, res) {
    const transaction = await PharmacySale.sequelize.transaction();
    try {
      const sale = await PharmacySale.findOne({
        where: { sale_id: req.params.id, hospital_id: req.hospitalId },
        include: [{ model: PharmacySaleDetail, as: 'details' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      // Restore stock to each batch
      for (const detail of (sale.details || [])) {
        const batch = await MedicineBatch.findByPk(detail.batch_id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (batch) {
          batch.available_quantity = (batch.available_quantity || 0) + (detail.quantity || 0);
          await batch.save({ transaction });
        }
      }

      // Remove associated bill charge if any
      await BillCharge.destroy({
        where: { service_type: 'Pharmacy', service_id: sale.sale_id },
        transaction
      });

      await PharmacySaleDetail.destroy({ where: { sale_id: sale.sale_id }, transaction });
      await sale.destroy({ transaction });

      await transaction.commit();
      res.json({ success: true, message: 'Sale deleted and stock restored' });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async returnIpdMedicine(req, res) {
    const transaction = await PharmacySale.sequelize.transaction();
    try {
      const { sale_id, sale_detail_id, quantity_returned } = req.body;
      const hospital_id = req.hospitalId || req.body.hospital_id;

      if (!sale_id || !sale_detail_id || !quantity_returned || quantity_returned <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Invalid return parameters' });
      }

      const sale = await PharmacySale.findOne({
        where: { sale_id, hospital_id },
        include: [{ model: PharmacySaleDetail, as: 'details' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      if (sale.visit_type !== 'IPD') {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Return is only supported for IPD sales via this endpoint' });
      }

      const detail = sale.details.find(d => d.sale_detail_id === sale_detail_id);
      if (!detail) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Sale detail not found' });
      }

      if (quantity_returned > detail.quantity) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Return quantity exceeds dispensed quantity' });
      }

      // Update batch stock
      const batch = await MedicineBatch.findByPk(detail.batch_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (batch) {
        batch.available_quantity = (batch.available_quantity || 0) + quantity_returned;
        await batch.save({ transaction });
      }

      // Calculate value to deduct
      const returnedAmount = parseFloat(detail.rate) * quantity_returned;
      const returnedTax = +(returnedAmount * parseFloat(detail.gst_percentage || 0) / 100).toFixed(2);
      
      // Update detail
      detail.quantity -= quantity_returned;
      detail.amount = +(parseFloat(detail.amount) - returnedAmount).toFixed(2);
      if (detail.quantity === 0) {
        await detail.destroy({ transaction });
      } else {
        await detail.save({ transaction });
      }

      // Update sale header
      sale.total_amount = +(parseFloat(sale.total_amount) - returnedAmount).toFixed(2);
      sale.tax_amount = +(parseFloat(sale.tax_amount) - returnedTax).toFixed(2);
      sale.net_amount = +(sale.total_amount + sale.tax_amount).toFixed(2);
      
      if (sale.net_amount <= 0 && sale.total_amount <= 0) {
         sale.total_amount = 0;
         sale.tax_amount = 0;
         sale.net_amount = 0;
      }
      await sale.save({ transaction });

      // Update linked BillCharge
      const billCharge = await BillCharge.findOne({
        where: { service_type: 'Pharmacy', service_id: sale.sale_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (billCharge) {
        const newChargeTotal = +(parseFloat(billCharge.amount) - returnedAmount).toFixed(2);
        const newChargeTax = +(parseFloat(billCharge.gst_amount) - returnedTax).toFixed(2);
        const newChargeNet = +(newChargeTotal + newChargeTax).toFixed(2);

        if (newChargeNet <= 0) {
           await billCharge.destroy({ transaction });
        } else {
           billCharge.amount = newChargeTotal;
           billCharge.taxable_amount = newChargeTotal;
           billCharge.gst_amount = newChargeTax;
           billCharge.net_amount = newChargeNet;
           billCharge.balance_amount = Math.max(0, newChargeNet - parseFloat(billCharge.paid_amount || 0));
           
           if (billCharge.balance_amount === 0 && billCharge.paid_amount > 0) {
             billCharge.payment_status = 'Paid';
           }
           billCharge.gst_percent = newChargeTotal > 0 ? +((newChargeTax / newChargeTotal) * 100).toFixed(2) : 0;
           await billCharge.save({ transaction });
        }
      }

      await transaction.commit();
      res.json({ success: true, message: 'Medication returned successfully', data: sale });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PharmacySaleController;
