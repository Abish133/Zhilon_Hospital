'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lab_order_details', {
      detail_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lab_orders',
          key: 'order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      test_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lab_tests',
          key: 'test_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      test_code: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      test_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      sample_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Collected', 'In Progress', 'Completed'),
        allowNull: true,
        defaultValue: 'Pending'
      },
      charge: {
        type: Sequelize.DECIMAL(10, 2),
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
    await queryInterface.dropTable('lab_order_details');
  }
};
