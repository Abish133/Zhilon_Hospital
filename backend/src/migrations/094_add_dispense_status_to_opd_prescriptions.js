'use strict';

// Tracks whether an OPD prescription line has been dispensed at the pharmacy,
// so the dispense screen can hide already-dispensed items instead of offering
// them again on every visit.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('opd_prescriptions');
    if (!tableInfo.dispense_status) {
      await queryInterface.addColumn('opd_prescriptions', 'dispense_status', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Pending'
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('opd_prescriptions', 'dispense_status');
  }
};
