const { PurchaseOrder, PurchaseOrderDetail, Vendor, User, Hospital, InventoryItem, Medicine } = require('../models');
const { QueryTypes } = require('sequelize');

class PurchaseOrderController {
  static async createPurchaseOrder(req, res) {
    const transaction = await PurchaseOrder.sequelize.transaction();
    try {
      const { po_number, vendor_id, po_date, expected_delivery_date, items, created_by, approved_by, hospital_id } = req.body;
      
      if (!po_number || !vendor_id || !po_date || !created_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'PO number, vendor, PO date, created by, and hospital are required' 
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one item is required' 
        });
      }

      // Calculate totals
      let total_amount = 0;
      let gst_amount = 0;

      for (const item of items) {
        const itemAmount = item.quantity * item.rate;
        total_amount += itemAmount;
        
        // Get item details for GST
        if (item.item_id) {
          const inventoryItem = await InventoryItem.findByPk(item.item_id);
          if (inventoryItem) {
            const gst = itemAmount * 0.18; // Default 18% GST
            gst_amount += gst;
          }
        }
        if (item.medicine_id) {
          const medicine = await Medicine.findByPk(item.medicine_id);
          if (medicine && medicine.gst_percentage) {
            const gst = itemAmount * (medicine.gst_percentage / 100);
            gst_amount += gst;
          }
        }
      }

      const net_amount = total_amount + gst_amount;

      const purchaseOrder = await PurchaseOrder.create({ 
        po_number,
        vendor_id,
        po_date,
        expected_delivery_date,
        total_amount,
        gst_amount,
        net_amount,
        status: 'Draft',
        created_by,
        approved_by,
        hospital_id
      }, { transaction });

      // Create PO details
      for (const item of items) {
        await PurchaseOrderDetail.create({
          po_id: purchaseOrder.po_id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          hospital_id
        }, { transaction });
      }

      await transaction.commit();

