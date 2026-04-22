'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('doctors');
    if (!table.department_id) {
      await queryInterface.addColumn('doctors', 'department_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('doctors');
    if (table.department_id) {
      await queryInterface.removeColumn('doctors', 'department_id');
    }
  }
};
