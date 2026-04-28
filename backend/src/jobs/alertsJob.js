const { Op } = require('sequelize');
const { InventoryItem, MedicineBatch, Medicine, Notification, Equipment, CalibrationLog, sequelize } = require('../models');

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

      // 3. AMC contracts expiring in next 30 days
      const expiringAmc = await Equipment.findAll({
        where: {
          hospital_id,
          is_active: true,
          amc_end: { [Op.lte]: cutoff30, [Op.gte]: new Date() }
        }
      });
      for (const eq of expiringAmc) {
        const existing = await Notification.findOne({
          where: {
            hospital_id, type: 'amc_expiring', is_read: false,
            metadata: { equipment_id: eq.equipment_id }
          }
        });
        if (!existing) {
          await Notification.create({
            hospital_id,
            type: 'amc_expiring',
            severity: 'warning',
            title: 'AMC Expiring Soon',
            message: `${eq.equipment_name} (${eq.equipment_code}) AMC ends ${eq.amc_end}. Vendor: ${eq.amc_vendor || 'N/A'}.`,
            link: `/equipment`,
            metadata: { equipment_id: eq.equipment_id }
          });
          results.notifications_created++;
        }
      }

      // 4. Equipment warranty expiring in next 30 days
      const expiringWarranty = await Equipment.findAll({
        where: {
          hospital_id,
          is_active: true,
          warranty_end: { [Op.lte]: cutoff30, [Op.gte]: new Date() }
        }
      });
      for (const eq of expiringWarranty) {
        const existing = await Notification.findOne({
          where: {
            hospital_id, type: 'warranty_expiring', is_read: false,
            metadata: { equipment_id: eq.equipment_id }
          }
        });
        if (!existing) {
          await Notification.create({
            hospital_id,
            type: 'warranty_expiring',
            severity: 'info',
            title: 'Equipment Warranty Expiring',
            message: `${eq.equipment_name} (${eq.equipment_code}) warranty ends ${eq.warranty_end}.`,
            link: `/equipment`,
            metadata: { equipment_id: eq.equipment_id }
          });
          results.notifications_created++;
        }
      }

      // 5. Calibration overdue or due in next 30 days (latest log per equipment)
      // Pull the most recent CalibrationLog per equipment, alert if next_due_date is in the warning window.
      const dueCalibrations = await CalibrationLog.findAll({
        where: {
          hospital_id,
          is_active: true,
          next_due_date: { [Op.lte]: cutoff30 }
        },
        include: [{ model: Equipment, as: 'equipment', attributes: ['equipment_id', 'equipment_name', 'equipment_code'] }],
        order: [['next_due_date', 'ASC']]
      });
      // De-dup: only alert on the latest log per equipment to avoid spamming on every historical entry.
      const seenEquipmentIds = new Set();
      for (const log of dueCalibrations) {
        if (seenEquipmentIds.has(log.equipment_id)) continue;
        seenEquipmentIds.add(log.equipment_id);

        const isOverdue = log.next_due_date < new Date().toISOString().slice(0, 10);
        const existing = await Notification.findOne({
          where: {
            hospital_id, type: 'calibration_due', is_read: false,
            metadata: { equipment_id: log.equipment_id }
          }
        });
        if (!existing) {
          await Notification.create({
            hospital_id,
            type: 'calibration_due',
            severity: isOverdue ? 'danger' : 'warning',
            title: isOverdue ? 'Calibration Overdue' : 'Calibration Due Soon',
            message: `${log.equipment?.equipment_name || 'Equipment'} (${log.equipment?.equipment_code || ''}) calibration ${isOverdue ? 'overdue since' : 'due on'} ${log.next_due_date}.`,
            link: `/equipment/calibration`,
            metadata: { equipment_id: log.equipment_id }
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
