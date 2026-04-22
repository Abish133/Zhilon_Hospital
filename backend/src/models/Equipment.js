'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Equipment extends Model {
    static associate(models) {
      Equipment.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      Equipment.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  Equipment.init({
    equipment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    equipment_code: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    equipment_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    equipment_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    purchase_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    warranty_start: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    warranty_end: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    amc_start: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    amc_end: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    amc_vendor: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Under Maintenance', 'Condemned', 'Disposed'),
      allowNull: true,
      defaultValue: 'Active'
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
    modelName: 'Equipment',
    tableName: 'equipment',
    timestamps: true
  });

  return Equipment;
};
