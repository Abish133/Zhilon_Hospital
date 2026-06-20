const { IpdDischargeSummary, IpdAdmission, IpdDischargeNursingSummary, Bed, Bill, BillCharge, BillingEpisode, Payment, PaymentAdvance, Patient, Doctor, User, Hospital, sequelize } = require('../models');

class IpdDischargeSummaryController {
  static async createDischargeSummary(req, res) {
    const t = await sequelize.transaction();
    try {
      const { 
        admission_id, 
        patient_id, 
        discharge_date, 
        discharge_type, 
        final_diagnosis, 
        procedures_performed, 
        clinical_summary, 
        discharge_medications, 
        follow_up_instructions, 
        follow_up_date, 
        diet_advice, 
        activity_restrictions, 
        discharged_by, 
        discharge_summary_by, 
        hospital_id,
        nursing_notes
      } = req.body;
      
      if (!admission_id || !patient_id || !discharge_type || !discharged_by || !discharge_summary_by || !hospital_id) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'admission_id, patient_id, discharge_type, discharged_by, discharge_summary_by, and hospital_id are required' 
        });
      }

      // Lock and retrieve admission
      const admission = await IpdAdmission.findByPk(admission_id, {
        lock: t.LOCK.UPDATE,
        transaction: t,
        include: ['bed', 'patient']
      });

      if (!admission) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      if (admission.status !== 'Admitted') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Admission cannot be discharged. Current status: ${admission.status}`
        });
      }

      // Outstanding balance check (Indian hospital convention: warn before discharge)
      // Allow override via force_discharge=true (eg. for medico-legal / LAMA / death cases).
      const openEpisode = await BillingEpisode.findOne({
        where: { admission_id, status: 'Open' },
        transaction: t
      });
      if (openEpisode && req.body.force_discharge !== true) {
        const charges = await BillCharge.findAll({
          where: { episode_id: openEpisode.episode_id, is_active: true },
          attributes: ['net_amount'],
          transaction: t
        });
        const totalCharges = charges.reduce((sum, c) => sum + Number(c.net_amount || 0), 0);

        const billsForEpisode = await Bill.findAll({
          where: { episode_id: openEpisode.episode_id, is_active: true },
          attributes: ['bill_id'],
          transaction: t
        });
        const billIds = billsForEpisode.map(b => b.bill_id);

        let totalPaid = 0;
        if (billIds.length) {
          const payments = await Payment.findAll({
            where: { bill_id: billIds, is_active: true },
            attributes: ['amount_paid'],
            transaction: t
          });
          totalPaid = payments.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
        }
        // Include unutilized advances against this admission (deposit/advance still on credit)
        const advances = await PaymentAdvance.findAll({
          where: { admission_id, is_active: true },
          attributes: ['balance_amount'],
          transaction: t
        }).catch(() => []);
        const advanceBalance = advances.reduce(
          (s, a) => s + Number(a.balance_amount || 0), 0
        );

        const outstanding = +(totalCharges - totalPaid - advanceBalance).toFixed(2);
        if (outstanding > 0) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: `Outstanding balance of ₹${outstanding.toFixed(2)}. Please collect payment, or use "Discharge anyway" to override.`,
            outstanding,
            totalCharges,
            totalPaid,
            advanceBalance
          });
        }
      }

      // Create discharge summary
      const dischargeSummary = await IpdDischargeSummary.create({ 
        admission_id,
        patient_id,
        discharge_date: discharge_date || new Date(),
        discharge_type,
        final_diagnosis,
        procedures_performed,
        clinical_summary,
        discharge_medications,
        follow_up_instructions,
        follow_up_date,
        diet_advice,
        activity_restrictions,
        discharged_by,
        discharge_summary_by,
        hospital_id,
        is_active: true
      }, { transaction: t });

      // Create nursing summary if provided
      if (nursing_notes) {
        await IpdDischargeNursingSummary.create({
          admission_id,
          nursing_notes,
          discharge_date: discharge_date || new Date()
        }, { transaction: t });
      }

      // Close billing episode for this admission
      const episode = await BillingEpisode.findOne({
        where: { admission_id, status: 'Open' },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      let bill = null;
      if (episode) {
        await episode.update({ status: 'Closed', closed_at: new Date() }, { transaction: t });
        bill = await Bill.findOne({
          where: { episode_id: episode.episode_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
      }

      // Release bed
      if (admission.bed_id) {
        const bed = await Bed.findByPk(admission.bed_id, {
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (bed) {
          await bed.update({
            status: 'Available',
            current_patient: null,
            admission_id: null
          }, { transaction: t });
        }
      }

      // Mark admission as discharged
      await admission.update({
        status: 'Discharged',
        discharge_date: discharge_date || new Date(),
        discharge_summary_id: dischargeSummary.id
      }, { transaction: t });

      await t.commit();

      // Fetch related data for response
      const patient = await Patient.findByPk(patient_id);
      const doctor = await Doctor.findByPk(discharged_by);
      const user = await User.findByPk(discharge_summary_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Patient discharged successfully',
        data: {
          ...dischargeSummary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, status: 'Discharged', bed_id: admission.bed_id } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          dischargingDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          summaryPreparedBy: user ? { id: user.id, name: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          billing: bill ? { bill_number: bill.bill_number, net_amount: bill.net_amount, payment_status: bill.payment_status } : null
        }
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllDischargeSummaries(req, res) {
    try {
      const summaries = await IpdDischargeSummary.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const summariesWithDetails = await Promise.all(
        summaries.map(async (summary) => {
          const admission = await IpdAdmission.findByPk(summary.admission_id);
          const patient = await Patient.findByPk(summary.patient_id);
          const doctor = await Doctor.findByPk(summary.discharged_by);
          const user = await User.findByPk(summary.discharge_summary_by, { attributes: { exclude: ['password'] } });
          const hospital = await Hospital.findByPk(summary.hospital_id);
          
          return {
            ...summary.toJSON(),
            admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            dischargingDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            summaryPreparedBy: user ? { id: user.id, username: user.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: summariesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDischargeSummaryById(req, res) {
    try {
      const summary = await IpdDischargeSummary.findOne({ where: { discharge_id: req.params.id, hospital_id: req.hospitalId } });

      if (!summary) {
        return res.status(404).json({ success: false, message: 'Discharge summary not found' });
      }

      const admission = await IpdAdmission.findByPk(summary.admission_id);
      const patient = await Patient.findByPk(summary.patient_id);
      const doctor = await Doctor.findByPk(summary.discharged_by);
      const user = await User.findByPk(summary.discharge_summary_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(summary.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...summary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          dischargingDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          summaryPreparedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDischargeSummary(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await IpdDischargeSummary.update(
          { is_active: false },
          { where: { discharge_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Discharge summary not found' });
        }
        const deactivatedSummary = await IpdDischargeSummary.findOne({ where: { discharge_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Discharge summary deactivated successfully', data: deactivatedSummary });
      }

      const [updated] = await IpdDischargeSummary.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { discharge_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Discharge summary not found' });
      }

      const updatedSummary = await IpdDischargeSummary.findOne({ where: { discharge_id: req.params.id, hospital_id: req.hospitalId } });
      const admission = await IpdAdmission.findByPk(updatedSummary.admission_id);
      const patient = await Patient.findByPk(updatedSummary.patient_id);
      const doctor = await Doctor.findByPk(updatedSummary.discharged_by);
      const user = await User.findByPk(updatedSummary.discharge_summary_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(updatedSummary.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedSummary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          dischargingDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          summaryPreparedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDischargeSummary(req, res) {
    try {
      const deleted = await IpdDischargeSummary.destroy({
        where: { discharge_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Discharge summary not found' });
      }

      res.json({ success: true, message: 'Discharge summary permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IpdDischargeSummaryController;
