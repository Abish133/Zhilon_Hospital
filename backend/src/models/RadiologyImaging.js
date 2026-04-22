'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RadiologyImaging extends Model {
    static associate(models) {
      RadiologyImaging.belongsTo(models.RadiologyOrders, {
        foreignKey: 'rad_order_id',
        as: 'radiologyOrder'
      });
      RadiologyImaging.belongsTo(models.Employee, {
        foreignKey: 'technologist_id',
        as: 'technologist'
      });
      RadiologyImaging.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  RadiologyImaging.init({
    imaging_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    rad_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'radiology_orders',
        key: 'rad_order_id'
      }
    },
    imaging_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    technologist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'employee_id'
      }
    },
    images_path: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    technical_notes: {
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
    modelName: 'RadiologyImaging',
    tableName: 'radiology_imaging',
    timestamps: true
  });

  return RadiologyImaging;
};