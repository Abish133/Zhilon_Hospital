'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentAdvance extends Model {
    static associate(models) {
      PaymentAdvance.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      PaymentAdvance.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      PaymentAdvance.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PaymentAdvance.belongsTo(models.User, {
        foreignKey: 'received_by',
        as: 'receivedBy'
      });
    }
  }

  PaymentAdvance.init({
    advance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ipd_admissions',
        key: 'admission_id'
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
    advance_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    utilized_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    balance_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_mode: {
      type: DataTypes.STRING(30),
      allowNull: false
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
    modelName: 'PaymentAdvance',
    tableName: 'payment_advances',
    timestamps: true
  });

  return PaymentAdvance;
};
