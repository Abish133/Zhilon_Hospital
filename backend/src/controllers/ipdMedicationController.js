const { IpdMedication, IpdMedicationAdministration, BillCharge, BillingEpisode, IpdAdmission, Medicine, MedicineBatch, sequelize } = require('../models');
const { Op } = require('sequelize');

const createMedication = async (req, res) => {
  try {
    const { admission_id, medicine_id, medicine_name, dosage, frequency, route, duration_days, start_date, instructions } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const medication = await IpdMedication.create({
      admission_id,
      prescribed_by: req.user.id,
      medicine_id,
      medicine_name,
      dosage,
      frequency,
      route,
      duration_days,
      start_date,
      instructions,
      status: 'Active'
    });

    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMedicationsByAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const medications = await IpdMedication.findAll({
      where: { admission_id: admissionId },
      include: [
        { association: 'prescribedBy', attributes: ['id', 'name'], required: false },
        { association: 'medicine', attributes: ['medicine_id', 'medicine_name', 'dosage_form', 'manufacturer'], required: false }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: medications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMedicationStatus = async (req, res) => {
  try {
    const { medicationId } = req.params;
    const { status, stop_reason } = req.body;

    await IpdMedication.update({
      status,
      stopped_by: req.user.id,
      stop_reason,
      stopped_at: new Date()
    }, {
      where: { medication_id: medicationId }
    });

    res.json({ success: true, message: 'Medication status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ward administration: deducts stock FEFO from a MedicineBatch and posts a BillCharge
// on the open BillingEpisode for the admission. Entire flow is transactional.
const administerMedication = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { medication_id, dosage_given, notes, scheduled_time, admission_id, quantity } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);

    const medication = await IpdMedication.findByPk(medication_id, { transaction: t });
    if (!medication) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Medication order not found' });
    }

    const admission = await IpdAdmission.findByPk(admission_id || medication.admission_id, { transaction: t });
    if (!admission) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    // FEFO: find earliest-expiring non-expired batch with stock
    let batch = null;
    let rate = 0;
    if (medication.medicine_id) {
      batch = await MedicineBatch.findOne({
        where: {
          medicine_id: medication.medicine_id,
          hospital_id: admission.hospital_id,
          is_active: true,
          available_quantity: { [Op.gte]: qty },
          expiry_date: { [Op.gt]: new Date() }
        },
        order: [['expiry_date', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!batch) {
        await t.rollback();
        return res.status(409).json({ success: false, message: 'No batch with sufficient stock / all expired' });
      }

      await batch.update({
        available_quantity: batch.available_quantity - qty
      }, { transaction: t });

      rate = Number(batch.mrp) || Number(batch.selling_rate) || 0;
    }

    const administration = await IpdMedicationAdministration.create({
      medication_id,
      admission_id: admission.admission_id,
      administered_by: req.user.id,
      scheduled_time,
      administered_time: new Date(),
      dosage_given,
      status: 'Administered',
      notes
    }, { transaction: t });

    // Post bill charge on the open billing episode
    if (rate > 0) {
      const episode = await BillingEpisode.findOne({
        where: { admission_id: admission.admission_id, status: 'Open' },
        transaction: t
      });
      if (episode) {
        const amount = rate * qty;
        await BillCharge.create({
          episode_id: episode.episode_id,
          hospital_id: admission.hospital_id,
          charge_date: new Date(),
          service_type: 'Pharmacy',
          service_id: batch ? batch.batch_id : null,
          description: `${medication.medicine_name || 'Medicine'} - ${dosage_given || medication.dosage || ''} x ${qty}`,
          quantity: qty,
          rate,
          amount,
          discount_percent: 0,
          discount_amount: 0,
          taxable_amount: amount,
          gst_percent: 0,
          gst_amount: 0,
          net_amount: amount,
          is_active: true
        }, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json({ success: true, data: administration });
  } catch (error) {
    try { await t.rollback(); } catch (e) { /* ignore */ }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdministrationRecords = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const records = await IpdMedicationAdministration.findAll({
      where: { admission_id: admissionId },
      include: [
        { association: 'medication' },
        { association: 'administeredBy', attributes: ['id', 'name'] }
      ],
      order: [['scheduled_time', 'DESC']]
    });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMedication,
  getMedicationsByAdmission,
  updateMedicationStatus,
  administerMedication,
  getAdministrationRecords
};
