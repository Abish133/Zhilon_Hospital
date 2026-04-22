'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Package extends Model {
    static associate(models) {
      Package.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  Package.init({
    package_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    package_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    package_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    services_included: {
      type: DataTypes.JSON,
      allowNull: true
    },
    total_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    validity_days: {
      type: DataTypes.INTEGER,
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
    modelName: 'Package',
    tableName: 'packages',
    timestamps: true
  });

  return Package;
};
