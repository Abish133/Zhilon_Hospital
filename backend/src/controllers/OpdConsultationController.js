const { OpdConsultation, Hospital, Doctor, Patient, OpdVisit, OpdAppointment, BillingEpisode, BillCharge, ChargeMaster, LabOrder, LabOrderDetail, LabTest, RadiologyOrders, RadiologyTests } = require('../models');

class OpdConsultationController {
  static async createConsultation(req, res) {
    try {
      const { 
        visit_id, 
        patient_id, 
        doctor_id, 
        chief_complaints, 
        clinical_notes, 
        examination_findings,
        diagnosis_code, 
        diagnosis_description,
        treatment_plan, 
        follow_up_date, 
        follow_up_instructions,
        consultation_date, 
        hospital_id 
      } = req.body;
      
      if (!visit_id || !patient_id || !doctor_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'visit_id, patient_id, doctor_id, and hospital_id are required' 
        });
      }

      const consultation = await OpdConsultation.create({ 
        visit_id, 
        patient_id,
        doctor_id, 
        chief_complaints, 
        clinical_notes, 
        examination_findings,
        diagnosis_code, 
        diagnosis_description,
        treatment_plan, 
        follow_up_date, 
        follow_up_instructions,
        consultation_date,
        hospital_id 
      });
      
      // Auto-create follow-up appointment if date is provided
      if (follow_up_date) {
        try {
          await OpdAppointment.create({
            patient_id,
            doctor_id,
            hospital_id,
            appointment_date: follow_up_date,
            appointment_time: '09:00:00', // Default follow-up time
            status: 'Scheduled',
            appointment_type: 'Follow-up',
            reason: `Follow-up from consultation #${consultation.consultation_id}`,
            is_active: true
          });
        } catch (appErr) {
          console.error('Failed to create automatic follow-up appointment:', appErr);
          // We don't fail the consultation creation if appointment fails
        }
      }
      
      const billingEpisode = await BillingEpisode.findOne({
        where: { opd_visit_id: visit_id, status: 'Open' }
      });

      if (billingEpisode) {
        const doctor = await Doctor.findByPk(doctor_id);

        const whereClause = {
          service_type: 'Consultation',
          hospital_id,
          is_active: true
        };

        if (doctor?.department_id) {
          whereClause.department_id = doctor.department_id;
        }

        const consultationCharge = await ChargeMaster.findOne({
          where: whereClause
        });

        if (consultationCharge) {
          const rate = parseFloat(consultationCharge.charge_amount);
          const quantity = 1;
          const amount = rate * quantity;
          const gstPercent = parseFloat(consultationCharge.gst_percentage || 0);
          const taxableAmount = amount;
          const gstAmount = (taxableAmount * gstPercent) / 100;
          const netAmount = taxableAmount + gstAmount;

          await BillCharge.create({
            episode_id: billingEpisode.episode_id,
            hospital_id,
            charge_date: new Date(),
            service_type: 'Consultation',
            service_id: consultation.consultation_id,
            description: `Consultation - ${doctor?.name || 'Doctor'}`,
            quantity,
            rate,
            amount,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: taxableAmount,
            gst_percent: gstPercent,
            gst_amount: gstAmount,
            net_amount: netAmount
          });
        }

        const labOrders = await LabOrder.findAll({
          where: { visit_id, visit_type: 'OPD', is_active: true }
        });

        for (const labOrder of labOrders) {
          const labOrderDetails = await LabOrderDetail.findAll({
            where: { order_id: labOrder.order_id, is_active: true }
          });

          for (const detail of labOrderDetails) {
            if (detail.charge) {
              const existing = await BillCharge.findOne({
                where: { episode_id: billingEpisode.episode_id, service_type: 'Investigation', service_id: detail.detail_id }
              });

              if (!existing) {
                await BillCharge.create({
                  episode_id: billingEpisode.episode_id,
                  hospital_id,
                  charge_date: new Date(),
                  service_type: 'Investigation',
                  service_id: detail.detail_id,
                  description: `Lab Test - ${detail.test_name}`,
                  quantity: 1,
                  rate: parseFloat(detail.charge),
                  amount: parseFloat(detail.charge),
                  discount_percent: 0,
                  discount_amount: 0,
                  taxable_amount: parseFloat(detail.charge),
                  gst_percent: 0,
                  gst_amount: 0,
                  net_amount: parseFloat(detail.charge)
                });
              }
            }
          }
        }

        const radiologyOrders = await RadiologyOrders.findAll({
          where: { visit_id, visit_type: 'OPD', is_active: true }
        });

        for (const radOrder of radiologyOrders) {
          const radTest = await RadiologyTests.findByPk(radOrder.rad_test_id);
          if (radTest && radTest.charge) {
            const existing = await BillCharge.findOne({
              where: { episode_id: billingEpisode.episode_id, service_type: 'Investigation', service_id: radOrder.rad_order_id }
            });

            if (!existing) {
              await BillCharge.create({
                episode_id: billingEpisode.episode_id,
                hospital_id,
                charge_date: new Date(),
                service_type: 'Investigation',
                service_id: radOrder.rad_order_id,
                description: `Radiology - ${radOrder.test_name}`,
                quantity: 1,
                rate: parseFloat(radTest.charge),
                amount: parseFloat(radTest.charge),
                discount_percent: 0,
                discount_amount: 0,
                taxable_amount: parseFloat(radTest.charge),
                gst_percent: 0,
                gst_amount: 0,
                net_amount: parseFloat(radTest.charge)
              });
            }
          }
        }
      }
      
