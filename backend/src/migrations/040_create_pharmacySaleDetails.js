'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pharmacy_sale_details', {
      sale_detail_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pharmacy_sales',
          key: 'sale_id'
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
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'medicine_batches',
          key: 'batch_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      medicine_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      gst_percentage: {
        type: Sequelize.DECIMAL(4, 2),
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
    await queryInterface.dropTable('pharmacy_sale_details');
  }
};
