const { ExpenseEntry, User, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const { generateSequentialNumber } = require('../utils/numberGenerator');

class ExpenseController {
  // GET /expenses?from=&to=&category=
  static async getAll(req, res) {
    try {
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const { from, to, category } = req.query;
      const where = { hospital_id, is_active: true };
      if (category) where.category = category;
      if (from && to) where.expense_date = { [Op.between]: [from, to] };

      const expenses = await ExpenseEntry.findAll({
        where,
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'], required: false }],
        order: [['expense_date', 'DESC'], ['expense_id', 'DESC']]
      });

      // Category totals for the summary cards.
      const byCategory = {};
      let total = 0;
      for (const e of expenses) {
        const amt = Number(e.amount) || 0;
        byCategory[e.category] = (byCategory[e.category] || 0) + amt;
        total += amt;
      }
      res.json({ success: true, data: expenses, summary: { total, byCategory } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /expenses — record a manual operating expense
  static async create(req, res) {
    try {
      const hospital_id = req.user?.hospital_id || req.hospitalId;
      const created_by = req.user?.id;
      const { expense_date, category, description, amount, payment_mode } = req.body;
      if (!expense_date || !category || amount == null) {
        return res.status(400).json({ success: false, message: 'expense_date, category, and amount are required' });
      }
      const expense_number = await generateSequentialNumber({ model: ExpenseEntry, field: 'expense_number', prefix: 'EXP', hospitalId: hospital_id });
      const expense = await ExpenseEntry.create({
        hospital_id, expense_number, expense_date, category,
        description: description || null, amount, payment_mode: payment_mode || 'Cash',
        status: 'Paid', created_by, is_active: true
      });
      res.status(201).json({ success: true, message: 'Expense recorded', data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Helper: post a payroll expense when a payslip is paid (idempotent per payroll).
  static async postPayrollExpense({ hospital_id, payroll, created_by, transaction }) {
    const existing = await ExpenseEntry.findOne({
      where: { hospital_id, reference_type: 'Payroll', reference_id: payroll.payroll_id, is_active: true },
      transaction
    });
    if (existing) return existing;
    const expense_number = await generateSequentialNumber({ model: ExpenseEntry, field: 'expense_number', prefix: 'EXP', hospitalId: hospital_id, transaction });
    return ExpenseEntry.create({
      hospital_id, expense_number,
      expense_date: payroll.payment_date || new Date().toISOString().slice(0, 10),
      category: 'Payroll',
      description: `Salary ${payroll.month}/${payroll.year} — employee #${payroll.employee_id}`,
      reference_type: 'Payroll', reference_id: payroll.payroll_id,
      amount: payroll.net_salary, payment_mode: payroll.payment_mode || 'Bank Transfer',
      status: 'Paid', created_by, is_active: true
    }, { transaction });
  }
}

module.exports = ExpenseController;
