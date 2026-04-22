'use strict';
 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ot_pre_operatives', {
      pre_op_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ot_bookings',
          key: 'booking_id'
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
      consent_taken: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      consent_signed_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      npo_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pre_anesthetic_checkup: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      pre_op_vitals: {
        type: Sequelize.JSON,
        allowNull: true
      },
      allergies_checked: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      site_marking_done: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      pre_op_medications: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lab_reports_available: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      blood_arranged: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pre_op_checklist_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      completed_at: {
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
    await queryInterface.dropTable('ot_pre_operatives');
  }
};
 