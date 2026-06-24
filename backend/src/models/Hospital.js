'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Hospital extends Model {
    static associate(models) {
      // Hospital has many Departments
      Hospital.hasMany(models.Department, {
        foreignKey: 'hospital_id',
        as: 'departments'
      });
      // Hospital has many Users
      Hospital.hasMany(models.User, {
        foreignKey: 'hospital_id',
        as: 'users'
      });
      // Hospital has many Employees
      Hospital.hasMany(models.Employee, {
        foreignKey: 'hospital_id',
        as: 'employees'
      });
      // Hospital has many Doctors
      Hospital.hasMany(models.Doctor, {
        foreignKey: 'hospital_id',
        as: 'doctors'
      });
      // Hospital has many Patients
      Hospital.hasMany(models.Patient, {
        foreignKey: 'hospital_id',
        as: 'patients'
      });
    }
  }
  
  Hospital.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    hospitalName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    licenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    hospitalEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    hospitalType: {
      type: DataTypes.ENUM('general', 'specialty', 'clinic', 'emergency', 'pediatric', 'maternity'),
      allowNull: false,
      defaultValue: 'general'
    },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    header_html: { type: DataTypes.TEXT, allowNull: true },
    footer_html: { type: DataTypes.TEXT, allowNull: true },
    gst_number: { type: DataTypes.STRING(50), allowNull: true },
    pan_number: { type: DataTypes.STRING(20), allowNull: true },
    registration_number: { type: DataTypes.STRING(100), allowNull: true },
    website: { type: DataTypes.STRING(200), allowNull: true },
    // JSON with prefix overrides per entity, e.g. { uhid: 'UHID', bill: 'INV', grn: 'GRN' }
    numbering_prefixes: { type: DataTypes.JSON, allowNull: true },
    settings: { type: DataTypes.JSON, allowNull: true },
    // Pharmacy operating model — chosen once at registration, read-only thereafter.
    //  'in_house'      → medicines/OT consumables billed to the hospital bill.
    //  'self_purchase' → patient buys & pays at the pharmacy counter (not billed).
    pharmacy_mode: {
      type: DataTypes.ENUM('in_house', 'self_purchase'),
      allowNull: false,
      defaultValue: 'in_house'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Hospital',
    tableName: 'hospitals',
    timestamps: true
  });
  
  return Hospital;
};