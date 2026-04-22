'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lab_results', {
      result_id: {
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
      detail_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lab_order_details',
          key: 'detail_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      result_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      interpretation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      critical_value: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      entered_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      entered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Verified', 'Reported'),
        allowNull: true,
        defaultValue: 'Draft'
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
    await queryInterface.dropTable('lab_results');
  }
};
