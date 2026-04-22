'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_roster', {
      roster_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id'
        }
      },
      shift_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'shifts',
          key: 'shift_id'
        }
      },
      roster_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Scheduled', 'Confirmed', 'Swap Requested', 'On Leave', 'Cancelled'),
        defaultValue: 'Scheduled',
        allowNull: false
      },
      swap_with_employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'employee_id'
        },
        comment: 'If swapped, reference to the employee swapped with'
      },
      leave_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'If on leave, type of leave'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hospitals',
          key: 'id'
        }
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('employee_roster', ['employee_id']);
    await queryInterface.addIndex('employee_roster', ['shift_id']);
    await queryInterface.addIndex('employee_roster', ['roster_date']);
    await queryInterface.addIndex('employee_roster', ['hospital_id']);
    
    // Unique constraint: one employee can have only one shift per day
    await queryInterface.addIndex('employee_roster', ['employee_id', 'roster_date'], {
      unique: true,
      name: 'unique_employee_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_roster');
  }
};

