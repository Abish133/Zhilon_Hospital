'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsuranceClaim extends Model {
    static associate(models) {
      InsuranceClaim.belongsTo(models.Bill, {
        foreignKey: 'bill_id',
        as: 'bill'
      });
      InsuranceClaim.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      InsuranceClaim.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
  InsuranceClaim.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    insurance_provider: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    policy_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    member_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    claim_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    deductible: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    copay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    approved_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'approved', 'paid', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    claim_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    submission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approval_remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    rejected_by: {
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'InsuranceClaim',
    tableName: 'insurance_claims',
    timestamps: true,
    underscored: true
  });
  return InsuranceClaim;
};
