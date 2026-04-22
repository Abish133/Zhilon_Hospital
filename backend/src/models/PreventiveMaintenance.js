'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PreventiveMaintenance extends Model {
    static associate(models) {
      PreventiveMaintenance.belongsTo(models.Equipment, {
        foreignKey: 'equipment_id',
        as: 'equipment'
      });
      PreventiveMaintenance.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  PreventiveMaintenance.init({
    pm_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
        key: 'equipment_id'
      }
    },
    pm_schedule: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_pm_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    next_pm_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    pm_checklist: {
      type: DataTypes.TEXT,
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
    }
  }, {
    sequelize,
    modelName: 'PreventiveMaintenance',
    tableName: 'preventive_maintenance',
    timestamps: true
  });

  return PreventiveMaintenance;
};
