const { Department, Employee, Hospital } = require('../models');

class DepartmentController {
  static async createDepartment(req, res) {
    try {
      const { department_code, department_name, department_type, description, hospital_id } = req.body;
      
      if (!department_code || !department_name || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Department code, name and hospital_id are required' 
        });
      }

      // First check if hospital exists
      const hospital = await Hospital.findByPk(hospital_id);
      if (!hospital) {
        return res.status(400).json({
          success: false,
          message: `Hospital with ID ${hospital_id} not found`
        });
      }

      const department = await Department.create({ 
        department_code, 
        department_name, 
        department_type,
        description,
        hospital_id
      });

      const responseData = {
        ...department.toJSON(),
        hospital: {
          id: hospital.id,
          hospitalName: hospital.hospitalName
        }
      };

      res.status(201).json({
        success: true, 
        message: 'Department created successfully',
        data: responseData
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Department code already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllDepartments(req, res) {
    try {
      const departments = await Department.findAll({
        where: { 
          is_active: true,
          hospital_id: req.hospitalId
        },
        include: [
          {
            model: Employee,
            as: 'employees',
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
      
      res.json({ success: true, data: departments });
    } catch (error) {
      console.error('Error in getAllDepartments:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDepartmentById(req, res) {
    try {
      const department = await Department.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.hospitalId
        },
        include: [
          {
            model: Employee,
            as: 'employees',
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
      
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error in getDepartmentById:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDepartment(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = { 
        id: req.params.id,
        hospital_id: req.hospitalId
      };
      
      // If is_active is 0, it's a soft delete (deactivate)
      if (is_active === 0 || is_active === false) {
        const [updated] = await Department.update(
          { is_active: false },
          { where }
        );
        
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Department not found' });
        }
        
        const deactivatedDepartment = await Department.findOne({
          where,
          include: [{
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }]
        });
        return res.json({ success: true, message: 'Department deactivated successfully', data: deactivatedDepartment });
      }
      
      // Regular update
      const [updated] = await Department.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      
      const updatedDepartment = await Department.findOne({
        where,
        include: [{
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'hospitalName'],
          required: false
        }]
      });
      res.json({ success: true, data: updatedDepartment });
    } catch (error) {
      console.error('Error in updateDepartment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDepartment(req, res) {
    try {
      // Hard delete - completely remove from database
      const deleted = await Department.destroy({
        where: { 
          id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      
      res.json({ success: true, message: 'Department permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DepartmentController;