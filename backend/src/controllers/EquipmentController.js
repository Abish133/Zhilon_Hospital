const { Equipment, Department, Hospital } = require('../models');

class EquipmentController {
  static async createEquipment(req, res) {
    try {
      const { equipment_code, serial_number, equipment_name, equipment_type, manufacturer, model_number, department_id, purchase_date, purchase_cost, warranty_start, warranty_end, amc_start, amc_end, amc_vendor, status, hospital_id } = req.body;
      
      if (!hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'hospital_id is required' 
        });
      }

      const equipment = await Equipment.create({ 
        equipment_code,
        serial_number,
        equipment_name,
        equipment_type,
        manufacturer,
        model_number,
        department_id,
        purchase_date,
        purchase_cost,
        warranty_start,
        warranty_end,
        amc_start,
        amc_end,
        amc_vendor,
        status: status || 'Active',
        hospital_id
      });

      const department = department_id ? await Department.findByPk(department_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Equipment created successfully',
        data: {
          ...equipment.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllEquipment(req, res) {
    try {
      const { equipment_type, department_id, status } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (equipment_type) where.equipment_type = equipment_type;
      if (department_id) where.department_id = department_id;
      if (status) where.status = status;

      const equipment = await Equipment.findAll({ where });

      const equipmentWithDetails = await Promise.all(
        equipment.map(async (equip) => {
          const department = equip.department_id ? await Department.findByPk(equip.department_id) : null;
          const hospital = await Hospital.findByPk(equip.hospital_id);
          
          return {
            ...equip.toJSON(),
            department: department ? { id: department.id, department_name: department.department_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: equipmentWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getEquipmentById(req, res) {
    try {
      const equipment = await Equipment.findOne({ where: { equipment_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!equipment) {
        return res.status(404).json({ success: false, message: 'Equipment not found' });
      }

      const department = equipment.department_id ? await Department.findByPk(equipment.department_id) : null;
      const hospital = await Hospital.findByPk(equipment.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...equipment.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateEquipment(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await Equipment.update(
          { is_active: false },
          { where: { equipment_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        const deactivatedEquipment = await Equipment.findOne({ where: { equipment_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Equipment deactivated successfully', data: deactivatedEquipment });
      }

      const [updated] = await Equipment.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { equipment_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Equipment not found' });
      }

      const updatedEquipment = await Equipment.findOne({ where: { equipment_id: req.params.id, hospital_id: req.hospitalId } });
      const department = updatedEquipment.department_id ? await Department.findByPk(updatedEquipment.department_id) : null;
      const hospital = await Hospital.findByPk(updatedEquipment.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedEquipment.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteEquipment(req, res) {
    try {
      const deleted = await Equipment.destroy({
        where: { equipment_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Equipment not found' });
      }

      res.json({ success: true, message: 'Equipment permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = EquipmentController;
