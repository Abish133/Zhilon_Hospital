'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OpdVisit extends Model {
    static associate(models) {
      OpdVisit.belongsTo(models.OpdAppointment, {
        foreignKey: 'appointment_id',
        as: 'appointment'
      });
      OpdVisit.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OpdVisit.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      OpdVisit.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      OpdVisit.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  OpdVisit.init({
    visit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'opd_appointments',
        key: 'appointment_id'
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
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    token_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    visit_type: {
      type: DataTypes.ENUM('New', 'Follow-up', 'Walk-in'),
      allowNull: false,
      defaultValue: 'Walk-in'
    },
    status: {
      type: DataTypes.ENUM('Checked-in', 'In-consultation', 'Completed'),
      allowNull: false,
      defaultValue: 'Checked-in'
    },
    checked_in_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consultation_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consultation_end: {
      type: DataTypes.DATE,
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OpdVisit',
    tableName: 'opd_visits',
    timestamps: true
  });
  
  return OpdVisit;
};
