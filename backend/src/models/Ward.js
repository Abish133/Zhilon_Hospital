'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ward extends Model {
    static associate(models) {
      Ward.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Ward.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
    }
  }
  
  Ward.init({
    ward_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    ward_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ward_type: {
      type: DataTypes.ENUM('General', 'Semi-Private', 'Private', 'ICU', 'NICU', 'CCU'),
      allowNull: false
    },
    total_beds: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    available_beds: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
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
    modelName: 'Ward',
    tableName: 'wards',
    timestamps: true
  });
  
  return Ward;
};
