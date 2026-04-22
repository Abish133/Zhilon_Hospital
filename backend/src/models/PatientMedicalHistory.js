'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class PatientMedicalHistory extends Model {
    static associate(models) {
      PatientMedicalHistory.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      PatientMedicalHistory.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PatientMedicalHistory.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updatedByUser'
      });
    }
  }
 
  PatientMedicalHistory.init({
    history_id: {
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
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    chronic_diseases: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    past_surgeries: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    family_history: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    social_history: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    immunization_history: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    blood_transfusion_history: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'PatientMedicalHistory',
    tableName: 'patient_medical_histories',
    timestamps: true
  });
 
  return PatientMedicalHistory;
};
 