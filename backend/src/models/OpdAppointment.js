'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OpdAppointment extends Model {
    static associate(models) {
      OpdAppointment.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OpdAppointment.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      OpdAppointment.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      OpdAppointment.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  OpdAppointment.init({
    appointment_id: {
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
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    visit_type: {
      type: DataTypes.ENUM('New', 'Follow-up'),
      allowNull: false,
      defaultValue: 'New'
    },
    status: {
      type: DataTypes.ENUM('Booked', 'Checked-in', 'Consulted', 'Completed', 'Cancelled', 'No-show'),
      allowNull: false,
      defaultValue: 'Booked'
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
    modelName: 'OpdAppointment',
    tableName: 'opd_appointments',
    timestamps: true
  });
  
  return OpdAppointment;
};
