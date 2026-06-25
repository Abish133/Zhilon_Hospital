const { VendorReturn, Vendor, GoodsReceiptNote, InventoryItem, User, Hospital } = require('../models');
const { generateSequentialNumber } = require('../utils/numberGenerator');

class VendorReturnController {
  // ── Helper: enrich a single vendor return with related data ──
  static async _enrich(vr) {
    const [vendor, grn, item, returnedBy, approvedByUser, hospital] = await Promise.all([
      vr.vendor_id ? Vendor.findByPk(vr.vendor_id) : null,
      vr.grn_id ? GoodsReceiptNote.findByPk(vr.grn_id) : null,
      vr.item_id ? InventoryItem.findByPk(vr.item_id) : null,
      vr.returned_by ? User.findByPk(vr.returned_by, { attributes: { exclude: ['password'] } }) : null,
      vr.approved_by ? User.findByPk(vr.approved_by, { attributes: { exclude: ['password'] } }) : null,
      vr.hospital_id ? Hospital.findByPk(vr.hospital_id) : null
    ]);
    return {
      ...vr.toJSON(),
      vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name } : null,
      goodsReceiptNote: grn ? { grn_id: grn.grn_id, grn_number: grn.grn_number } : null,
      item: item ? { item_id: item.item_id, item_name: item.item_name, current_stock: item.current_stock } : null,
      returnedBy: returnedBy ? { id: returnedBy.id, name: returnedBy.name } : null,
      approvedByUser: approvedByUser ? { id: approvedByUser.id, name: approvedByUser.name } : null,
      hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
    };
  }

  // ── CREATE ──
  static async createVendorReturn(req, res) {
    const transaction = await VendorReturn.sequelize.transaction();
    try {
      const { return_date, vendor_id, grn_id, item_id, quantity, reason, remarks } = req.body;
      // Tenant + actor always come from the authenticated session, never the body.
      const hospital_id = req.hospitalId;
      const returned_by = req.user?.id;

      if (!hospital_id || !returned_by) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Authentication / hospital context missing' });
      }
      if (!return_date || !vendor_id || !item_id || !quantity || !reason) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'return_date, vendor_id, item_id, quantity, and reason are required'
        });
      }

      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'quantity must be a positive whole number' });
      }

      // Vendor must belong to this hospital
      const vendor = await Vendor.findOne({ where: { vendor_id, hospital_id }, transaction });
      if (!vendor) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      // GRN (optional) must belong to this hospital when supplied
      if (grn_id) {
        const grn = await GoodsReceiptNote.findOne({ where: { grn_id, hospital_id }, transaction });
        if (!grn) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'Goods Receipt Note not found' });
        }
      }

      // Lock the inventory item (hospital-scoped) for atomic stock update
      const item = await InventoryItem.findOne({ where: { item_id, hospital_id }, transaction, lock: transaction.LOCK.UPDATE });
      if (!item) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      if ((Number(item.current_stock) || 0) < qty) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock to return. Available: ${item.current_stock}`
        });
      }

      // Deduct stock (goods physically leave the hospital back to the vendor)
      await item.update({
        current_stock: (Number(item.current_stock) || 0) - qty
      }, { transaction });

      // Generate sequential return number (e.g. VR-2026-00001)
      const return_number = await generateSequentialNumber({
        model: VendorReturn, field: 'return_number', prefix: 'VR', hospitalId: hospital_id, transaction
      });

      const vendorReturn = await VendorReturn.create({
        return_number,
        return_date,
        vendor_id,
        grn_id: grn_id || null,
        item_id,
        quantity: qty,
        reason,
        remarks: remarks || null,
        status: 'Pending',
        returned_by,
        hospital_id
      }, { transaction });

      await transaction.commit();

      const enriched = await VendorReturnController._enrich(vendorReturn);
      res.status(201).json({
        success: true,
        message: 'Vendor return created successfully',
        data: enriched
      });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── GET ALL ──
  static async getAllVendorReturns(req, res) {
    try {
      const where = { is_active: true, hospital_id: req.hospitalId };
      if (req.query.vendor_id) where.vendor_id = req.query.vendor_id;
      if (req.query.status) where.status = req.query.status;

      const vendorReturns = await VendorReturn.findAll({ where, order: [['return_date', 'DESC']] });

      // Batch lookups to avoid N+1
      const vendorIds = [...new Set(vendorReturns.map(v => v.vendor_id).filter(Boolean))];
      const grnIds = [...new Set(vendorReturns.map(v => v.grn_id).filter(Boolean))];
      const itemIds = [...new Set(vendorReturns.map(v => v.item_id).filter(Boolean))];
      const userIds = [...new Set([
        ...vendorReturns.map(v => v.returned_by),
        ...vendorReturns.map(v => v.approved_by)
      ].filter(Boolean))];

      const [vendors, grns, items, users] = await Promise.all([
        vendorIds.length ? Vendor.findAll({ where: { vendor_id: vendorIds } }) : [],
        grnIds.length ? GoodsReceiptNote.findAll({ where: { grn_id: grnIds } }) : [],
        itemIds.length ? InventoryItem.findAll({ where: { item_id: itemIds } }) : [],
        userIds.length ? User.findAll({ where: { id: userIds }, attributes: { exclude: ['password'] } }) : []
      ]);

      const vMap = Object.fromEntries(vendors.map(v => [v.vendor_id, v]));
      const gMap = Object.fromEntries(grns.map(g => [g.grn_id, g]));
      const iMap = Object.fromEntries(items.map(i => [i.item_id, i]));
      const uMap = Object.fromEntries(users.map(u => [u.id, u]));

      const enriched = vendorReturns.map(vr => {
        const v = vMap[vr.vendor_id];
        const g = gMap[vr.grn_id];
        const i = iMap[vr.item_id];
        const rb = uMap[vr.returned_by];
        const ab = uMap[vr.approved_by];
        return {
          ...vr.toJSON(),
          vendor: v ? { vendor_id: v.vendor_id, vendor_name: v.vendor_name } : null,
          goodsReceiptNote: g ? { grn_id: g.grn_id, grn_number: g.grn_number } : null,
          item: i ? { item_id: i.item_id, item_name: i.item_name, current_stock: i.current_stock } : null,
          returnedBy: rb ? { id: rb.id, name: rb.name } : null,
          approvedByUser: ab ? { id: ab.id, name: ab.name } : null
        };
      });

      res.json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── GET BY ID ──
  static async getVendorReturnById(req, res) {
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true }
      });
      if (!vr) {
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }
      const enriched = await VendorReturnController._enrich(vr);
      res.json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── UPDATE (only while Pending) ──
  static async updateVendorReturn(req, res) {
    const transaction = await VendorReturn.sequelize.transaction();
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!vr) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }
      if (vr.status !== 'Pending') {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Can only edit vendor returns with Pending status' });
      }

      const { quantity, item_id, ...otherFields } = req.body;

      // If quantity or item changed, adjust stock
      if (quantity !== undefined || item_id !== undefined) {
        const newQty = Number(quantity || vr.quantity);
        const newItemId = item_id || vr.item_id;
        const oldQty = Number(vr.quantity);
        const oldItemId = vr.item_id;

        if (!Number.isInteger(newQty) || newQty <= 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'quantity must be a positive whole number' });
        }

        // Restore old item stock
        const oldItem = await InventoryItem.findOne({ where: { item_id: oldItemId, hospital_id: req.hospitalId }, transaction, lock: transaction.LOCK.UPDATE });
        if (oldItem) {
          await oldItem.update({
            current_stock: (Number(oldItem.current_stock) || 0) + oldQty
          }, { transaction });
        }

        // Deduct from new item
        const newItem = newItemId === oldItemId ? oldItem : await InventoryItem.findOne({ where: { item_id: newItemId, hospital_id: req.hospitalId }, transaction, lock: transaction.LOCK.UPDATE });
        if (!newItem) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'New inventory item not found' });
        }
        // newItem.current_stock already reflects the restore above when it's the same item.
        const availableStock = Number(newItem.current_stock) || 0;
        if (availableStock < newQty) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Available: ${availableStock}`
          });
        }
        await newItem.update({
          current_stock: availableStock - newQty
        }, { transaction });
      }

      // Remove fields that shouldn't be updated directly
      delete otherFields.status;
      delete otherFields.approved_by;
      delete otherFields.is_active;
      delete otherFields.return_number;

      await vr.update({
        ...otherFields,
        ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
        ...(item_id !== undefined ? { item_id } : {})
      }, { transaction });

      await transaction.commit();

      const updated = await VendorReturn.findByPk(vr.vendor_return_id);
      const enriched = await VendorReturnController._enrich(updated);
      res.json({ success: true, message: 'Vendor return updated successfully', data: enriched });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── APPROVE ──
  static async approveVendorReturn(req, res) {
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true }
      });
      if (!vr) {
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }
      if (vr.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Only Pending returns can be approved' });
      }

      await vr.update({
        status: 'Approved',
        approved_by: req.user?.id || req.body.approved_by || null
      });

      const enriched = await VendorReturnController._enrich(vr);
      res.json({ success: true, message: 'Vendor return approved', data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── COMPLETE ──
  static async completeVendorReturn(req, res) {
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true }
      });
      if (!vr) {
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }
      if (vr.status !== 'Approved') {
        return res.status(400).json({ success: false, message: 'Only Approved returns can be completed' });
      }

      await vr.update({ status: 'Completed' });

      const enriched = await VendorReturnController._enrich(vr);
      res.json({ success: true, message: 'Vendor return completed', data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── REJECT (restores stock) ──
  static async rejectVendorReturn(req, res) {
    const transaction = await VendorReturn.sequelize.transaction();
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!vr) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }
      if (vr.status === 'Completed' || vr.status === 'Rejected') {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Cannot reject a ${vr.status} return` });
      }

      // Restore stock
      const item = await InventoryItem.findByPk(vr.item_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (item) {
        await item.update({
          current_stock: (Number(item.current_stock) || 0) + Number(vr.quantity)
        }, { transaction });
      }

      await vr.update({
        status: 'Rejected',
        approved_by: req.user?.id || req.body.approved_by || null
      }, { transaction });

      await transaction.commit();

      const updated = await VendorReturn.findByPk(vr.vendor_return_id);
      const enriched = await VendorReturnController._enrich(updated);
      res.json({ success: true, message: 'Vendor return rejected and stock restored', data: enriched });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── DELETE (soft-delete; restores stock only while still in flight) ──
  static async deleteVendorReturn(req, res) {
    const transaction = await VendorReturn.sequelize.transaction();
    try {
      const vr = await VendorReturn.findOne({
        where: { vendor_return_id: req.params.id, hospital_id: req.hospitalId, is_active: true },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!vr) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Vendor return not found' });
      }

      // Restore stock only when goods are still notionally in the hospital
      // (Pending/Approved). Completed = goods already left; Rejected already
      // restored its stock — neither should add stock back.
      let stockRestored = false;
      if (vr.status === 'Pending' || vr.status === 'Approved') {
        const item = await InventoryItem.findOne({ where: { item_id: vr.item_id, hospital_id: req.hospitalId }, transaction, lock: transaction.LOCK.UPDATE });
        if (item) {
          await item.update({
            current_stock: (Number(item.current_stock) || 0) + Number(vr.quantity)
          }, { transaction });
          stockRestored = true;
        }
      }

      // Soft-delete so getAll (filtered on is_active) hides it while history is kept.
      await vr.update({ is_active: false }, { transaction });
      await transaction.commit();
      res.json({
        success: true,
        message: stockRestored ? 'Vendor return deleted and stock restored' : 'Vendor return deleted'
      });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = VendorReturnController;
