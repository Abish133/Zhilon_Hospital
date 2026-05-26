'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add new columns to bill_charges
    await queryInterface.addColumn('bill_charges', 'payment_status', {
      type: Sequelize.ENUM('Unpaid', 'Partial', 'Paid'),
      allowNull: false,
      defaultValue: 'Unpaid'
    });
    
    await queryInterface.addColumn('bill_charges', 'paid_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('bill_charges', 'balance_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // 2. Initialize balance_amount to net_amount for existing unpaid charges
    await queryInterface.sequelize.query(`
      UPDATE bill_charges 
      SET balance_amount = net_amount 
      WHERE payment_status = 'Unpaid' AND balance_amount = 0
    `);

    // 3. Create payment_allocations table
    await queryInterface.createTable('payment_allocations', {
      allocation_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      payment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'payment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      charge_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bill_charges',
          key: 'charge_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount_allocated: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop table first
    await queryInterface.dropTable('payment_allocations');

    // Remove columns
    await queryInterface.removeColumn('bill_charges', 'payment_status');
    await queryInterface.removeColumn('bill_charges', 'paid_amount');
    await queryInterface.removeColumn('bill_charges', 'balance_amount');
  }
};
