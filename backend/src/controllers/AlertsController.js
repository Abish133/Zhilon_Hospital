const { Op } = require('sequelize');
const { InventoryItem, MedicineBatch, Medicine, sequelize } = require('../models');

class AlertsController {
  // GET /api/alerts/low-stock — items where current_stock <= reorder_level
  static async lowStock(req, res) {
    try {
      const where = {
        is_active: true,
        current_stock: { [Op.lte]: sequelize.col('reorder_level') }
      };
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;

      const items = await InventoryItem.findAll({
        where,
        order: [['current_stock', 'ASC']]
      });

      res.json({ success: true, data: items, count: items.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/alerts/expiring?days=30 — medicine batches expiring within N days
  static async expiring(req, res) {
    try {
      const days = Math.max(0, parseInt(req.query.days, 10) || 30);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const where = {
        is_active: true,
        available_quantity: { [Op.gt]: 0 },
        expiry_date: { [Op.lte]: cutoff }
      };
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;

      const batches = await MedicineBatch.findAll({
        where,
        order: [['expiry_date', 'ASC']]
      });

      const medicineIds = [...new Set(batches.map(b => b.medicine_id).filter(Boolean))];
      const meds = medicineIds.length
        ? await Medicine.findAll({ where: { medicine_id: medicineIds } })
        : [];
      const medMap = Object.fromEntries(meds.map(m => [m.medicine_id, m]));

      const today = new Date();
      const data = batches.map(b => {
        const exp = new Date(b.expiry_date);
        const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return {
          ...b.toJSON(),
          medicine: medMap[b.medicine_id] ? { medicine_id: medMap[b.medicine_id].medicine_id, medicine_name: medMap[b.medicine_id].medicine_name } : null,
          days_to_expiry: daysLeft,
          is_expired: daysLeft < 0
        };
      });

      res.json({ success: true, data, count: data.length, cutoff_days: days });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/alerts/expired — batches already expired with remaining stock
  static async expired(req, res) {
    try {
      const where = {
        is_active: true,
        available_quantity: { [Op.gt]: 0 },
        expiry_date: { [Op.lt]: new Date() }
      };
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;

      const batches = await MedicineBatch.findAll({
        where,
        order: [['expiry_date', 'ASC']]
      });

      res.json({ success: true, data: batches, count: batches.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/alerts/summary — counts only
  static async summary(req, res) {
    try {
      const hospitalId = req.user?.hospital_id;
      const baseWhere = hospitalId ? { hospital_id: hospitalId } : {};

      const [lowStockCount, expiredCount, expiringCount] = await Promise.all([
        InventoryItem.count({
          where: {
            ...baseWhere,
            is_active: true,
            current_stock: { [Op.lte]: sequelize.col('reorder_level') }
          }
        }),
        MedicineBatch.count({
          where: {
            ...baseWhere,
            is_active: true,
            available_quantity: { [Op.gt]: 0 },
            expiry_date: { [Op.lt]: new Date() }
          }
        }),
        (async () => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() + 30);
          return MedicineBatch.count({
            where: {
              ...baseWhere,
              is_active: true,
              available_quantity: { [Op.gt]: 0 },
              expiry_date: { [Op.lte]: cutoff, [Op.gte]: new Date() }
            }
          });
        })()
      ]);

      res.json({
        success: true,
        data: {
          low_stock: lowStockCount,
          expired: expiredCount,
          expiring_30d: expiringCount
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AlertsController;
