'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdVital extends Model {
    static associate(models) {
      IpdVital.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdVital.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      IpdVital.belongsTo(models.User, {
        foreignKey: 'recorded_by',
        as: 'recordedBy'
      });
    }
  }

  IpdVital.init({
    vital_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recorded_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    recorded_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    systolic_bp: DataTypes.INTEGER,
    diastolic_bp: DataTypes.INTEGER,
    pulse_rate: DataTypes.INTEGER,
    temperature: DataTypes.DECIMAL(4, 1),
    respiratory_rate: DataTypes.INTEGER,
    spo2: DataTypes.INTEGER,
    blood_sugar: DataTypes.DECIMAL(5, 1),
    consciousness_level: DataTypes.STRING(50),
    pain_scale: DataTypes.INTEGER,
    intake_ml: DataTypes.INTEGER,
    output_ml: DataTypes.INTEGER,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'IpdVital',
    tableName: 'ipd_vitals',
    timestamps: false
  });

  return IpdVital;
};
