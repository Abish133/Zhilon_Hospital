const { DoctorQualification } = require('../models');

class DoctorQualificationController {
  static async create(req, res) {
    try {
      const { doctor_id, degree, hospital_id } = req.body;
      if (!doctor_id || !degree || !hospital_id) {
        return res.status(400).json({ success: false, message: 'doctor_id, degree, hospital_id required' });
      }
      const q = await DoctorQualification.create(req.body);
      res.status(201).json({ success: true, data: q });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const where = { is_active: true };
      if (req.query.doctor_id) where.doctor_id = req.query.doctor_id;
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      const items = await DoctorQualification.findAll({ where, order: [['year_obtained', 'DESC']] });
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const [updated] = await DoctorQualification.update(req.body, { where: { qualification_id: req.params.id, hospital_id: req.hospitalId } });
      if (!updated) return res.status(404).json({ success: false, message: 'Qualification not found' });
      const q = await DoctorQualification.findOne({ where: { qualification_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: q });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await DoctorQualification.destroy({ where: { qualification_id: req.params.id, hospital_id: req.hospitalId } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Qualification not found' });
      res.json({ success: true, message: 'Qualification deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DoctorQualificationController;
