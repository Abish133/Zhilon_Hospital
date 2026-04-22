'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Refund extends Model {
    static associate(models) {
      Refund.belongsTo(models.Bill, {
        foreignKey: 'bill_id',
        as: 'bill'
      });
      Refund.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      Refund.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Refund.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approvedBy'
      });
      Refund.belongsTo(models.User, {
        foreignKey: 'processed_by',
        as: 'processedBy'
      });
    }
  }

  Refund.init({
    refund_id: {
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
    refund_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refund_mode: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    processed_by: {
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
    modelName: 'Refund',
    tableName: 'refunds',
    timestamps: true
  });

  return Refund;
};
