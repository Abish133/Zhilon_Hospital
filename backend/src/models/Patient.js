'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    static associate(models) {
      Patient.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  Patient.init({
    patient_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
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
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    marital_status: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mobile_number: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    alternate_mobile: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    address_line1: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    address_line2: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING(10),
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
    insurance_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    insurance_provider: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    policy_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    aadhaar_number: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    abha_id: {
      type: DataTypes.STRING(17),
      allowNull: true
    },
    abha_address: {
      type: DataTypes.STRING(100),
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    timestamps: true
  });
 
  return Patient;
};
 