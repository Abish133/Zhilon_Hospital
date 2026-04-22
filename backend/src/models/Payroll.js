'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payroll extends Model {
    static associate(models) {
      Payroll.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      Payroll.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Payroll.belongsTo(models.User, {
        foreignKey: 'generated_by',
        as: 'generator'
      });
      Payroll.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
      });
      Payroll.belongsTo(models.User, {
        foreignKey: 'processed_by',
        as: 'processor'
      });
    }
  }

  Payroll.init({
    payroll_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    days_worked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    days_absent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0
    },
    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_allowances: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    gross_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    net_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Generated', 'Approved', 'Paid', 'Cancelled'),
      defaultValue: 'Generated',
      allowNull: false
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    transaction_reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Payroll',
    tableName: 'payroll',
    timestamps: true
  });

  return Payroll;
};

