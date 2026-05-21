const { Payment, Bill, Hospital, User, Patient, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateSequentialNumber } = require('../utils/numberGenerator');
const logger = require('../utils/logger');

class PaymentController {
  // Process bill payment — atomic: lock bill row, create payment, update bill, all in one transaction.
  static async processBillPayment(req, res) {
    const t = await sequelize.transaction();
    try {
      const { bill_id, amount_paid, payment_mode, transaction_ref, bank_name, received_by, hospital_id } = req.body;

      if (!bill_id || !amount_paid || !payment_mode || !received_by || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'bill_id, amount_paid, payment_mode, received_by, and hospital_id are required'
        });
      }

      const amt = parseFloat(amount_paid);
      if (!(amt > 0)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'amount_paid must be greater than 0' });
      }

      // Lock the bill row so concurrent payments cannot both read the same balance.
      const bill = await Bill.findOne({
        where: { bill_id, hospital_id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!bill) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      if (amt > parseFloat(bill.balance_amount)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment amount cannot exceed balance amount'
        });
      }

      // Per-hospital sequential receipt number, generated under transaction lock.
      const receipt_number = await generateSequentialNumber({
        model: Payment,
        field: 'receipt_number',
        prefix: 'RCPT',
        hospitalId: hospital_id,
        transaction: t
      });

      const payment = await Payment.create({
        bill_id,
        payment_type: 'Bill Payment',
        payment_mode,
        amount_paid: amt,
        transaction_ref,
        bank_name,
        received_by,
        hospital_id,
        receipt_number
      }, { transaction: t });

      const newPaidAmount = parseFloat(bill.paid_amount) + amt;
      const newBalanceAmount = parseFloat(bill.net_amount) - parseFloat(bill.advance_adjusted) - newPaidAmount;

      let payment_status = 'Unpaid';
      if (newBalanceAmount <= 0) payment_status = 'Paid';
      else if (newPaidAmount > 0 || parseFloat(bill.advance_adjusted) > 0) payment_status = 'Partial';

      await bill.update({
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        payment_status
      }, { transaction: t });

      await t.commit();

      const hospital = await Hospital.findByPk(hospital_id);
      const user = await User.findByPk(received_by, { attributes: { exclude: ['password'] } });
      const updatedBill = await Bill.findByPk(bill_id, {
        include: [{ model: Patient, as: 'patient' }]
      });

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment: {
            ...payment.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            receivedBy: user ? { id: user.id, username: user.name } : null
          },
          bill: updatedBill
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      logger.error('processBillPayment failed', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const { payment_type, payment_mode, amount_paid, received_by, hospital_id, bill_id, ...otherData } = req.body;

      if (!payment_type || !payment_mode || !amount_paid || !received_by || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'payment_type, payment_mode, amount_paid, received_by, and hospital_id are required'
        });
      }

      const amt = parseFloat(amount_paid);
      if (!(amt > 0)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'amount_paid must be greater than 0' });
      }

      // Per-hospital sequential receipt number under transaction lock.
      const receipt_number = await generateSequentialNumber({
        model: Payment,
        field: 'receipt_number',
        prefix: 'RCPT',
        hospitalId: hospital_id,
        transaction: t
      });

      // Lock bill first (if any) so balance reads/writes are serialized.
      let bill = null;
      if (bill_id) {
        bill = await Bill.findOne({
          where: { bill_id, hospital_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!bill) {
          await t.rollback();
          return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        if (payment_type === 'Bill Payment' && amt > parseFloat(bill.balance_amount)) {
          await t.rollback();
          return res.status(400).json({ success: false, message: 'Payment amount cannot exceed balance amount' });
        }
      }

      const payment = await Payment.create({
        payment_type,
        payment_mode,
        amount_paid: amt,
        received_by,
        hospital_id,
        bill_id: bill_id || null,
        ...otherData,
        receipt_number
      }, { transaction: t });

      if (bill && payment_type === 'Bill Payment') {
        const newPaidAmount = parseFloat(bill.paid_amount) + amt;
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
      const hospital = await Hospital.findByPk(hospital_id);
      const user = await User.findByPk(received_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: {
          ...payment.toJSON(),
          bill: refreshedBill ? { bill_id: refreshedBill.bill_id, bill_number: refreshedBill.bill_number, net_amount: refreshedBill.net_amount, balance_amount: refreshedBill.balance_amount, payment_status: refreshedBill.payment_status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, name: user.name } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      logger.error('Payment.create failed', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { payment_type, payment_mode, bill_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (payment_type) where.payment_type = payment_type;
      if (payment_mode) where.payment_mode = payment_mode;
      if (bill_id) where.bill_id = bill_id;

      const payments = await Payment.findAll({ 
        where,
        order: [['payment_date', 'DESC']]
      });

      const paymentsWithDetails = await Promise.all(
        payments.map(async (payment) => {
          const bill = payment.bill_id ? await Bill.findByPk(payment.bill_id) : null;
          const hospital = await Hospital.findByPk(payment.hospital_id);
          const user = await User.findByPk(payment.received_by, { attributes: { exclude: ['password'] } });
          
          return {
            ...payment.toJSON(),
            bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount, balance_amount: bill.balance_amount } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            receivedBy: user ? { id: user.id, username: user.name } : null
          };
        })
      );

      res.json({ success: true, data: paymentsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const payment = await Payment.findOne({ where: { payment_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const bill = payment.bill_id ? await Bill.findByPk(payment.bill_id) : null;
      const hospital = await Hospital.findByPk(payment.hospital_id);
      const user = await User.findByPk(payment.received_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...payment.toJSON(),
          bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount, balance_amount: bill.balance_amount } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, username: user.name } : null
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
        const [updated] = await Payment.update(
          { is_active: false },
          { where: { payment_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        const deactivatedPayment = await Payment.findOne({ where: { payment_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Payment deactivated successfully', data: deactivatedPayment });
      }

      const [updated] = await Payment.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { payment_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const updatedPayment = await Payment.findOne({ where: { payment_id: req.params.id, hospital_id: req.hospitalId } });
      const bill = updatedPayment.bill_id ? await Bill.findByPk(updatedPayment.bill_id) : null;
      const hospital = await Hospital.findByPk(updatedPayment.hospital_id);
      const user = await User.findByPk(updatedPayment.received_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...updatedPayment.toJSON(),
          bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount, balance_amount: bill.balance_amount } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Payment.destroy({
        where: { payment_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({ success: true, message: 'Payment permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get payment summary
  static async getPaymentSummary(req, res) {
    try {
      const { start_date, end_date, payment_mode } = req.query;
      const where = { is_active: true };
      
      if (start_date && end_date) {
        where.payment_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }
      if (payment_mode) where.payment_mode = payment_mode;

      const summary = await Payment.findAll({
        where,
        attributes: [
          'payment_mode',
          [Payment.sequelize.fn('COUNT', Payment.sequelize.col('payment_id')), 'count'],
          [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount_paid')), 'total_amount']
        ],
        group: ['payment_mode']
      });

      const totalPayments = await Payment.count({ where });
      const totalAmount = await Payment.sum('amount_paid', { where });

      res.json({ 
        success: true, 
        data: {
          summary,
          totals: {
            total_payments: totalPayments,
            total_amount: totalAmount || 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PaymentController;
