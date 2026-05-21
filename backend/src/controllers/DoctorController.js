const {
  Doctor,
  Hospital,
  Employee,
  Department,
  Patient,
  OpdAppointment,
  OpdVisit,
  OpdConsultation,
  OpdPrescription,
  Medicine,
  IpdAdmission,
  LabOrder,
  LabOrderDetail,
  RadiologyOrders,
  RadiologyTests,
  OtBooking,
  DoctorSchedules,
  DoctorQualification,
  DoctorLeave
} = require('../models');

class DoctorController {
  // Get employees with role='Doctor' for dropdown
  static async getDoctorEmployees(req, res) {
    try {
      const { hospital_id } = req.query;
      const { Op } = require('sequelize');

      const employees = await Employee.findAll({
        where: {
          hospital_id,
          role: { [Op.like]: '%Doctor%' },
          is_active: true
        },
        attributes: ['employee_id', 'full_name', 'email', 'role']
      });

      res.json({ success: true, data: employees });
    } catch (error) {
      console.error('Error fetching doctor employees:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get employee details by ID
  static async getEmployeeById(req, res) {
    try {
      const employee = await Employee.findOne({
        where: { employee_id: req.params.employeeId, hospital_id: req.hospitalId },
        attributes: ['employee_id', 'full_name', 'email']
      });

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      res.json({ success: true, data: employee });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async getAllDoctors(req, res) {
    try {
      const doctors = await Doctor.findAll({
        where: { 
          is_active: true,
          hospital_id: req.hospitalId
        }
      });
      
      const doctorsWithHospital = await Promise.all(
        doctors.map(async (doctor) => {
          const hospital = await Hospital.findByPk(doctor.hospital_id);
          return {
            ...doctor.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );
      
      res.json({ success: true, data: doctorsWithHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDoctorById(req, res) {
    try {
      const doctor = await Doctor.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
      
      const hospital = await Hospital.findByPk(doctor.hospital_id);
      
      res.json({ 
        success: true, 
        data: {
          ...doctor.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createDoctor(req, res) {
    try {
      const { employee_id, name, specialization, email, phone, experience, schedule, hospital_id, registration_number } = req.body;
      
      if (!name || !specialization || !email || !hospital_id || !registration_number) {
        return res.status(400).json({
          success: false,
          message: 'Name, specialization, email, registration_number, and hospital_id are required'
        });
      }

      const doctor = await Doctor.create({ 
        name, 
        specialization, 
        email, 
        phone, 
        experience, 
        schedule,
        registration_number, 
        hospital_id 
      });
      
      // Link employee to doctor if employee_id provided
      if (employee_id) {
        await Employee.update(
          { doctor_id: doctor.id },
          { where: { employee_id } }
        );
      }
      
      const hospital = await Hospital.findByPk(hospital_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Doctor created successfully',
        data: {
          ...doctor.toJSON(),
          hospital: hospital ? {
            id: hospital.id,
            hospitalName: hospital.hospitalName
          } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDoctor(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = {
        id: req.params.id,
        hospital_id: req.hospitalId
      };
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await Doctor.update(
          { is_active: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const deactivatedDoctor = await Doctor.findOne({ where });
        const hospital = await Hospital.findByPk(deactivatedDoctor.hospital_id);
        return res.json({ 
          success: true, 
          message: 'Doctor deactivated successfully', 
          data: {
            ...deactivatedDoctor.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          }
        });
      }
      
      const [updated] = await Doctor.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
      const updatedDoctor = await Doctor.findOne({ where });
      const hospital = await Hospital.findByPk(updatedDoctor.hospital_id);
      res.json({ 
        success: true, 
        data: {
          ...updatedDoctor.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Comprehensive doctor profile drill-down: who they treated, what they prescribed/ordered
  static async getDoctorProfile(req, res) {
    try {
      const doctor = await Doctor.findOne({
        where: { id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }

      const doctorId = doctor.id;
      const hospitalId = req.hospitalId;
      const { Op } = require('sequelize');

      const safe = async (p) => {
        try { return await p; } catch (e) { return []; }
      };

      const [
        hospital,
        department,
        employee,
        appointments,
        visits,
        consultations,
        prescriptions,
        admissions,
        labOrders,
        radiologyOrders,
        otAsSurgeon,
        otAsAssistant,
        otAsAnesthetist,
        schedules,
        qualifications,
        leaves
      ] = await Promise.all([
        Hospital.findByPk(doctor.hospital_id),
        doctor.department_id ? Department.findByPk(doctor.department_id) : null,
        safe(Employee.findOne({ where: { doctor_id: doctorId, hospital_id: hospitalId } })),
        safe(OpdAppointment.findAll({
          where: { doctor_id: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name', 'gender', 'date_of_birth', 'mobile_number'] },
            { model: Department, as: 'department', attributes: ['id', 'department_name'] }
          ],
          order: [['appointment_date', 'DESC']]
        })),
        safe(OpdVisit.findAll({
          where: { doctor_id: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }
          ],
          order: [['visit_date', 'DESC']]
        })),
        safe(OpdConsultation.findAll({
          where: { doctor_id: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }
          ],
          order: [['consultation_date', 'DESC']]
        })),
        safe(OpdPrescription.findAll({
          where: { prescribed_by: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] },
            { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength', 'dosage_form'] }
          ],
          order: [['prescribed_at', 'DESC'], ['createdAt', 'DESC']]
        })),
        safe(IpdAdmission.findAll({
          where: { admitting_doctor_id: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }
          ],
          order: [['admission_date', 'DESC']]
        })),
        safe(LabOrder.findAll({
          where: { ordered_by: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] },
            { model: LabOrderDetail, as: 'details' }
          ],
          order: [['order_date', 'DESC']]
        })),
        safe(RadiologyOrders.findAll({
          where: { ordered_by: doctorId, hospital_id: hospitalId },
          include: [
            { model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] },
            { model: RadiologyTests, as: 'radiologyTest' }
          ],
          order: [['order_date', 'DESC']]
        })),
        safe(OtBooking.findAll({
          where: { surgeon_id: doctorId, hospital_id: hospitalId },
          include: [{ model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }],
          order: [['surgery_date', 'DESC']]
        })),
        safe(OtBooking.findAll({
          where: { assistant_surgeon_id: doctorId, hospital_id: hospitalId },
          include: [{ model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }],
          order: [['surgery_date', 'DESC']]
        })),
        safe(OtBooking.findAll({
          where: { anesthetist_id: doctorId, hospital_id: hospitalId },
          include: [{ model: Patient, as: 'patient', attributes: ['patient_id', 'uhid', 'first_name', 'last_name'] }],
          order: [['surgery_date', 'DESC']]
        })),
        safe(DoctorSchedules ? DoctorSchedules.findAll({ where: { doctor_id: doctorId, hospital_id: hospitalId } }) : []),
        safe(DoctorQualification ? DoctorQualification.findAll({ where: { doctor_id: doctorId, hospital_id: hospitalId } }) : []),
        safe(DoctorLeave ? DoctorLeave.findAll({
          where: { doctor_id: doctorId, hospital_id: hospitalId },
          order: [['from_date', 'DESC']]
        }) : [])
      ]);

      // Patients seen — distinct list with last visit date
      const patientMap = {};
      const addPatient = (p, date, source) => {
        if (!p) return;
        const key = p.patient_id || p.uhid;
        if (!key) return;
        if (!patientMap[key]) {
          patientMap[key] = {
            patient_id: p.patient_id,
            uhid: p.uhid,
            first_name: p.first_name,
            last_name: p.last_name,
            gender: p.gender,
            date_of_birth: p.date_of_birth,
            mobile_number: p.mobile_number,
            visit_count: 0,
            last_seen: null,
            sources: new Set()
          };
        }
        patientMap[key].visit_count += 1;
        patientMap[key].sources.add(source);
        if (date && (!patientMap[key].last_seen || new Date(date) > new Date(patientMap[key].last_seen))) {
          patientMap[key].last_seen = date;
        }
      };
      for (const a of appointments) addPatient(a.patient, a.appointment_date, 'OPD');
      for (const c of consultations) addPatient(c.patient, c.consultation_date, 'OPD');
      for (const a of admissions) addPatient(a.patient, a.admission_date, 'IPD');
      for (const o of otAsSurgeon) addPatient(o.patient, o.surgery_date, 'OT');

      const patientsHandled = Object.values(patientMap)
        .map(p => ({ ...p, sources: Array.from(p.sources) }))
        .sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0));

      // Stats
      const stats = {
        total_appointments: appointments.length,
        total_visits: visits.length,
        total_consultations: consultations.length,
        total_prescriptions: prescriptions.length,
        total_admissions: admissions.length,
        total_lab_orders: labOrders.length,
        total_radiology_orders: radiologyOrders.length,
        total_surgeries: otAsSurgeon.length,
        total_assisted: otAsAssistant.length,
        total_anesthesia: otAsAnesthetist.length,
        unique_patients: patientsHandled.length,
        upcoming_appointments: appointments.filter(a => new Date(a.appointment_date) >= new Date()).length,
        completed_appointments: appointments.filter(a => ['Consulted', 'Completed'].includes(a.status)).length
      };

      return res.json({
        success: true,
        data: {
          doctor: {
            ...doctor.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            department: department ? { id: department.id, department_name: department.department_name } : null,
            employee: employee ? employee.toJSON() : null
          },
          stats,
          patientsHandled,
          appointments,
          visits,
          consultations,
          prescriptions,
          admissions,
          labOrders,
          radiologyOrders,
          otAsSurgeon,
          otAsAssistant,
          otAsAnesthetist,
          schedules,
          qualifications,
          leaves
        }
      });
    } catch (error) {
      console.error('getDoctorProfile error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDoctor(req, res) {
    try {
      const deleted = await Doctor.destroy({
        where: { 
          id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
      res.json({ success: true, message: 'Doctor permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DoctorController;