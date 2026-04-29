const { LabOrderDetail, LabOrder, LabTest, Hospital, BillingEpisode, BillCharge } = require('../models');

class LabOrderDetailController {
  static async createLabOrderDetail(req, res) {
    try {
      const { order_id, test_id, test_code, test_name, sample_type, status, charge, hospital_id, covered_by_package_charge_id } = req.body;

      if (!order_id || !hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'order_id and hospital_id are required'
        });
      }

      // Get charge from LabTest if not provided
      let finalCharge = charge;
      if (!finalCharge && test_id) {
        const labTest = await LabTest.findByPk(test_id);
        if (labTest && labTest.charge) {
          finalCharge = labTest.charge;
        }
      }

      const labOrderDetail = await LabOrderDetail.create({
        order_id,
        test_id,
        test_code,
        test_name,
        sample_type,
        status: status || 'Pending',
        charge: finalCharge,
        covered_by_package_charge_id: covered_by_package_charge_id || null,
        hospital_id
      });

      // Automatically add lab test charge to billing episode (OPD or IPD)
      // ...UNLESS this test is covered by a package — the package's BillCharge already covers it.
      const order = await LabOrder.findByPk(order_id);
      if (order && order.visit_id && !covered_by_package_charge_id) {
        const episodeWhere = order.visit_type === 'IPD'
          ? { admission_id: order.visit_id, status: 'Open' }
          : { opd_visit_id: order.visit_id, status: 'Open' };
        const billingEpisode = await BillingEpisode.findOne({ where: episodeWhere });

        if (billingEpisode && finalCharge) {
          const rate = parseFloat(finalCharge);
          const quantity = 1;
          const amount = rate * quantity;
          const gstPercent = 0; // Lab tests typically don't have GST, adjust if needed
          const taxableAmount = amount;
          const gstAmount = (taxableAmount * gstPercent) / 100;
          const netAmount = taxableAmount + gstAmount;

          await BillCharge.create({
            episode_id: billingEpisode.episode_id,
            hospital_id,
            charge_date: new Date(),
            service_type: 'Investigation',
            service_id: labOrderDetail.detail_id,
            description: `Lab Test - ${test_name || 'Test'}`,
            quantity,
            rate,
            amount,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: taxableAmount,
            gst_percent: gstPercent,
            gst_amount: gstAmount,
            net_amount: netAmount
          });
        }
      }

      const test = test_id ? await LabTest.findByPk(test_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Lab order detail created successfully',
        data: {
          ...labOrderDetail.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name, test_category: test.test_category } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabOrderDetails(req, res) {
    try {
      const { order_id, test_id, status } = req.query;
      const where = { is_active: true };
      
      if (order_id) where.order_id = order_id;
      if (test_id) where.test_id = test_id;
      if (status) where.status = status;

      const labOrderDetails = await LabOrderDetail.findAll({ where });

      const labOrderDetailsWithDetails = await Promise.all(
        labOrderDetails.map(async (labOrderDetail) => {
          const order = await LabOrder.findByPk(labOrderDetail.order_id);
          const test = labOrderDetail.test_id ? await LabTest.findByPk(labOrderDetail.test_id) : null;
          const hospital = await Hospital.findByPk(labOrderDetail.hospital_id);
          
          return {
            ...labOrderDetail.toJSON(),
            order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
            test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name, test_category: test.test_category } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labOrderDetailsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabOrderDetailById(req, res) {
    try {
      const labOrderDetail = await LabOrderDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labOrderDetail) {
        return res.status(404).json({ success: false, message: 'Lab order detail not found' });
      }

      const order = await LabOrder.findByPk(labOrderDetail.order_id);
      const test = labOrderDetail.test_id ? await LabTest.findByPk(labOrderDetail.test_id) : null;
      const hospital = await Hospital.findByPk(labOrderDetail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labOrderDetail.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name, test_category: test.test_category } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabOrderDetail(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabOrderDetail.update(
          { is_active: false },
          { where: { detail_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab order detail not found' });
        }
        const deactivatedLabOrderDetail = await LabOrderDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab order detail deactivated successfully', data: deactivatedLabOrderDetail });
      }

      const [updated] = await LabOrderDetail.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { detail_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab order detail not found' });
      }

      const updatedLabOrderDetail = await LabOrderDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
      const order = await LabOrder.findByPk(updatedLabOrderDetail.order_id);
      const test = updatedLabOrderDetail.test_id ? await LabTest.findByPk(updatedLabOrderDetail.test_id) : null;
      const hospital = await Hospital.findByPk(updatedLabOrderDetail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabOrderDetail.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          test: test ? { test_id: test.test_id, test_code: test.test_code, test_name: test.test_name, test_category: test.test_category } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabOrderDetail(req, res) {
    try {
      const deleted = await LabOrderDetail.destroy({
        where: { detail_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab order detail not found' });
      }

      res.json({ success: true, message: 'Lab order detail permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabOrderDetailController;
