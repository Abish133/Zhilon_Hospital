const { GoodsReceiptNote, PurchaseOrder, PurchaseOrderDetail, Vendor, User, Hospital, GrnDetail, InventoryItem, Medicine, MedicineBatch, sequelize } = require('../models');
const { generateSequentialNumber } = require('../utils/numberGenerator');

class GoodsReceiptNoteController {
  static async createGRN(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { po_id, vendor_id, received_date, invoice_number, invoice_date, received_by, hospital_id, items } = req.body;
      let { grn_number } = req.body;

      if (!po_id || !vendor_id || !received_date || !received_by || !hospital_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'PO, vendor, received date, received by, and hospital are required'
        });
      }

      // Auto-generate GRN number if not supplied
      if (!grn_number) {
        grn_number = await generateSequentialNumber({
          model: GoodsReceiptNote,
          field: 'grn_number',
          prefix: 'GRN',
          hospitalId: hospital_id,
          transaction,
          pad: 6
        });
      }

      const grn = await GoodsReceiptNote.create({
        grn_number,
        po_id,
        vendor_id,
        received_date,
        invoice_number,
        invoice_date,
        received_by,
        hospital_id
      }, { transaction });

      // Process GRN items and update inventory/medicine batches
      let anyShort = false;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const receivedQty = Number(item.received_quantity) || 0;
          const orderedQty = Number(item.ordered_quantity) || 0;
          if (orderedQty > 0 && receivedQty < orderedQty) anyShort = true;

          // Create GRN detail
          await GrnDetail.create({
            grn_id: grn.grn_id,
            item_id: item.item_id,
            ordered_quantity: orderedQty,
            received_quantity: receivedQty,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            hospital_id
          }, { transaction });

          // Update inventory item stock under lock
          if (item.item_id) {
            const invItem = await InventoryItem.findByPk(item.item_id, { transaction, lock: transaction.LOCK.UPDATE });
            if (invItem) {
              await invItem.update({
                current_stock: (Number(invItem.current_stock) || 0) + receivedQty
              }, { transaction });
            }
          }

          // Medicine batch: upsert by (medicine_id, batch_number, hospital_id) to avoid duplicates
          if (item.medicine_id) {
            const existingBatch = await MedicineBatch.findOne({
              where: {
                medicine_id: item.medicine_id,
                batch_number: item.batch_number || null,
                hospital_id
              },
              transaction,
              lock: transaction.LOCK.UPDATE
            });

            if (existingBatch) {
              await existingBatch.update({
                received_quantity: (Number(existingBatch.received_quantity) || 0) + receivedQty,
                available_quantity: (Number(existingBatch.available_quantity) || 0) + receivedQty,
                purchase_rate: item.purchase_rate != null ? item.purchase_rate : existingBatch.purchase_rate,
                selling_rate: item.selling_rate != null ? item.selling_rate : existingBatch.selling_rate,
                mrp: item.mrp != null ? item.mrp : existingBatch.mrp,
                is_active: true
              }, { transaction });
            } else {
              await MedicineBatch.create({
                medicine_id: item.medicine_id,
                hospital_id,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date,
                purchase_rate: item.purchase_rate || 0,
                selling_rate: item.selling_rate || 0,
                mrp: item.mrp || 0,
                received_quantity: receivedQty,
                available_quantity: receivedQty,
                vendor_id,
                received_date,
                po_id,
                grn_id: grn.grn_id,
                is_active: true
              }, { transaction });
            }
          }
        }
      }

      // Update PO status: Partially Received if any short, else Received
      await PurchaseOrder.update(
        { status: anyShort ? 'Partially Received' : 'Received' },
        { where: { po_id }, transaction }
      );

      await transaction.commit();

      const purchaseOrder = await PurchaseOrder.findByPk(po_id);
      const vendor = await Vendor.findByPk(vendor_id);
      const receiver = await User.findByPk(received_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Goods receipt note created successfully',
        data: {
          ...grn.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          receiver: receiver ? { id: receiver.id, name: receiver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'GRN number already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllGRNs(req, res) {
    try {
      const grns = await GoodsReceiptNote.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const grnsWithDetails = await Promise.all(
        grns.map(async (grn) => {
          const purchaseOrder = await PurchaseOrder.findByPk(grn.po_id);
          const vendor = await Vendor.findByPk(grn.vendor_id);
          const receiver = await User.findByPk(grn.received_by, { attributes: { exclude: ['password'] } });
          const hospital = await Hospital.findByPk(grn.hospital_id);
          
          return {
            ...grn.toJSON(),
            purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
            vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
            receiver: receiver ? { id: receiver.id, name: receiver.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: grnsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getGRNById(req, res) {
    try {
      const grn = await GoodsReceiptNote.findOne({ where: { grn_id: req.params.id, hospital_id: req.hospitalId } });

      if (!grn) {
        return res.status(404).json({ success: false, message: 'Goods receipt note not found' });
      }

      const purchaseOrder = await PurchaseOrder.findByPk(grn.po_id);
      const vendor = await Vendor.findByPk(grn.vendor_id);
      const receiver = await User.findByPk(grn.received_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(grn.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...grn.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          receiver: receiver ? { id: receiver.id, name: receiver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateGRN(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await GoodsReceiptNote.update(
          { is_active: false },
          { where: { grn_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Goods receipt note not found' });
        }
        const deactivatedGRN = await GoodsReceiptNote.findOne({ where: { grn_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Goods receipt note deactivated successfully', data: deactivatedGRN });
      }

      const [updated] = await GoodsReceiptNote.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { grn_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Goods receipt note not found' });
      }

      const updatedGRN = await GoodsReceiptNote.findOne({ where: { grn_id: req.params.id, hospital_id: req.hospitalId } });
      const purchaseOrder = await PurchaseOrder.findByPk(updatedGRN.po_id);
      const vendor = await Vendor.findByPk(updatedGRN.vendor_id);
      const receiver = await User.findByPk(updatedGRN.received_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(updatedGRN.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedGRN.toJSON(),
          purchaseOrder: purchaseOrder ? { po_id: purchaseOrder.po_id, po_number: purchaseOrder.po_number } : null,
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          receiver: receiver ? { id: receiver.id, name: receiver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteGRN(req, res) {
    try {
      const deleted = await GoodsReceiptNote.destroy({
        where: { grn_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Goods receipt note not found' });
      }

      res.json({ success: true, message: 'Goods receipt note permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = GoodsReceiptNoteController;
