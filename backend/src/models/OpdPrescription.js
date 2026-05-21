'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OpdPrescription extends Model {
    static associate(models) {
      OpdPrescription.belongsTo(models.OpdConsultation, {
        foreignKey: 'consultation_id',
        as: 'consultation'
      });
      OpdPrescription.belongsTo(models.OpdVisit, {
        foreignKey: 'visit_id',
        as: 'visit'
      });
      OpdPrescription.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OpdPrescription.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
      });
      OpdPrescription.belongsTo(models.Doctor, {
        foreignKey: 'prescribed_by',
        as: 'prescribedBy'
      });
      OpdPrescription.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  OpdPrescription.init({
    prescription_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    consultation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'opd_consultations',
        key: 'consultation_id'
      }
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    medicine_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'medicines',
        key: 'medicine_id'
      }
    },
    medicine_name: {
      type: DataTypes.STRING(200),
      allowNull: true
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prescribed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    prescribed_at: {
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
    },
    dispense_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pending'
    }
  }, {
    sequelize,
    modelName: 'OpdPrescription',
    tableName: 'opd_prescriptions',
    timestamps: true
  });

  return OpdPrescription;
};
