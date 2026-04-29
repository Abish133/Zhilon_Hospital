'use strict';

// Tracks each time a Package is applied to a billing episode. Holds the consultation
// "credits" the package grants so consultations during the episode can be drawn
// against the package without re-billing.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('package_applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'hospitals', key: 'id' }
      },
      episode_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'billing_episodes', key: 'episode_id' },
        onDelete: 'CASCADE'
      },
      package_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'packages', key: 'package_id' }
      },
      bill_charge_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'bill_charges', key: 'charge_id' },
        onDelete: 'CASCADE'
      },
      consult_credits_total: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      consult_credits_used:  { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      applied_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      applied_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      is_active:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addIndex('package_applications', ['episode_id'], { name: 'idx_pkgapp_episode' });
    await queryInterface.addIndex('package_applications', ['hospital_id', 'is_active'], { name: 'idx_pkgapp_hosp_active' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('package_applications');
  }
};
