'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdDischargeNursingSummary extends Model {
    static associate(models) {
      IpdDischargeNursingSummary.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdDischargeNursingSummary.belongsTo(models.Employee, {
        foreignKey: 'primary_nurse_id',
        as: 'primaryNurse'
      });
      IpdDischargeNursingSummary.belongsTo(models.Employee, {
        foreignKey: 'last_shift_nurse_id',
        as: 'lastShiftNurse'
      });
      IpdDischargeNursingSummary.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  IpdDischargeNursingSummary.init({
    discharge_nurse_id: {
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
    primary_nurse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    last_shift_nurse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    patient_condition_at_discharge: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vitals_at_discharge: {
      type: DataTypes.JSON,
      allowNull: true
    },
    wound_status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    catheter_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    iv_line_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    discharge_education_given: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    nurse_remarks: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'IpdDischargeNursingSummary',
    tableName: 'ipd_discharge_nursing_summary',
    timestamps: true
  });
  
  return IpdDischargeNursingSummary;
};
