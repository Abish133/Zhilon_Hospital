'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Bill, {
        foreignKey: 'bill_id',
        as: 'bill'
      });
      Payment.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Payment.belongsTo(models.User, {
        foreignKey: 'received_by',
        as: 'receivedBy'
      });
      Payment.hasMany(models.PaymentAllocation, {
        foreignKey: 'payment_id',
        as: 'allocations'
      });
    }
  }

  Payment.init({
    payment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    bill_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bills',
        key: 'bill_id'
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
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    payment_type: {
      type: DataTypes.ENUM('Bill Payment', 'Advance', 'Deposit'),
      allowNull: false
    },
    payment_mode: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    amount_paid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(100),
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
    receipt_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};
