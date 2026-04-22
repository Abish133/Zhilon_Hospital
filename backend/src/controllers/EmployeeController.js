const { Employee, Department, Hospital, User } = require('../models');

class EmployeeController {
  // Get users for dropdown (exclude admin)
  static async getUsersForDropdown(req, res) {
    try {
      const { hospital_id } = req.query;
      const { Op } = require('sequelize');
      
      const users = await User.findAll({
        where: { 
          hospital_id,
          isActive: true,
          employee_id: null,
          role: { [Op.ne]: 'admin' } // Exclude admin
        },
        attributes: ['id', 'name', 'email', 'role']
      });

      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user details by ID
  static async getUserById(req, res) {
    try {
      const user = await User.findByPk(req.params.userId, {
        attributes: ['id', 'name', 'email', 'role']
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async createEmployee(req, res) {
    try {
      const { user_id, emp_code, full_name, gender, date_of_birth, mobile, email, address, role, qualification, joining_date, department_id, hospital_id, designation, bank_account_number, ifsc_code, pan_number, uan_number, emergency_contact_name, emergency_contact_number, id_proof_url, reporting_manager_id } = req.body;

      if (!emp_code || !full_name || !hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: emp_code, full_name, hospital_id'
        });
      }

      const employee = await Employee.create({
        emp_code,
        full_name,
        gender,
        date_of_birth,
        mobile,
        email,
        address,
        role,
        qualification,
        joining_date,
        department_id,
        hospital_id,
        designation,
        bank_account_number,
        ifsc_code,
        pan_number,
        uan_number,
        emergency_contact_name,
        emergency_contact_number,
        id_proof_url,
        reporting_manager_id
      });

      // Link user to employee if user_id provided
      if (user_id) {
        await User.update(
          { employee_id: employee.employee_id },
          { where: { id: user_id } }
        );
      }

      const employeeWithDept = await Employee.findByPk(employee.employee_id, {
        include: [
          {
            model: Department,
            as: 'department',
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employeeWithDept
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Employee code, mobile, or email already exists'
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllEmployees(req, res) {
    try {
      const where = { 
        is_active: true,
        hospital_id: req.hospitalId 
      };
      
      const employees = await Employee.findAll({
        where,
        include: [
          {
            model: Department,
            as: 'department',
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });
      res.json({ success: true, data: employees });
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getEmployeeById(req, res) {
    try {
      const employee = await Employee.findOne({
        where: {
          employee_id: req.params.id,
          hospital_id: req.hospitalId
        },
        include: [
          {
            model: Department,
            as: 'department',
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      res.json({ success: true, data: employee });
    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateEmployee(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = { 
        employee_id: req.params.id,
        hospital_id: req.hospitalId 
      };

      if (is_active === 0 || is_active === false) {
        const [updated] = await Employee.update(
          { is_active: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        const deactivatedEmployee = await Employee.findOne({
          where,
          include: [
            { model: Department, as: 'department', required: false },
            { model: Hospital, as: 'hospital', attributes: ['id', 'hospitalName'], required: false }
          ]
        });
        return res.json({ success: true, message: 'Employee deactivated successfully', data: deactivatedEmployee });
      }

      const [updated] = await Employee.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const updatedEmployee = await Employee.findOne({
        where,
        include: [
          {
            model: Department,
            as: 'department',
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });

      res.json({ success: true, data: updatedEmployee });
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteEmployee(req, res) {
    try {
      const deleted = await Employee.destroy({
        where: { 
          employee_id: req.params.id,
          hospital_id: req.hospitalId 
        }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      res.json({ success: true, message: 'Employee permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getEmployeesByDepartment(req, res) {
    try {
      const employees = await Employee.findAll({
        where: { 
          department_id: req.params.departmentId,
          hospital_id: req.hospitalId
        },
        include: [
          {
            model: Department,
            as: 'department',
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });

      res.json({ success: true, data: employees });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = EmployeeController;