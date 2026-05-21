const { IpdMedication, IpdMedicationAdministration, BillCharge, BillingEpisode, IpdAdmission, Medicine, MedicineBatch, sequelize } = require('../models');
const { Op } = require('sequelize');

// IPD medication records have no hospital_id of their own — tenancy is inherited
// from the parent admission. These helpers resolve a record only when its
// admission belongs to the caller's hospital, preventing cross-tenant access.
const findTenantAdmission = (admissionId, req, transaction) =>
  IpdAdmission.findOne({
    where: { admission_id: admissionId, hospital_id: req.user.hospital_id },
    transaction
  });

const createMedication = async (req, res) => {
  try {
    const { admission_id, medicine_id, medicine_name, dosage, frequency, route, duration_days, start_date, instructions } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const admission = await findTenantAdmission(admission_id, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
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

    const admission = await findTenantAdmission(admissionId, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

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

    const medication = await IpdMedication.findByPk(medicationId);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication order not found' });
    }
    const admission = await findTenantAdmission(medication.admission_id, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Medication order not found' });
    }

    await medication.update({
      status,
      stopped_by: req.user.id,
      stop_reason,
      stopped_at: new Date()
    });

    res.json({ success: true, message: 'Medication status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ward administration is a CLINICAL record only — it logs that a nurse gave a
// dose. Stock deduction and billing happen once, at pharmacy issuance
// (PharmacySaleController.dispenseMedicine via the "Issue to Ward" screen), so
// administration intentionally does NOT touch MedicineBatch stock or post a
// BillCharge. (To bill per-dose instead, move the dispense logic here and make
// ward issuance the clinical-only step.)
const administerMedication = async (req, res) => {
  try {
    const { medication_id, dosage_given, notes, scheduled_time, admission_id } = req.body;

    const medication = await IpdMedication.findByPk(medication_id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication order not found' });
    }

    const admission = await findTenantAdmission(admission_id || medication.admission_id, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }
    // Guard against administering against a medication order from another admission.
    if (medication.admission_id !== admission.admission_id) {
      return res.status(400).json({ success: false, message: 'Medication does not belong to this admission' });
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
    });

    res.status(201).json({ success: true, data: administration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdministrationRecords = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const admission = await findTenantAdmission(admissionId, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

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
