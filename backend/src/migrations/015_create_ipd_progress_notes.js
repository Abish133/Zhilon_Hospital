'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ipd_progress_notes', {
      progress_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      admission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ipd_admissions',
          key: 'admission_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      progress_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      progress_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      note_type: {
        type: Sequelize.ENUM('Doctor', 'Nurse'),
        allowNull: false
      },
      doctor_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nursing_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vitals: {
        type: Sequelize.JSON,
        allowNull: true
      },
      intake_output: {
        type: Sequelize.JSON,
        allowNull: true
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
    await queryInterface.dropTable('ipd_progress_notes');
  }
};
