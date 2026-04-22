'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class OtIntraOperative extends Model {
    static associate(models) {
      OtIntraOperative.belongsTo(models.OtBooking, {
        foreignKey: 'booking_id',
        as: 'otBooking'
      });
      OtIntraOperative.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OtIntraOperative.belongsTo(models.User, {
        foreignKey: 'recorded_by',
        as: 'recordedBy'
      });
      OtIntraOperative.belongsTo(models.Doctor, {
        foreignKey: 'surgeon_id',
        as: 'surgeon'
      });
      OtIntraOperative.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  OtIntraOperative.init({
    intra_op_id: {
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
    procedure_performed: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    surgery_start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    surgery_end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    anesthesia_start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    anesthesia_end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    anesthesia_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    anesthesia_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    intra_op_findings: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    procedure_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    blood_loss_ml: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fluids_given: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    urine_output_ml: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vital_signs: {
      type: DataTypes.JSON,
      allowNull: true
    },
    instruments_used: {
      type: DataTypes.JSON,
      allowNull: true
    },
    specimens_sent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    implants_used: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    drains_tubes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    closure_method: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    dressing_applied: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    surgeon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OtIntraOperative',
    tableName: 'ot_intra_operatives',
    timestamps: true
  });
 
  return OtIntraOperative;
};
 