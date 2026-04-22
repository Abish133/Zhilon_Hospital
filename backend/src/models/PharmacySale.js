'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacySale extends Model {
    static associate(models) {
      PharmacySale.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      PharmacySale.belongsTo(models.OpdPrescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
      });
      PharmacySale.belongsTo(models.User, {
        foreignKey: 'dispensed_by',
        as: 'dispensedBy'
      });
      PharmacySale.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      PharmacySale.hasMany(models.PharmacySaleDetail, {
        foreignKey: 'sale_id',
        as: 'details'
      });
    }
  }

  PharmacySale.init({
    sale_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    visit_type: {
      type: DataTypes.ENUM('OPD', 'IPD', 'Walk-in'),
      allowNull: true
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    prescription_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'opd_prescriptions',
        key: 'prescription_id'
      }
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    payment_mode: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    dispensed_by: {
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
    modelName: 'PharmacySale',
    tableName: 'pharmacy_sales',
    timestamps: true
  });

  return PharmacySale;
};
