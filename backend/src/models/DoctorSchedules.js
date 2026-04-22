'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorSchedules extends Model {
    static associate(models) {
      DoctorSchedules.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      DoctorSchedules.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  DoctorSchedules.init({
    schedule_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    day_of_week: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    slot_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15
    },
    max_appointments: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    modelName: 'DoctorSchedules',
    tableName: 'doctor_schedules',
    timestamps: true
  });

  return DoctorSchedules;
};