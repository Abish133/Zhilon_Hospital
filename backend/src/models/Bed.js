'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Bed extends Model {
    static associate(models) {
      Bed.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Bed.belongsTo(models.Ward, {
        foreignKey: 'ward_id',
        as: 'ward'
      });
    }
  }
  
  Bed.init({
    bed_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'wards',
        key: 'ward_id'
      }
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bed_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    bed_type: {
      type: DataTypes.ENUM('General', 'Oxygen', 'Ventilator'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Under Maintenance'),
      allowNull: false,
      defaultValue: 'Available'
    },
    charge_per_day: {
      type: DataTypes.DECIMAL(10, 2),
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Bed',
    tableName: 'beds',
    timestamps: true
  });
  
  return Bed;
};
