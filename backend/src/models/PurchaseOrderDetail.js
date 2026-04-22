'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseOrderDetail extends Model {
    static associate(models) {
      PurchaseOrderDetail.belongsTo(models.PurchaseOrder, {
        foreignKey: 'po_id',
        as: 'purchaseOrder'
      });
      PurchaseOrderDetail.belongsTo(models.InventoryItem, {
        foreignKey: 'item_id',
        as: 'item'
      });
      PurchaseOrderDetail.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  
  PurchaseOrderDetail.init({
    po_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_orders',
        key: 'po_id'
      }
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inventory_items',
        key: 'item_id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
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
    modelName: 'PurchaseOrderDetail',
    tableName: 'purchase_order_details',
    timestamps: true,
    hooks: {
      beforeSave: (detail) => {
        detail.amount = (detail.quantity * detail.rate).toFixed(2);
      }
    }
  });
  
  return PurchaseOrderDetail;
};
