'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExpenseEntry extends Model {
    static associate(models) {
      ExpenseEntry.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
      ExpenseEntry.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    }
  }

  // A simple expense ledger. Payroll posts a 'Payroll' expense automatically when
  // a payslip is processed (paid); manual operating expenses can also be recorded.
  ExpenseEntry.init({
    expense_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    hospital_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'hospitals', key: 'id' } },
    expense_number: { type: DataTypes.STRING(30), allowNull: true },
    expense_date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false }, // Payroll, Utilities, Maintenance, Procurement, Other
    description: { type: DataTypes.STRING(255), allowNull: true },
    reference_type: { type: DataTypes.STRING(40), allowNull: true }, // e.g. 'Payroll'
    reference_id: { type: DataTypes.INTEGER, allowNull: true },      // e.g. payroll_id
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    payment_mode: { type: DataTypes.STRING(30), allowNull: true },
    status: { type: DataTypes.ENUM('Recorded', 'Paid'), allowNull: false, defaultValue: 'Paid' },
    created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'ExpenseEntry',
    tableName: 'expense_entries',
    timestamps: true
  });

  return ExpenseEntry;
};
