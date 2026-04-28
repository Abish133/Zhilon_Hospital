const { InsuranceClaim, Bill, Patient, Hospital, sequelize } = require('../models');
const { Op } = require('sequelize');

class InsuranceClaimController {
  static async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const {
        bill_id,
        insurance_provider,
        policy_number,
        member_id,
        claim_amount,
        deductible = 0,
        copay = 0,
        hospital_id
      } = req.body;

      if (!bill_id || !insurance_provider || !policy_number || !claim_amount || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'bill_id, insurance_provider, policy_number, claim_amount, and hospital_id are required'
        });
      }

      // Verify bill exists and lock it
      const bill = await Bill.findByPk(bill_id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!bill) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      // Verify patient
      if (!bill.patient_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Bill must have a patient' });
      }

      // Create insurance claim
      const insuranceClaim = await InsuranceClaim.create({
        bill_id,
        patient_id: bill.patient_id,
        insurance_provider,
        policy_number,
        member_id: member_id || null,
        claim_amount: parseFloat(claim_amount),
        deductible: parseFloat(deductible),
        copay: parseFloat(copay),
        hospital_id,
        status: 'pending',
        claim_date: new Date()
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Insurance claim created successfully',
        data: insuranceClaim
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { status, insurance_provider } = req.query;
      const where = { hospital_id: req.hospitalId };

      if (status) where.status = status;
      if (insurance_provider) where.insurance_provider = insurance_provider;

      const claims = await InsuranceClaim.findAll({
        where,
        include: [
          { model: Bill, as: 'bill', attributes: ['bill_id', 'bill_number', 'net_amount', 'balance_amount'] },
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'email', 'mobile_number'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] }
        ],
        order: [['claim_date', 'DESC']]
      });

      res.json({
        success: true,
        data: claims,
        count: claims.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const claim = await InsuranceClaim.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.hospitalId
        },
        include: [
          { model: Bill, as: 'bill', include: [{ association: 'billingEpisode' }] },
          { model: Patient, as: 'patient' },
          { model: Hospital, as: 'hospital' }
        ]
      });

      if (!claim) {
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      res.json({ success: true, data: claim });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByPatient(req, res) {
    try {
      const { patient_id } = req.params;

      const claims = await InsuranceClaim.findAll({
        where: { 
          patient_id,
          hospital_id: req.hospitalId
        },
        include: [
          { model: Bill, as: 'bill', attributes: ['bill_id', 'bill_number', 'net_amount'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] }
        ],
        order: [['claim_date', 'DESC']]
      });

      res.json({
        success: true,
        data: claims,
        count: claims.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async submitClaim(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { submission_date = new Date() } = req.body;

      const claim = await InsuranceClaim.findOne({
        where: {
          id,
          hospital_id: req.hospitalId
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!claim) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      if (claim.status !== 'pending') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Claim cannot be submitted. Current status: ${claim.status}`
        });
      }

      await claim.update({
        status: 'submitted',
        submission_date,
        submitted_by: req.user?.id || null
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Claim submitted successfully',
        data: claim
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async approveClaim(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { approved_amount, approval_date, remarks } = req.body;
      const approvedDate = approval_date || new Date();

      const claim = await InsuranceClaim.findOne({
        where: {
          id,
          hospital_id: req.hospitalId
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!claim) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      if (!['pending', 'submitted'].includes(claim.status)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Claim cannot be approved. Current status: ${claim.status}`
        });
      }

      await claim.update({
        status: 'approved',
        approved_date: approvedDate,
        approved_amount: parseFloat(approved_amount),
        approval_remarks: remarks,
        approved_by: req.user?.id || null
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Claim approved successfully',
        data: claim
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async rejectClaim(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { rejection_reason, rejection_date = new Date() } = req.body;

      if (!rejection_reason) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const claim = await InsuranceClaim.findOne({
        where: {
          id,
          hospital_id: req.hospitalId
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!claim) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      if (!['pending', 'submitted'].includes(claim.status)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Claim cannot be rejected. Current status: ${claim.status}`
        });
      }

      await claim.update({
        status: 'rejected',
        rejection_reason,
        rejection_date,
        rejected_by: req.user?.id || null
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Claim rejected successfully',
        data: claim
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async processPayment(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { payment_amount, payment_date = new Date(), reference_number } = req.body;

      if (!payment_amount || !reference_number) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'payment_amount and reference_number are required'
        });
      }

      const amt = parseFloat(payment_amount);
      if (!(amt > 0)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'payment_amount must be greater than 0' });
      }

      const claim = await InsuranceClaim.findOne({
        where: {
          id,
          hospital_id: req.hospitalId
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!claim) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      if (claim.status !== 'approved') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Only approved claims can be paid'
        });
      }

      // Lock the linked bill so we can credit the insurer payment against the patient's balance.
      const bill = await Bill.findOne({
        where: { bill_id: claim.bill_id, hospital_id: req.hospitalId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!bill) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Linked bill not found for claim' });
      }
      if (amt > parseFloat(bill.balance_amount)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insurer payment ${amt} exceeds outstanding balance ${bill.balance_amount}`
        });
      }

      await claim.update({
        status: 'paid',
        paid_amount: amt,
        payment_date,
        payment_reference: reference_number
      }, { transaction: t });

      // Credit the insurer payment to the bill so the patient sees the correct outstanding balance.
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

      res.json({
        success: true,
        message: 'Claim payment processed successfully and credited to bill',
        data: { claim, bill: { bill_id: bill.bill_id, paid_amount: newPaidAmount, balance_amount: newBalanceAmount, payment_status } }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async trackClaim(req, res) {
    try {
      const { id } = req.params;

      const claim = await InsuranceClaim.findOne({
        where: {
          id,
          hospital_id: req.hospitalId
        },
        include: [
          { model: Bill, as: 'bill', attributes: ['bill_id', 'bill_number', 'net_amount'] },
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] }
        ]
      });

      if (!claim) {
        return res.status(404).json({ success: false, message: 'Insurance claim not found' });
      }

      // Calculate status timeline
      const timeline = [];
      
      if (claim.claim_date) {
        timeline.push({
          event: 'Claim Created',
          date: claim.claim_date,
          status: 'completed'
        });
      }

      if (claim.submission_date) {
        timeline.push({
          event: 'Claim Submitted',
          date: claim.submission_date,
          status: 'completed'
        });
      }

      if (claim.approved_date) {
        timeline.push({
          event: 'Claim Approved',
          date: claim.approved_date,
          amount: claim.approved_amount,
          status: 'completed'
        });
      }

      if (claim.payment_date) {
        timeline.push({
          event: 'Payment Processed',
          date: claim.payment_date,
          amount: claim.paid_amount,
          status: 'completed'
        });
      }

      if (claim.rejection_date && claim.status === 'rejected') {
        timeline.push({
          event: 'Claim Rejected',
          date: claim.rejection_date,
          reason: claim.rejection_reason,
          status: 'completed'
        });
      }

      res.json({
        success: true,
        data: {
          claim: claim,
          timeline,
          current_status: claim.status,
          progress: InsuranceClaimController.getProgressPercentage(claim.status)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static getProgressPercentage(status) {
    const statusProgress = {
      'pending': 10,
      'submitted': 40,
      'approved': 70,
      'paid': 100,
      'rejected': 0
    };
    return statusProgress[status] || 0;
  }

  static async getClaimStats(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };

      const stats = await InsuranceClaim.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('claim_amount')), 'total_claim_amount'],
          [sequelize.fn('SUM', sequelize.col('approved_amount')), 'total_approved_amount']
        ],
        group: ['status'],
        raw: true
      });

      const summary = {
        total_claims: 0,
        pending: 0,
        submitted: 0,
        approved: 0,
        paid: 0,
        rejected: 0,
        total_claim_amount: 0,
        total_approved_amount: 0,
        total_paid_amount: 0
      };

      for (const stat of stats) {
        summary.total_claims += parseInt(stat.count);
        summary.total_claim_amount += parseFloat(stat.total_claim_amount || 0);
        summary.total_approved_amount += parseFloat(stat.total_approved_amount || 0);
        summary[stat.status] = parseInt(stat.count);
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = InsuranceClaimController;
