'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    static associate(models) {
      PurchaseOrder.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        as: 'vendor'
      });
      PurchaseOrder.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      PurchaseOrder.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
      });
      PurchaseOrder.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PurchaseOrder.hasMany(models.PurchaseOrderDetail, {
        foreignKey: 'po_id',
        as: 'details'
      });
      PurchaseOrder.hasMany(models.GoodsReceiptNote, {
        foreignKey: 'po_id',
        as: 'goodsReceiptNotes'
      });
      PurchaseOrder.hasMany(models.MedicineBatch, {
        foreignKey: 'po_id',
        as: 'medicineBatches'
      });
    }
  }
  
  PurchaseOrder.init({
    po_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    po_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'vendor_id'
      }
    },
    po_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expected_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    gst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    net_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Approved', 'Sent', 'Partially Received', 'Received', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Draft'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    modelName: 'PurchaseOrder',
    tableName: 'purchase_orders',
    timestamps: true
  });
  
  return PurchaseOrder;
};
