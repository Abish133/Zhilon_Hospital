const { PatientMedicalHistory, Patient, Hospital, User } = require('../models');

class PatientMedicalHistoryController {
  static async createMedicalHistory(req, res) {
    try {
      if (!req.body.patient_id || !req.body.hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and Hospital ID are required'
        });
      }

      const medicalHistory = await PatientMedicalHistory.create({
        ...req.body,
        updated_by: req.user?.id || req.body.updated_by
      });
      const patient = await Patient.findByPk(req.body.patient_id);
      const hospital = await Hospital.findByPk(req.body.hospital_id);
      const updatedBy = medicalHistory.updated_by ? await User.findByPk(medicalHistory.updated_by) : null;

      res.status(201).json({
        success: true,
        data: {
          ...medicalHistory.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          updatedByUser: updatedBy ? { id: updatedBy.id, username: updatedBy.name } : null
        }
      });
    } catch (error) {
      console.error('Full error:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.errors.map(e => `${e.path}: ${e.message}`)
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllMedicalHistories(req, res) {
    try {
      const medicalHistories = await PatientMedicalHistory.findAll({
        where: { hospital_id: req.hospitalId }
      });

      const historiesWithDetails = await Promise.all(
        medicalHistories.map(async (history) => {
          const patient = await Patient.findByPk(history.patient_id);
          const hospital = await Hospital.findByPk(history.hospital_id);
          const updatedBy = history.updated_by ? await User.findByPk(history.updated_by) : null;
          return {
            ...history.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            updatedByUser: updatedBy ? { id: updatedBy.id, username: updatedBy.name } : null
          };
        })
      );

      res.json({ success: true, data: historiesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMedicalHistoryById(req, res) {
    try {
      const medicalHistory = await PatientMedicalHistory.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!medicalHistory) {
        return res.status(404).json({ success: false, message: 'Medical history not found' });
      }

      const patient = await Patient.findByPk(medicalHistory.patient_id);
      const hospital = await Hospital.findByPk(medicalHistory.hospital_id);
      const updatedBy = medicalHistory.updated_by ? await User.findByPk(medicalHistory.updated_by) : null;

      res.json({
        success: true,
        data: {
          ...medicalHistory.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          updatedByUser: updatedBy ? { id: updatedBy.id, username: updatedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateMedicalHistory(req, res) {
    try {
      const [updated] = await PatientMedicalHistory.update({
        ...req.body,
        updated_by: req.user?.id || req.body.updated_by
      }, {
        where: { history_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Medical history not found' });
      }
      const updatedHistory = await PatientMedicalHistory.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedHistory.patient_id);
      const hospital = await Hospital.findByPk(updatedHistory.hospital_id);
      const updatedBy = updatedHistory.updated_by ? await User.findByPk(updatedHistory.updated_by) : null;

      res.json({
        success: true,
        data: {
          ...updatedHistory.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          updatedByUser: updatedBy ? { id: updatedBy.id, username: updatedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteMedicalHistory(req, res) {
    try {
      const deleted = await PatientMedicalHistory.destroy({
        where: { history_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Medical history not found' });
      }
      res.json({ success: true, message: 'Medical history deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async getMedicalHistoryByPatientId(req, res) {
    try {
      const medicalHistories = await PatientMedicalHistory.findAll({
        where: { 
          patient_id: req.params.patientId,
          hospital_id: req.hospitalId
        }
      });

      const historiesWithDetails = await Promise.all(
        medicalHistories.map(async (history) => {
          const patient = await Patient.findByPk(history.patient_id);
          const hospital = await Hospital.findByPk(history.hospital_id);
          const updatedBy = history.updated_by ? await User.findByPk(history.updated_by) : null;
          return {
            ...history.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            updatedByUser: updatedBy ? { id: updatedBy.id, username: updatedBy.name } : null
          };
        })
      );

      res.json({ success: true, data: historiesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PatientMedicalHistoryController;
