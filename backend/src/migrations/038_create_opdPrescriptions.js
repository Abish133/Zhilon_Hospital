'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('opd_prescriptions', {
      prescription_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      consultation_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'opd_consultations',
          key: 'consultation_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      visit_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'opd_visits',
          key: 'visit_id'
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
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'medicines',
          key: 'medicine_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      medicine_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      dosage: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      frequency: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      route: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      duration: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      prescribed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      prescribed_at: {
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
    await queryInterface.dropTable('opd_prescriptions');
  }
};
