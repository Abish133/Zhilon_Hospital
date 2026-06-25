'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VendorReturn extends Model {
    static associate(models) {
      VendorReturn.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        as: 'vendor'
      });
      VendorReturn.belongsTo(models.GoodsReceiptNote, {
        foreignKey: 'grn_id',
        as: 'goodsReceiptNote'
      });
      VendorReturn.belongsTo(models.InventoryItem, {
        foreignKey: 'item_id',
        as: 'item'
      });
      VendorReturn.belongsTo(models.User, {
        foreignKey: 'returned_by',
        as: 'returnedBy'
      });
      VendorReturn.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approvedByUser'
      });
      VendorReturn.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  VendorReturn.init({
    vendor_return_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    return_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'vendor_id'
      }
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'goods_receipt_notes',
        key: 'grn_id'
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
    reason: {
      type: DataTypes.ENUM('Damaged', 'Expired', 'Defective', 'Wrong Item', 'Quality Issue', 'Other'),
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Completed', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    returned_by: {
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
    modelName: 'VendorReturn',
    tableName: 'vendor_returns',
    timestamps: true
  });

  return VendorReturn;
};
