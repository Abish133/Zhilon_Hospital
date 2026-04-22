const { Patient, Hospital, sequelize } = require('../models');
const { generateSequentialNumber } = require('../utils/numberGenerator');
const { parsePaging } = require('../utils/pagination');

class PatientController {
  static async createPatient(req, res) {
    const t = await sequelize.transaction();
    try {
      if (!req.body.first_name || !req.body.last_name || !req.body.hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'First name, last name, and hospital_id are required'
        });
      }

      // Atomically generate UHID if not provided
      if (!req.body.uhid) {
        req.body.uhid = await generateSequentialNumber({
          model: Patient,
          field: 'uhid',
          prefix: 'UHID',
          hospitalId: req.body.hospital_id,
          transaction: t,
          pad: 6
        });
      }

      const patient = await Patient.create(req.body, { transaction: t });
      await t.commit();
      const hospital = await Hospital.findByPk(req.body.hospital_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Patient registered successfully',
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* already committed or rolled back */ }
      console.error('Full error:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.errors.map(e => `${e.path}: ${e.message}`)
        });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Duplicate value',
          details: error.errors.map(e => `${e.path}: ${e.value} already exists`)
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllPatients(req, res) {
    try {
      const { limit, offset, order, page, pageSize } = parsePaging(req.query, {
        defaultOrder: [['patient_id', 'DESC']],
        allowedSortFields: ['patient_id', 'first_name', 'last_name', 'uhid', 'createdAt']
      });

      const where = {};
      if (req.query.hospital_id) where.hospital_id = req.query.hospital_id;
      if (req.query.search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { first_name: { [Op.like]: `%${req.query.search}%` } },
          { last_name: { [Op.like]: `%${req.query.search}%` } },
          { uhid: { [Op.like]: `%${req.query.search}%` } },
          { mobile_number: { [Op.like]: `%${req.query.search}%` } }
        ];
      }

      const { rows, count } = await Patient.findAndCountAll({ where, limit, offset, order });

      // Batch-fetch hospitals (O(N) queries → 1 query)
      const hospitalIds = [...new Set(rows.map(p => p.hospital_id).filter(Boolean))];
      const hospitals = hospitalIds.length
        ? await Hospital.findAll({ where: { id: hospitalIds } })
        : [];
      const hMap = Object.fromEntries(hospitals.map(h => [h.id, h]));

      const data = rows.map(p => ({
        ...p.toJSON(),
        hospital: hMap[p.hospital_id] ? { id: hMap[p.hospital_id].id, hospitalName: hMap[p.hospital_id].hospitalName } : null
      }));

      res.json({
        success: true,
        data,
        pagination: { page, pageSize, total: count, totalPages: Math.max(1, Math.ceil(count / pageSize)) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getPatientById(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const patient = await Patient.findOne({ where });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      
      const hospital = await Hospital.findByPk(patient.hospital_id);
      
      res.json({ 
        success: true, 
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updatePatient(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const [updated] = await Patient.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      
      const patient = await Patient.findOne({ where });
      const hospital = await Hospital.findByPk(patient.hospital_id);
      
      res.json({ 
        success: true,
        message: 'Patient updated successfully',
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deletePatient(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const deleted = await Patient.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async searchPatients(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
      }

      const { Op } = require('sequelize');
      const searchTerm = q.replace(/^UHID:\s*/i, '').trim();
      
      const patients = await Patient.findAll({
        where: {
          hospital_id: req.hospitalId,
          [Op.or]: [
            { uhid: { [Op.like]: `%${searchTerm}%` } },
            { first_name: { [Op.like]: `%${searchTerm}%` } },
            { last_name: { [Op.like]: `%${searchTerm}%` } },
            { mobile_number: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: 20
      });

      res.json({ success: true, data: patients });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = PatientController;
 