'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('medicines');
    
    if (!tableInfo.available_quantity) {
      await queryInterface.addColumn('medicines', 'available_quantity', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        after: 'medicine_name'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicines', 'available_quantity');
  }
};
