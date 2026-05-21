const { GrnDetail, Hospital, GoodsReceiptNote, InventoryItem } = require('../models');

class GrnDetailController {
  static async createGrnDetail(req, res) {
    try {
      const { grn_id, item_id, ordered_quantity, received_quantity, batch_number, expiry_date, hospital_id } = req.body;

      if (!grn_id || !item_id || !ordered_quantity || !received_quantity || !hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'grn_id, item_id, ordered_quantity, received_quantity, and hospital_id are required'
        });
      }

      const grnDetail = await GrnDetail.create({
        grn_id,
        item_id,
        ordered_quantity,
        received_quantity,
        batch_number,
        expiry_date,
        hospital_id
      });

      const hospital = await Hospital.findByPk(hospital_id);
      const grn = await GoodsReceiptNote.findByPk(grn_id);
      const item = await InventoryItem.findByPk(item_id);

      res.status(201).json({
        success: true,
        message: 'GRN detail created successfully',
        data: {
          ...grnDetail.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          grn: grn ? { grn_id: grn.grn_id, grn_number: grn.grn_number } : null,
          item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllGrnDetails(req, res) {
    try {
      const grnDetails = await GrnDetail.findAll({
        where: { is_active: true, hospital_id: req.hospitalId }
      });

      const detailsWithHospital = await Promise.all(
        grnDetails.map(async (detail) => {
          const hospital = await Hospital.findByPk(detail.hospital_id);
          const grn = await GoodsReceiptNote.findByPk(detail.grn_id);
          const item = await InventoryItem.findByPk(detail.item_id);
          return {
            ...detail.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            grn: grn ? { grn_id: grn.grn_id, grn_number: grn.grn_number } : null,
            item: item ? { item_id: item.item_id, item_name: item.item_name } : null
          };
        })
      );

      res.json({ success: true, data: detailsWithHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getGrnDetailById(req, res) {
    try {
      const grnDetail = await GrnDetail.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!grnDetail) {
        return res.status(404).json({ success: false, message: 'GRN detail not found' });
      }

      const hospital = await Hospital.findByPk(grnDetail.hospital_id);
 const grn = await GoodsReceiptNote.findByPk(grnDetail.grn_id);
      const item = await InventoryItem.findByPk(grnDetail.item_id);

      res.json({
        success: true,
        data: {
          ...grnDetail.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            grn: grn ? { grn_id: grn.grn_id, grn_number: grn.grn_number } : null,
            item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateGrnDetail(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await GrnDetail.update(
          { is_active: false },
          { where: { grn_detail_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'GRN detail not found' });
        }
        const deactivatedDetail = await GrnDetail.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({
          success: true,
          message: 'GRN detail deactivated successfully',
          data: deactivatedDetail
        });
      }

      const [updated] = await GrnDetail.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { grn_detail_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'GRN detail not found' });
      }
      const updatedDetail = await GrnDetail.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedDetail.hospital_id);
 const grn = await GoodsReceiptNote.findByPk(updatedDetail.grn_id);
      const item = await InventoryItem.findByPk(updatedDetail.item_id);
      res.json({
        success: true,
        data: {
          ...updatedDetail.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            grn: grn ? { grn_id: grn.grn_id, grn_number: grn.grn_number } : null,
            item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteGrnDetail(req, res) {
    try {
      const deleted = await GrnDetail.destroy({
        where: { grn_detail_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'GRN detail not found' });
      }
      res.json({ success: true, message: 'GRN detail permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = GrnDetailController;
