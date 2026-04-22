'use strict';

const COLS = [
  ['leave_type', (S) => ({ type: S.ENUM('casual', 'medical', 'earned', 'unpaid'), allowNull: false, defaultValue: 'casual' })],
  ['from_date', (S) => ({ type: S.DATE, allowNull: false })],
  ['to_date', (S) => ({ type: S.DATE, allowNull: false })],
  ['no_of_days', (S) => ({ type: S.INTEGER, allowNull: false, defaultValue: 1 })],
  ['reason', (S) => ({ type: S.TEXT, allowNull: true })],
  ['status', (S) => ({ type: S.ENUM('pending', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending' })],
  ['approver_id', (S) => ({
    type: S.INTEGER,
    allowNull: true,
    references: { model: 'employees', key: 'employee_id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })],
  ['approval_date', (S) => ({ type: S.DATE, allowNull: true })],
  ['rejection_reason', (S) => ({ type: S.TEXT, allowNull: true })],
  ['is_active', (S) => ({ type: S.BOOLEAN, defaultValue: true })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());

    if (!tables.includes('leave_requests')) {
      await queryInterface.createTable('leave_requests', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        employee_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'employees', key: 'employee_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        ...Object.fromEntries(COLS.map(([name, defFn]) => [name, defFn(Sequelize)])),
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
    } else {
      const table = await queryInterface.describeTable('leave_requests');
      for (const [name, defFn] of COLS) {
        if (!table[name]) {
          await queryInterface.addColumn('leave_requests', name, defFn(Sequelize));
        }
      }
    }

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('leave_requests', cols); } catch (e) { /* may exist */ }
    };
    await safeIndex(['employee_id']);
    await safeIndex(['approver_id']);
    await safeIndex(['status']);
    await safeIndex(['from_date']);
    await safeIndex(['to_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_requests');
  }
};
