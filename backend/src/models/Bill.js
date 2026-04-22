'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Bill extends Model {
    static associate(models) {
      Bill.belongsTo(models.BillingEpisode, {
        foreignKey: 'episode_id',
        as: 'billingEpisode'
      });
      Bill.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      Bill.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Bill.belongsTo(models.User, {
        foreignKey: 'generated_by',
        as: 'generatedBy'
      });
    }
  }

  Bill.init({
    bill_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    bill_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    episode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'billing_episodes',
        key: 'episode_id'
      }
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
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
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    bill_type: {
      type: DataTypes.ENUM('OPD', 'IPD', 'Emergency', 'Pharmacy'),
      allowNull: false
    },
    bill_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    gross_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    net_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    advance_adjusted: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    balance_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('Unpaid', 'Partial', 'Paid', 'Refunded'),
      allowNull: false,
      defaultValue: 'Unpaid'
    },
    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    modelName: 'Bill',
    tableName: 'bills',
    timestamps: true
  });

  return Bill;
};
