'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MaintenanceHistory extends Model {
    static associate(models) {
      MaintenanceHistory.belongsTo(models.MaintenanceRequest, {
        foreignKey: 'request_id',
        as: 'maintenanceRequest'
      });
      MaintenanceHistory.belongsTo(models.Equipment, {
        foreignKey: 'equipment_id',
        as: 'equipment'
      });
      MaintenanceHistory.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  MaintenanceHistory.init({
    history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'maintenance_requests',
        key: 'request_id'
      }
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
        key: 'equipment_id'
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
    maintenance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    maintenance_type: {
      type: DataTypes.ENUM('Preventive', 'Breakdown', 'Calibration'),
      allowNull: false
    },
    work_done: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parts_replaced: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    serviced_by: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    next_service_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'MaintenanceHistory',
    tableName: 'maintenance_history',
    timestamps: true
  });

  return MaintenanceHistory;
};
