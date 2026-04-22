'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabTest extends Model {
    static associate(models) {
      LabTest.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabTest.init({
    test_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    test_code: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true
    },
    test_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    test_category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sample_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sample_volume: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    container_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    normal_range: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    turn_around_time_hours: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    charge: {
      type: DataTypes.DECIMAL(10, 2),
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
    modelName: 'LabTest',
    tableName: 'lab_tests',
    timestamps: true
  });

  return LabTest;
};
