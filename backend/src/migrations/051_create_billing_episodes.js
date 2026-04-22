'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('billing_episodes', {
      episode_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'patient_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      episode_type: {
        type: Sequelize.ENUM('OPD', 'IPD'),
        allowNull: false
      },
      opd_visit_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'opd_visits',
          key: 'visit_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      admission_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ipd_admissions',
          key: 'admission_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Open', 'Closed'),
        allowNull: false,
        defaultValue: 'Open'
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
    await queryInterface.dropTable('billing_episodes');
  }
};
