'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacySaleDetail extends Model {
    static associate(models) {
      PharmacySaleDetail.belongsTo(models.PharmacySale, {
        foreignKey: 'sale_id',
        as: 'sale'
      });
      PharmacySaleDetail.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
      });
      PharmacySaleDetail.belongsTo(models.MedicineBatch, {
        foreignKey: 'batch_id',
        as: 'batch'
      });
      PharmacySaleDetail.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  PharmacySaleDetail.init({
    sale_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pharmacy_sales',
        key: 'sale_id'
      }
    },
    medicine_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'medicines',
        key: 'medicine_id'
      }
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'medicine_batches',
        key: 'batch_id'
      }
    },
    medicine_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(4, 2),
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
    modelName: 'PharmacySaleDetail',
    tableName: 'pharmacy_sale_details',
    timestamps: true
  });

  return PharmacySaleDetail;
};
