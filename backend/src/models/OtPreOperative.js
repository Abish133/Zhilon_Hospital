'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class OtPreOperative extends Model {
    static associate(models) {
      OtPreOperative.belongsTo(models.OtBooking, {
        foreignKey: 'booking_id',
        as: 'otBooking'
      });
      OtPreOperative.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OtPreOperative.belongsTo(models.User, {
        foreignKey: 'pre_op_checklist_by',
        as: 'checklistBy'
      });
      OtPreOperative.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  OtPreOperative.init({
    pre_op_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ot_bookings',
        key: 'booking_id'
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
    consent_taken: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    consent_signed_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    npo_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pre_anesthetic_checkup: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    pre_op_vitals: {
      type: DataTypes.JSON,
      allowNull: true
    },
    allergies_checked: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    site_marking_done: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    pre_op_medications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lab_reports_available: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    blood_arranged: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pre_op_checklist_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    completed_at: {
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
    modelName: 'OtPreOperative',
    tableName: 'ot_pre_operatives',
    timestamps: true
  });
 
  return OtPreOperative;
};
 