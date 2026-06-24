const { LeaveBalance, Employee } = require('../models');

const num = (v) => Number(v) || 0;

class LeaveBalanceController {
  // GET /leave-balances?year=&employee_id=
  static async getAll(req, res) {
    try {
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const { year, employee_id } = req.query;
      const where = { hospital_id, is_active: true };
      if (year) where.year = parseInt(year);
      if (employee_id) where.employee_id = parseInt(employee_id);

      const balances = await LeaveBalance.findAll({
        where,
        include: [{ model: Employee, as: 'employee', attributes: ['employee_id', 'emp_code', 'full_name', 'role'] }],
        order: [['year', 'DESC']]
      });

      const data = balances.map(b => {
        const j = b.toJSON();
        j.casual_balance = num(j.casual_allocated) - num(j.casual_used);
        j.medical_balance = num(j.medical_allocated) - num(j.medical_used);
        j.earned_balance = num(j.earned_allocated) - num(j.earned_used);
        return j;
      });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /leave-balances — allocate / update a year's quota for an employee (upsert)
  static async allocate(req, res) {
    try {
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const { employee_id, year, casual_allocated, medical_allocated, earned_allocated } = req.body;
      if (!employee_id || !year) {
        return res.status(400).json({ success: false, message: 'employee_id and year are required' });
      }

      let balance = await LeaveBalance.findOne({ where: { employee_id, year: parseInt(year), hospital_id } });
      if (balance) {
        await balance.update({
          casual_allocated: casual_allocated != null ? casual_allocated : balance.casual_allocated,
          medical_allocated: medical_allocated != null ? medical_allocated : balance.medical_allocated,
          earned_allocated: earned_allocated != null ? earned_allocated : balance.earned_allocated,
          is_active: true
        });
      } else {
        balance = await LeaveBalance.create({
          employee_id, hospital_id, year: parseInt(year),
          casual_allocated: casual_allocated != null ? casual_allocated : 12,
          medical_allocated: medical_allocated != null ? medical_allocated : 12,
          earned_allocated: earned_allocated != null ? earned_allocated : 15
        });
      }
      res.status(201).json({ success: true, message: 'Leave balance saved', data: balance });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Helper used by the leave-approval flow. Maps leave_type → the matching *_used
  // column and applies a signed delta (days). Returns { ok, message }.
  static async applyUsage({ employee_id, hospital_id, year, leave_type, days, transaction }) {
    const typeMap = { casual: 'casual', medical: 'medical', earned: 'earned' };
    const key = typeMap[leave_type];
    if (!key) return { ok: true }; // 'unpaid' (or unknown) → no balance movement

    let balance = await LeaveBalance.findOne({ where: { employee_id, year, hospital_id }, transaction, lock: transaction?.LOCK?.UPDATE });
    if (!balance) {
      // Auto-create with default quota so approvals never hard-fail on missing setup.
      balance = await LeaveBalance.create({ employee_id, hospital_id, year }, { transaction });
    }
    const allocated = num(balance[`${key}_allocated`]);
    const used = num(balance[`${key}_used`]);
    const newUsed = used + Number(days);
    if (newUsed > allocated) {
      return { ok: false, message: `Insufficient ${key} leave balance: ${allocated - used} day(s) left, ${days} requested.` };
    }
    await balance.update({ [`${key}_used`]: Math.max(0, newUsed) }, { transaction });
    return { ok: true };
  }
}

module.exports = LeaveBalanceController;
