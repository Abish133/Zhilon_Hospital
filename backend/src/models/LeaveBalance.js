'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveBalance extends Model {
    static associate(models) {
      LeaveBalance.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
      LeaveBalance.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  // One row per employee per year. Tracks annual quota (allocated) and used days
  // per leave type; balance = allocated - used. Approving a paid leave increments
  // the matching *_used; 'unpaid' leave does not touch balances.
  LeaveBalance.init({
    balance_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'employee_id' } },
    hospital_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'hospitals', key: 'id' } },
    year: { type: DataTypes.INTEGER, allowNull: false },
    casual_allocated: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 12 },
    casual_used: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    medical_allocated: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 12 },
    medical_used: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    earned_allocated: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 15 },
    earned_used: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'LeaveBalance',
    tableName: 'leave_balances',
    timestamps: true
  });

  return LeaveBalance;
};
