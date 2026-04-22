'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorLeave extends Model {
    static associate(models) {
      DoctorLeave.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
      DoctorLeave.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  DoctorLeave.init({
    leave_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'doctors', key: 'id' }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' }
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    leave_type: {
      type: DataTypes.ENUM('Casual', 'Sick', 'Conference', 'Personal', 'Emergency'),
      allowNull: false,
      defaultValue: 'Casual'
    },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'DoctorLeave',
    tableName: 'doctor_leaves',
    timestamps: true
  });

  return DoctorLeave;
};
