const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/rbac');
const { runDailyIpCharges } = require('../jobs/dailyIpCharges');

// POST /api/admin/jobs/run-daily-charges — Admin-only on-demand trigger
router.post('/run-daily-charges', authorize('Admin'), async (req, res) => {
  try {
    const { date } = req.body || {};
    const target = date ? new Date(date) : new Date();
    if (isNaN(target.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }
    const result = await runDailyIpCharges(target);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
