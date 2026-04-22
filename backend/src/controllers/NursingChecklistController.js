const { NursingChecklist, User } = require('../models');

const DEFAULT_ITEMS = {
  bath: false,
  oral_care: false,
  bed_linen_change: false,
  position_turning: false,
  iv_site_check: false,
  catheter_care: false,
  pressure_sore_check: false,
  fall_risk_assessment: false,
  vitals_recorded: false,
  intake_output_recorded: false,
  medication_administered: false,
  wound_dressing: false
};

class NursingChecklistController {
  static async create(req, res) {
    try {
      const { admission_id, hospital_id, shift, check_date, items, notes } = req.body;
      if (!admission_id || !hospital_id || !shift || !check_date) {
        return res.status(400).json({ success: false, message: 'admission_id, hospital_id, shift, check_date required' });
      }
      const payload = {
        admission_id,
        hospital_id,
        nurse_id: req.user?.id,
        shift,
        check_date,
        items: { ...DEFAULT_ITEMS, ...(items || {}) },
        notes
      };
      const record = await NursingChecklist.create(payload);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const where = { is_active: true };
      if (req.query.admission_id) where.admission_id = req.query.admission_id;
      if (req.query.check_date) where.check_date = req.query.check_date;
      if (req.query.shift) where.shift = req.query.shift;
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      const records = await NursingChecklist.findAll({
        where,
        order: [['check_date', 'DESC'], ['createdAt', 'DESC']]
      });

      const nurseIds = [...new Set(records.map(r => r.nurse_id).filter(Boolean))];
      const nurses = nurseIds.length ? await User.findAll({ where: { id: nurseIds }, attributes: ['id', 'name'] }) : [];
      const nMap = Object.fromEntries(nurses.map(n => [n.id, n]));

      const data = records.map(r => ({
        ...r.toJSON(),
        nurse: nMap[r.nurse_id] ? { id: nMap[r.nurse_id].id, name: nMap[r.nurse_id].name } : null
      }));

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const [updated] = await NursingChecklist.update(req.body, { where: { checklist_id: req.params.id, hospital_id: req.hospitalId } });
      if (!updated) return res.status(404).json({ success: false, message: 'Checklist not found' });
      const record = await NursingChecklist.findOne({ where: { checklist_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await NursingChecklist.destroy({ where: { checklist_id: req.params.id, hospital_id: req.hospitalId } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Checklist not found' });
      res.json({ success: true, message: 'Checklist deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async template(req, res) {
    res.json({ success: true, data: DEFAULT_ITEMS });
  }
}

module.exports = NursingChecklistController;
