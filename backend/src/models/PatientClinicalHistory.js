'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientClinicalHistory extends Model {
    static associate(models) {
      PatientClinicalHistory.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      PatientClinicalHistory.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PatientClinicalHistory.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      PatientClinicalHistory.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
    }
  }

  PatientClinicalHistory.init({
    clinical_history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
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
    visit_type: {
      type: DataTypes.ENUM('OPD', 'IPD'),
      allowNull: false
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    chief_complaints: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'PatientClinicalHistory',
    tableName: 'patient_clinical_histories',
    timestamps: true
  });

  return PatientClinicalHistory;
};
