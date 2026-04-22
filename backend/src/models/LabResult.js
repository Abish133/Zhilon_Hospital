'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LabResult extends Model {
    static associate(models) {
      LabResult.belongsTo(models.LabOrder, {
        foreignKey: 'order_id',
        as: 'order'
      });
      LabResult.belongsTo(models.LabOrderDetail, {
        foreignKey: 'detail_id',
        as: 'detail'
      });
      LabResult.belongsTo(models.LabTest, {
        foreignKey: 'test_id',
        as: 'test'
      });
      LabResult.belongsTo(models.User, {
        foreignKey: 'entered_by',
        as: 'enteredBy'
      });
      LabResult.belongsTo(models.User, {
        foreignKey: 'verified_by',
        as: 'verifiedBy'
      });
      LabResult.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  LabResult.init({
    result_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lab_orders',
        key: 'order_id'
      }
    },
    detail_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lab_order_details',
        key: 'detail_id'
      }
    },
    test_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lab_tests',
        key: 'test_id'
      }
    },
    result_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    critical_value: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    entered_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    entered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Verified', 'Reported'),
      allowNull: true,
      defaultValue: 'Draft'
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
    modelName: 'LabResult',
    tableName: 'lab_results',
    timestamps: true
  });

  return LabResult;
};
