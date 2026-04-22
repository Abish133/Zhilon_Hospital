'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // Employee belongs to Department
      Employee.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      // Employee has one User
      Employee.hasOne(models.User, {
        foreignKey: 'employee_id',
        as: 'user'
      });
      // Employee belongs to Hospital
      Employee.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  Employee.init({
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    emp_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('M', 'F', 'O'),
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_account_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ifsc_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    pan_number: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    uan_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    emergency_contact_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_contact_number: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    id_proof_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reporting_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    qualification: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true
  });
  
  return Employee;
};