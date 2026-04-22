'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdProgressNote extends Model {
    static associate(models) {
      IpdProgressNote.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdProgressNote.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      IpdProgressNote.belongsTo(models.User, {
        foreignKey: 'recorded_by',
        as: 'recordedBy'
      });
      IpdProgressNote.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  IpdProgressNote.init({
    progress_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ipd_admissions',
        key: 'admission_id'
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
    progress_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    progress_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    note_type: {
      type: DataTypes.ENUM('Doctor', 'Nurse'),
      allowNull: false
    },
    doctor_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nursing_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vitals: {
      type: DataTypes.JSON,
      allowNull: true
    },
    intake_output: {
      type: DataTypes.JSON,
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    modelName: 'IpdProgressNote',
    tableName: 'ipd_progress_notes',
    timestamps: true
  });
  
  return IpdProgressNote;
};
