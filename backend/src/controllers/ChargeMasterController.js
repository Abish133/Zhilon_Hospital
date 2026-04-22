const { ChargeMaster, Department, Hospital } = require('../models');

class ChargeMasterController {
  static async create(req, res) {
    try {
      const { service_code, service_name, service_type, charge_amount, hospital_id } = req.body;
      
      if (!service_code || !service_name || !service_type || !charge_amount || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'service_code, service_name, service_type, charge_amount, and hospital_id are required' 
        });
      }

      const chargeMaster = await ChargeMaster.create(req.body);
      const department = chargeMaster.department_id ? await Department.findByPk(chargeMaster.department_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Charge master created successfully',
        data: {
          ...chargeMaster.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { service_type, department_id } = req.query;
      const where = { 
        is_active: true,
        hospital_id: req.hospitalId
      };
      
      if (service_type) where.service_type = service_type;
      if (department_id) where.department_id = department_id;

      const chargeMasters = await ChargeMaster.findAll({ 
        where,
        order: [['service_name', 'ASC']]
      });

      const chargesWithDetails = await Promise.all(
        chargeMasters.map(async (charge) => {
          const department = charge.department_id ? await Department.findByPk(charge.department_id) : null;
          const hospital = await Hospital.findByPk(charge.hospital_id);
          
          return {
            ...charge.toJSON(),
            department: department ? { id: department.id, department_name: department.department_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: chargesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const chargeMaster = await ChargeMaster.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!chargeMaster) {
        return res.status(404).json({ success: false, message: 'Charge master not found' });
      }

      const department = chargeMaster.department_id ? await Department.findByPk(chargeMaster.department_id) : null;
      const hospital = await Hospital.findByPk(chargeMaster.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...chargeMaster.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await ChargeMaster.update(
          { is_active: false },
          { where: { charge_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Charge master not found' });
        }
        const deactivatedCharge = await ChargeMaster.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Charge master deactivated successfully', data: deactivatedCharge });
      }

      const [updated] = await ChargeMaster.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { charge_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Charge master not found' });
      }

      const updatedCharge = await ChargeMaster.findOne({ where: { charge_id: req.params.id, hospital_id: req.hospitalId } });
      const department = updatedCharge.department_id ? await Department.findByPk(updatedCharge.department_id) : null;
      const hospital = await Hospital.findByPk(updatedCharge.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedCharge.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await ChargeMaster.destroy({
        where: { charge_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Charge master not found' });
      }

      res.json({ success: true, message: 'Charge master permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ChargeMasterController;