      const hospital = await Hospital.findByPk(hospital_id);
      const doctor = await Doctor.findByPk(doctor_id);
      const patient = await Patient.findByPk(patient_id);
      const visit = await OpdVisit.findByPk(visit_id);

      res.status(201).json({ 
        success: true, 
        message: 'Consultation created successfully',
        data: {
          ...consultation.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
       visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllConsultations(req, res) {
    try {
      const { visit_id, patient_id } = req.query;
      const hospital_id = req.user?.hospital_id;
      const where = { is_active: true };
      if (hospital_id) where.hospital_id = hospital_id;
      if (visit_id) where.visit_id = parseInt(visit_id);
      if (patient_id) where.patient_id = parseInt(patient_id);

      const consultations = await OpdConsultation.findAll({
        where,
        include: [
          { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'], required: false },
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid'], required: false },
          { model: OpdVisit, as: 'visit', attributes: ['visit_id', 'visit_date', 'token_number'], required: false }
        ],
        order: [['consultation_date', 'DESC']]
      });

      res.json({ success: true, data: consultations });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getConsultationById(req, res) {
    try {
      const consultation = await OpdConsultation.findOne({ where: { consultation_id: req.params.id, hospital_id: req.hospitalId } });
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }
      
      const hospital = await Hospital.findByPk(consultation.hospital_id);
      const doctor = await Doctor.findByPk(consultation.doctor_id);
      const patient = await Patient.findByPk(consultation.patient_id);
      const visit = await OpdVisit.findByPk(consultation.visit_id);
      res.json({ 
        success: true, 
        data: {
          ...consultation.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
           visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateConsultation(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await OpdConsultation.update(
          { is_active: false },
          { where: { consultation_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Consultation not found' });
        }
        const deactivatedConsultation = await OpdConsultation.findOne({ where: { consultation_id: req.params.id, hospital_id: req.hospitalId } });
        const hospital = await Hospital.findByPk(deactivatedConsultation.hospital_id);
        const doctor = await Doctor.findByPk(deactivatedConsultation.doctor_id);
        const patient = await Patient.findByPk(deactivatedConsultation.patient_id);
        const visit = await OpdVisit.findByPk(deactivatedConsultation.visit_id);
        return res.json({ 
          success: true, 
          message: 'Consultation deactivated successfully', 
          data: {
            ...deactivatedConsultation.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
             visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
          }
        });
      }
      
      const [updated] = await OpdConsultation.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { consultation_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }
      const updatedConsultation = await OpdConsultation.findOne({ where: { consultation_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedConsultation.hospital_id);
      const doctor = await Doctor.findByPk(updatedConsultation.doctor_id);
      const patient = await Patient.findByPk(updatedConsultation.patient_id);
      const visit = await OpdVisit.findByPk(updatedConsultation.visit_id);
      
      res.json({ 
        success: true, 
        data: {
          ...updatedConsultation.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
           visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteConsultation(req, res) {
    try {
      const deleted = await OpdConsultation.destroy({
        where: { consultation_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }
      res.json({ success: true, message: 'Consultation permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getConsultationsByPatientId(req, res) {
    try {
      const consultations = await OpdConsultation.findAll({
        where: { 
          patient_id: req.params.patientId,
          is_active: true 
        },
        order: [['consultation_date', 'DESC']]
      });
      
      const consultationsWithDetails = await Promise.all(
        consultations.map(async (consultation) => {
          const hospital = await Hospital.findByPk(consultation.hospital_id);
          const doctor = await Doctor.findByPk(consultation.doctor_id);
          const patient = await Patient.findByPk(consultation.patient_id);
          const visit = await OpdVisit.findByPk(consultation.visit_id);
          return {
            ...consultation.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            doctor_name: doctor ? doctor.name : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            visit: visit ? { visit_id: visit.visit_id, visit_date: visit.visit_date, token_number: visit.token_number } : null,
          };
        })
      );
      
      res.json({ success: true, data: consultationsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OpdConsultationController;
