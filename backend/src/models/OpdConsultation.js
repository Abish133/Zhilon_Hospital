'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OpdConsultation extends Model {
    static associate(models) {
      OpdConsultation.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      OpdConsultation.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      OpdConsultation.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OpdConsultation.belongsTo(models.OpdVisit, {
        foreignKey: 'visit_id',
        as: 'visit'
      });
    }
  }
  
  OpdConsultation.init({
    consultation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'opd_visits',
        key: 'visit_id'
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
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    chief_complaints: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    examination_findings: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diagnosis_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    diagnosis_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    treatment_plan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    consultation_date: {
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
    modelName: 'OpdConsultation',
    tableName: 'opd_consultations',
    timestamps: true
  });
  
  return OpdConsultation;
};
