'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdMedicationAdministration extends Model {
    static associate(models) {
      IpdMedicationAdministration.belongsTo(models.IpdMedication, {
        foreignKey: 'medication_id',
        as: 'medication'
      });
      IpdMedicationAdministration.belongsTo(models.IpdAdmission, {
        foreignKey: 'admission_id',
        as: 'admission'
      });
      IpdMedicationAdministration.belongsTo(models.User, {
        foreignKey: 'administered_by',
        as: 'administeredBy'
      });
    }
  }

  IpdMedicationAdministration.init({
    administration_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medication_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ipd_medications', key: 'medication_id' }
    },
    admission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ipd_admissions', key: 'admission_id' }
    },
    administered_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    administered_time: {
      type: DataTypes.DATE
    },
    dosage_given: {
      type: DataTypes.STRING(100)
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'Administered', 'Missed', 'Refused', 'Held'),
      defaultValue: 'Scheduled'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'IpdMedicationAdministration',
    tableName: 'ipd_medication_administrations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return IpdMedicationAdministration;
};
