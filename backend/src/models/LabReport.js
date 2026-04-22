'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabReport extends Model {
    static associate(models) {
      LabReport.belongsTo(models.LabOrder, {
        foreignKey: 'order_id',
        as: 'order'
      });
      LabReport.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approvedBy'
      });
      LabReport.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabReport.init({
    report_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lab_orders',
        key: 'order_id'
      }
    },
    report_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'LabReport',
    tableName: 'lab_reports',
    timestamps: true
  });

  return LabReport;
};
