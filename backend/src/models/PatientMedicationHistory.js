'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientMedicationHistory extends Model {
    static associate(models) {
      PatientMedicationHistory.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      PatientMedicationHistory.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PatientMedicationHistory.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
      });
      PatientMedicationHistory.belongsTo(models.Doctor, {
        foreignKey: 'prescribed_by',
        as: 'prescribedBy'
      });
    }
  }

  PatientMedicationHistory.init({
    med_history_id: {
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
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    visit_type: {
      type: DataTypes.ENUM('OPD', 'IPD', 'OT'),
      allowNull: false
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    medicine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medicines',
        key: 'medicine_id'
      }
    },
    medicine_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    dosage: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    route: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed', 'Stopped'),
      allowNull: false,
      defaultValue: 'Active'
    },
    prescribed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    prescribed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'PatientMedicationHistory',
    tableName: 'patient_medication_histories',
    timestamps: true
  });

  return PatientMedicationHistory;
};
