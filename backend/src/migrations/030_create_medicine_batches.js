'use strict';
 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicine_batches', {
      batch_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'medicines',
          key: 'medicine_id'
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
      batch_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      purchase_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      selling_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      mrp: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      received_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      available_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'vendor_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      received_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      po_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'purchase_orders',
          key: 'po_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('medicine_batches');
  }
};
 
 