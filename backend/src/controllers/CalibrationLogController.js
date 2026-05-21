const { Op } = require('sequelize');
const { CalibrationLog, Equipment } = require('../models');

class CalibrationLogController {
  static async create(req, res) {
    try {
      const { equipment_id, hospital_id, calibration_date } = req.body;
      if (!equipment_id || !hospital_id || !calibration_date) {
        return res.status(400).json({ success: false, message: 'equipment_id, hospital_id, calibration_date required' });
      }
      const log = await CalibrationLog.create(req.body);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const where = { is_active: true };
      if (req.query.equipment_id) where.equipment_id = req.query.equipment_id;
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      const logs = await CalibrationLog.findAll({ where, order: [['calibration_date', 'DESC']] });
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Upcoming/overdue calibrations within N days
  static async due(req, res) {
    try {
      const days = Math.max(0, parseInt(req.query.days, 10) || 30);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const where = { is_active: true, next_due_date: { [Op.lte]: cutoff } };
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;

      const logs = await CalibrationLog.findAll({ where, order: [['next_due_date', 'ASC']] });
      res.json({ success: true, data: logs, count: logs.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const [updated] = await CalibrationLog.update(req.body, { where: { calibration_id: req.params.id, hospital_id: req.hospitalId } });
      if (!updated) return res.status(404).json({ success: false, message: 'Calibration log not found' });
      const log = await CalibrationLog.findOne({ where: { calibration_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: log });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await CalibrationLog.destroy({ where: { calibration_id: req.params.id, hospital_id: req.hospitalId } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Calibration log not found' });
      res.json({ success: true, message: 'Calibration log deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CalibrationLogController;
