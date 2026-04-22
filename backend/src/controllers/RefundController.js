const { Refund, Bill, Patient, Hospital, User } = require('../models');

class RefundController {
  static async create(req, res) {
    try {
      const { patient_id, refund_amount, refund_mode, approved_by, processed_by, hospital_id } = req.body;
      
      if (!patient_id || !refund_amount || !refund_mode || !approved_by || !processed_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'patient_id, refund_amount, refund_mode, approved_by, processed_by, and hospital_id are required' 
        });
      }

      const refund = await Refund.create(req.body);
      const bill = refund.bill_id ? await Bill.findByPk(refund.bill_id) : null;
      const patient = await Patient.findByPk(patient_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const approver = await User.findByPk(approved_by, { attributes: { exclude: ['password'] } });
      const processor = await User.findByPk(processed_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({ 
        success: true, 
        message: 'Refund created successfully',
        data: {
          ...refund.toJSON(),
          bill: bill ? { bill_id: bill.bill_id, bill_number: bill.bill_number, net_amount: bill.net_amount } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          approvedBy: approver ? { id: approver.id, username: approver.username } : null,
          processedBy: processor ? { id: processor.id, username: processor.username } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { patient_id, bill_id } = req.query;
      const where = { is_active: true };
      
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
            approvedBy: approver ? { id: approver.id, username: approver.username } : null,
            processedBy: processor ? { id: processor.id, username: processor.username } : null
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
          approvedBy: approver ? { id: approver.id, username: approver.username } : null,
          processedBy: processor ? { id: processor.id, username: processor.username } : null
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
          approvedBy: approver ? { id: approver.id, username: approver.username } : null,
          processedBy: processor ? { id: processor.id, username: processor.username } : null
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
