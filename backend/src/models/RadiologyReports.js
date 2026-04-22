'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RadiologyReports extends Model {
    static associate(models) {
      RadiologyReports.belongsTo(models.RadiologyOrders, {
        foreignKey: 'rad_order_id',
        as: 'radiologyOrder'
      });
      RadiologyReports.belongsTo(models.Doctor, {
        foreignKey: 'reported_by',
        as: 'reportedBy'
      });
      RadiologyReports.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  RadiologyReports.init({
    rad_report_id: {
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
    findings: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    impression: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    reported_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    report_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Approved'),
      allowNull: false,
      defaultValue: 'Draft'
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
    modelName: 'RadiologyReports',
    tableName: 'radiology_reports',
    timestamps: true
  });

  return RadiologyReports;
};