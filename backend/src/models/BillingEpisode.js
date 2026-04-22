'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BillingEpisode extends Model {
    static associate(models) {
      BillingEpisode.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      BillingEpisode.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      BillingEpisode.belongsTo(models.OpdVisit, {
        foreignKey: 'opd_visit_id',
        as: 'opdVisit'
      });
      BillingEpisode.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'ipdAdmission'
      });
    }
  }

  BillingEpisode.init({
    episode_id: {
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
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    episode_type: {
      type: DataTypes.ENUM('OPD', 'IPD'),
      allowNull: false
    },
    opd_visit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'opd_visits',
        key: 'visit_id'
      }
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ipd_admissions',
        key: 'admission_id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Open', 'Closed'),
      allowNull: false,
      defaultValue: 'Open'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'BillingEpisode',
    tableName: 'billing_episodes',
    timestamps: true
  });

  return BillingEpisode;
};
