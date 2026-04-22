const { LabReport, LabOrder, User, Hospital } = require('../models');

class LabReportController {
  static async createLabReport(req, res) {
    try {
      const { order_id, report_url, generated_at, approved_by, hospital_id } = req.body;
      
      if (!order_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'order_id and hospital_id are required' 
        });
      }

      const labReport = await LabReport.create({ 
        order_id,
        report_url,
        generated_at: generated_at || new Date(),
        approved_by,
        hospital_id
      });

      const order = await LabOrder.findByPk(order_id);
      const user = approved_by ? await User.findByPk(approved_by) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Lab report created successfully',
        data: {
          ...labReport.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          approvedBy: user ? { id: user.id, username: user.username, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabReports(req, res) {
    try {
      const { order_id, approved_by } = req.query;
      const where = { is_active: true };
      
      if (order_id) where.order_id = order_id;
      if (approved_by) where.approved_by = approved_by;

      const labReports = await LabReport.findAll({ where });

      const labReportsWithDetails = await Promise.all(
        labReports.map(async (labReport) => {
          const order = await LabOrder.findByPk(labReport.order_id);
          const user = labReport.approved_by ? await User.findByPk(labReport.approved_by) : null;
          const hospital = await Hospital.findByPk(labReport.hospital_id);
          
          return {
            ...labReport.toJSON(),
            order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
            approvedBy: user ? { id: user.id, username: user.username, email: user.email } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labReportsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabReportById(req, res) {
    try {
      const labReport = await LabReport.findOne({ where: { report_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labReport) {
        return res.status(404).json({ success: false, message: 'Lab report not found' });
      }

      const order = await LabOrder.findByPk(labReport.order_id);
      const user = labReport.approved_by ? await User.findByPk(labReport.approved_by) : null;
      const hospital = await Hospital.findByPk(labReport.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labReport.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          approvedBy: user ? { id: user.id, username: user.username, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabReport(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabReport.update(
          { is_active: false },
          { where: { report_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab report not found' });
        }
        const deactivatedLabReport = await LabReport.findOne({ where: { report_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab report deactivated successfully', data: deactivatedLabReport });
      }

      const [updated] = await LabReport.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { report_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab report not found' });
      }

      const updatedLabReport = await LabReport.findOne({ where: { report_id: req.params.id, hospital_id: req.hospitalId } });
      const order = await LabOrder.findByPk(updatedLabReport.order_id);
      const user = updatedLabReport.approved_by ? await User.findByPk(updatedLabReport.approved_by) : null;
      const hospital = await Hospital.findByPk(updatedLabReport.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabReport.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          approvedBy: user ? { id: user.id, username: user.username, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabReport(req, res) {
    try {
      const deleted = await LabReport.destroy({
        where: { report_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab report not found' });
      }

      res.json({ success: true, message: 'Lab report permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabReportController;
