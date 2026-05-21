const { PatientMedicationHistory, Patient, Hospital, Medicine, Doctor, OpdVisit, IpdAdmission } = require('../models');

class PatientMedicationHistoryController {
  static async create(req, res) {
    try {
      const medicationHistory = await PatientMedicationHistory.create(req.body);
      const patient = await Patient.findByPk(medicationHistory.patient_id);
      const hospital = await Hospital.findByPk(medicationHistory.hospital_id);
      const medicine = await Medicine.findByPk(medicationHistory.medicine_id);
      const doctor = await Doctor.findByPk(medicationHistory.prescribed_by);
      
      let visit = null;
      if (medicationHistory.visit_type === 'OPD') {
        visit = await OpdVisit.findByPk(medicationHistory.visit_id);
      } else if (medicationHistory.visit_type === 'IPD') {
        visit = await IpdAdmission.findByPk(medicationHistory.visit_id);
      }
      
      res.status(201).json({
        success: true,
        data: {
          ...medicationHistory.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, strength: medicine.strength } : null,
          prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          visit: visit ? (medicationHistory.visit_type === 'OPD' ? { visit_id: visit.visit_id, visit_date: visit.visit_date } : { admission_id: visit.admission_id, admission_date: visit.admission_date }) : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const medicationHistories = await PatientMedicationHistory.findAll({
        where: { hospital_id: req.hospitalId },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength'] },
          { model: Doctor, as: 'prescribedBy', attributes: ['id', 'name', 'specialization'] }
        ]
      });

      res.json({ success: true, data: medicationHistories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const medicationHistory = await PatientMedicationHistory.findOne({
        where: { med_history_id: req.params.id, hospital_id: req.hospitalId },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength'] },
          { model: Doctor, as: 'prescribedBy', attributes: ['id', 'name', 'specialization'] }
        ]
      });

      if (!medicationHistory) {
        return res.status(404).json({ success: false, message: 'Medication history not found' });
      }

      res.json({ success: true, data: medicationHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByPatientId(req, res) {
    try {
      const medicationHistories = await PatientMedicationHistory.findAll({
        where: { patient_id: req.params.patientId, hospital_id: req.hospitalId },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength'] },
          { model: Doctor, as: 'prescribedBy', attributes: ['id', 'name', 'specialization'] }
        ],
        order: [['prescribed_at', 'DESC']]
      });

      res.json({ success: true, data: medicationHistories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const [updated] = await PatientMedicationHistory.update(req.body, {
        where: { med_history_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Medication history not found' });
      }

      const updatedHistory = await PatientMedicationHistory.findByPk(req.params.id, {
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'] },
          { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength'] },
          { model: Doctor, as: 'prescribedBy', attributes: ['id', 'name', 'specialization'] }
        ]
      });

      res.json({ success: true, data: updatedHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await PatientMedicationHistory.destroy({
        where: { med_history_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Medication history not found' });
      }

      res.json({ success: true, message: 'Medication history deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PatientMedicationHistoryController;
