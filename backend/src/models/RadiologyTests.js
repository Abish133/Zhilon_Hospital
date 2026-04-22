'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RadiologyTests extends Model {
    static associate(models) {
      RadiologyTests.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  RadiologyTests.init({
    rad_test_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    test_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    test_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    modality: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    body_part: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    contrast_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    preparation_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    charge: {
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
    modelName: 'RadiologyTests',
    tableName: 'radiology_tests',
    timestamps: true
  });

  return RadiologyTests;
};