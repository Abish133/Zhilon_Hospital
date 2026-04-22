const { MaintenanceRequest, Equipment, Hospital, User } = require('../models');

class MaintenanceRequestController {
  static async create(req, res) {
    try {
      const { equipment_id, issue_description, reported_by, priority, status, hospital_id } = req.body;
      
      if (!equipment_id || !issue_description || !reported_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'equipment_id, issue_description, reported_by, and hospital_id are required' 
        });
      }

      const maintenanceRequest = await MaintenanceRequest.create(req.body);
      const equipment = await Equipment.findByPk(equipment_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const user = await User.findByPk(reported_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({ 
        success: true, 
        message: 'Maintenance request created successfully',
        data: {
          ...maintenanceRequest.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          reportedBy: user ? { id: user.id, username: user.username } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { status, priority } = req.query;
      const where = { is_active: true };
      
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const requests = await MaintenanceRequest.findAll({ where });

      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const equipment = await Equipment.findByPk(request.equipment_id);
          const hospital = await Hospital.findByPk(request.hospital_id);
          const user = await User.findByPk(request.reported_by, { attributes: { exclude: ['password'] } });
          
          return {
            ...request.toJSON(),
            equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            reportedBy: user ? { id: user.id, username: user.username } : null
          };
        })
      );

      res.json({ success: true, data: requestsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const maintenanceRequest = await MaintenanceRequest.findOne({ where: { request_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!maintenanceRequest) {
        return res.status(404).json({ success: false, message: 'Maintenance request not found' });
      }

      const equipment = await Equipment.findByPk(maintenanceRequest.equipment_id);
      const hospital = await Hospital.findByPk(maintenanceRequest.hospital_id);
      const user = await User.findByPk(maintenanceRequest.reported_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...maintenanceRequest.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          reportedBy: user ? { id: user.id, username: user.username } : null
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
        const [updated] = await MaintenanceRequest.update(
          { is_active: false },
          { where: { request_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Maintenance request not found' });
        }
        const deactivatedRequest = await MaintenanceRequest.findOne({ where: { request_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Maintenance request deactivated successfully', data: deactivatedRequest });
      }

      const [updated] = await MaintenanceRequest.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { request_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Maintenance request not found' });
      }

      const updatedRequest = await MaintenanceRequest.findOne({ where: { request_id: req.params.id, hospital_id: req.hospitalId } });
      const equipment = await Equipment.findByPk(updatedRequest.equipment_id);
      const hospital = await Hospital.findByPk(updatedRequest.hospital_id);
      const user = await User.findByPk(updatedRequest.reported_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...updatedRequest.toJSON(),
          equipment: equipment ? { equipment_id: equipment.equipment_id, equipment_code: equipment.equipment_code, equipment_name: equipment.equipment_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          reportedBy: user ? { id: user.id, username: user.username } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await MaintenanceRequest.destroy({
        where: { request_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Maintenance request not found' });
      }

      res.json({ success: true, message: 'Maintenance request permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = MaintenanceRequestController;
