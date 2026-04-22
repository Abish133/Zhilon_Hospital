'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OtConsumablesUsed extends Model {
    static associate(models) {
      OtConsumablesUsed.belongsTo(models.OtBooking, {
        foreignKey: 'booking_id',
        as: 'otBooking'
      });
      OtConsumablesUsed.belongsTo(models.InventoryItem, {
        foreignKey: 'item_id',
        as: 'inventoryItem'
      });
      OtConsumablesUsed.belongsTo(models.User, {
        foreignKey: 'recorded_by',
        as: 'recordedBy'
      });
      OtConsumablesUsed.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  OtConsumablesUsed.init({
    usage_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ot_bookings',
        key: 'booking_id'
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
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    quantity_used: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    recorded_by: {
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
    modelName: 'OtConsumablesUsed',
    tableName: 'ot_consumables_used',
    timestamps: true
  });

  return OtConsumablesUsed;
};