'use strict';

/**
 * The original leave_requests migration (079) created the table with
 * `approver_id` + camelCase timestamps and is missing several columns the
 * LeaveRequest model expects (requested_date, approved_by, approval_comments,
 * hospital_id, created_at, updated_at). Bring the table into alignment.
 */

const COLS = [
  ['requested_date',     (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') })],
  ['approved_by',        (S) => ({ type: S.INTEGER, allowNull: true })],
  ['approval_comments',  (S) => ({ type: S.TEXT, allowNull: true })],
  ['hospital_id',        (S) => ({ type: S.INTEGER, allowNull: true })],
  ['created_at',         (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') })],
  ['updated_at',         (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('leave_requests')) return;

    const table = await queryInterface.describeTable('leave_requests');
    for (const [name, defFn] of COLS) {
      if (!table[name]) {
        await queryInterface.addColumn('leave_requests', name, defFn(Sequelize));
      }
    }

    // Drop camelCase timestamps left over from the original 079 migration —
    // model uses snake_case (`underscored: true`) and Sequelize won't supply them on insert.
    const refreshed = await queryInterface.describeTable('leave_requests');
    for (const legacy of ['createdAt', 'updatedAt']) {
      if (refreshed[legacy]) {
        try { await queryInterface.removeColumn('leave_requests', legacy); } catch (e) { /* ignore */ }
      }
    }
  },

  async down(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('leave_requests')) return;

    const table = await queryInterface.describeTable('leave_requests');
    for (const [name] of COLS) {
      if (table[name]) {
        try { await queryInterface.removeColumn('leave_requests', name); } catch (e) { /* ignore */ }
      }
    }
  }
};
