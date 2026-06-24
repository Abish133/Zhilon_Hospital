'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const names = tables.map(t => (typeof t === 'string' ? t : t.tableName).toLowerCase());
    if (names.includes('leave_balances')) return;
    await queryInterface.createTable('leave_balances', {
      balance_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'employee_id' }, onDelete: 'CASCADE' },
      hospital_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'hospitals', key: 'id' } },
      year: { type: Sequelize.INTEGER, allowNull: false },
      casual_allocated: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 12 },
      casual_used: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      medical_allocated: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 12 },
      medical_used: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      earned_allocated: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 15 },
      earned_used: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('leave_balances');
  }
};
