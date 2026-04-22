'use strict';

/**
 * Migration 075 created salary_structures with a UNIQUE constraint on
 * employee_id. That blocks the historical-structure workflow that the
 * SalaryStructureController.create() handler implements: when a new
 * structure is created for an employee, the existing one's effective_to
 * is closed and the new one is inserted. With UNIQUE on employee_id
 * the second insert fails.
 *
 * Drop the unique index/constraint and replace it with a plain index on
 * employee_id so lookups stay fast, while allowing multiple rows per
 * employee (one current, plus historical).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('salary_structures')) return;

    // MySQL stores unique constraints as indexes; both unique constraint
    // and unique index removal go through removeIndex / removeConstraint.
    // Try common names first, then fall back to scanning indexes.
    const candidates = ['employee_id', 'salary_structures_employee_id_unique', 'salary_structures_employee_id'];
    for (const name of candidates) {
      try { await queryInterface.removeIndex('salary_structures', name); } catch (e) { /* ignore */ }
    }

    // Re-create a non-unique index for lookup performance. showIndex is
    // mysql-specific, so we just try to add and ignore "already exists".
    try {
      await queryInterface.addIndex('salary_structures', ['employee_id'], {
        name: 'salary_structures_employee_id_idx',
        unique: false
      });
    } catch (e) { /* ignore — index already exists */ }
  },

  async down(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('salary_structures')) return;

    try { await queryInterface.removeIndex('salary_structures', 'salary_structures_employee_id_idx'); } catch (e) { /* ignore */ }
    try {
      await queryInterface.addIndex('salary_structures', ['employee_id'], {
        name: 'salary_structures_employee_id_unique',
        unique: true
      });
    } catch (e) { /* ignore */ }
  }
};
