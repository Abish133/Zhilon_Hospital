let cron;
try { cron = require('node-cron'); } catch (e) { cron = null; }

const { runDailyIpCharges } = require('./dailyIpCharges');
const { runAlertsJob } = require('./alertsJob');

function startScheduler() {
  if (!cron) {
    console.warn('[scheduler] node-cron not installed; background jobs disabled.');
    return;
  }

  // 1. Daily IP Charges - Every day at 01:00 IST
  cron.schedule('0 1 * * *', async () => {
    try {
      const result = await runDailyIpCharges();
      console.log('[scheduler] daily IP charges:', result);
    } catch (err) {
      console.error('[scheduler] daily IP charges failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 2. Automated Inventory Alerts - Every day at 01:30 IST
  cron.schedule('30 1 * * *', async () => {
    try {
      const result = await runAlertsJob();
      console.log('[scheduler] automated alerts job:', result);
    } catch (err) {
      console.error('[scheduler] automated alerts job failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[scheduler] background jobs started');
}

module.exports = { startScheduler };
