const express = require('express');
const { Op } = require('sequelize');
const { InventoryItem, MedicineBatch, Medicine, IpdAdmission, sequelize } = require('../models');

const router = express.Router();

const fmtIN = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// Read flag is in-memory per process (resets on restart). Replace with a
// Notification model + table when persistent notifications are needed.
const dismissed = new Set();

const buildNotifications = async (hospitalId) => {
  const baseWhere = hospitalId ? { hospital_id: hospitalId } : {};

  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() + 30);

  const [lowStock, expiring, expired, longStayAdmissions] = await Promise.all([
    InventoryItem.findAll({
      where: {
        ...baseWhere,
        is_active: true,
        current_stock: { [Op.lte]: sequelize.col('reorder_level') }
      },
      limit: 50
    }),
    MedicineBatch.findAll({
      where: {
        ...baseWhere,
        is_active: true,
        available_quantity: { [Op.gt]: 0 },
        expiry_date: { [Op.lte]: cutoff30, [Op.gte]: new Date() }
      },
      limit: 50,
      order: [['expiry_date', 'ASC']]
    }),
    MedicineBatch.findAll({
      where: {
        ...baseWhere,
        is_active: true,
        available_quantity: { [Op.gt]: 0 },
        expiry_date: { [Op.lt]: new Date() }
      },
      limit: 50
    }),
    IpdAdmission.findAll({
      where: {
        ...baseWhere,
        is_active: true,
        status: 'Admitted',
        admission_date: { [Op.lt]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      },
      limit: 20
    })
  ]);

  const medIds = [...new Set([...expiring, ...expired].map(b => b.medicine_id).filter(Boolean))];
  const meds = medIds.length ? await Medicine.findAll({ where: { medicine_id: medIds } }) : [];
  const medMap = Object.fromEntries(meds.map(m => [m.medicine_id, m.medicine_name]));

  const items = [];

  lowStock.forEach(i => items.push({
    id: `low-stock-${i.item_id}`,
    type: 'low_stock',
    severity: 'warning',
    title: 'Low stock',
    message: `${i.item_name} is at ${i.current_stock} (reorder level ${i.reorder_level})`,
    link: `/inventory/items/${i.item_id}`,
    created_at: new Date()
  }));

  expired.forEach(b => items.push({
    id: `expired-${b.batch_id}`,
    type: 'expired_batch',
    severity: 'danger',
    title: 'Expired batch',
    message: `${medMap[b.medicine_id] || 'Medicine'} batch ${b.batch_number} expired on ${fmtIN(b.expiry_date)} — ${b.available_quantity} units in stock`,
    link: `/pharmacy/batches`,
    created_at: new Date(b.expiry_date)
  }));

  expiring.forEach(b => items.push({
    id: `expiring-${b.batch_id}`,
    type: 'expiring_batch',
    severity: 'warning',
    title: 'Expiring soon',
    message: `${medMap[b.medicine_id] || 'Medicine'} batch ${b.batch_number} expires on ${fmtIN(b.expiry_date)}`,
    link: `/pharmacy/batches`,
    created_at: new Date(b.expiry_date)
  }));

  longStayAdmissions.forEach(a => items.push({
    id: `long-stay-${a.admission_id}`,
    type: 'long_stay',
    severity: 'info',
    title: 'Long-stay patient',
    message: `Admission #${a.admission_id} (UHID ${a.uhid || '-'}) admitted on ${fmtIN(a.admission_date)} — review for discharge`,
    link: `/ipd/admissions/${a.admission_id}`,
    created_at: new Date(a.admission_date)
  }));

  return items.filter(n => !dismissed.has(n.id));
};

router.get('/unread', async (req, res) => {
  try {
    const items = await buildNotifications(req.user?.hospital_id);
    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const items = await buildNotifications(req.user?.hospital_id);
    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', (req, res) => {
  dismissed.add(String(req.params.id));
  res.json({ success: true });
});

router.put('/read-all', async (req, res) => {
  try {
    const items = await buildNotifications(req.user?.hospital_id);
    items.forEach(n => dismissed.add(n.id));
    res.json({ success: true, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
