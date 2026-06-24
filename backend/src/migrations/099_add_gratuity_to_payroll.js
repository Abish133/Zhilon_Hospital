'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('payroll');
    if (!table.gratuity) {
      await queryInterface.addColumn('payroll', 'gratuity', {
        type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0
      });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('payroll');
    if (table.gratuity) { try { await queryInterface.removeColumn('payroll', 'gratuity'); } catch (e) { /* ignore */ } }
  }
};
