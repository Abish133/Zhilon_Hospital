'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GrnDetail extends Model {
    static associate(models) {
      GrnDetail.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      GrnDetail.belongsTo(models.GoodsReceiptNote, {
        foreignKey: 'grn_id',
        as: 'grn'
      });
      GrnDetail.belongsTo(models.InventoryItem, {
        foreignKey: 'item_id',
        as: 'item'
      });
    }
  }
  
  GrnDetail.init({
    grn_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    ordered_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    received_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
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
    modelName: 'GrnDetail',
    tableName: 'grn_details',
    timestamps: true
  });
  
  return GrnDetail;
};
