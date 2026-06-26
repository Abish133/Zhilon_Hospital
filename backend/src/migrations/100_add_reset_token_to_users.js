'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.reset_token_hash) {
      await queryInterface.addColumn('users', 'reset_token_hash', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    if (!table.reset_token_expires) {
      await queryInterface.addColumn('users', 'reset_token_expires', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    if (table.reset_token_expires) {
      await queryInterface.removeColumn('users', 'reset_token_expires');
    }
    if (table.reset_token_hash) {
      await queryInterface.removeColumn('users', 'reset_token_hash');
    }
  }
};
