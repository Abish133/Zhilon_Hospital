const { PurchaseOrderDetail, PurchaseOrder, InventoryItem, Hospital } = require('../models');

class PurchaseOrderDetailController {
  static async createDetail(req, res) {
    try {
      const { po_id, item_id, quantity, rate, hospital_id } = req.body;
      
      if (!po_id || !item_id || !quantity || !rate || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'PO, item, quantity, rate, and hospital are required' 
        });
      }

      const detail = await PurchaseOrderDetail.create({ 
        po_id,
        item_id,
        quantity,
        rate,
        amount: (quantity * rate).toFixed(2),
        hospital_id
      });

      const purchaseOrder = await PurchaseOrder.findByPk(po_id);
      const item = await InventoryItem.findByPk(item_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Purchase order detail created successfully',
        data: {
          ...detail.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          item: item ? { item_id: item.item_id, item_code: item.item_code, item_name: item.item_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllDetails(req, res) {
    try {
      const details = await PurchaseOrderDetail.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const detailsWithInfo = await Promise.all(
        details.map(async (detail) => {
          const purchaseOrder = await PurchaseOrder.findByPk(detail.po_id);
          const item = await InventoryItem.findByPk(detail.item_id);
          const hospital = await Hospital.findByPk(detail.hospital_id);
          
          return {
            ...detail.toJSON(),
            purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
            item: item ? { item_id: item.item_id, item_code: item.item_code, item_name: item.item_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: detailsWithInfo });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDetailById(req, res) {
    try {
      const detail = await PurchaseOrderDetail.findOne({ where: { po_detail_id: req.params.id, hospital_id: req.hospitalId } });

      if (!detail) {
        return res.status(404).json({ success: false, message: 'Purchase order detail not found' });
      }

      const purchaseOrder = await PurchaseOrder.findByPk(detail.po_id);
      const item = await InventoryItem.findByPk(detail.item_id);
      const hospital = await Hospital.findByPk(detail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...detail.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          item: item ? { item_id: item.item_id, item_code: item.item_code, item_name: item.item_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDetail(req, res) {
    try {
      const { is_active, quantity, rate, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await PurchaseOrderDetail.update(
          { is_active: false },
          { where: { po_detail_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Purchase order detail not found' });
        }
        const deactivatedDetail = await PurchaseOrderDetail.findOne({ where: { po_detail_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Purchase order detail deactivated successfully', data: deactivatedDetail });
      }

      const dataToUpdate = { ...updateData };
      if (quantity !== undefined) dataToUpdate.quantity = quantity;
      if (rate !== undefined) dataToUpdate.rate = rate;
      if (quantity !== undefined && rate !== undefined) {
        dataToUpdate.amount = (quantity * rate).toFixed(2);
      }

      const [updated] = await PurchaseOrderDetail.update(
        { ...dataToUpdate, is_active: is_active !== undefined ? is_active : true },
        { where: { po_detail_id: req.params.id, hospital_id: req.hospitalId }, individualHooks: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Purchase order detail not found' });
      }

      const updatedDetail = await PurchaseOrderDetail.findOne({ where: { po_detail_id: req.params.id, hospital_id: req.hospitalId } });
      const purchaseOrder = await PurchaseOrder.findByPk(updatedDetail.po_id);
      const item = await InventoryItem.findByPk(updatedDetail.item_id);
      const hospital = await Hospital.findByPk(updatedDetail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedDetail.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          item: item ? { item_id: item.item_id, item_code: item.item_code, item_name: item.item_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDetail(req, res) {
    try {
      const deleted = await PurchaseOrderDetail.destroy({
        where: { po_detail_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Purchase order detail not found' });
      }

      res.json({ success: true, message: 'Purchase order detail permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PurchaseOrderDetailController;
