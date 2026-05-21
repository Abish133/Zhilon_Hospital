const { OpdPrescription, Patient, Medicine, Doctor, Hospital, OpdConsultation, OpdVisit } = require('../models');

class OpdPrescriptionController {
  static async createPrescription(req, res) {
    try {
      const { consultation_id, visit_id, patient_id, medicine_id, medicine_name, dosage, frequency, route, duration, quantity, instructions, prescribed_by, prescribed_at, hospital_id } = req.body;
      
      if (!patient_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'patient_id and hospital_id are required' 
        });
      }

      const prescription = await OpdPrescription.create({ 
        consultation_id,
        visit_id,
        patient_id,
        medicine_id,
        medicine_name,
        dosage,
        frequency,
        route,
        duration,
        quantity,
        instructions,
        prescribed_by,
        prescribed_at: prescribed_at || new Date(),
        hospital_id
      });

      const patient = await Patient.findByPk(patient_id);
      const medicine = medicine_id ? await Medicine.findByPk(medicine_id) : null;
      const doctor = prescribed_by ? await Doctor.findByPk(prescribed_by) : null;
      const hospital = await Hospital.findByPk(hospital_id);
      const consultation = consultation_id ? await OpdConsultation.findByPk(consultation_id) : null;
      const visit = visit_id ? await OpdVisit.findByPk(visit_id) : null;

      res.status(201).json({ 
        success: true, 
        message: 'Prescription created successfully',
        data: {
          ...prescription.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          consultation: consultation ? { consultation_id: consultation.consultation_id, consultation_date: consultation.consultation_date } : null,
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, visit_type: visit.visit_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllPrescriptions(req, res) {
    try {
      const { patient_id, consultation_id, visit_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };

      if (patient_id) where.patient_id = patient_id;
      if (consultation_id) where.consultation_id = consultation_id;
      if (visit_id) where.visit_id = visit_id;

      const prescriptions = await OpdPrescription.findAll({ where });

      const prescriptionsWithDetails = await Promise.all(
        prescriptions.map(async (prescription) => {
          const patient = await Patient.findByPk(prescription.patient_id);
          const medicine = prescription.medicine_id ? await Medicine.findByPk(prescription.medicine_id) : null;
          const doctor = prescription.prescribed_by ? await Doctor.findByPk(prescription.prescribed_by) : null;
          const hospital = await Hospital.findByPk(prescription.hospital_id);
          const consultation = prescription.consultation_id ? await OpdConsultation.findByPk(prescription.consultation_id) : null;
          const visit = prescription.visit_id ? await OpdVisit.findByPk(prescription.visit_id) : null;
          
          return {
            ...prescription.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
            prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            consultation: consultation ? { consultation_id: consultation.consultation_id, consultation_date: consultation.consultation_date } : null,
            visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, visit_type: visit.visit_type } : null
          };
        })
      );

      res.json({ success: true, data: prescriptionsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPrescriptionById(req, res) {
    try {
      const prescription = await OpdPrescription.findOne({ where: { prescription_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!prescription) {
        return res.status(404).json({ success: false, message: 'Prescription not found' });
      }

      const patient = await Patient.findByPk(prescription.patient_id);
      const medicine = prescription.medicine_id ? await Medicine.findByPk(prescription.medicine_id) : null;
      const doctor = prescription.prescribed_by ? await Doctor.findByPk(prescription.prescribed_by) : null;
      const hospital = await Hospital.findByPk(prescription.hospital_id);
      const consultation = prescription.consultation_id ? await OpdConsultation.findByPk(prescription.consultation_id) : null;
      const visit = prescription.visit_id ? await OpdVisit.findByPk(prescription.visit_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...prescription.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          consultation: consultation ? { consultation_id: consultation.consultation_id, consultation_date: consultation.consultation_date } : null,
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, visit_type: visit.visit_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePrescription(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await OpdPrescription.update(
          { is_active: false },
          { where: { prescription_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        const deactivatedPrescription = await OpdPrescription.findOne({ where: { prescription_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Prescription deactivated successfully', data: deactivatedPrescription });
      }

      const [updated] = await OpdPrescription.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { prescription_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Prescription not found' });
      }

      const updatedPrescription = await OpdPrescription.findOne({ where: { prescription_id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedPrescription.patient_id);
      const medicine = updatedPrescription.medicine_id ? await Medicine.findByPk(updatedPrescription.medicine_id) : null;
      const doctor = updatedPrescription.prescribed_by ? await Doctor.findByPk(updatedPrescription.prescribed_by) : null;
      const hospital = await Hospital.findByPk(updatedPrescription.hospital_id);
      const consultation = updatedPrescription.consultation_id ? await OpdConsultation.findByPk(updatedPrescription.consultation_id) : null;
      const visit = updatedPrescription.visit_id ? await OpdVisit.findByPk(updatedPrescription.visit_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...updatedPrescription.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          consultation: consultation ? { consultation_id: consultation.consultation_id, consultation_date: consultation.consultation_date } : null,
          visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, visit_type: visit.visit_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePrescription(req, res) {
    try {
      const deleted = await OpdPrescription.destroy({
        where: { prescription_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Prescription not found' });
      }

      res.json({ success: true, message: 'Prescription permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPrescriptionsByPatientId(req, res) {
    try {
      const prescriptions = await OpdPrescription.findAll({
        where: {
          patient_id: req.params.patientId,
          is_active: true,
          hospital_id: req.hospitalId
        },
        order: [['prescribed_at', 'DESC']]
      });

      const prescriptionsWithDetails = await Promise.all(
        prescriptions.map(async (prescription) => {
          const patient = await Patient.findByPk(prescription.patient_id);
          const medicine = prescription.medicine_id ? await Medicine.findByPk(prescription.medicine_id) : null;
          const doctor = prescription.prescribed_by ? await Doctor.findByPk(prescription.prescribed_by) : null;
          const hospital = await Hospital.findByPk(prescription.hospital_id);
          const consultation = prescription.consultation_id ? await OpdConsultation.findByPk(prescription.consultation_id) : null;
          const visit = prescription.visit_id ? await OpdVisit.findByPk(prescription.visit_id) : null;
          
          return {
            ...prescription.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
            prescribedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            prescribed_by_name: doctor ? doctor.name : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            consultation: consultation ? { consultation_id: consultation.consultation_id, consultation_date: consultation.consultation_date } : null,
            visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, visit_type: visit.visit_type } : null
          };
        })
      );

      res.json({ success: true, data: prescriptionsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/opd-prescriptions/:id/pdf  or  GET /api/opd-prescriptions/by-visit/:visitId/pdf
  static async generatePDF(req, res) {
    try {
      const { id, visitId } = req.params;
      let where;
      if (visitId) where = { visit_id: visitId, is_active: true };
      else where = { prescription_id: id };

      const list = await OpdPrescription.findAll({ where });
      if (!list.length) {
        return res.status(404).json({ success: false, message: 'Prescription not found' });
      }

      const head = list[0];
      const patient = await Patient.findByPk(head.patient_id);
      const doctor = head.prescribed_by ? await Doctor.findByPk(head.prescribed_by) : null;
      const hospital = await Hospital.findByPk(head.hospital_id);

      const items = list.map(p => ({
        medicine_name: p.medicine_name,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions
      }));

      const { generatePrescriptionPDF } = require('../utils/pdfGenerator');
      generatePrescriptionPDF(res, {
        prescription: { prescription_id: head.prescription_id, prescription_date: head.prescribed_at, advice: head.advice },
        patient,
        doctor,
        hospital,
        items
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OpdPrescriptionController;
