const { PreventiveMaintenance, Equipment, Hospital } = require('../models');

class PreventiveMaintenanceController {
  static async createPM(req, res) {
    try {
      const { equipment_id, pm_schedule, last_pm_date, next_pm_date, pm_checklist, hospital_id } = req.body;
      
      if (!equipment_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'equipment_id and hospital_id are required' 
        });
      }

      const pm = await PreventiveMaintenance.create({ 
        equipment_id,
        pm_schedule,
        last_pm_date,
        next_pm_date,
        pm_checklist,
        hospital_id
      });

      const equipment = await Equipment.findByPk(equipment_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Preventive maintenance created successfully',
        data: {
          ...pm.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllPM(req, res) {
    try {
      const { equipment_id, pm_schedule } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (equipment_id) where.equipment_id = equipment_id;
      if (pm_schedule) where.pm_schedule = pm_schedule;

      const pmRecords = await PreventiveMaintenance.findAll({ where });

      const pmWithDetails = await Promise.all(
        pmRecords.map(async (pm) => {
          const equipment = await Equipment.findByPk(pm.equipment_id);
          const hospital = await Hospital.findByPk(pm.hospital_id);
          
          return {
            ...pm.toJSON(),
            equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: pmWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPMById(req, res) {
    try {
      const pm = await PreventiveMaintenance.findOne({ where: { pm_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!pm) {
        return res.status(404).json({ success: false, message: 'Preventive maintenance not found' });
      }

      const equipment = await Equipment.findByPk(pm.equipment_id);
      const hospital = await Hospital.findByPk(pm.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...pm.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePM(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await PreventiveMaintenance.update(
          { is_active: false },
          { where: { pm_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Preventive maintenance not found' });
        }
        const deactivatedPM = await PreventiveMaintenance.findOne({ where: { pm_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Preventive maintenance deactivated successfully', data: deactivatedPM });
      }

      const [updated] = await PreventiveMaintenance.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { pm_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Preventive maintenance not found' });
      }

      const updatedPM = await PreventiveMaintenance.findOne({ where: { pm_id: req.params.id, hospital_id: req.hospitalId } });
      const equipment = await Equipment.findByPk(updatedPM.equipment_id);
      const hospital = await Hospital.findByPk(updatedPM.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedPM.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePM(req, res) {
    try {
      const deleted = await PreventiveMaintenance.destroy({
        where: { pm_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Preventive maintenance not found' });
      }

      res.json({ success: true, message: 'Preventive maintenance permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PreventiveMaintenanceController;
