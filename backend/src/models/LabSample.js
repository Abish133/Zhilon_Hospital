'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabSample extends Model {
    static associate(models) {
      LabSample.belongsTo(models.LabOrder, {
        foreignKey: 'order_id',
        as: 'order'
      });
      LabSample.belongsTo(models.User, {
        foreignKey: 'collected_by',
        as: 'collectedBy'
      });
      LabSample.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabSample.init({
    sample_id: {
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
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    sample_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    collected_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    collection_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    received_in_lab_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    condition_on_receipt: {
      type: DataTypes.STRING(100),
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
    modelName: 'LabSample',
    tableName: 'lab_samples',
    timestamps: true
  });

  return LabSample;
};
