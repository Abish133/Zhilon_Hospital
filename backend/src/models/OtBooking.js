'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class OtBooking extends Model {
    static associate(models) {
      OtBooking.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OtBooking.belongsTo(models.Doctor, {
        foreignKey: 'surgeon_id',
        as: 'surgeon'
      });
      OtBooking.belongsTo(models.Doctor, {
        foreignKey: 'assistant_surgeon_id',
        as: 'assistantSurgeon'
      });
      OtBooking.belongsTo(models.Doctor, {
        foreignKey: 'anesthetist_id',
        as: 'anesthetist'
      });
      OtBooking.belongsTo(models.OtRoom, {
        foreignKey: 'ot_room_id',
        as: 'otRoom'
      });
      OtBooking.belongsTo(models.User, {
        foreignKey: 'booked_by',
        as: 'bookedByUser'
      });
      OtBooking.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  OtBooking.init({
    booking_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    surgery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    surgery_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    surgery_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    surgery_type: {
      type: DataTypes.ENUM('Elective', 'Emergency'),
      allowNull: true
    },
    surgeon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    assistant_surgeon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    anesthetist_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    ot_room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ot_rooms',
        key: 'room_id'
      }
    },
    estimated_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actual_start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'),
      allowNull: true
    },
    booked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OtBooking',
    tableName: 'ot_bookings',
    timestamps: true
  });
 
  return OtBooking;
};
 