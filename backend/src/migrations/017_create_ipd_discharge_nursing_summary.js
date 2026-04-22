'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ipd_discharge_nursing_summary', {
      discharge_nurse_id: {
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
      primary_nurse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      last_shift_nurse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      patient_condition_at_discharge: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      vitals_at_discharge: {
        type: Sequelize.JSON,
        allowNull: true
      },
      wound_status: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      catheter_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      iv_line_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      discharge_education_given: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      nurse_remarks: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('ipd_discharge_nursing_summary');
  }
};
