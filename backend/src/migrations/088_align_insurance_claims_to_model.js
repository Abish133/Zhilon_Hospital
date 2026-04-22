'use strict';

/**
 * Migration 078 created insurance_claims using one column-set
 * (approver_id, approval_date, paid_date, approval_comments, ...) and
 * camelCase timestamps. The InsuranceClaim model uses a different set
 * (submitted_by, approved_by, rejected_by, approved_date, rejection_date,
 * payment_date, rejection_reason, approval_remarks, ...) and snake-case
 * timestamps. Bring the table into alignment with the model.
 */

const COLS = [
  ['submitted_by',       (S) => ({ type: S.INTEGER, allowNull: true })],
  ['approved_by',        (S) => ({ type: S.INTEGER, allowNull: true })],
  ['rejected_by',        (S) => ({ type: S.INTEGER, allowNull: true })],
  ['approved_date',      (S) => ({ type: S.DATE, allowNull: true })],
  ['rejection_date',     (S) => ({ type: S.DATE, allowNull: true })],
  ['payment_date',       (S) => ({ type: S.DATE, allowNull: true })],
  ['rejection_reason',   (S) => ({ type: S.TEXT, allowNull: true })],
  ['approval_remarks',   (S) => ({ type: S.TEXT, allowNull: true })],
  ['created_at',         (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') })],
  ['updated_at',         (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('insurance_claims')) return;

    const table = await queryInterface.describeTable('insurance_claims');
    for (const [name, defFn] of COLS) {
      if (!table[name]) {
        await queryInterface.addColumn('insurance_claims', name, defFn(Sequelize));
      }
    }

    // Drop camelCase timestamps left over from 078 — model is `underscored`.
    const refreshed = await queryInterface.describeTable('insurance_claims');
    for (const legacy of ['createdAt', 'updatedAt']) {
      if (refreshed[legacy]) {
        try { await queryInterface.removeColumn('insurance_claims', legacy); } catch (e) { /* ignore */ }
      }
    }
  },

  async down(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('insurance_claims')) return;

    const table = await queryInterface.describeTable('insurance_claims');
    for (const [name] of COLS) {
      if (table[name]) {
        try { await queryInterface.removeColumn('insurance_claims', name); } catch (e) { /* ignore */ }
      }
    }
  }
};
