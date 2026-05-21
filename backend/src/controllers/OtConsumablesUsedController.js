const { OtConsumablesUsed, OtBooking, InventoryItem, User, BillingEpisode, BillCharge, sequelize } = require('../models');

class OtConsumablesUsedController {
  static async createOtConsumablesUsed(req, res) {
    const t = await sequelize.transaction();
    try {
      if (!req.body.booking_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Booking ID is required' });
      }
      if (!req.body.item_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Item ID is required' });
      }

      const inventoryItem = await InventoryItem.findByPk(req.body.item_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!inventoryItem) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      const quantityUsed = parseInt(req.body.quantity_used) || 0;
      if (quantityUsed <= 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'quantity_used must be greater than 0' });
      }
      if (inventoryItem.current_stock < quantityUsed) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${inventoryItem.current_stock}, Required: ${quantityUsed}`
        });
      }

      const hospital_id = req.user?.hospital_id;
      const otConsumablesUsed = await OtConsumablesUsed.create({ ...req.body, hospital_id }, { transaction: t });

      await inventoryItem.update(
        { current_stock: inventoryItem.current_stock - quantityUsed },
        { transaction: t }
      );

      // Auto-bill the consumable to the patient's open billing episode (IPD or OPD).
      // Resolves episode via OtBooking.admission_id (IPD) or via patient_id with no admission (rare day-care OPD).
      const otBooking = await OtBooking.findByPk(req.body.booking_id, { transaction: t });
      if (otBooking) {
        const episodeWhere = otBooking.admission_id
          ? { admission_id: otBooking.admission_id, status: 'Open' }
          : { patient_id: otBooking.patient_id, status: 'Open', episode_type: 'OPD' };
        const billingEpisode = await BillingEpisode.findOne({ where: episodeWhere, transaction: t });

        const ratePerUnit = parseFloat(inventoryItem.rate_per_unit || 0);
        if (billingEpisode && ratePerUnit > 0) {
          const amount = +(ratePerUnit * quantityUsed).toFixed(2);
          await BillCharge.create({
            episode_id: billingEpisode.episode_id,
            hospital_id,
            charge_date: new Date(),
            service_type: 'OT Consumable',
            service_id: otConsumablesUsed.usage_id,
            description: `OT Consumable - ${inventoryItem.item_name}`,
            quantity: quantityUsed,
            rate: ratePerUnit,
            amount,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: amount,
            gst_percent: 0,
            gst_amount: 0,
            net_amount: amount
          }, { transaction: t });
        }
      }

      await t.commit();

      const recordedBy = await User.findByPk(req.body.recorded_by);

      res.status(201).json({
        success: true,
        data: {
          ...otConsumablesUsed.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          inventoryItem: inventoryItem ? { item_id: inventoryItem.item_id, item_name: inventoryItem.item_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllOtConsumablesUsed(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otConsumablesUsed = await OtConsumablesUsed.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
     
      const consumablesWithDetails = await Promise.all(
        otConsumablesUsed.map(async (consumable) => {
          const otBooking = await OtBooking.findByPk(consumable.booking_id);
          const inventoryItem = await InventoryItem.findByPk(consumable.item_id);
          const recordedBy = await User.findByPk(consumable.recorded_by);
          return {
            ...consumable.toJSON(),
            otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
            inventoryItem: inventoryItem ? { id: inventoryItem.id, name: inventoryItem.name } : null,
            recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
          };
        })
      );
     
      res.json({ success: true, data: consumablesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getOtConsumablesUsedById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otConsumablesUsed = await OtConsumablesUsed.findOne({ where: { usage_id: req.params.id, hospital_id: req.hospitalId } });
      if (!otConsumablesUsed || (hospital_id && otConsumablesUsed.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'OT consumables usage record not found' });
      }
     
      const otBooking = await OtBooking.findByPk(otConsumablesUsed.booking_id);
      const inventoryItem = await InventoryItem.findByPk(otConsumablesUsed.item_id);
      const recordedBy = await User.findByPk(otConsumablesUsed.recorded_by);
     
      res.json({
        success: true,
        data: {
          ...otConsumablesUsed.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          inventoryItem: inventoryItem ? { id: inventoryItem.id, name: inventoryItem.name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateOtConsumablesUsed(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { usage_id: req.params.id, hospital_id }
        : { usage_id: req.params.id };
      const [updated] = await OtConsumablesUsed.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT consumables usage record not found' });
      }
      const updatedConsumable = await OtConsumablesUsed.findOne({ where: { usage_id: req.params.id, hospital_id: req.hospitalId } });
      const otBooking = await OtBooking.findByPk(updatedConsumable.booking_id);
      const inventoryItem = await InventoryItem.findByPk(updatedConsumable.item_id);
      const recordedBy = await User.findByPk(updatedConsumable.recorded_by);
     
      res.json({
        success: true,
        data: {
          ...updatedConsumable.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          inventoryItem: inventoryItem ? { id: inventoryItem.id, name: inventoryItem.name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteOtConsumablesUsed(req, res) {
    const t = await sequelize.transaction();
    try {
      const hospital_id = req.user?.hospital_id;
      const record = await OtConsumablesUsed.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!record || (hospital_id && record.hospital_id !== hospital_id)) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'OT consumables usage record not found' });
      }

      // Restore stock
      const item = await InventoryItem.findByPk(record.item_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (item) {
        await item.update(
          { current_stock: (item.current_stock || 0) + (parseInt(record.quantity_used) || 0) },
          { transaction: t }
        );
      }

      await record.destroy({ transaction: t });
      await t.commit();
      res.json({ success: true, message: 'OT consumables usage record deleted and stock restored' });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OtConsumablesUsedController;