const { IpdVital } = require('../models');
const { IpdAdmission } = require('../models');
const { Patient } = require('../models');

exports.recordVitals = async (req, res) => {
  try {
    const { admission_id, systolic_bp, diastolic_bp, pulse_rate, temperature,
            respiratory_rate, spo2, blood_sugar, consciousness_level,
            pain_scale, intake_ml, output_ml, notes } = req.body;

    const admission = await IpdAdmission.findByPk(admission_id);

    if (!admission || admission.status !== 'Admitted') {
      return res.status(400).json({ error: 'Invalid admission' });
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
    
    const vitals = await IpdVital.findAll({
      where: { admission_id, recorded_date: date },
      order: [['recorded_time', 'DESC']]
    });

    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
