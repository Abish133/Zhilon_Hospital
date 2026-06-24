'use strict';

// ESI (Employee State Insurance) employee-contribution rate on the salary
// structure, used as a payroll deduction (% of gross wages).
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('salary_structures');
    if (!table.esi_percentage) {
      await queryInterface.addColumn('salary_structures', 'esi_percentage', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('salary_structures');
    if (table.esi_percentage) {
      try { await queryInterface.removeColumn('salary_structures', 'esi_percentage'); } catch (e) { /* ignore */ }
    }
  }
};
