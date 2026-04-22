'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabOrder extends Model {
    static associate(models) {
      LabOrder.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      LabOrder.belongsTo(models.Doctor, {
        foreignKey: 'ordered_by',
        as: 'orderedBy'
      });
      LabOrder.hasMany(models.LabOrderDetail, {
        foreignKey: 'order_id',
        as: 'details'
      });
      LabOrder.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabOrder.init({
    order_id: {
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
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    visit_type: {
      type: DataTypes.ENUM('OPD', 'IPD'),
      allowNull: true
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ordered_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled'),
      allowNull: true,
      defaultValue: 'Ordered'
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
    modelName: 'LabOrder',
    tableName: 'lab_orders',
    timestamps: true
  });

  return LabOrder;
};
