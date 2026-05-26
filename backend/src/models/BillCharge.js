'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BillCharge extends Model {
    static associate(models) {
      BillCharge.belongsTo(models.BillingEpisode, {
        foreignKey: 'episode_id',
        as: 'billingEpisode'
      });
      BillCharge.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      BillCharge.hasMany(models.PaymentAllocation, {
        foreignKey: 'charge_id',
        as: 'allocations'
      });
    }
  }

  BillCharge.init({
    charge_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    episode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'billing_episodes',
        key: 'episode_id'
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
    charge_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    service_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    gst_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    gst_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('Unpaid', 'Partial', 'Paid'),
      allowNull: false,
      defaultValue: 'Unpaid'
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    balance_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'BillCharge',
    tableName: 'bill_charges',
    timestamps: true
  });

  return BillCharge;
};
