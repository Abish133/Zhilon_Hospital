const { OpdVisit, OpdAppointment, Patient, Doctor, Department, Hospital, BillingEpisode, sequelize } = require('../models');
const { Op } = require('sequelize');

class OpdVisitController {
  static async createVisit(req, res) {
    const t = await sequelize.transaction();
    try {
      const { appointment_id, patient_id, doctor_id, department_id, visit_date, token_number, visit_type, hospital_id } = req.body;

      if (!patient_id || !visit_date || !token_number || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Patient, visit date, token number, and hospital are required'
        });
      }

      if (appointment_id) {
        const existing = await OpdVisit.findOne({
          where: { appointment_id, is_active: true },
          transaction: t
        });
        if (existing) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: 'A visit already exists for this appointment',
            data: { visit_id: existing.visit_id }
          });
        }
      } else {
        const existing = await OpdVisit.findOne({
          where: { patient_id, visit_date, hospital_id, is_active: true },
          transaction: t
        });
        if (existing) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: 'A visit already exists for this patient on this date',
            data: { visit_id: existing.visit_id }
          });
        }
      }

      const patient = await Patient.findByPk(patient_id, { transaction: t });
      const visit = await OpdVisit.create({
        appointment_id: appointment_id || null,
        patient_id,
        uhid: patient?.uhid || null,
        doctor_id: doctor_id || null,
        department_id: department_id || null,
        visit_date,
        token_number,
        visit_type: visit_type || 'Walk-in',
        status: 'Checked-in',
        checked_in_at: new Date(),
        hospital_id
      }, { transaction: t });

      // Automatically create Billing Episode for this visit
      const billingEpisode = await BillingEpisode.create({
        patient_id,
        hospital_id,
        uhid: patient?.uhid || null,
        episode_type: 'OPD',
        opd_visit_id: visit.visit_id,
        start_date: new Date(),
        status: 'Open'
      }, { transaction: t });

      await t.commit();

      const doctor = doctor_id ? await Doctor.findByPk(doctor_id) : null;
      const department = department_id ? await Department.findByPk(department_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);
      let appointment = null;
      if (appointment_id) {
        appointment = await OpdAppointment.findByPk(appointment_id);
      }

      res.status(201).json({ 
        success: true, 
        message: 'Visit and billing episode created successfully',
        data: {
          ...visit.toJSON(),
          billing_episode_id: billingEpisode.episode_id,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          appointment: appointment ? { appointment_id: appointment.appointment_id, appointment_date: appointment.appointment_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllVisits(req, res) {
    try {
      const { visit_date, doctor_id, status, patient_id, uhid, token_number, date_from, date_to, search } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      if (doctor_id) where.doctor_id = parseInt(doctor_id);
      if (status) where.status = status;
      if (patient_id) where.patient_id = parseInt(patient_id);
      if (uhid) where.uhid = uhid;
      if (token_number) where.token_number = parseInt(token_number);

      // Date: exact date or a from/to range
      if (visit_date) {
        where.visit_date = visit_date;
      } else if (date_from && date_to) {
        where.visit_date = { [Op.between]: [date_from, date_to] };
      } else if (date_from) {
        where.visit_date = { [Op.gte]: date_from };
      } else if (date_to) {
        where.visit_date = { [Op.lte]: date_to };
      }

      // Free-text patient search: resolve matching patients first, then scope
      // visits to those ids (visits store patient_id, not the name).
      if (search) {
        const like = { [Op.like]: `%${search}%` };
        const matched = await Patient.findAll({
          where: {
            hospital_id: req.hospitalId,
            [Op.or]: [
              { first_name: like },
              { last_name: like },
              { uhid: like },
              { mobile_number: like },
              ...(/^\d+$/.test(search) ? [{ patient_id: parseInt(search) }] : [])
            ]
          },
          attributes: ['patient_id']
        });
        where.patient_id = { [Op.in]: matched.map(p => p.patient_id) };
      }

      const visits = await OpdVisit.findAll({
        where,
        order: [['visit_date', 'DESC'], ['token_number', 'ASC']]
      });

      // Billing episodes are a separate table linked by opd_visit_id; batch-load
      // them so each visit can expose its billing_episode_id to the UI.
      const visitIds = visits.map(v => v.visit_id);
      const episodes = visitIds.length
        ? await BillingEpisode.findAll({
            where: { opd_visit_id: visitIds, hospital_id: req.hospitalId },
            attributes: ['episode_id', 'opd_visit_id']
          })
        : [];
      const episodeByVisit = {};
      episodes.forEach(e => { episodeByVisit[e.opd_visit_id] = e.episode_id; });

      const visitsWithDetails = await Promise.all(
        visits.map(async (visit) => {
          const patient = await Patient.findByPk(visit.patient_id);
          const doctor = visit.doctor_id ? await Doctor.findByPk(visit.doctor_id) : null;
          const department = visit.department_id ? await Department.findByPk(visit.department_id) : null;
          const hospital = await Hospital.findByPk(visit.hospital_id);
          let appointment = null;
          if (visit.appointment_id) {
            appointment = await OpdAppointment.findByPk(visit.appointment_id);
          }

          return {
            ...visit.toJSON(),
            billing_episode_id: episodeByVisit[visit.visit_id] || null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            department: department ? { id: department.id, department_name: department.department_name } : null,
            appointment: appointment ? { appointment_id: appointment.appointment_id, appointment_date: appointment.appointment_date } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: visitsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getVisitById(req, res) {
    try {
      const visit = await OpdVisit.findOne({ where: { visit_id: req.params.id, hospital_id: req.hospitalId } });

      if (!visit) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
      }

      const patient = await Patient.findByPk(visit.patient_id);
      const doctor = visit.doctor_id ? await Doctor.findByPk(visit.doctor_id) : null;
      const department = visit.department_id ? await Department.findByPk(visit.department_id) : null;
      const hospital = await Hospital.findByPk(visit.hospital_id);
      let appointment = null;
      if (visit.appointment_id) {
        appointment = await OpdAppointment.findByPk(visit.appointment_id);
      }
      const episode = await BillingEpisode.findOne({
        where: { opd_visit_id: visit.visit_id, hospital_id: req.hospitalId },
        attributes: ['episode_id']
      });

      res.json({
        success: true,
        data: {
          ...visit.toJSON(),
          billing_episode_id: episode?.episode_id || null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          appointment: appointment ? { appointment_id: appointment.appointment_id, appointment_date: appointment.appointment_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateVisit(req, res) {
    try {
      const { is_active, status, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await OpdVisit.update(
          { is_active: false },
          { where: { visit_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Visit not found' });
        }
        const deactivatedVisit = await OpdVisit.findOne({ where: { visit_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Visit deactivated successfully', data: deactivatedVisit });
      }

      const updateFields = { ...updateData };
      if (status) {
        updateFields.status = status;
        if (status === 'In-consultation' && !updateData.consultation_start) {
          updateFields.consultation_start = new Date();
        }
        if (status === 'Completed' && !updateData.consultation_end) {
          updateFields.consultation_end = new Date();
        }
      }

      const [updated] = await OpdVisit.update(
        updateFields,
        { where: { visit_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
      }

      const updatedVisit = await OpdVisit.findOne({ where: { visit_id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedVisit.patient_id);
      const doctor = updatedVisit.doctor_id ? await Doctor.findByPk(updatedVisit.doctor_id) : null;
      const department = updatedVisit.department_id ? await Department.findByPk(updatedVisit.department_id) : null;
      const hospital = await Hospital.findByPk(updatedVisit.hospital_id);
      let appointment = null;
      if (updatedVisit.appointment_id) {
        appointment = await OpdAppointment.findByPk(updatedVisit.appointment_id);
      }

      res.json({ 
        success: true, 
        data: {
          ...updatedVisit.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          appointment: appointment ? { appointment_id: appointment.appointment_id, appointment_date: appointment.appointment_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteVisit(req, res) {
    try {
      const deleted = await OpdVisit.destroy({
        where: { visit_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Visit not found' });
      }

      res.json({ success: true, message: 'Visit permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OpdVisitController;
