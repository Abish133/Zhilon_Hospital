'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class OtRoom extends Model {
    static associate(models) {
      OtRoom.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }
 
  OtRoom.init({
    room_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    room_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    room_type: {
      type: DataTypes.ENUM('Major', 'Minor', 'Emergency'),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Maintenance', 'Sterilization'),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'OtRoom',
    tableName: 'ot_rooms',
    timestamps: true
  });
 
  return OtRoom;
};
 