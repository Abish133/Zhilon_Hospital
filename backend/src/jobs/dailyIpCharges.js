const { Op } = require('sequelize');
const { IpdAdmission, Bed, Ward, BillingEpisode, BillCharge, ChargeMaster, sequelize } = require('../models');

// Posts a bed-rent charge (and nursing charge if configured) for every currently admitted IPD
// patient. Idempotent per (episode_id, service_type, YYYY-MM-DD) — safe to call multiple times.
async function runDailyIpCharges(targetDate = new Date()) {
  const day = new Date(targetDate);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const admissions = await IpdAdmission.findAll({
    where: { status: 'Admitted', is_active: true }
  });

  const results = { processed: 0, skipped: 0, errors: [] };

  for (const admission of admissions) {
    const t = await sequelize.transaction();
    try {
      const episode = await BillingEpisode.findOne({
        where: { admission_id: admission.admission_id, status: 'Open' },
        transaction: t
      });
      if (!episode) {
        await t.rollback();
        results.skipped++;
        continue;
      }

      // Resolve bed + nursing rates
      let bedRate = 0;
      let bedDesc = 'Bed Rent';
      if (admission.bed_id) {
        const bed = await Bed.findByPk(admission.bed_id, { transaction: t });
        if (bed) {
          bedRate = Number(bed.charge_per_day) || 0;
          const ward = bed.ward_id ? await Ward.findByPk(bed.ward_id, { transaction: t }) : null;
          bedDesc = `Bed Rent - ${ward ? ward.ward_type : bed.bed_type} (${bed.bed_number})`;
        }
      }

      const nursingCharge = await ChargeMaster.findOne({
        where: { service_type: 'Nursing', is_active: true, hospital_id: admission.hospital_id },
        transaction: t
      });
      const nursingRate = nursingCharge ? Number(nursingCharge.rate) || 0 : 0;

      const postCharge = async (serviceType, description, rate) => {
        if (rate <= 0) return false;
        // Idempotency: skip if a charge already exists for this episode+service+day
        const existing = await BillCharge.findOne({
          where: {
            episode_id: episode.episode_id,
            service_type: serviceType,
            charge_date: { [Op.gte]: day, [Op.lt]: nextDay }
          },
          transaction: t
        });
        if (existing) return false;

        const gstPct = 0; // healthcare services typically exempt; adjust per hospital config
        const amount = rate;
        const taxable = amount;
        const gstAmt = (taxable * gstPct) / 100;
        const net = taxable + gstAmt;

        await BillCharge.create({
          episode_id: episode.episode_id,
          hospital_id: admission.hospital_id,
          charge_date: day,
          service_type: serviceType,
          description,
          quantity: 1,
          rate,
          amount,
          discount_percent: 0,
          discount_amount: 0,
          taxable_amount: taxable,
          gst_percent: gstPct,
          gst_amount: gstAmt,
          net_amount: net,
          is_active: true
        }, { transaction: t });
        return true;
      };

      const postedBed = await postCharge('Bed Rent', bedDesc, bedRate);
      const postedNursing = await postCharge('Nursing', 'Daily Nursing Charge', nursingRate);

      await t.commit();
      if (postedBed || postedNursing) results.processed++;
      else results.skipped++;
    } catch (err) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      results.errors.push({ admission_id: admission.admission_id, error: err.message });
    }
  }

  return results;
}

module.exports = { runDailyIpCharges };
