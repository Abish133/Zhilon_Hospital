'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class OtPostOperative extends Model {
    static associate(models) {
      OtPostOperative.belongsTo(models.OtBooking, {
        foreignKey: 'booking_id',
        as: 'otBooking'
      });
      OtPostOperative.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      OtPostOperative.belongsTo(models.User, {
        foreignKey: 'recorded_by',
        as: 'recordedBy'
      });
      OtPostOperative.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  OtPostOperative.init({
    post_op_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ot_bookings',
        key: 'booking_id'
      }
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    recovery_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    post_op_vitals: {
      type: DataTypes.JSON,
      allowNull: true
    },
    post_op_orders: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pain_management: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    wound_status: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    drains_inserted: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    transferred_to_ward: {
      type: DataTypes.DATE,
      allowNull: true
    },
    post_op_complications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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
    modelName: 'OtPostOperative',
    tableName: 'ot_post_operatives',
    timestamps: true
  });
 
  return OtPostOperative;
};
 