'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdNurseAssignment extends Model {
    static associate(models) {
      IpdNurseAssignment.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdNurseAssignment.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      IpdNurseAssignment.belongsTo(models.Employee, {
        foreignKey: 'nurse_id',
        as: 'nurse'
      });
      IpdNurseAssignment.belongsTo(models.Ward, {
        foreignKey: 'ward_id',
        as: 'ward'
      });
      IpdNurseAssignment.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  IpdNurseAssignment.init({
    assignment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ipd_admissions',
        key: 'admission_id'
      }
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    nurse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'wards',
        key: 'ward_id'
      }
    },
    shift: {
      type: DataTypes.ENUM('Morning', 'Evening', 'Night'),
      allowNull: false
    },
    assigned_from: {
      type: DataTypes.DATE,
      allowNull: false
    },
    assigned_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_primary_nurse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed'),
      allowNull: false,
      defaultValue: 'Active'
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
    modelName: 'IpdNurseAssignment',
    tableName: 'ipd_nurse_assignments',
    timestamps: true
  });
  
  return IpdNurseAssignment;
};
