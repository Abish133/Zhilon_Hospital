'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('employees');
    if (!table.doctor_id) {
      await queryInterface.addColumn('employees', 'doctor_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('employees');
    if (table.doctor_id) {
      await queryInterface.removeColumn('employees', 'doctor_id');
    }
  }
};
