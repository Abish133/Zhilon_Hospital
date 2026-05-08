const { LabSample, LabOrder, LabOrderDetail, User, Hospital, sequelize } = require('../models');
const { generateSequentialNumber } = require('../utils/numberGenerator');

let bwipjs;
try { bwipjs = require('bwip-js'); } catch (e) { bwipjs = null; }

class LabSampleController {
  static async createLabSample(req, res) {
    const t = await sequelize.transaction();
    try {
      const { order_id, barcode, sample_type, collected_by, collection_date, received_in_lab_at, condition_on_receipt, hospital_id } = req.body;

      if (!order_id || !hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'order_id and hospital_id are required'
        });
      }

      // Auto-generate barcode if not provided
      const generatedBarcode = barcode || await generateSequentialNumber({
        model: LabSample,
        field: 'barcode',
        prefix: 'LAB',
        hospitalId: hospital_id,
        transaction: t,
        pad: 6
      });

      const labSample = await LabSample.create({
        order_id,
        barcode: generatedBarcode,
        sample_type,
        collected_by,
        collection_date: collection_date || new Date(),
        received_in_lab_at,
        condition_on_receipt,
        hospital_id
      }, { transaction: t });

      // Advance order + detail status so the lab queue reflects "sample collected".
      // PDF flow: Ordered -> Sample Collected -> In Progress -> Completed.
      await LabOrder.update(
        { status: 'Sample Collected' },
        { where: { order_id, status: 'Ordered' }, transaction: t }
      );
      await LabOrderDetail.update(
        { status: 'Collected' },
        { where: { order_id, status: 'Pending' }, transaction: t }
      );

      await t.commit();

      const order = await LabOrder.findByPk(order_id);
      const user = collected_by ? await User.findByPk(collected_by) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Lab sample created successfully',
        data: {
          ...labSample.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          collectedBy: user ? { id: user.id, username: user.name, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/lab-samples/:id/barcode — returns PNG image of the barcode
  static async getBarcodeImage(req, res) {
    try {
      const sample = await LabSample.findOne({ where: { sample_id: req.params.id, hospital_id: req.hospitalId } });
      if (!sample) return res.status(404).json({ success: false, message: 'Lab sample not found' });
      if (!bwipjs) {
        return res.status(501).json({ success: false, message: 'bwip-js not installed. Run: npm install bwip-js' });
      }
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: String(sample.barcode || sample.sample_id),
        scale: 3,
        height: 12,
        includetext: true,
        textxalign: 'center'
      });
      res.setHeader('Content-Type', 'image/png');
      res.end(png);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabSamples(req, res) {
    try {
      const { order_id, sample_type, condition_on_receipt, collected_by } = req.query;
      const where = { is_active: true };
      
      if (order_id) where.order_id = order_id;
      if (sample_type) where.sample_type = sample_type;
      if (condition_on_receipt) where.condition_on_receipt = condition_on_receipt;
      if (collected_by) where.collected_by = collected_by;

      const labSamples = await LabSample.findAll({ where });

      const labSamplesWithDetails = await Promise.all(
        labSamples.map(async (labSample) => {
          const order = await LabOrder.findByPk(labSample.order_id);
          const user = labSample.collected_by ? await User.findByPk(labSample.collected_by) : null;
          const hospital = await Hospital.findByPk(labSample.hospital_id);
          
          return {
            ...labSample.toJSON(),
            order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
            collectedBy: user ? { id: user.id, username: user.name, email: user.email } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labSamplesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabSampleById(req, res) {
    try {
      const labSample = await LabSample.findOne({ where: { sample_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labSample) {
        return res.status(404).json({ success: false, message: 'Lab sample not found' });
      }

      const order = await LabOrder.findByPk(labSample.order_id);
      const user = labSample.collected_by ? await User.findByPk(labSample.collected_by) : null;
      const hospital = await Hospital.findByPk(labSample.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labSample.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          collectedBy: user ? { id: user.id, username: user.name, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabSample(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabSample.update(
          { is_active: false },
          { where: { sample_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab sample not found' });
        }
        const deactivatedLabSample = await LabSample.findOne({ where: { sample_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab sample deactivated successfully', data: deactivatedLabSample });
      }

      const [updated] = await LabSample.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { sample_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab sample not found' });
      }

      const updatedLabSample = await LabSample.findOne({ where: { sample_id: req.params.id, hospital_id: req.hospitalId } });
      const order = await LabOrder.findByPk(updatedLabSample.order_id);
      const user = updatedLabSample.collected_by ? await User.findByPk(updatedLabSample.collected_by) : null;
      const hospital = await Hospital.findByPk(updatedLabSample.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabSample.toJSON(),
          order: order ? { order_id: order.order_id, order_date: order.order_date, status: order.status } : null,
          collectedBy: user ? { id: user.id, username: user.name, email: user.email } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabSample(req, res) {
    try {
      const deleted = await LabSample.destroy({
        where: { sample_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab sample not found' });
      }

      res.json({ success: true, message: 'Lab sample permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabSampleController;
