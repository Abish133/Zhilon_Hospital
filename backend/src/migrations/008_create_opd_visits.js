'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('opd_visits', {
      visit_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      appointment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'opd_appointments',
          key: 'appointment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      visit_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      token_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      visit_type: {
        type: Sequelize.ENUM('New', 'Follow-up', 'Walk-in'),
        allowNull: false,
        defaultValue: 'Walk-in'
      },
      status: {
        type: Sequelize.ENUM('Checked-in', 'In-consultation', 'Completed'),
        allowNull: false,
        defaultValue: 'Checked-in'
      },
      checked_in_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      consultation_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      consultation_end: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('opd_visits');
  }
};
