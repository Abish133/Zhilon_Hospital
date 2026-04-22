'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeRoster extends Model {
    static associate(models) {
      EmployeeRoster.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      EmployeeRoster.belongsTo(models.Shift, {
        foreignKey: 'shift_id',
        as: 'shift'
      });
      EmployeeRoster.belongsTo(models.Employee, {
        foreignKey: 'swap_with_employee_id',
        as: 'swapWithEmployee'
      });
      EmployeeRoster.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      EmployeeRoster.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  EmployeeRoster.init({
    roster_id: {
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
    shift_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shifts',
        key: 'shift_id'
      }
    },
    roster_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'Confirmed', 'Swap Requested', 'On Leave', 'Cancelled'),
      defaultValue: 'Scheduled',
      allowNull: false
    },
    swap_with_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    leave_type: {
      type: DataTypes.STRING(50),
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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'EmployeeRoster',
    tableName: 'employee_roster',
    timestamps: true
  });

  return EmployeeRoster;
};

