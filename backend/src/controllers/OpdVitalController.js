const { OpdVital, OpdVisit, Hospital } = require('../models');

class OpdVitalController {
  static async createVital(req, res) {
    try {
      const { visit_id, blood_pressure, bp_systolic, bp_diastolic, pulse_rate, temperature, respiratory_rate, spo2, weight, height, bmi, hospital_id, recorded_at } = req.body;
      
      if (!visit_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Visit and hospital are required' 
        });
      }

      // Support both legacy string BP and new split numeric fields
      const bpString = blood_pressure || (bp_systolic && bp_diastolic ? `${bp_systolic}/${bp_diastolic}` : null);

      const vital = await OpdVital.create({ 
        visit_id,
        blood_pressure: bpString,
        bp_systolic: bp_systolic || null,
        bp_diastolic: bp_diastolic || null,
        pulse_rate,
        temperature,
        respiratory_rate,
        spo2,
        weight,
        height,
        bmi: bmi || null,
        hospital_id,
        recorded_at: recorded_at || new Date()
      });

      const visit = await OpdVisit.findByPk(visit_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Vitals recorded successfully',
        data: {
          ...vital.toJSON(),
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllVitals(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const { visit_id, page = 1, pageSize = 50 } = req.query;
      const where = { is_active: true };
      if (hospital_id) where.hospital_id = hospital_id;
      if (visit_id) where.visit_id = visit_id;

      const limit = Math.min(parseInt(pageSize) || 50, 200);
      const offset = (parseInt(page) - 1) * limit;

      const { count, rows: vitals } = await OpdVital.findAndCountAll({
        where,
        include: [
          { model: OpdVisit, as: 'visit', attributes: ['visit_id', 'visit_date', 'token_number'], required: false }
        ],
        order: [['recorded_at', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: vitals,
        pagination: { total: count, page: parseInt(page), pageSize: limit }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getVitalById(req, res) {
    try {
      const vital = await OpdVital.findOne({ where: { vitals_id: req.params.id, hospital_id: req.hospitalId } });

      if (!vital) {
        return res.status(404).json({ success: false, message: 'Vitals not found' });
      }

      const visit = await OpdVisit.findByPk(vital.visit_id);
      const hospital = await Hospital.findByPk(vital.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...vital.toJSON(),
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateVital(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await OpdVital.update(
          { is_active: false },
          { where: { vitals_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Vitals not found' });
        }
        const deactivatedVital = await OpdVital.findOne({ where: { vitals_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Vitals deactivated successfully', data: deactivatedVital });
      }

      const [updated] = await OpdVital.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { vitals_id: req.params.id, hospital_id: req.hospitalId }, individualHooks: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Vitals not found' });
      }

      const updatedVital = await OpdVital.findOne({ where: { vitals_id: req.params.id, hospital_id: req.hospitalId } });
      const visit = await OpdVisit.findByPk(updatedVital.visit_id);
      const hospital = await Hospital.findByPk(updatedVital.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedVital.toJSON(),
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteVital(req, res) {
    try {
      const deleted = await OpdVital.destroy({
        where: { vitals_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Vitals not found' });
      }

      res.json({ success: true, message: 'Vitals permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getVitalsByPatientId(req, res) {
    try {
      const { Patient } = require('../models');
      const vitals = await OpdVital.findAll({
        include: [{
          model: OpdVisit,
          as: 'visit',
          where: { patient_id: req.params.patientId },
          include: [{
            model: Patient,
            as: 'patient'
          }]
        }],
        where: { is_active: true, hospital_id: req.hospitalId },
        order: [['recorded_at', 'DESC']]
      });

      const vitalsWithDetails = await Promise.all(
        vitals.map(async (vital) => {
          const hospital = await Hospital.findByPk(vital.hospital_id);
          
          return {
            ...vital.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: vitalsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getVitalsByVisitId(req, res) {
    try {
      const vitals = await OpdVital.findAll({
        where: { 
          visit_id: req.params.visitId,
          is_active: true 
        },
        order: [['recorded_at', 'DESC']]
      });

      const vitalsWithDetails = await Promise.all(
        vitals.map(async (vital) => {
          const visit = await OpdVisit.findByPk(vital.visit_id);
          const hospital = await Hospital.findByPk(vital.hospital_id);
          
          return {
            ...vital.toJSON(),
            visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: vitalsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OpdVitalController;