      const vendor = await Vendor.findByPk(vendor_id);
      const creator = await User.findByPk(created_by, { attributes: { exclude: ['password'] } });
      let approver = null;
      if (approved_by) {
        approver = await User.findByPk(approved_by, { attributes: { exclude: ['password'] } });
      }
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Purchase order created successfully',
        data: {
          ...purchaseOrder.toJSON(),
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          creator: creator ? { id: creator.id, name: creator.name } : null,
          approver: approver ? { id: approver.id, name: approver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'PO number already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllPurchaseOrders(req, res) {
    try {
      const { status } = req.query;
      const where = { is_active: true };
      if (status) where.status = status;

      const purchaseOrders = await PurchaseOrder.findAll({ where });

      const ordersWithDetails = await Promise.all(
        purchaseOrders.map(async (po) => {
          const vendor = await Vendor.findByPk(po.vendor_id);
          const creator = await User.findByPk(po.created_by, { attributes: { exclude: ['password'] } });
          let approver = null;
          if (po.approved_by) {
            approver = await User.findByPk(po.approved_by, { attributes: { exclude: ['password'] } });
          }
          const hospital = await Hospital.findByPk(po.hospital_id);
          
          // Get PO items
          const items = await PurchaseOrderDetail.findAll({ 
            where: { po_id: po.po_id, is_active: true } 
          });
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const inventoryItem = await InventoryItem.findByPk(item.item_id);
              return {
                ...item.toJSON(),
                item_name: inventoryItem?.item_name,
                item_code: inventoryItem?.item_code
              };
            })
          );
          
          return {
            ...po.toJSON(),
            vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
            creator: creator ? { id: creator.id, name: creator.name } : null,
            approver: approver ? { id: approver.id, name: approver.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            items: itemsWithDetails
          };
        })
      );

      res.json({ success: true, data: ordersWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPurchaseOrderById(req, res) {
    try {
      const purchaseOrder = await PurchaseOrder.findOne({ where: { po_id: req.params.id, hospital_id: req.hospitalId } });

      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      const vendor = await Vendor.findByPk(purchaseOrder.vendor_id);
      const creator = await User.findByPk(purchaseOrder.created_by, { attributes: { exclude: ['password'] } });
      let approver = null;
      if (purchaseOrder.approved_by) {
        approver = await User.findByPk(purchaseOrder.approved_by, { attributes: { exclude: ['password'] } });
      }
      const hospital = await Hospital.findByPk(purchaseOrder.hospital_id);

      // Get PO items
      const items = await PurchaseOrderDetail.findAll({ 
        where: { po_id: purchaseOrder.po_id, is_active: true } 
      });
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const inventoryItem = await InventoryItem.findByPk(item.item_id);
          return {
            ...item.toJSON(),
            item_name: inventoryItem?.item_name,
            item_code: inventoryItem?.item_code
          };
        })
      );

      res.json({ 
        success: true, 
        data: {
          ...purchaseOrder.toJSON(),
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          creator: creator ? { id: creator.id, name: creator.name } : null,
          approver: approver ? { id: approver.id, name: approver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          items: itemsWithDetails
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePurchaseOrder(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await PurchaseOrder.update(
          { is_active: false },
          { where: { po_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Purchase order not found' });
        }
        const deactivatedPO = await PurchaseOrder.findOne({ where: { po_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Purchase order deactivated successfully', data: deactivatedPO });
      }

      const [updated] = await PurchaseOrder.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { po_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      const updatedPO = await PurchaseOrder.findOne({ where: { po_id: req.params.id, hospital_id: req.hospitalId } });
      const vendor = await Vendor.findByPk(updatedPO.vendor_id);
      const creator = await User.findByPk(updatedPO.created_by, { attributes: { exclude: ['password'] } });
      let approver = null;
      if (updatedPO.approved_by) {
        approver = await User.findByPk(updatedPO.approved_by, { attributes: { exclude: ['password'] } });
      }
      const hospital = await Hospital.findByPk(updatedPO.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedPO.toJSON(),
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name, vendor_code: vendor.vendor_code } : null,
          creator: creator ? { id: creator.id, name: creator.name } : null,
          approver: approver ? { id: approver.id, name: approver.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePurchaseOrder(req, res) {
    try {
      const deleted = await PurchaseOrder.destroy({
        where: { po_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      res.json({ success: true, message: 'Purchase order permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async approvePurchaseOrder(req, res) {
    try {
      const { approved_by } = req.body;
      
      const purchaseOrder = await PurchaseOrder.findOne({ where: { po_id: req.params.id, hospital_id: req.hospitalId } });
      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      if (purchaseOrder.status !== 'Draft') {
        return res.status(400).json({ 
          success: false, 
          message: 'Only draft purchase orders can be approved' 
        });
      }

      await purchaseOrder.update({
        status: 'Approved',
        approved_by: approved_by || purchaseOrder.created_by
      });

      const vendor = await Vendor.findByPk(purchaseOrder.vendor_id);
      const approver = await User.findByPk(approved_by || purchaseOrder.created_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        message: 'Purchase order approved successfully',
        data: {
          ...purchaseOrder.toJSON(),
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name } : null,
          approver: approver ? { id: approver.id, name: approver.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async triggerAutoReorder(req, res) {
    let transaction;
    try {
      transaction = await PurchaseOrder.sequelize.transaction();
      const { hospital_id, default_vendor_id } = req.body;
      
      if (!hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hospital ID is required' 
        });
      }

      // Get all inventory items with low stock
      const rawLowStockItems = await PurchaseOrder.sequelize.query(
        `SELECT * FROM inventory_items 
         WHERE hospital_id = :hospital_id 
         AND current_stock <= reorder_point
         AND status = 'Active'`,
        {
          replacements: { hospital_id },
          type: QueryTypes.SELECT
        }
      );

      if (rawLowStockItems.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No items require reordering',
          data: { po_created: 0, items_checked: 0 }
        });
      }

      // Group items by vendor
      const itemsByVendor = {};
      
      for (const item of rawLowStockItems) {
        // Get vendor for this item
        let vendor_id = default_vendor_id;
        
        if (item.vendor_id) {
          vendor_id = item.vendor_id;
        } else if (default_vendor_id) {
          vendor_id = default_vendor_id;
        }

        if (!vendor_id) {
          continue; // Skip items without vendor
        }

        if (!itemsByVendor[vendor_id]) {
          itemsByVendor[vendor_id] = [];
        }

        itemsByVendor[vendor_id].push({
          item_id: item.item_id,
          item_name: item.item_name,
          current_stock: item.current_stock,
          reorder_point: item.reorder_point,
          reorder_quantity: item.reorder_quantity || (item.reorder_point * 2), // Default 2x reorder point
          unit_cost: item.unit_cost || 0
        });
      }

      // Create POs for each vendor
      const createdPOs = [];
      const poNumber = `PO-AUTO-${Date.now()}`;
      const baseUser = await User.findOne({ where: { role: 'ADMIN' }, transaction });

      for (const vendorId in itemsByVendor) {
        const items = itemsByVendor[vendorId];
        let totalAmount = 0;

        // Calculate totals
        for (const item of items) {
          totalAmount += item.reorder_quantity * item.unit_cost;
        }

        // Create purchase order
        const purchaseOrder = await PurchaseOrder.create({
          po_number: `${poNumber}-${vendorId}`,
          vendor_id: vendorId,
          po_date: new Date(),
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          total_amount: totalAmount,
          gst_amount: totalAmount * 0.18, // 18% GST
          net_amount: totalAmount + (totalAmount * 0.18),
          status: 'Draft',
          created_by: baseUser ? baseUser.id : null,
          hospital_id,
          remarks: `Auto-reorder: ${items.map(i => i.item_name).join(', ')}`
        }, { transaction });

        // Create PO details
        for (const item of items) {
          await PurchaseOrderDetail.create({
            po_id: purchaseOrder.po_id,
            item_id: item.item_id,
            quantity: item.reorder_quantity,
            rate: item.unit_cost,
            amount: item.reorder_quantity * item.unit_cost,
            hospital_id
          }, { transaction });
        }

        createdPOs.push({
          po_id: purchaseOrder.po_id,
          po_number: purchaseOrder.po_number,
          vendor_id: vendorId,
          item_count: items.length,
          total_amount: purchaseOrder.net_amount
        });
      }

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: `Auto-reorder completed: ${createdPOs.length} PO(s) created`,
        data: {
          po_created: createdPOs.length,
          items_checked: rawLowStockItems.length,
          purchase_orders: createdPOs
        }
      });
    } catch (error) {
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }
      res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async checkStockLevels(req, res) {
    try {
      const { hospital_id } = req.query;
      
      if (!hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is required'
        });
      }

      // Get all items with stock status
      const items = await PurchaseOrder.sequelize.query(
        `SELECT 
           item_id,
           item_name,
           current_stock,
           reorder_point,
           reorder_quantity,
           unit_cost,
           CASE 
             WHEN current_stock <= reorder_point THEN 'CRITICAL'
             WHEN current_stock <= reorder_point * 1.5 THEN 'LOW'
             ELSE 'NORMAL'
           END as stock_status
         FROM inventory_items
         WHERE hospital_id = :hospital_id
         AND status = 'Active'
         ORDER BY current_stock ASC`,
        {
          replacements: { hospital_id },
          type: QueryTypes.SELECT
        }
      );

      const summary = {
        critical_count: items.filter(i => i.stock_status === 'CRITICAL').length,
        low_count: items.filter(i => i.stock_status === 'LOW').length,
        normal_count: items.filter(i => i.stock_status === 'NORMAL').length,
        total_items: items.length
      };

      return res.status(200).json({
        success: true,
        data: {
          summary,
          items
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = PurchaseOrderController;
