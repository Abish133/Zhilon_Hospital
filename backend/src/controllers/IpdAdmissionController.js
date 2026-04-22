const { IpdAdmission, Patient, Doctor, Hospital, Department, Ward, Bed, User, BillingEpisode, sequelize } = require('../models');

class IpdAdmissionController {
  static async createAdmission(req, res) {
    const t = await sequelize.transaction();
    try {
      const { patient_id, uhid, admitting_doctor_id, department_id, ward_id, bed_id, room_number, bed_number, admission_date, admission_reason, provisional_diagnosis, admission_type, referred_by, advance_paid, status, admitted_by, hospital_id } = req.body;
      
      if (!patient_id || !admitting_doctor_id || !hospital_id) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Patient, admitting doctor, and hospital are required' 
        });
      }

      // Lock and verify bed availability before admission
      if (bed_id) {
        const bedRow = await Bed.findByPk(bed_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!bedRow) {
          await t.rollback();
          return res.status(404).json({ success: false, message: 'Bed not found' });
        }
        if (bedRow.status && bedRow.status !== 'Available') {
          await t.rollback();
          return res.status(409).json({ success: false, message: `Bed is ${bedRow.status}, cannot admit` });
        }
      }

      const admission = await IpdAdmission.create({
        patient_id,
        uhid,
        admitting_doctor_id,
        department_id,
        ward_id,
        bed_id,
        room_number,
        bed_number,
        admission_date: admission_date || new Date(),
        admission_reason,
        provisional_diagnosis,
        admission_type: admission_type || 'Planned',
        referred_by,
        advance_paid: advance_paid || 0,
        status: status || 'Admitted',
        admitted_by,
        hospital_id
      }, { transaction: t });

      // Update bed status to Occupied
      if (bed_id) {
        await Bed.update(
          { status: 'Occupied' },
          { where: { bed_id }, transaction: t }
        );
      }

      const billingEpisode = await BillingEpisode.create({
        patient_id,
        hospital_id,
        uhid,
        episode_type: 'IPD',
        admission_id: admission.admission_id,
        start_date: admission.admission_date,
        status: 'Open'
      }, { transaction: t });

      await t.commit();

      const patient = await Patient.findByPk(patient_id);
      const doctor = await Doctor.findByPk(admitting_doctor_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const department = department_id ? await Department.findByPk(department_id) : null;
      const ward = ward_id ? await Ward.findByPk(ward_id) : null;
      const bed = bed_id ? await Bed.findByPk(bed_id) : null;
      const admittedByUser = admitted_by ? await User.findByPk(admitted_by) : null;

      res.status(201).json({ 
        success: true, 
        message: 'Admission and billing episode created successfully',
        data: {
          ...admission.toJSON(),
          billingEpisode: billingEpisode.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          admittingDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null,
          bed: bed ? { bed_id: bed.bed_id, bed_number: bed.bed_number, bed_type: bed.bed_type, status: bed.status } : null,
          admittedBy: admittedByUser ? { id: admittedByUser.id, name: admittedByUser.name, email: admittedByUser.email } : null
        }
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllAdmissions(req, res) {
    try {
      const { status, uhid } = req.query;
      const hospital_id = req.user?.hospital_id;

      const where = { is_active: true };
      if (hospital_id) where.hospital_id = hospital_id;
      if (status) where.status = status;
      if (uhid) where.uhid = uhid;

      const admissions = await IpdAdmission.findAll({
        where,
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid', 'mobile_number', 'gender', 'age'] },
          { model: Doctor, as: 'admittingDoctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'], required: false },
          { model: Ward, as: 'ward', attributes: ['ward_id', 'ward_name', 'ward_type'], required: false },
          { model: Bed, as: 'bed', attributes: ['bed_id', 'bed_number', 'bed_type', 'room_number', 'status'], required: false },
        ],
        order: [['admission_date', 'DESC']]
      });

      res.json({ success: true, data: admissions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAdmissionById(req, res) {
    try {
      const admission = await IpdAdmission.findOne({
        where: {
          admission_id: req.params.id,
          hospital_id: req.hospitalId
        },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid', 'mobile_number', 'gender', 'age', 'blood_group'] },
          { model: Doctor, as: 'admittingDoctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'], required: false },
          { model: Ward, as: 'ward', attributes: ['ward_id', 'ward_name', 'ward_type'], required: false },
          { model: Bed, as: 'bed', attributes: ['bed_id', 'bed_number', 'bed_type', 'room_number', 'status'], required: false },
        ]
      });

      if (!admission) {
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      res.json({ success: true, data: admission });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateAdmission(req, res) {
    const t = await sequelize.transaction();
    try {
      const { is_active, ...updateData } = req.body;

      const existing = await IpdAdmission.findOne({
        where: {
          admission_id: req.params.id,
          hospital_id: req.hospitalId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!existing) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      if (is_active === 0 || is_active === false) {
        await IpdAdmission.update(
          { is_active: false, status: existing.status === 'Admitted' ? 'Cancelled' : existing.status },
          { where: { admission_id: req.params.id, hospital_id: req.hospitalId }, transaction: t }
        );
        // Release bed if still occupied by this admission
        if (existing.bed_id) {
          await Bed.update({ status: 'Available' }, { where: { bed_id: existing.bed_id }, transaction: t });
        }
        await t.commit();
        const deactivatedAdmission = await IpdAdmission.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Admission deactivated successfully', data: deactivatedAdmission });
      }

      // Handle bed change: if the new bed differs from existing, verify availability and swap
      const newBedId = updateData.bed_id;
      if (newBedId !== undefined && newBedId !== existing.bed_id) {
        if (newBedId) {
          const newBed = await Bed.findByPk(newBedId, { transaction: t, lock: t.LOCK.UPDATE });
          if (!newBed) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'New bed not found' });
          }
          if (newBed.status && newBed.status !== 'Available') {
            await t.rollback();
            return res.status(409).json({ success: false, message: `Bed is ${newBed.status}, cannot assign` });
          }
          await Bed.update({ status: 'Occupied' }, { where: { bed_id: newBedId }, transaction: t });
        }
        if (existing.bed_id) {
          await Bed.update({ status: 'Available' }, { where: { bed_id: existing.bed_id }, transaction: t });
        }
      }

      // Handle status transition: released bed on Discharged / Cancelled
      const newStatus = updateData.status;
      if (newStatus && newStatus !== existing.status && ['Discharged', 'Cancelled'].includes(newStatus)) {
        const bedToRelease = newBedId !== undefined ? newBedId : existing.bed_id;
        if (bedToRelease) {
          await Bed.update({ status: 'Available' }, { where: { bed_id: bedToRelease }, transaction: t });
        }

        // Auto-close billing episode on discharge
        if (newStatus === 'Discharged') {
          await BillingEpisode.update(
            { status: 'Closed', end_date: new Date() },
            { where: { admission_id: req.params.id, status: 'Open' , hospital_id: req.hospitalId }, transaction: t }
          );
        }
      }

      const [updated] = await IpdAdmission.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { 
          admission_id: req.params.id,
          hospital_id: req.hospitalId
        }, transaction: t }
      );

      if (!updated) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      await t.commit();

      const updatedAdmission = await IpdAdmission.findOne({
        where: {
          admission_id: req.params.id,
          hospital_id: req.hospitalId
        },
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid', 'mobile_number', 'gender', 'age'] },
          { model: Doctor, as: 'admittingDoctor', attributes: ['id', 'name', 'specialization'] },
          { model: Department, as: 'department', attributes: ['id', 'department_name'], required: false },
          { model: Ward, as: 'ward', attributes: ['ward_id', 'ward_name', 'ward_type'], required: false },
          { model: Bed, as: 'bed', attributes: ['bed_id', 'bed_number', 'bed_type', 'room_number', 'status'], required: false },
        ]
      });

      res.json({ success: true, data: updatedAdmission });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteAdmission(req, res) {
    const t = await sequelize.transaction();
    try {
      const admission = await IpdAdmission.findOne({
        where: {
          admission_id: req.params.id,
          hospital_id: req.hospitalId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!admission) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      if (admission.bed_id) {
        await Bed.update({ status: 'Available' }, { where: { bed_id: admission.bed_id }, transaction: t });
      }

      await IpdAdmission.destroy({ where: { 
        admission_id: req.params.id,
        hospital_id: req.hospitalId
      }, transaction: t });
      await t.commit();

      res.json({ success: true, message: 'Admission permanently deleted' });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async transferBed(req, res) {
    const t = await sequelize.transaction();
    try {
      const { admission_id, new_ward_id, new_bed_id, transfer_date, reason } = req.body;
      const hospital_id = req.user?.hospital_id;

      if (!admission_id || !new_bed_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Admission ID and New Bed ID are required' });
      }

      const admission = await IpdAdmission.findOne({
        where: {
          admission_id,
          hospital_id: req.hospitalId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!admission) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Admission not found' });
      }

      if (admission.status !== 'Admitted') {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Cannot transfer patient with status ${admission.status}` });
      }

      // Check new bed availability
      const newBed = await Bed.findByPk(new_bed_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!newBed) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Target bed not found' });
      }
      if (newBed.status !== 'Available') {
        await t.rollback();
        return res.status(409).json({ success: false, message: `Target bed is ${newBed.status}` });
      }

      // Release old bed
      if (admission.bed_id) {
        await Bed.update({ status: 'Available' }, { where: { bed_id: admission.bed_id }, transaction: t });
      }

      // Occupy new bed
      await Bed.update({ status: 'Occupied' }, { where: { bed_id: new_bed_id }, transaction: t });

      // Update admission
      await IpdAdmission.update({
        ward_id: new_ward_id || admission.ward_id,
        bed_id: new_bed_id,
        bed_number: newBed.bed_number,
        room_number: newBed.room_number || admission.room_number
      }, { where: { admission_id }, transaction: t });

      await t.commit();
      res.json({ success: true, message: 'Patient transferred successfully' });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IpdAdmissionController;
