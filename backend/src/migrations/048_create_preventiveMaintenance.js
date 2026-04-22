'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('preventive_maintenance', {
      pm_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'equipment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pm_schedule: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      last_pm_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      next_pm_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      pm_checklist: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hospitals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('preventive_maintenance');
  }
};
