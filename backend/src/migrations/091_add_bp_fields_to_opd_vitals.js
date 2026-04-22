'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('opd_vitals');
    if (!tableDesc.bp_systolic) {
      await queryInterface.addColumn('opd_vitals', 'bp_systolic', {
        type: Sequelize.INTEGER,
        allowNull: true,
        after: 'blood_pressure'
      });
    }
    if (!tableDesc.bp_diastolic) {
      await queryInterface.addColumn('opd_vitals', 'bp_diastolic', {
        type: Sequelize.INTEGER,
        allowNull: true,
        after: 'bp_systolic'
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('opd_vitals', 'bp_systolic');
    await queryInterface.removeColumn('opd_vitals', 'bp_diastolic');
  }
};
