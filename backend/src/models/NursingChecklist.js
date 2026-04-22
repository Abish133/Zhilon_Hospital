'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NursingChecklist extends Model {
    static associate(models) {
      NursingChecklist.belongsTo(models.IpdAdmission, { foreignKey: 'admission_id', as: 'admission' });
      NursingChecklist.belongsTo(models.User, { foreignKey: 'nurse_id', as: 'nurse' });
      NursingChecklist.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
    }
  }

  NursingChecklist.init({
    checklist_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ipd_admissions', key: 'admission_id' }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' }
    },
    nurse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    shift: {
      type: DataTypes.ENUM('Morning', 'Afternoon', 'Night'),
      allowNull: false
    },
    check_date: { type: DataTypes.DATEONLY, allowNull: false },
    // JSON blob storing individual item states (bath, oral care, bed linen, turning,
    // input/output, fall risk, pressure-sore check, IV site, catheter care, etc.)
    items: { type: DataTypes.JSON, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'NursingChecklist',
    tableName: 'nursing_checklists',
    timestamps: true,
    indexes: [
      { fields: ['admission_id', 'check_date', 'shift'] }
    ]
  });

  return NursingChecklist;
};
