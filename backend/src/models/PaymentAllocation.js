'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentAllocation extends Model {
    static associate(models) {
      PaymentAllocation.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        as: 'payment'
      });
      PaymentAllocation.belongsTo(models.BillCharge, {
        foreignKey: 'charge_id',
        as: 'charge'
      });
      PaymentAllocation.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  PaymentAllocation.init({
    allocation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'payments',
        key: 'payment_id'
      }
    },
    charge_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bill_charges',
        key: 'charge_id'
      }
    },
    amount_allocated: {
      type: DataTypes.DECIMAL(12, 2),
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
    modelName: 'PaymentAllocation',
    tableName: 'payment_allocations',
    timestamps: true
  });

  return PaymentAllocation;
};
