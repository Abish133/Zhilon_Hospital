const {
  Patient, Hospital, BillingEpisode, BillCharge, Bill, Payment,
  ChargeMaster, LabTest, RadiologyTests, Package,
  Medicine, MedicineBatch, PharmacySale, PharmacySaleDetail, sequelize
} = require('../models');
const { Op } = require('sequelize');
const { generateSequentialNumber } = require('../utils/numberGenerator');

// Counter / common billing: a single screen where staff build ONE bill from any
// master (consultation/charge, lab, radiology, package, medicine). Medicines are
// truly dispensed here — FEFO batch, stock deducted — and billed. Everything runs
// in one transaction so a partial failure leaves no stock/bill drift.
class CounterBillingController {
  // GET /counter-billing/catalog — every billable master for the picker, in one
  // RBAC-safe call (served under the billing guard so cashiers can read it).
  static async getCatalog(req, res) {
    try {
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const today = new Date().toISOString().slice(0, 10);

      const [charges, labTests, radTests, packages, medicines, batches] = await Promise.all([
        ChargeMaster.findAll({ where: { hospital_id, is_active: true }, attributes: ['charge_id', 'service_code', 'service_name', 'service_type', 'charge_amount', 'gst_percentage'] }),
        LabTest.findAll({ where: { hospital_id, is_active: true }, attributes: ['test_id', 'test_code', 'test_name', 'charge'] }),
        RadiologyTests.findAll({ where: { hospital_id, is_active: true }, attributes: ['rad_test_id', 'test_code', 'test_name', 'charge'] }),
        Package.findAll({ where: { hospital_id, is_active: true }, attributes: ['package_id', 'package_name', 'total_charge'] }),
        Medicine.findAll({ where: { hospital_id, isActive: true }, attributes: ['medicine_id', 'medicine_name', 'brand_name', 'generic_name', 'strength', 'gst_percentage'] }),
        MedicineBatch.findAll({ where: { hospital_id, is_active: true, available_quantity: { [Op.gt]: 0 }, expiry_date: { [Op.gte]: today } }, attributes: ['batch_id', 'medicine_id', 'mrp', 'selling_rate', 'available_quantity', 'expiry_date'] })
      ]);

      // Decorate each medicine with its FEFO price + total in-stock quantity.
      const batchesByMed = {};
      for (const b of batches) (batchesByMed[b.medicine_id] = batchesByMed[b.medicine_id] || []).push(b);
      const medicineList = medicines.map(m => {
        const bs = (batchesByMed[m.medicine_id] || []).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        const stock = bs.reduce((s, b) => s + (b.available_quantity || 0), 0);
        const mrp = bs[0] ? parseFloat(bs[0].mrp || bs[0].selling_rate || 0) : 0;
        return { ...m.toJSON(), mrp, available_quantity: stock, in_stock: stock > 0 };
      });

      res.json({ success: true, data: { charges, labTests, radiologyTests: radTests, packages, medicines: medicineList } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /counter-billing — one transaction: episode → dispense meds + post all
  // charges → generate bill → record payment → close episode.
  static async createCounterBill(req, res) {
    const t = await sequelize.transaction();
    try {
      const { uhid, patient_id, items, payment_mode, paid_amount = 0, discount_amount = 0 } = req.body;
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const generated_by = req.user?.id;

      if (!hospital_id || !generated_by) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Authentication / hospital context missing' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Add at least one item to bill' });
      }

      const patient = await Patient.findOne({ where: { ...(patient_id ? { patient_id } : { uhid }), hospital_id }, transaction: t });
      if (!patient) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      // Hospital-wide default GST (Settings → Tax Rate), used for medicines that
      // don't carry their own gst_percentage.
      const hospital = await Hospital.findByPk(hospital_id, { transaction: t });
      const defaultGst = parseFloat(hospital?.settings?.tax_rate) || 0;

      // 1) Counter billing episode (OPD type, no visit/admission)
      const episode = await BillingEpisode.create({
        patient_id: patient.patient_id, hospital_id, uhid: patient.uhid,
        episode_type: 'OPD', start_date: new Date(), status: 'Open', is_active: true
      }, { transaction: t });

      const today = new Date().toISOString().slice(0, 10);

      // helper to post one bill charge to the episode
      const addCharge = async ({ service_type, service_id = null, description, quantity, rate, gst_pct = 0, discount_percent = 0 }) => {
        const qty = quantity || 1;
        const amount = +(rate * qty).toFixed(2);
        const disc = +(amount * (discount_percent || 0) / 100).toFixed(2);
        const taxable = +(amount - disc).toFixed(2);
        const gst = +(taxable * (gst_pct || 0) / 100).toFixed(2);
        const net = +(taxable + gst).toFixed(2);
        await BillCharge.create({
          episode_id: episode.episode_id, hospital_id, charge_date: new Date(),
          service_type, service_id, description, quantity: qty, rate, amount,
          discount_percent: discount_percent || 0, discount_amount: disc, taxable_amount: taxable,
          gst_percent: gst_pct || 0, gst_amount: gst, net_amount: net,
          payment_status: 'Unpaid', paid_amount: 0, balance_amount: net
        }, { transaction: t });
      };

      // 2) Master line items (charge / lab / radiology / package)
      for (const it of items) {
        const qty = parseInt(it.quantity) || 1;
        if (qty <= 0 || it.kind === 'medicine') continue;
        const disc = it.discount_percent || 0;

        if (it.kind === 'charge') {
          const cm = await ChargeMaster.findOne({ where: { charge_id: it.ref_id, hospital_id }, transaction: t });
          if (!cm) { await t.rollback(); return res.status(404).json({ success: false, message: 'Service not found in Charge Master' }); }
          await addCharge({ service_type: cm.service_type || 'Other', service_id: cm.charge_id, description: cm.service_name, quantity: qty, rate: parseFloat(cm.charge_amount || 0), gst_pct: parseFloat(cm.gst_percentage || 0), discount_percent: disc });
        } else if (it.kind === 'lab') {
          const lt = await LabTest.findOne({ where: { test_id: it.ref_id, hospital_id }, transaction: t });
          if (!lt) { await t.rollback(); return res.status(404).json({ success: false, message: 'Lab test not found' }); }
          await addCharge({ service_type: 'Investigation', service_id: lt.test_id, description: `Lab - ${lt.test_name}`, quantity: qty, rate: parseFloat(lt.charge || 0), discount_percent: disc });
        } else if (it.kind === 'radiology') {
          const rt = await RadiologyTests.findOne({ where: { rad_test_id: it.ref_id, hospital_id }, transaction: t });
          if (!rt) { await t.rollback(); return res.status(404).json({ success: false, message: 'Radiology test not found' }); }
          await addCharge({ service_type: 'Investigation', service_id: rt.rad_test_id, description: `Radiology - ${rt.test_name}`, quantity: qty, rate: parseFloat(rt.charge || 0), discount_percent: disc });
        } else if (it.kind === 'package') {
          const pk = await Package.findOne({ where: { package_id: it.ref_id, hospital_id }, transaction: t });
          if (!pk) { await t.rollback(); return res.status(404).json({ success: false, message: 'Package not found' }); }
          await addCharge({ service_type: 'Package', service_id: pk.package_id, description: `Package - ${pk.package_name}`, quantity: qty, rate: parseFloat(pk.total_charge || 0), discount_percent: disc });
        } else {
          await t.rollback();
          return res.status(400).json({ success: false, message: `Unknown item type: ${it.kind}` });
        }
      }

      // 3) Medicines — real dispense (FEFO, deduct stock) + one Pharmacy charge
      const medItems = items.filter(i => i.kind === 'medicine' && (parseInt(i.quantity) || 0) > 0);
      let pharmacySale = null;
      if (medItems.length) {
        let medTotal = 0, medTax = 0;
        const details = [];
        for (const it of medItems) {
          const qty = parseInt(it.quantity) || 1;
          const medicine = await Medicine.findOne({ where: { medicine_id: it.ref_id, hospital_id }, transaction: t });
          if (!medicine) { await t.rollback(); return res.status(404).json({ success: false, message: 'Medicine not found' }); }
          const batch = await MedicineBatch.findOne({
            where: { medicine_id: medicine.medicine_id, hospital_id, is_active: true, available_quantity: { [Op.gte]: qty }, expiry_date: { [Op.gte]: today } },
            order: [['expiry_date', 'ASC']], lock: t.LOCK.UPDATE, transaction: t
          });
          if (!batch) { await t.rollback(); return res.status(400).json({ success: false, message: `Insufficient / expired stock for ${medicine.brand_name || medicine.medicine_name}` }); }
          const rate = parseFloat(batch.mrp || batch.selling_rate || 0);
          if (!rate) { await t.rollback(); return res.status(400).json({ success: false, message: `Price not set for ${medicine.brand_name || medicine.medicine_name}` }); }
          const amount = +(rate * qty).toFixed(2);
          const gstPct = medicine.gst_percentage != null ? parseFloat(medicine.gst_percentage) : defaultGst;
          medTotal += amount;
          medTax += +(amount * gstPct / 100).toFixed(2);
          details.push({ medicine_id: medicine.medicine_id, batch_id: batch.batch_id, medicine_name: medicine.brand_name || medicine.medicine_name, quantity: qty, rate, amount, gst_percentage: gstPct, hospital_id });
          batch.available_quantity -= qty;
          await batch.save({ transaction: t });
        }
        medTax = +medTax.toFixed(2);
        const medNet = +(medTotal + medTax).toFixed(2);
        pharmacySale = await PharmacySale.create({
          patient_id: patient.patient_id, uhid: patient.uhid, visit_type: 'Walk-in', visit_id: null,
          sale_date: new Date(), total_amount: medTotal, discount_amount: 0, tax_amount: medTax, net_amount: medNet,
          payment_mode: payment_mode || 'Cash', dispensed_by: generated_by, hospital_id, is_active: true
        }, { transaction: t });
        for (const d of details) await PharmacySaleDetail.create({ sale_id: pharmacySale.sale_id, ...d }, { transaction: t });
        const effGst = medTotal > 0 ? +((medTax / medTotal) * 100).toFixed(2) : 0;
        await addCharge({ service_type: 'Pharmacy', service_id: pharmacySale.sale_id, description: 'Pharmacy (counter dispense)', quantity: 1, rate: medTotal, gst_pct: effGst });
      }

      // 4) Generate the bill from the episode's charges
      const charges = await BillCharge.findAll({ where: { episode_id: episode.episode_id, is_active: true }, transaction: t });
      if (charges.length === 0) { await t.rollback(); return res.status(400).json({ success: false, message: 'Nothing to bill' }); }
      const totalGross = charges.reduce((s, c) => s + parseFloat(c.amount), 0);
      const totalDisc = charges.reduce((s, c) => s + parseFloat(c.discount_amount), 0) + (parseFloat(discount_amount) || 0);
      const totalTax = charges.reduce((s, c) => s + parseFloat(c.gst_amount || 0), 0);
      const totalNet = +(totalGross - totalDisc + totalTax).toFixed(2);
      const paid = Math.min(parseFloat(paid_amount) || 0, totalNet);
      const balance = +(totalNet - paid).toFixed(2);
      const payment_status = balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

      const bill_number = await generateSequentialNumber({ model: Bill, field: 'bill_number', prefix: 'BILL', hospitalId: hospital_id, transaction: t });
      const bill = await Bill.create({
        bill_number, episode_id: episode.episode_id, patient_id: patient.patient_id, uhid: patient.uhid,
        bill_type: 'OPD', bill_date: new Date(), generated_by, hospital_id,
        gross_amount: totalGross, discount_amount: totalDisc, taxable_amount: +(totalGross - totalDisc).toFixed(2),
        tax_amount: totalTax, net_amount: totalNet, advance_adjusted: 0, paid_amount: paid, balance_amount: balance,
        payment_status, is_active: true
      }, { transaction: t });

      // 5) Record payment (if any collected now)
      let payment = null;
      if (paid > 0) {
        const receipt_number = await generateSequentialNumber({ model: Payment, field: 'receipt_number', prefix: 'RCP', hospitalId: hospital_id, transaction: t });
        payment = await Payment.create({
          bill_id: bill.bill_id, hospital_id, payment_date: new Date(), payment_type: 'Bill Payment',
          payment_mode: payment_mode || 'Cash', amount_paid: paid, received_by: generated_by, receipt_number, is_active: true
        }, { transaction: t });
      }

      // 6) Close the one-shot counter episode
      await episode.update({ status: 'Closed', end_date: new Date() }, { transaction: t });

      await t.commit();
      res.status(201).json({
        success: true,
        message: 'Counter bill created successfully',
        data: { bill: bill.toJSON(), payment: payment ? payment.toJSON() : null, episode_id: episode.episode_id }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CounterBillingController;
