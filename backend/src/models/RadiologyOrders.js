'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RadiologyOrders extends Model {
    static associate(models) {
      RadiologyOrders.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      RadiologyOrders.belongsTo(models.RadiologyTests, {
        foreignKey: 'rad_test_id',
        as: 'radiologyTest'
      });
      RadiologyOrders.belongsTo(models.Doctor, {
        foreignKey: 'ordered_by',
        as: 'orderedBy'
      });
      RadiologyOrders.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  RadiologyOrders.init({
    rad_order_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    visit_type: {
      type: DataTypes.ENUM('OPD', 'IPD'),
      allowNull: false
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rad_test_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'radiology_tests',
        key: 'rad_test_id'
      }
    },
    test_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    modality: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    clinical_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ordered_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    scheduled_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    room: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Ordered', 'Scheduled', 'In Progress', 'Completed', 'Reported'),
      allowNull: false,
      defaultValue: 'Ordered'
    },
    covered_by_package_charge_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'bill_charges', key: 'charge_id' }
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
    modelName: 'RadiologyOrders',
    tableName: 'radiology_orders',
    timestamps: true
  });

  return RadiologyOrders;
};