'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const names = tables.map(t => (typeof t === 'string' ? t : t.tableName).toLowerCase());
    if (names.includes('expense_entries')) return;
    await queryInterface.createTable('expense_entries', {
      expense_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      hospital_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'hospitals', key: 'id' } },
      expense_number: { type: Sequelize.STRING(30), allowNull: true },
      expense_date: { type: Sequelize.DATEONLY, allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      reference_type: { type: Sequelize.STRING(40), allowNull: true },
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      payment_mode: { type: Sequelize.STRING(30), allowNull: true },
      status: { type: Sequelize.ENUM('Recorded', 'Paid'), allowNull: false, defaultValue: 'Paid' },
      created_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('expense_entries');
  }
};
