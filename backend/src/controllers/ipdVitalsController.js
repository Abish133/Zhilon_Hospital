const { IpdVital } = require('../models');
const { IpdAdmission } = require('../models');
const { Patient } = require('../models');

// IpdVital has no hospital_id of its own — tenancy is inherited from the parent
// admission. This resolves an admission only if it belongs to the caller's
// hospital, so vitals can never be read/written across tenants.
const findTenantAdmission = (admissionId, req) =>
  IpdAdmission.findOne({
    where: { admission_id: admissionId, hospital_id: req.user.hospital_id }
  });

exports.recordVitals = async (req, res) => {
  try {
    const { admission_id, systolic_bp, diastolic_bp, pulse_rate, temperature,
            respiratory_rate, spo2, blood_sugar, consciousness_level,
            pain_scale, intake_ml, output_ml, notes } = req.body;

    const admission = await findTenantAdmission(admission_id, req);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }
    if (admission.status !== 'Admitted') {
      return res.status(400).json({ success: false, message: 'Invalid admission' });
    }

    const vital = await IpdVital.create({
      admission_id,
      patient_id: admission.patient_id,
      recorded_by: req.user.id,
      recorded_date: new Date().toISOString().split('T')[0],
      recorded_time: new Date().toTimeString().split(' ')[0],
      systolic_bp, diastolic_bp, pulse_rate, temperature,
      respiratory_rate, spo2, blood_sugar, consciousness_level,
      pain_scale, intake_ml, output_ml, notes
    });

    res.json({ success: true, message: 'Vitals recorded', data: vital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVitalsByAdmission = async (req, res) => {
  try {
    const { admission_id } = req.params;

    const admission = await findTenantAdmission(admission_id, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    const vitals = await IpdVital.findAll({
      where: { admission_id },
      order: [['recorded_date', 'DESC'], ['recorded_time', 'DESC']]
    });

    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVitalsByDate = async (req, res) => {
  try {
    const { admission_id, date } = req.params;

    const admission = await findTenantAdmission(admission_id, req);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    const vitals = await IpdVital.findAll({
      where: { admission_id, recorded_date: date },
      order: [['recorded_time', 'DESC']]
    });

    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
