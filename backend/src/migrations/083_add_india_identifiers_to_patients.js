'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('patients');
    if (!table.aadhaar_number) {
      await queryInterface.addColumn('patients', 'aadhaar_number', {
        type: Sequelize.STRING(12),
        allowNull: true,
        comment: 'Masked 12-digit Aadhaar (store last 4 visible, rest encrypted if required by policy)'
      });
    }
    if (!table.abha_id) {
      await queryInterface.addColumn('patients', 'abha_id', {
        type: Sequelize.STRING(17),
        allowNull: true,
        comment: 'ABHA (Ayushman Bharat Health Account) ID — 14-digit or xx-xxxx-xxxx-xxxx format'
      });
    }
    if (!table.abha_address) {
      await queryInterface.addColumn('patients', 'abha_address', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ABHA address (alias@abdm)'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('patients');
    if (table.aadhaar_number) await queryInterface.removeColumn('patients', 'aadhaar_number');
    if (table.abha_id) await queryInterface.removeColumn('patients', 'abha_id');
    if (table.abha_address) await queryInterface.removeColumn('patients', 'abha_address');
  }
};
