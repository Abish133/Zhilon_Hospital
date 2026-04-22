const { Doctor, Hospital, Employee } = require('../models');

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
      const employee = await Employee.findByPk(req.params.employeeId, {
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