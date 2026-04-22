const { PatientClinicalHistory, Patient, Hospital, Doctor, Department, OpdVisit } = require('../models');

class PatientClinicalHistoryController {
  static async create(req, res) {
    try {
      const clinicalHistory = await PatientClinicalHistory.create(req.body);
      const patient = await Patient.findByPk(clinicalHistory.patient_id);
      const hospital = await Hospital.findByPk(clinicalHistory.hospital_id);
      const doctor = await Doctor.findByPk(clinicalHistory.doctor_id);
      const department = await Department.findByPk(clinicalHistory.department_id);
      const visit = await OpdVisit.findByPk(clinicalHistory.visit_id);

      res.status(201).json({
        success: true,
        data: {
          ...clinicalHistory.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const clinicalHistories = await PatientClinicalHistory.findAll({
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'] }
        ]
      });

      res.json({ success: true, data: clinicalHistories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const clinicalHistory = await PatientClinicalHistory.findByPk(req.params.id, {
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'] }
        ]
      });

      if (!clinicalHistory) {
        return res.status(404).json({ success: false, message: 'Clinical history not found' });
      }

      res.json({ success: true, data: clinicalHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByPatientId(req, res) {
    try {
      const clinicalHistories = await PatientClinicalHistory.findAll({
        where: { patient_id: req.params.patientId },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'] }
        ],
        order: [['visit_date', 'DESC']]
      });

      res.json({ success: true, data: clinicalHistories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const [updated] = await PatientClinicalHistory.update(req.body, {
        where: { clinical_history_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Clinical history not found' });
      }

      const updatedHistory = await PatientClinicalHistory.findByPk(req.params.id, {
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'] }
        ]
      });

      res.json({ success: true, data: updatedHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await PatientClinicalHistory.destroy({
        where: { clinical_history_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Clinical history not found' });
      }

      res.json({ success: true, message: 'Clinical history deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PatientClinicalHistoryController;
