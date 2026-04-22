'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChargeMaster extends Model {
    static associate(models) {
      ChargeMaster.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      ChargeMaster.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  ChargeMaster.init({
    charge_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    service_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    service_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    service_type: {
      type: DataTypes.ENUM('Consultation', 'Procedure', 'Investigation', 'Room', 'Other'),
      allowNull: false
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    charge_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'ChargeMaster',
    tableName: 'charge_master',
    timestamps: true
  });

  return ChargeMaster;
};
