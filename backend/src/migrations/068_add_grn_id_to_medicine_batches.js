'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = require('sequelize');
    const table = await queryInterface.describeTable('medicine_batches');
    if (!table.grn_id) {
      await queryInterface.addColumn('medicine_batches', 'grn_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        after: 'po_id'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('medicine_batches');
    if (table.grn_id) {
      await queryInterface.removeColumn('medicine_batches', 'grn_id');
    }
  }
};
