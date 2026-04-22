'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payroll', {
      payroll_id: {
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
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12
        }
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      days_worked: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      days_absent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      overtime_hours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0
      },
      basic_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total_allowances: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total_deductions: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      gross_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      net_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('Generated', 'Approved', 'Paid', 'Cancelled'),
        defaultValue: 'Generated',
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      payment_mode: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Bank Transfer, Cash, Cheque, etc.'
      },
      transaction_reference: {
        type: Sequelize.STRING(100),
        allowNull: true
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
      generated_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      processed_by: {
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

    await queryInterface.addIndex('payroll', ['employee_id']);
    await queryInterface.addIndex('payroll', ['month', 'year']);
    await queryInterface.addIndex('payroll', ['status']);
    await queryInterface.addIndex('payroll', ['hospital_id']);
    await queryInterface.addIndex('payroll', ['employee_id', 'month', 'year'], {
      unique: true,
      name: 'unique_employee_month_year'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payroll');
  }
};

