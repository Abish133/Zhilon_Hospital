'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ipd_admissions', {
      admission_id: {
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
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      admitting_doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      ward_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'wards',
          key: 'ward_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      bed_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'beds',
          key: 'bed_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      room_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      bed_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      admission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      admission_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      provisional_diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      admission_type: {
        type: Sequelize.ENUM('Emergency', 'Planned', 'Transfer'),
        allowNull: false,
        defaultValue: 'Planned'
      },
      referred_by: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      advance_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('Admitted', 'Discharged', 'Transferred', 'Absconded', 'LAMA', 'Expired'),
        allowNull: false,
        defaultValue: 'Admitted'
      },
      admitted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('ipd_admissions');
  }
};
