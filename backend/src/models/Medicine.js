'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class Medicine extends Model {
    static associate(models) {
      Medicine.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      if (models.MedicineCategory) {
        Medicine.belongsTo(models.MedicineCategory, {
          foreignKey: 'category_id',
          as: 'medicineCategory'
        });
      }
      Medicine.hasMany(models.MedicineBatch, {
        foreignKey: 'medicine_id',
        as: 'batches'
      });
      Medicine.hasMany(models.PharmacySaleDetail, {
        foreignKey: 'medicine_id',
        as: 'saleDetails'
      });
    }
  }
 
  Medicine.init({
    medicine_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    medicine_code: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true
    },
    medicine_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // India: brand (trade) name + generic (molecule / composition / salt) name.
    brand_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    generic_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    // category: {
    //   type: DataTypes.STRING(100),
    //   allowNull: true
    // },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'medicine_categories',
        key: 'category_id'
      }
    },
    strength: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dosage_form: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    hsn_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    schedule: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Medicine',
    tableName: 'medicines',
    timestamps: true
  });
 
  return Medicine;
};
 
 