'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Vendor extends Model {
    static associate(models) {
      Vendor.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Vendor.hasMany(models.PurchaseOrder, {
        foreignKey: 'vendor_id',
        as: 'purchaseOrders'
      });
      Vendor.hasMany(models.GoodsReceiptNote, {
        foreignKey: 'vendor_id',
        as: 'goodsReceiptNotes'
      });
      Vendor.hasMany(models.MedicineBatch, {
        foreignKey: 'vendor_id',
        as: 'medicineBatches'
      });
      Vendor.hasMany(models.VendorReturn, {
        foreignKey: 'vendor_id',
        as: 'vendorReturns'
      });
    }
  }
  
  Vendor.init({
    vendor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    vendor_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    vendor_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    payment_terms: {
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
    modelName: 'Vendor',
    tableName: 'vendors',
    timestamps: true
  });
  
  return Vendor;
};
