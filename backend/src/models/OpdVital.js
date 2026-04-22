'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OpdVital extends Model {
    static associate(models) {
      OpdVital.belongsTo(models.OpdVisit, {
        foreignKey: 'visit_id',
        as: 'visit'
      });
      OpdVital.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  OpdVital.init({
    vitals_id: {
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
    blood_pressure: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bp_systolic: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bp_diastolic: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    pulse_rate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true
    },
    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    spo2: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    bmi: {
      type: DataTypes.DECIMAL(4, 2),
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
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OpdVital',
    tableName: 'opd_vitals',
    timestamps: true,
    hooks: {
      beforeSave: (vital) => {
        if (vital.weight && vital.height) {
          const heightInMeters = vital.height / 100;
          vital.bmi = (vital.weight / (heightInMeters * heightInMeters)).toFixed(2);
        }
      }
    }
  });
  
  return OpdVital;
};
