const { Ward, Hospital, Department } = require('../models');

class WardController {
  static async createWard(req, res) {
    try {
      const { ward_name, ward_type, total_beds, available_beds, floor_number, department_id, hospital_id } = req.body;
      
      if (!ward_name || !ward_type || !total_beds || !department_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'ward_name, ward_type, total_beds, department_id, and hospital_id are required' 
        });
      }

      const ward = await Ward.create({ 
        ward_name, 
        ward_type, 
        total_beds, 
        available_beds: available_beds !== undefined ? available_beds : total_beds,
        floor_number, 
        department_id, 
        hospital_id 
      });
      
      const hospital = await Hospital.findByPk(hospital_id);
      const department = await Department.findByPk(department_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Ward created successfully',
        data: {
          ...ward.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllWards(req, res) {
    try {
      const wards = await Ward.findAll({
        where: { 
          is_active: true,
          hospital_id: req.hospitalId
        }
      });
      
      const wardsWithDetails = await Promise.all(
        wards.map(async (ward) => {
          const hospital = await Hospital.findByPk(ward.hospital_id);
          const department = await Department.findByPk(ward.department_id);
          return {
            ...ward.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            department: department ? { id: department.id, department_name: department.department_name } : null
          };
        })
      );
      
      res.json({ success: true, data: wardsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getWardById(req, res) {
    try {
      const ward = await Ward.findOne({
        where: {
          ward_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!ward) {
        return res.status(404).json({ success: false, message: 'Ward not found' });
      }
      
      const hospital = await Hospital.findByPk(ward.hospital_id);
      const department = await Department.findByPk(ward.department_id);
      
      res.json({ 
        success: true, 
        data: {
          ...ward.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateWard(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = {
        ward_id: req.params.id,
        hospital_id: req.hospitalId
      };
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await Ward.update(
          { is_active: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Ward not found' });
        }
        const deactivatedWard = await Ward.findOne({ where });
        const hospital = await Hospital.findByPk(deactivatedWard.hospital_id);
        const department = await Department.findByPk(deactivatedWard.department_id);
        return res.json({ 
          success: true, 
          message: 'Ward deactivated successfully', 
          data: {
            ...deactivatedWard.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            department: department ? { id: department.id, department_name: department.department_name } : null
          }
        });
      }
      
      const [updated] = await Ward.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Ward not found' });
      }
      const updatedWard = await Ward.findOne({ where });
      const hospital = await Hospital.findByPk(updatedWard.hospital_id);
      const department = await Department.findByPk(updatedWard.department_id);
      
      res.json({ 
        success: true, 
        data: {
          ...updatedWard.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          department: department ? { id: department.id, department_name: department.department_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteWard(req, res) {
    try {
      const deleted = await Ward.destroy({
        where: { 
          ward_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Ward not found' });
      }
      res.json({ success: true, message: 'Ward permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = WardController;
