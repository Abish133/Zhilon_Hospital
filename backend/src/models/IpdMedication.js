'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdMedication extends Model {
    static associate(models) {
      IpdMedication.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdMedication.belongsTo(models.User, {
        foreignKey: 'prescribed_by',
        as: 'prescribedBy'
      });
      IpdMedication.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
      });
      IpdMedication.belongsTo(models.User, {
        foreignKey: 'stopped_by',
        as: 'stoppedBy'
      });
    }
  }

  IpdMedication.init({
    medication_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ipd_admissions', key: 'admission_id' }
    },
    prescribed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    medicine_id: {
      type: DataTypes.INTEGER,
      references: { model: 'medicines', key: 'medicine_id' }
    },
    medicine_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    route: {
      type: DataTypes.ENUM('Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Rectal', 'Other'),
      defaultValue: 'Oral'
    },
    duration_days: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE
    },
    instructions: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed', 'Stopped', 'On-Hold'),
      defaultValue: 'Active'
    },
    stopped_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'id' }
    },
    stop_reason: {
      type: DataTypes.TEXT
    },
    stopped_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'IpdMedication',
    tableName: 'ipd_medications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return IpdMedication;
};
