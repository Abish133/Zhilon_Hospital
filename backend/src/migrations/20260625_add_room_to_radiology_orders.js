'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('radiology_orders', 'room', {
      type: Sequelize.STRING(40),
      allowNull: true,
      after: 'scheduled_time'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('radiology_orders', 'room');
  }
};
