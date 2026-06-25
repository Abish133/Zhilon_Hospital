'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_returns', {
      vendor_return_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      return_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'vendor_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      grn_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'goods_receipt_notes',
          key: 'grn_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory_items',
          key: 'item_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reason: {
        type: Sequelize.ENUM('Damaged', 'Expired', 'Defective', 'Wrong Item', 'Quality Issue', 'Other'),
        allowNull: false
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Completed', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      returned_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      approved_by: {
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
        onDelete: 'RESTRICT'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexes for common queries
    await queryInterface.addIndex('vendor_returns', ['vendor_id']);
    await queryInterface.addIndex('vendor_returns', ['hospital_id']);
    await queryInterface.addIndex('vendor_returns', ['item_id']);
    await queryInterface.addIndex('vendor_returns', ['status']);
    await queryInterface.addIndex('vendor_returns', ['return_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vendor_returns');
  }
};
