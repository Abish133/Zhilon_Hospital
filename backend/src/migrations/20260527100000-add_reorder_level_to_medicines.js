'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('medicines');
    
    if (!tableInfo.reorder_level) {
      await queryInterface.addColumn('medicines', 'reorder_level', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        after: 'available_quantity'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicines', 'reorder_level');
  }
};
