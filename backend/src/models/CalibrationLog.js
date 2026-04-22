'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CalibrationLog extends Model {
    static associate(models) {
      CalibrationLog.belongsTo(models.Equipment, { foreignKey: 'equipment_id', as: 'equipment' });
      CalibrationLog.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  CalibrationLog.init({
    calibration_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'equipment', key: 'equipment_id' }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' }
    },
    calibration_date: { type: DataTypes.DATEONLY, allowNull: false },
    next_due_date: { type: DataTypes.DATEONLY, allowNull: true },
    calibrated_by: { type: DataTypes.STRING(200), allowNull: true },
    agency: { type: DataTypes.STRING(200), allowNull: true },
    certificate_number: { type: DataTypes.STRING(100), allowNull: true },
    certificate_path: { type: DataTypes.STRING(500), allowNull: true },
    result: {
      type: DataTypes.ENUM('Pass', 'Fail', 'Conditional'),
      allowNull: false,
      defaultValue: 'Pass'
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'CalibrationLog',
    tableName: 'calibration_logs',
    timestamps: true
  });

  return CalibrationLog;
};
