const { LabResult, LabOrder, LabOrderDetail, LabTest, User, Hospital, sequelize } = require('../models');
const { Op } = require('sequelize');

class LabResultController {
  static async createLabResult(req, res) {
    const t = await sequelize.transaction();
    try {
      const { order_id, detail_id, test_id, result_data, interpretation, critical_value, entered_by, entered_at, verified_by, verified_at, status, hospital_id } = req.body;

      if (!order_id || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'order_id and hospital_id are required'
        });
      }

      const resultStatus = status || 'Draft';
      const labResult = await LabResult.create({
        order_id,
        detail_id,
        test_id,
        result_data,
        interpretation,
        critical_value: critical_value || false,
        entered_by,
        entered_at: entered_at || new Date(),
        verified_by,
        verified_at,
        status: resultStatus,
        hospital_id
      }, { transaction: t });

      // Auto-advance lab pipeline: line item → Completed when result is verified, In Progress otherwise.
      // Order status becomes Completed only when every line is done.
      if (detail_id) {
        const detailStatus = (resultStatus === 'Verified' || verified_by) ? 'Completed' : 'In Progress';
        await LabOrderDetail.update(
          { status: detailStatus },
          { where: { detail_id }, transaction: t }
        );
      }

      const remaining = await LabOrderDetail.count({
        where: { order_id, status: { [Op.ne]: 'Completed' }, is_active: true },
        transaction: t
      });
      await LabOrder.update(
        { status: remaining === 0 ? 'Completed' : 'In Progress' },
        { where: { order_id }, transaction: t }
      );

      await t.commit();

      const order = await LabOrder.findByPk(order_id);
      const detail = detail_id ? await LabOrderDetail.findByPk(detail_id) : null;
      const test = test_id ? await LabTest.findByPk(test_id) : null;
      const enteredByUser = entered_by ? await User.findByPk(entered_by) : null;
      const verifiedByUser = verified_by ? await User.findByPk(verified_by) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({
        success: true,
        message: 'Lab result created successfully',
        data: {
          ...labResult.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          detail: detail ? { detail_id: detail.detail_id, test_name: detail.test_name, status: detail.status } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name } : null,
          enteredBy: enteredByUser ? { id: enteredByUser.id, username: enteredByUser.name } : null,
          verifiedBy: verifiedByUser ? { id: verifiedByUser.id, username: verifiedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabResults(req, res) {
    try {
      const { order_id, test_id, status, critical_value } = req.query;
      const where = { is_active: true };
      
      if (order_id) where.order_id = order_id;
      if (test_id) where.test_id = test_id;
      if (status) where.status = status;
      if (critical_value !== undefined) where.critical_value = critical_value === 'true';

      const labResults = await LabResult.findAll({ where });

      const labResultsWithDetails = await Promise.all(
        labResults.map(async (labResult) => {
          const order = await LabOrder.findByPk(labResult.order_id);
          const detail = labResult.detail_id ? await LabOrderDetail.findByPk(labResult.detail_id) : null;
          const test = labResult.test_id ? await LabTest.findByPk(labResult.test_id) : null;
          const enteredByUser = labResult.entered_by ? await User.findByPk(labResult.entered_by) : null;
          const verifiedByUser = labResult.verified_by ? await User.findByPk(labResult.verified_by) : null;
          const hospital = await Hospital.findByPk(labResult.hospital_id);
          
          return {
            ...labResult.toJSON(),
            order: order ? { order_id: order.order_id, order_date: order.order_date } : null,
            detail: detail ? { detail_id: detail.detail_id, test_name: detail.test_name } : null,
            test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name } : null,
            enteredBy: enteredByUser ? { id: enteredByUser.id, username: enteredByUser.name } : null,
            verifiedBy: verifiedByUser ? { id: verifiedByUser.id, username: verifiedByUser.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labResultsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabResultById(req, res) {
    try {
      const labResult = await LabResult.findOne({ where: { result_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labResult) {
        return res.status(404).json({ success: false, message: 'Lab result not found' });
      }

      const order = await LabOrder.findByPk(labResult.order_id);
      const detail = labResult.detail_id ? await LabOrderDetail.findByPk(labResult.detail_id) : null;
      const test = labResult.test_id ? await LabTest.findByPk(labResult.test_id) : null;
      const enteredByUser = labResult.entered_by ? await User.findByPk(labResult.entered_by) : null;
      const verifiedByUser = labResult.verified_by ? await User.findByPk(labResult.verified_by) : null;
      const hospital = await Hospital.findByPk(labResult.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labResult.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date } : null,
          detail: detail ? { detail_id: detail.detail_id, test_name: detail.test_name } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name } : null,
          enteredBy: enteredByUser ? { id: enteredByUser.id, username: enteredByUser.name } : null,
          verifiedBy: verifiedByUser ? { id: verifiedByUser.id, username: verifiedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabResult(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabResult.update(
          { is_active: false },
          { where: { result_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab result not found' });
        }
        const deactivatedLabResult = await LabResult.findOne({ where: { result_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab result deactivated successfully', data: deactivatedLabResult });
      }

      const [updated] = await LabResult.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { result_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab result not found' });
      }

      const updatedLabResult = await LabResult.findOne({ where: { result_id: req.params.id, hospital_id: req.hospitalId } });
      const order = await LabOrder.findByPk(updatedLabResult.order_id);
      const detail = updatedLabResult.detail_id ? await LabOrderDetail.findByPk(updatedLabResult.detail_id) : null;
      const test = updatedLabResult.test_id ? await LabTest.findByPk(updatedLabResult.test_id) : null;
      const enteredByUser = updatedLabResult.entered_by ? await User.findByPk(updatedLabResult.entered_by) : null;
      const verifiedByUser = updatedLabResult.verified_by ? await User.findByPk(updatedLabResult.verified_by) : null;
      const hospital = await Hospital.findByPk(updatedLabResult.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabResult.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date } : null,
          detail: detail ? { detail_id: detail.detail_id, test_name: detail.test_name } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name } : null,
          enteredBy: enteredByUser ? { id: enteredByUser.id, username: enteredByUser.name } : null,
          verifiedBy: verifiedByUser ? { id: verifiedByUser.id, username: verifiedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabResult(req, res) {
    try {
      const deleted = await LabResult.destroy({
        where: { result_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab result not found' });
      }

      res.json({ success: true, message: 'Lab result permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabResultController;
