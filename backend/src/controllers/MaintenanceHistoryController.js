const { MaintenanceHistory, MaintenanceRequest, Equipment, Hospital } = require('../models');

class MaintenanceHistoryController {
  static async create(req, res) {
    try {
      const { equipment_id, maintenance_date, maintenance_type, hospital_id } = req.body;
      
      if (!equipment_id || !maintenance_date || !maintenance_type || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'equipment_id, maintenance_date, maintenance_type, and hospital_id are required' 
        });
      }

      const maintenanceHistory = await MaintenanceHistory.create(req.body);
      const equipment = await Equipment.findByPk(equipment_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const request = req.body.request_id ? await MaintenanceRequest.findByPk(req.body.request_id) : null;

      res.status(201).json({ 
        success: true, 
        message: 'Maintenance history created successfully',
        data: {
          ...maintenanceHistory.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          maintenanceRequest: request ? { request_id: request.request_id, status: request.status, priority: request.priority } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { maintenance_type, equipment_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (maintenance_type) where.maintenance_type = maintenance_type;
      if (equipment_id) where.equipment_id = equipment_id;

      const histories = await MaintenanceHistory.findAll({ 
        where,
        order: [['maintenance_date', 'DESC']]
      });

      const historiesWithDetails = await Promise.all(
        histories.map(async (history) => {
          const equipment = await Equipment.findByPk(history.equipment_id);
          const hospital = await Hospital.findByPk(history.hospital_id);
          const request = history.request_id ? await MaintenanceRequest.findByPk(history.request_id) : null;
          
          return {
            ...history.toJSON(),
            equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            maintenanceRequest: request ? { request_id: request.request_id, status: request.status, priority: request.priority } : null
          };
        })
      );

      res.json({ success: true, data: historiesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const maintenanceHistory = await MaintenanceHistory.findOne({ where: { history_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!maintenanceHistory) {
        return res.status(404).json({ success: false, message: 'Maintenance history not found' });
      }

      const equipment = await Equipment.findByPk(maintenanceHistory.equipment_id);
      const hospital = await Hospital.findByPk(maintenanceHistory.hospital_id);
      const request = maintenanceHistory.request_id ? await MaintenanceRequest.findByPk(maintenanceHistory.request_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...maintenanceHistory.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          maintenanceRequest: request ? { request_id: request.request_id, status: request.status, priority: request.priority } : null
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
        const [updated] = await MaintenanceHistory.update(
          { is_active: false },
          { where: { history_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Maintenance history not found' });
        }
        const deactivatedHistory = await MaintenanceHistory.findOne({ where: { history_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Maintenance history deactivated successfully', data: deactivatedHistory });
      }

      const [updated] = await MaintenanceHistory.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { history_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Maintenance history not found' });
      }

      const updatedHistory = await MaintenanceHistory.findOne({ where: { history_id: req.params.id, hospital_id: req.hospitalId } });
      const equipment = await Equipment.findByPk(updatedHistory.equipment_id);
      const hospital = await Hospital.findByPk(updatedHistory.hospital_id);
      const request = updatedHistory.request_id ? await MaintenanceRequest.findByPk(updatedHistory.request_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...updatedHistory.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          maintenanceRequest: request ? { request_id: request.request_id, status: request.status, priority: request.priority } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await MaintenanceHistory.destroy({
        where: { history_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Maintenance history not found' });
      }

      res.json({ success: true, message: 'Maintenance history permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = MaintenanceHistoryController;
