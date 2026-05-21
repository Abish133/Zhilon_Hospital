const { Refund, Bill, Patient, Hospital, User, sequelize } = require('../models');

class RefundController {
  static async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const { patient_id, bill_id, refund_amount, refund_mode, approved_by, processed_by, hospital_id } = req.body;

      if (!patient_id || !refund_amount || !refund_mode || !approved_by || !processed_by || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'patient_id, refund_amount, refund_mode, approved_by, processed_by, and hospital_id are required'
        });
      }

      const amt = parseFloat(refund_amount);
      if (!(amt > 0)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'refund_amount must be greater than 0' });
      }

      // If linked to a bill, lock it and reverse the paid_amount so finance ledger stays consistent.
      let bill = null;
      if (bill_id) {
        bill = await Bill.findOne({
          where: { bill_id, hospital_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!bill) {
          await t.rollback();
          return res.status(404).json({ success: false, message: 'Linked bill not found' });
        }
        if (amt > parseFloat(bill.paid_amount)) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Refund ${amt} exceeds bill paid amount ${bill.paid_amount}`
          });
        }
      }

      const refund = await Refund.create(req.body, { transaction: t });

      if (bill) {
        const newPaidAmount = parseFloat(bill.paid_amount) - amt;
        const newBalanceAmount = parseFloat(bill.net_amount) - parseFloat(bill.advance_adjusted) - newPaidAmount;
        let payment_status = 'Unpaid';
        if (newBalanceAmount <= 0) payment_status = 'Paid';
        else if (newPaidAmount > 0 || parseFloat(bill.advance_adjusted) > 0) payment_status = 'Partial';

        await bill.update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          payment_status
        }, { transaction: t });
      }

      await t.commit();

      const refreshedBill = bill_id ? await Bill.findByPk(bill_id) : null;
      const patient = await Patient.findByPk(patient_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const approver = await User.findByPk(approved_by, { attributes: { exclude: ['password'] } });
      const processor = await User.findByPk(processed_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({
        success: true,
        message: 'Refund created successfully',
        data: {
          ...refund.toJSON(),
          bill: refreshedBill ? { bill_id: refreshedBill.bill_id, bill_number: refreshedBill.bill_number, net_amount: refreshedBill.net_amount, paid_amount: refreshedBill.paid_amount, balance_amount: refreshedBill.balance_amount, payment_status: refreshedBill.payment_status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          approvedBy: approver ? { id: approver.id, username: approver.name } : null,
          processedBy: processor ? { id: processor.id, username: processor.name } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { patient_id, bill_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (patient_id) where.patient_id = patient_id;
      if (bill_id) where.bill_id = bill_id;

      const refunds = await Refund.findAll({ 
        where,
        order: [['refund_date', 'DESC']]
      });

      const refundsWithDetails = await Promise.all(
        refunds.map(async (refund) => {
          const bill = refund.bill_id ? await Bill.findByPk(refund.bill_id) : null;
          const patient = await Patient.findByPk(refund.patient_id);
          const hospital = await Hospital.findByPk(refund.hospital_id);
          const approver = await User.findByPk(refund.approved_by, { attributes: { exclude: ['password'] } });
          const processor = await User.findByPk(refund.processed_by, { attributes: { exclude: ['password'] } });
          
          return {
            ...refund.toJSON(),
            bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            approvedBy: approver ? { id: approver.id, username: approver.name } : null,
            processedBy: processor ? { id: processor.id, username: processor.name } : null
          };
        })
      );

      res.json({ success: true, data: refundsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const refund = await Refund.findOne({ where: { refund_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!refund) {
        return res.status(404).json({ success: false, message: 'Refund not found' });
      }

      const bill = refund.bill_id ? await Bill.findByPk(refund.bill_id) : null;
      const patient = await Patient.findByPk(refund.patient_id);
      const hospital = await Hospital.findByPk(refund.hospital_id);
      const approver = await User.findByPk(refund.approved_by, { attributes: { exclude: ['password'] } });
      const processor = await User.findByPk(refund.processed_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...refund.toJSON(),
          bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          approvedBy: approver ? { id: approver.id, username: approver.name } : null,
          processedBy: processor ? { id: processor.id, username: processor.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await Refund.update(
          { is_active: false },
          { where: { refund_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Refund not found' });
        }
        const deactivatedRefund = await Refund.findOne({ where: { refund_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Refund deactivated successfully', data: deactivatedRefund });
      }

      const [updated] = await Refund.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { refund_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Refund not found' });
      }

      const updatedRefund = await Refund.findOne({ where: { refund_id: req.params.id, hospital_id: req.hospitalId } });
      const bill = updatedRefund.bill_id ? await Bill.findByPk(updatedRefund.bill_id) : null;
      const patient = await Patient.findByPk(updatedRefund.patient_id);
      const hospital = await Hospital.findByPk(updatedRefund.hospital_id);
      const approver = await User.findByPk(updatedRefund.approved_by, { attributes: { exclude: ['password'] } });
      const processor = await User.findByPk(updatedRefund.processed_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...updatedRefund.toJSON(),
          bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          approvedBy: approver ? { id: approver.id, username: approver.name } : null,
          processedBy: processor ? { id: processor.id, username: processor.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Refund.destroy({
        where: { refund_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Refund not found' });
      }

      res.json({ success: true, message: 'Refund permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RefundController;
