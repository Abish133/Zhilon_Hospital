'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorQualification extends Model {
    static associate(models) {
      DoctorQualification.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
      DoctorQualification.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  DoctorQualification.init({
    qualification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'doctors', key: 'id' }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' }
    },
    degree: { type: DataTypes.STRING(100), allowNull: false },
    institution: { type: DataTypes.STRING(200), allowNull: true },
    year_obtained: { type: DataTypes.INTEGER, allowNull: true },
    registration_number: { type: DataTypes.STRING(100), allowNull: true },
    registration_council: { type: DataTypes.STRING(100), allowNull: true },
    valid_till: { type: DataTypes.DATEONLY, allowNull: true },
    document_path: { type: DataTypes.STRING(500), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'DoctorQualification',
    tableName: 'doctor_qualifications',
    timestamps: true
  });

  return DoctorQualification;
};
