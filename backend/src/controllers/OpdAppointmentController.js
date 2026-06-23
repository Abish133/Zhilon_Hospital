const { OpdAppointment, Patient, Doctor, Department, Hospital, OpdVisit, BillingEpisode, DoctorSchedules, DoctorLeave, sequelize } = require('../models');
const { Op } = require('sequelize');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class OpdAppointmentController {
  static async createAppointment(req, res) {
    const t = await sequelize.transaction();
    try {
      const { patient_id, doctor_id, department_id, hospital_id, appointment_date, appointment_time, visit_type } = req.body;

      if (!patient_id || !doctor_id || !department_id || !hospital_id || !appointment_date || !appointment_time) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Patient, doctor, department, hospital, date, and time are required'
        });
      }

      // Validate doctor schedule (day and time window)
      const dayName = DAYS[new Date(appointment_date).getDay()];
      const schedule = await DoctorSchedules.findOne({
        where: {
          doctor_id,
          day_of_week: dayName,
          is_active: true,
          start_time: { [Op.lte]: appointment_time },
          end_time: { [Op.gt]: appointment_time }
        },
        transaction: t
      });

      if (!schedule) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Doctor is not available on ${dayName} at ${appointment_time}`
        });
      }

      // Block if doctor is on approved leave on that date
      const onLeave = await DoctorLeave.findOne({
        where: {
          doctor_id,
          status: 'Approved',
          is_active: true,
          from_date: { [Op.lte]: appointment_date },
          to_date: { [Op.gte]: appointment_date }
        },
        transaction: t
      });
      if (onLeave) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: `Doctor is on ${onLeave.leave_type} leave on ${appointment_date}`
        });
      }

      // Prevent double-booking of the same slot
      const slotConflict = await OpdAppointment.findOne({
        where: {
          doctor_id,
          appointment_date,
          appointment_time,
          is_active: true,
          status: { [Op.notIn]: ['Cancelled', 'No-show'] }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (slotConflict) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: `Slot already booked for this doctor at ${appointment_date} ${appointment_time}`
        });
      }

      // Enforce max_appointments per day
      const bookedCount = await OpdAppointment.count({
        where: {
          doctor_id,
          appointment_date,
          is_active: true,
          status: { [Op.notIn]: ['Cancelled', 'No-show'] }
        },
        transaction: t
      });
      if (bookedCount >= schedule.max_appointments) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: `Doctor has reached maximum appointments (${schedule.max_appointments}) for ${appointment_date}`
        });
      }

      const appointment = await OpdAppointment.create({
        patient_id,
        doctor_id,
        department_id,
        hospital_id,
        appointment_date,
        appointment_time,
        visit_type: visit_type || 'New'
      }, { transaction: t });

      await t.commit();

      const patient = await Patient.findByPk(patient_id);
      const doctor = await Doctor.findByPk(doctor_id);
      const department = await Department.findByPk(department_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Appointment created successfully',
        data: {
          ...appointment.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllAppointments(req, res) {
    try {
      const { uhid, patient_id, doctor_id, status, appointment_date, appointment_id, date_from, date_to, search } = req.query;
      const hospital_id = req.user?.hospital_id;
      const where = { is_active: true };
      if (hospital_id) where.hospital_id = hospital_id;
      if (patient_id) where.patient_id = parseInt(patient_id);
      if (doctor_id) where.doctor_id = parseInt(doctor_id);
      if (status) where.status = status;
      if (appointment_id) where.appointment_id = parseInt(appointment_id);

      // Date: support an exact date or a from/to range
      if (appointment_date) {
        where.appointment_date = appointment_date;
      } else if (date_from && date_to) {
        where.appointment_date = { [Op.between]: [date_from, date_to] };
      } else if (date_from) {
        where.appointment_date = { [Op.gte]: date_from };
      } else if (date_to) {
        where.appointment_date = { [Op.lte]: date_to };
      }

      const include = [
        { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid', 'mobile_number'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'], required: false },
        { model: Department, as: 'department', attributes: ['id', 'department_name'], required: false }
      ];

      // Patient-level filtering: exact uhid, or a free-text search across
      // name / uhid / mobile / numeric patient_id.
      const patientWhere = {};
      if (uhid) patientWhere.uhid = uhid;
      if (search) {
        const like = { [Op.like]: `%${search}%` };
        patientWhere[Op.or] = [
          { first_name: like },
          { last_name: like },
          { uhid: like },
          { mobile_number: like },
          ...(/^\d+$/.test(search) ? [{ patient_id: parseInt(search) }] : [])
        ];
      }
      if (Object.keys(patientWhere).length > 0 || Object.getOwnPropertySymbols(patientWhere).length > 0) {
        include[0].where = patientWhere;
        include[0].required = true;
      }

      const appointments = await OpdAppointment.findAll({
        where,
        include,
        order: [['appointment_date', 'DESC'], ['appointment_time', 'ASC']]
      });

      res.json({ success: true, data: appointments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAppointmentById(req, res) {
    try {
      const appointment = await OpdAppointment.findOne({
        where: {
          appointment_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const patient = await Patient.findByPk(appointment.patient_id);
      const doctor = await Doctor.findByPk(appointment.doctor_id);
      const department = await Department.findByPk(appointment.department_id);
      const hospital = await Hospital.findByPk(appointment.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...appointment.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateAppointment(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = {
        appointment_id: req.params.id,
        hospital_id: req.hospitalId
      };

      if (is_active === 0 || is_active === false) {
        const [updated] = await OpdAppointment.update(
          { is_active: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        const deactivatedAppointment = await OpdAppointment.findOne({ where });
        return res.json({ success: true, message: 'Appointment cancelled successfully', data: deactivatedAppointment });
      }

      const [updated] = await OpdAppointment.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await OpdAppointment.findOne({ where });
      const patient = await Patient.findByPk(updatedAppointment.patient_id);
      const doctor = await Doctor.findByPk(updatedAppointment.doctor_id);
      const department = await Department.findByPk(updatedAppointment.department_id);
      const hospital = await Hospital.findByPk(updatedAppointment.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedAppointment.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteAppointment(req, res) {
    try {
      const deleted = await OpdAppointment.destroy({
        where: { 
          appointment_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      res.json({ success: true, message: 'Appointment permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const [updated] = await OpdAppointment.update(
        { status },
        { where: { 
          appointment_id: req.params.id,
          hospital_id: req.hospitalId
        } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await OpdAppointment.findOne({
        where: {
          appointment_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      res.json({ success: true, data: updatedAppointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async checkInAppointment(req, res) {
    const t = await sequelize.transaction();
    try {
      const appointment = await OpdAppointment.findOne({
        where: {
          appointment_id: req.params.id,
          hospital_id: req.hospitalId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!appointment) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const existingVisit = await OpdVisit.findOne({
        where: { appointment_id: appointment.appointment_id, is_active: true },
        transaction: t
      });
      if (existingVisit) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: 'This appointment has already been checked in',
          data: { visit_id: existingVisit.visit_id }
        });
      }

      await appointment.update({ status: 'Checked-in' }, { transaction: t });

      const patient = await Patient.findByPk(appointment.patient_id, { transaction: t });

      const todayVisits = await OpdVisit.count({
        where: {
          visit_date: new Date().toISOString().split('T')[0],
          hospital_id: appointment.hospital_id
        },
        transaction: t
      });
      const tokenNumber = todayVisits + 1;

      const visit = await OpdVisit.create({
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        uhid: patient?.uhid || null,
        doctor_id: appointment.doctor_id,
        department_id: appointment.department_id,
        visit_date: new Date(),
        token_number: tokenNumber,
        visit_type: appointment.visit_type || 'Appointment',
        status: 'Checked-in',
        checked_in_at: new Date(),
        hospital_id: appointment.hospital_id
      }, { transaction: t });

      const billingEpisode = await BillingEpisode.create({
        patient_id: appointment.patient_id,
        hospital_id: appointment.hospital_id,
        uhid: patient?.uhid || null,
        episode_type: 'OPD',
        opd_visit_id: visit.visit_id,
        start_date: new Date(),
        status: 'Open'
      }, { transaction: t });

      await t.commit();

      const doctor = await Doctor.findByPk(appointment.doctor_id);
      const department = await Department.findByPk(appointment.department_id);
      const hospital = await Hospital.findByPk(appointment.hospital_id);

      res.status(201).json({
        success: true,
        message: 'Appointment checked-in, visit and billing episode created successfully',
        data: {
          appointment: appointment.toJSON(),
          visit: visit.toJSON(),
          billing_episode_id: billingEpisode.episode_id,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OpdAppointmentController;
