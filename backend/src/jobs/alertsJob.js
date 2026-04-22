const { Op } = require('sequelize');
const { InventoryItem, MedicineBatch, Medicine, Notification, sequelize } = require('../models');

async function runAlertsJob() {
  const hospitals = await sequelize.models.Hospital.findAll({ where: { is_active: true } });
  const results = { notifications_created: 0, errors: [] };

  for (const hospital of hospitals) {
    const hospital_id = hospital.id;
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() + 30);

    try {
      // 1. Check Low Stock Items
      const lowStockItems = await InventoryItem.findAll({
        where: {
          hospital_id,
          is_active: true,
          current_stock: { [Op.lte]: sequelize.col('reorder_level') }
        }
      });

      for (const item of lowStockItems) {
        // Only create if not already notified recently or still unread
        const existing = await Notification.findOne({
          where: {
            hospital_id,
            type: 'low_stock',
            is_read: false,
            metadata: { item_id: item.item_id }
          }
        });

        if (!existing) {
          await Notification.create({
            hospital_id,
            type: 'low_stock',
            severity: 'warning',
            title: 'Critical: Low Stock Alert',
            message: `${item.item_name} is running low. Current stock: ${item.current_stock}, Reorder level: ${item.reorder_level}.`,
            link: `/inventory`,
            metadata: { item_id: item.item_id }
          });
          results.notifications_created++;
        }
      }

      // 2. Check Expiring Medicine Batches
      const expiringBatches = await MedicineBatch.findAll({
        where: {
          hospital_id,
          is_active: true,
          available_quantity: { [Op.gt]: 0 },
          expiry_date: { [Op.lte]: cutoff30, [Op.gte]: new Date() }
        },
        include: [{ model: Medicine, as: 'medicine', attributes: ['medicine_name'] }]
      });

      for (const batch of expiringBatches) {
        const existing = await Notification.findOne({
          where: {
            hospital_id,
            type: 'expiring_batch',
            is_read: false,
            metadata: { batch_id: batch.batch_id }
          }
        });

        if (!existing) {
          await Notification.create({
            hospital_id,
            type: 'expiring_batch',
            severity: 'danger',
            title: 'Action Required: Expiring Medicine',
            message: `${batch.medicine?.medicine_name || 'Medicine'} (Batch: ${batch.batch_number}) expires on ${batch.expiry_date}. ${batch.available_quantity} units remaining.`,
            link: `/pharmacy/batches`,
            metadata: { batch_id: batch.batch_id }
          });
          results.notifications_created++;
        }
      }

    } catch (err) {
      console.error(`[alerts-job] Error for hospital ${hospital_id}:`, err.message);
      results.errors.push({ hospital_id, error: err.message });
    }
  }

  return results;
}

module.exports = { runAlertsJob };
