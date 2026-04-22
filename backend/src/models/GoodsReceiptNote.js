'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoodsReceiptNote extends Model {
    static associate(models) {
      GoodsReceiptNote.belongsTo(models.PurchaseOrder, {
        foreignKey: 'po_id',
        as: 'purchaseOrder'
      });
      GoodsReceiptNote.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        as: 'vendor'
      });
      GoodsReceiptNote.belongsTo(models.User, {
        foreignKey: 'received_by',
        as: 'receiver'
      });
      GoodsReceiptNote.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      GoodsReceiptNote.hasMany(models.GrnDetail, {
        foreignKey: 'grn_id',
        as: 'details'
      });
      GoodsReceiptNote.hasMany(models.MedicineBatch, {
        foreignKey: 'grn_id',
        as: 'medicineBatches'
      });
    }
  }
  
  GoodsReceiptNote.init({
    grn_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    grn_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_orders',
        key: 'po_id'
      }
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'vendor_id'
      }
    },
    received_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    received_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'GoodsReceiptNote',
    tableName: 'goods_receipt_notes',
    timestamps: true
  });
  
  return GoodsReceiptNote;
};
