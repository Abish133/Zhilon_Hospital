'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventoryItem extends Model {
    static associate(models) {
      InventoryItem.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      InventoryItem.belongsTo(models.InventoryCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });
      InventoryItem.hasMany(models.PurchaseOrderDetail, {
        foreignKey: 'item_id',
        as: 'purchaseOrderDetails'
      });
      InventoryItem.hasMany(models.GrnDetail, {
        foreignKey: 'item_id',
        as: 'grnDetails'
      });
      InventoryItem.hasMany(models.StockIssue, {
        foreignKey: 'item_id',
        as: 'stockIssues'
      });
      InventoryItem.hasMany(models.StockReturn, {
        foreignKey: 'item_id',
        as: 'stockReturns'
      });
    }
  }
  
  InventoryItem.init({
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    item_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventory_categories',
        key: 'category_id'
      }
    },
    unit_of_measure: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rate_per_unit: {
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
    modelName: 'InventoryItem',
    tableName: 'inventory_items',
    timestamps: true
  });
  
  return InventoryItem;
};
