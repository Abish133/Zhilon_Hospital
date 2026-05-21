const { RadiologyReports, RadiologyOrders, Doctor } = require('../models');

class RadiologyReportsController {
  static async createRadiologyReport(req, res) {
    try {
      if (!req.body.rad_order_id) {
        return res.status(400).json({
          success: false,
          message: 'Radiology order ID is required'
        });
      }
      if (!req.body.reported_by) {
        return res.status(400).json({
          success: false,
          message: 'Reported by (doctor ID) is required'
        });
      }

      const hospital_id = req.user?.hospital_id;
      const radiologyReport = await RadiologyReports.create({ ...req.body, hospital_id });
      const radiologyOrder = await RadiologyOrders.findByPk(req.body.rad_order_id);
      const reportedBy = await Doctor.findByPk(req.body.reported_by);

      res.status(201).json({
        success: true,
        data: {
          ...radiologyReport.toJSON(),
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          reportedBy: reportedBy ? { id: reportedBy.id, first_name: reportedBy.first_name, last_name: reportedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllRadiologyReports(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const { rad_order_id } = req.query;
      const whereClause = {};
      if (rad_order_id) whereClause.rad_order_id = rad_order_id;
      if (hospital_id) whereClause.hospital_id = hospital_id;

      const radiologyReports = await RadiologyReports.findAll({ where: whereClause });

      const reportsWithDetails = await Promise.all(
        radiologyReports.map(async (report) => {
          const radiologyOrder = await RadiologyOrders.findByPk(report.rad_order_id);
          const reportedBy = await Doctor.findByPk(report.reported_by);
          return {
            ...report.toJSON(),
            radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
            reportedBy: reportedBy ? { id: reportedBy.id, name: reportedBy.name } : null,
            radiologist_name: reportedBy ? reportedBy.name : null
          };
        })
      );

      res.json({ success: true, data: reportsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRadiologyReportById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const radiologyReport = await RadiologyReports.findOne({ where: { rad_report_id: req.params.id, hospital_id: req.hospitalId } });
      if (!radiologyReport || (hospital_id && radiologyReport.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Radiology report not found' });
      }

      const radiologyOrder = await RadiologyOrders.findByPk(radiologyReport.rad_order_id);
      const reportedBy = await Doctor.findByPk(radiologyReport.reported_by);

      res.json({
        success: true,
        data: {
          ...radiologyReport.toJSON(),
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          reportedBy: reportedBy ? { id: reportedBy.id, first_name: reportedBy.first_name, last_name: reportedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateRadiologyReport(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { rad_report_id: req.params.id, hospital_id }
        : { rad_report_id: req.params.id };
      const [updated] = await RadiologyReports.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Radiology report not found' });
      }
      const updatedReport = await RadiologyReports.findOne({ where: { rad_report_id: req.params.id, hospital_id: req.hospitalId } });
      const radiologyOrder = await RadiologyOrders.findByPk(updatedReport.rad_order_id);
      const reportedBy = await Doctor.findByPk(updatedReport.reported_by);

      res.json({
        success: true,
        data: {
          ...updatedReport.toJSON(),
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          reportedBy: reportedBy ? { id: reportedBy.id, first_name: reportedBy.first_name, last_name: reportedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteRadiologyReport(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { rad_report_id: req.params.id, hospital_id }
        : { rad_report_id: req.params.id };
      const deleted = await RadiologyReports.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Radiology report not found' });
      }
      res.json({ success: true, message: 'Radiology report deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RadiologyReportsController;
