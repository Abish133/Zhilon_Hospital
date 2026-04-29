'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PackageApplication extends Model {
    static associate(models) {
      PackageApplication.belongsTo(models.BillingEpisode, { foreignKey: 'episode_id', as: 'episode' });
      PackageApplication.belongsTo(models.Package, { foreignKey: 'package_id', as: 'package' });
      PackageApplication.belongsTo(models.BillCharge, { foreignKey: 'bill_charge_id', as: 'billCharge' });
      PackageApplication.belongsTo(models.User, { foreignKey: 'applied_by', as: 'appliedByUser' });
      PackageApplication.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  PackageApplication.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    hospital_id: { type: DataTypes.INTEGER, allowNull: false },
    episode_id: { type: DataTypes.INTEGER, allowNull: false },
    package_id: { type: DataTypes.INTEGER, allowNull: false },
    bill_charge_id: { type: DataTypes.INTEGER, allowNull: false },
    consult_credits_total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    consult_credits_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    applied_by: { type: DataTypes.INTEGER, allowNull: true },
    applied_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'PackageApplication',
    tableName: 'package_applications',
    timestamps: true
  });

  return PackageApplication;
};
