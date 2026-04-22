'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ipd_discharge_summary', {
      discharge_id: {
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
      discharge_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      discharge_type: {
        type: Sequelize.ENUM('Normal', 'DAMA', 'LAMA', 'Absconded', 'Expired', 'Transferred'),
        allowNull: false
      },
      final_diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      procedures_performed: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      clinical_summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      discharge_medications: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      follow_up_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      follow_up_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      diet_advice: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activity_restrictions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      discharged_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      discharge_summary_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
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
    await queryInterface.dropTable('ipd_discharge_summary');
  }
};
