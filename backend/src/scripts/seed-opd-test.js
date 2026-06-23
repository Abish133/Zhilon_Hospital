/**
 * OPD Test Data Seeder (ADDITIVE)
 * ---------------------------------------------------------------------------
 * Adds a spread of OPD appointments + visits across several dates and every
 * status, so you can exercise:
 *   - Today's Board   (Booked / Checked-in / In-consultation / Completed columns)
 *   - Queue           (today's checked-in & in-consultation, wait times)
 *   - Appointments    (search, appointment ID, date range, status filters)
 *   - Visits          (search, token, date range, status filters)
 *
 * It does NOT wipe anything — it attaches to the FIRST existing hospital and
 * reuses its existing patients / doctors / departments. Safe to run on top of
 * the main seed. Re-running simply appends more test rows.
 *
 *   node src/scripts/seed-opd-test.js
 */
require('dotenv').config();
const db = require('../models');
const { sequelize, Hospital, Patient, Doctor, Department, OpdAppointment, OpdVisit, BillingEpisode } = db;

// Local-date "YYYY-MM-DD" offset by n days (visit_date / appointment_date are DATEONLY).
const d = (n = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
// A timestamp `mins` minutes ago (for checked_in_at, to produce realistic wait times).
const minsAgo = (mins) => new Date(Date.now() - mins * 60000);

async function main() {
  const t = await sequelize.transaction();
  try {
    console.log('\n🧪  Seeding OPD test data...\n');

    const hospital = await Hospital.findOne({ order: [['id', 'ASC']], transaction: t });
    if (!hospital) throw new Error('No hospital found. Run the main seed first: node src/scripts/seed.js');
    const H = hospital.id;

    const doctors = await Doctor.findAll({ where: { hospital_id: H, is_active: true }, order: [['id', 'ASC']], transaction: t });
    const patients = await Patient.findAll({ where: { hospital_id: H }, order: [['patient_id', 'ASC']], transaction: t });
    const departments = await Department.findAll({ where: { hospital_id: H }, transaction: t });
    if (doctors.length < 2 || patients.length < 8) {
      throw new Error(`Not enough base data (doctors=${doctors.length}, patients=${patients.length}). Run the main seed first.`);
    }

    // Round-robin pickers so the data spreads across doctors/patients/depts.
    const doc = (i) => doctors[i % doctors.length];
    const pat = (i) => patients[i % patients.length];
    const deptForDoctor = (dr) => departments.find(x => x.id === dr.department_id) || departments[0];

    // Per-date token counter, continuing past any tokens already in the DB.
    const tokenCounters = {};
    const nextToken = async (date) => {
      if (tokenCounters[date] == null) {
        const max = await OpdVisit.max('token_number', { where: { hospital_id: H, visit_date: date }, transaction: t });
        tokenCounters[date] = max || 0;
      }
      return ++tokenCounters[date];
    };

    let apptCount = 0, visitCount = 0, episodeCount = 0;

    // Create a booked appointment only (patient hasn't arrived).
    const makeAppointment = async ({ p, dr, date, time, visitType = 'New', status = 'Booked' }) => {
      const dept = deptForDoctor(dr);
      const appt = await OpdAppointment.create({
        patient_id: p.patient_id, doctor_id: dr.id, department_id: dept.id,
        appointment_date: date, appointment_time: time, visit_type: visitType,
        status, hospital_id: H, is_active: true
      }, { transaction: t });
      apptCount++;
      return appt;
    };

    // Create a visit (and a billing episode, mirroring the real check-in flow).
    const makeVisit = async ({ p, dr, date, status, visitType = 'New', appt = null, waitedMins = 20 }) => {
      const dept = deptForDoctor(dr);
      const token = await nextToken(date);
      const checkedInAt = minsAgo(waitedMins);
      const visit = await OpdVisit.create({
        appointment_id: appt ? appt.appointment_id : null,
        patient_id: p.patient_id, uhid: p.uhid, doctor_id: dr.id, department_id: dept.id,
        visit_date: date, token_number: token, visit_type: visitType, status,
        checked_in_at: checkedInAt,
        consultation_start: status === 'In-consultation' || status === 'Completed' ? minsAgo(waitedMins - 10) : null,
        consultation_end: status === 'Completed' ? minsAgo(waitedMins - 25) : null,
        hospital_id: H, is_active: true
      }, { transaction: t });
      visitCount++;

      await BillingEpisode.create({
        patient_id: p.patient_id, hospital_id: H, uhid: p.uhid,
        episode_type: 'OPD', opd_visit_id: visit.visit_id, start_date: new Date(), status: 'Open'
      }, { transaction: t });
      episodeCount++;
      return visit;
    };

    // ── TODAY ────────────────────────────────────────────────────────────
    // 3 Booked (not arrived) → Appointments(today) + Board "Booked"
    await makeAppointment({ p: pat(0), dr: doc(0), date: d(0), time: '09:15:00', visitType: 'New' });
    await makeAppointment({ p: pat(1), dr: doc(1), date: d(0), time: '09:45:00', visitType: 'Follow-up' });
    await makeAppointment({ p: pat(2), dr: doc(2), date: d(0), time: '10:15:00', visitType: 'New' });

    // 2 Checked-in (from appointments) → Board "Checked-in", Queue waiting
    const a4 = await makeAppointment({ p: pat(3), dr: doc(0), date: d(0), time: '08:30:00', status: 'Checked-in' });
    await makeVisit({ p: pat(3), dr: doc(0), date: d(0), status: 'Checked-in', appt: a4, waitedMins: 45 });
    const a5 = await makeAppointment({ p: pat(4), dr: doc(1), date: d(0), time: '08:45:00', status: 'Checked-in' });
    await makeVisit({ p: pat(4), dr: doc(1), date: d(0), status: 'Checked-in', appt: a5, waitedMins: 30 });

    // 1 Walk-in Checked-in (no appointment) → tests walk-in path
    await makeVisit({ p: pat(5), dr: doc(2), date: d(0), status: 'Checked-in', visitType: 'Walk-in', waitedMins: 15 });

    // 2 In-consultation → Board "In Consultation", Queue
    const a7 = await makeAppointment({ p: pat(6), dr: doc(0), date: d(0), time: '08:00:00', status: 'Checked-in' });
    await makeVisit({ p: pat(6), dr: doc(0), date: d(0), status: 'In-consultation', appt: a7, waitedMins: 60 });
    await makeVisit({ p: pat(7), dr: doc(3 % doctors.length), date: d(0), status: 'In-consultation', visitType: 'Walk-in', waitedMins: 50 });

    // 2 Completed → Board "Completed" (+ billing)
    const a9 = await makeAppointment({ p: pat(8 % patients.length), dr: doc(1), date: d(0), time: '07:45:00', status: 'Completed' });
    await makeVisit({ p: pat(8 % patients.length), dr: doc(1), date: d(0), status: 'Completed', appt: a9, waitedMins: 90 });
    await makeVisit({ p: pat(9 % patients.length), dr: doc(2), date: d(0), status: 'Completed', visitType: 'Follow-up', waitedMins: 120 });

    // ── PAST (date-range / history / search testing) ─────────────────────
    const ay = await makeAppointment({ p: pat(0), dr: doc(0), date: d(-1), time: '10:00:00', status: 'Completed' });
    await makeVisit({ p: pat(0), dr: doc(0), date: d(-1), status: 'Completed', appt: ay, waitedMins: 60 });
    await makeVisit({ p: pat(2), dr: doc(1), date: d(-3), status: 'Completed', visitType: 'Walk-in', waitedMins: 40 });
    await makeAppointment({ p: pat(5), dr: doc(2), date: d(-5), time: '11:30:00', status: 'No-show' });

    // ── FUTURE (forward date-range testing; must NOT appear on today's board)
    await makeAppointment({ p: pat(1), dr: doc(0), date: d(1), time: '09:30:00', visitType: 'Follow-up' });
    await makeAppointment({ p: pat(3), dr: doc(1), date: d(2), time: '10:45:00', visitType: 'New' });

    await t.commit();

    console.log(`  ✔ Hospital #${H} (${hospital.hospitalName})`);
    console.log(`  ✔ Appointments created: ${apptCount}`);
    console.log(`  ✔ Visits created:       ${visitCount}`);
    console.log(`  ✔ Billing episodes:     ${episodeCount}`);
    console.log('\n  Today snapshot — Booked: 3 (+future), Checked-in: 3, In-consultation: 2, Completed: 2');
    console.log('  Try: OPD → Today\'s Board / Queue, and the date-range + search filters.\n');
    console.log('✅  OPD test data seeded.\n');
    process.exit(0);
  } catch (err) {
    try { await t.rollback(); } catch (e) { /* ignore */ }
    console.error('\n❌  Seed failed:', err.message, '\n');
    process.exit(1);
  }
}

main();
