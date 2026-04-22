'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdDischargeSummary extends Model {
    static associate(models) {
      IpdDischargeSummary.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdDischargeSummary.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      IpdDischargeSummary.belongsTo(models.Doctor, {
        foreignKey: 'discharged_by',
        as: 'dischargingDoctor'
      });
      IpdDischargeSummary.belongsTo(models.User, {
        foreignKey: 'discharge_summary_by',
        as: 'summaryPreparedBy'
      });
      IpdDischargeSummary.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  IpdDischargeSummary.init({
    discharge_id: {
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
    discharge_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    discharge_type: {
      type: DataTypes.ENUM('Normal', 'DAMA', 'LAMA', 'Absconded', 'Expired', 'Transferred'),
      allowNull: false
    },
    final_diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    procedures_performed: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clinical_summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discharge_medications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    diet_advice: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activity_restrictions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discharged_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    discharge_summary_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'IpdDischargeSummary',
    tableName: 'ipd_discharge_summary',
    timestamps: true
  });
  
  return IpdDischargeSummary;
};
