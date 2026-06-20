const { OpdConsultation, Hospital, Doctor, Patient, OpdVisit, OpdAppointment, BillingEpisode, BillCharge, ChargeMaster, LabOrder, LabOrderDetail, LabTest, RadiologyOrders, RadiologyTests, PackageApplication, sequelize } = require('../models');

class OpdConsultationController {
  static async createConsultation(req, res) {
    const t = await sequelize.transaction();
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
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'visit_id, patient_id, doctor_id, and hospital_id are required'
        });
      }

      // Look up the open billing episode for this visit. If a package was applied to
      // this episode and still has unused consult credits, this consultation is covered:
      // we mark it on the consultation row and SKIP auto-billing for the consult fee.
      let coveringPackageChargeId = null;
      // Tracks whether a consultation fee actually got billed, so the UI can warn
      // when neither a package nor a Charge Master entry covered the consult.
      let consultationChargeAdded = false;
      const openEpisode = await BillingEpisode.findOne({
        where: { opd_visit_id: visit_id, status: 'Open' },
        transaction: t
      });
      if (openEpisode) {
        const application = await PackageApplication.findOne({
          where: {
            episode_id: openEpisode.episode_id,
            is_active: true,
            consult_credits_used: { [require('sequelize').Op.lt]: sequelize.col('consult_credits_total') }
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (application) {
          coveringPackageChargeId = application.bill_charge_id;
          await application.update(
            { consult_credits_used: application.consult_credits_used + 1 },
            { transaction: t }
          );
        }
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
        covered_by_package_charge_id: coveringPackageChargeId,
        hospital_id
      }, { transaction: t });

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
          }, { transaction: t });
        } catch (appErr) {
          console.error('Failed to create automatic follow-up appointment:', appErr);
          // We don't fail the consultation creation if appointment fails
        }
      }

      const billingEpisode = openEpisode || await BillingEpisode.findOne({
        where: { opd_visit_id: visit_id, status: 'Open' },
        transaction: t
      });

      // Skip auto-billing the consultation fee when this consultation was covered
      // by a package credit (handled before the OpdConsultation.create above).
      if (billingEpisode && !coveringPackageChargeId) {
        const doctor = await Doctor.findByPk(doctor_id, { transaction: t });

        const whereClause = {
          service_type: 'Consultation',
          hospital_id,
          is_active: true
        };

        if (doctor?.department_id) {
          whereClause.department_id = doctor.department_id;
        }

        let consultationCharge = await ChargeMaster.findOne({
          where: whereClause,
          transaction: t
        });

        // Fallback: if no department-specific consultation charge is configured,
        // use any active hospital-level 'Consultation' charge so the consult fee
        // isn't silently dropped to zero. (Configure per-department rates to override.)
        if (!consultationCharge && whereClause.department_id) {
          consultationCharge = await ChargeMaster.findOne({
            where: { service_type: 'Consultation', hospital_id, is_active: true },
            transaction: t
          });
        }

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
          }, { transaction: t });
          consultationChargeAdded = true;
        }

        const labOrders = await LabOrder.findAll({
          where: { visit_id, visit_type: 'OPD', is_active: true },
          transaction: t
        });

        for (const labOrder of labOrders) {
          const labOrderDetails = await LabOrderDetail.findAll({
            where: { order_id: labOrder.order_id, is_active: true },
            transaction: t
          });

          for (const detail of labOrderDetails) {
            // Skip lab tests already covered by an applied package — their cost is in the package charge.
            if (detail.charge && !detail.covered_by_package_charge_id) {
              const existing = await BillCharge.findOne({
                where: { episode_id: billingEpisode.episode_id, service_type: 'Investigation', service_id: detail.detail_id },
                transaction: t
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
                }, { transaction: t });
              }
            }
          }
        }

        const radiologyOrders = await RadiologyOrders.findAll({
          where: { visit_id, visit_type: 'OPD', is_active: true },
          transaction: t
        });

        for (const radOrder of radiologyOrders) {
          // Skip radiology orders already covered by an applied package.
          if (radOrder.covered_by_package_charge_id) continue;
          const radTest = await RadiologyTests.findByPk(radOrder.rad_test_id, { transaction: t });
          if (radTest && radTest.charge) {
            const existing = await BillCharge.findOne({
              where: { episode_id: billingEpisode.episode_id, service_type: 'Investigation', service_id: radOrder.rad_order_id },
              transaction: t
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
              }, { transaction: t });
            }
          }
        }
      }

      await t.commit();

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
          covered_by_package: !!coveringPackageChargeId,
          consultation_charge_added: consultationChargeAdded
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
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
