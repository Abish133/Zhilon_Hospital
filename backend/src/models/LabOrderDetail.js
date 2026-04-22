'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabOrderDetail extends Model {
    static associate(models) {
      LabOrderDetail.belongsTo(models.LabOrder, {
        foreignKey: 'order_id',
        as: 'order'
      });
      LabOrderDetail.belongsTo(models.LabTest, {
        foreignKey: 'test_id',
        as: 'test'
      });
      LabOrderDetail.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabOrderDetail.init({
    detail_id: {
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
    test_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lab_tests',
        key: 'test_id'
      }
    },
    test_code: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    test_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    sample_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Collected', 'In Progress', 'Completed'),
      allowNull: true,
      defaultValue: 'Pending'
    },
    charge: {
      type: DataTypes.DECIMAL(10, 2),
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
    modelName: 'LabOrderDetail',
    tableName: 'lab_order_details',
    timestamps: true
  });

  return LabOrderDetail;
};
