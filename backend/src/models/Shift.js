'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shift extends Model {
    static associate(models) {
      Shift.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      Shift.hasMany(models.EmployeeRoster, {
        foreignKey: 'shift_id',
        as: 'rosters'
      });
    }
  }

  Shift.init({
    shift_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    shift_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    duration_hours: {
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
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Shift',
    tableName: 'shifts',
    timestamps: true,
    hooks: {
      beforeSave: (shift) => {
        // Calculate duration if not set
        if (shift.start_time && shift.end_time && !shift.duration_hours) {
          const start = new Date(`2000-01-01 ${shift.start_time}`);
          const end = new Date(`2000-01-01 ${shift.end_time}`);
          // Handle overnight shifts
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }
          const diffMs = end - start;
          shift.duration_hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        }
      }
    }
  });

  return Shift;
};

