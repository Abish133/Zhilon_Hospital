'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pharmacy_sales', {
      sale_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'patients',
          key: 'patient_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      visit_type: {
        type: Sequelize.ENUM('OPD', 'IPD', 'Walk-in'),
        allowNull: true
      },
      visit_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      prescription_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'opd_prescriptions',
          key: 'prescription_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sale_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      payment_mode: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      dispensed_by: {
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
    await queryInterface.dropTable('pharmacy_sales');
  }
};
