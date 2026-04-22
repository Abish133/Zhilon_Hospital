'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      equipment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      equipment_code: {
        type: Sequelize.STRING(30),
        allowNull: true,
        unique: true
      },
      serial_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      equipment_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      equipment_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manufacturer: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      model_number: {
        type: Sequelize.STRING(100),
        allowNull: true
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
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      purchase_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      warranty_start: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      warranty_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      amc_start: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      amc_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      amc_vendor: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Under Maintenance', 'Condemned', 'Disposed'),
        allowNull: true,
        defaultValue: 'Active'
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
    await queryInterface.dropTable('equipment');
  }
};
