const { Op } = require('sequelize');
const { DoctorLeave, Doctor } = require('../models');

class DoctorLeaveController {
  static async create(req, res) {
    try {
      const { doctor_id, from_date, to_date, leave_type, reason, hospital_id } = req.body;
      if (!doctor_id || !from_date || !to_date || !hospital_id) {
        return res.status(400).json({ success: false, message: 'doctor_id, from_date, to_date, hospital_id required' });
      }
      if (new Date(to_date) < new Date(from_date)) {
        return res.status(400).json({ success: false, message: 'to_date cannot be before from_date' });
      }
      const leave = await DoctorLeave.create({ doctor_id, from_date, to_date, leave_type, reason, hospital_id });
      res.status(201).json({ success: true, data: leave });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const where = { is_active: true };
      if (req.query.doctor_id) where.doctor_id = req.query.doctor_id;
      if (req.query.status) where.status = req.query.status;
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      const leaves = await DoctorLeave.findAll({ where, order: [['from_date', 'DESC']] });
      res.json({ success: true, data: leaves });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      const [updated] = await DoctorLeave.update(
        { status, approved_by: req.user?.id || null },
        { where: { leave_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Leave request not found' });
      const leave = await DoctorLeave.findOne({ where: { leave_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: leave });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/doctor-leaves/check?doctor_id=X&date=YYYY-MM-DD
  static async checkAvailability(req, res) {
    try {
      const { doctor_id, date } = req.query;
      if (!doctor_id || !date) {
        return res.status(400).json({ success: false, message: 'doctor_id and date query params required' });
      }
      const onLeave = await DoctorLeave.findOne({
        where: {
          doctor_id,
          status: 'Approved',
          is_active: true,
          from_date: { [Op.lte]: date },
          to_date: { [Op.gte]: date }
        }
      });
      res.json({ success: true, data: { available: !onLeave, leave: onLeave || null } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await DoctorLeave.destroy({ where: { leave_id: req.params.id, hospital_id: req.hospitalId } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Leave not found' });
      res.json({ success: true, message: 'Leave deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DoctorLeaveController;
