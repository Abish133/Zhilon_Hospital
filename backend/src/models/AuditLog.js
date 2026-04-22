'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      AuditLog.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  AuditLog.init({
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action_type: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT'),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    request_method: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    request_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    request_body: {
      type: DataTypes.JSON,
      allowNull: true
    },
    request_params: {
      type: DataTypes.JSON,
      allowNull: true
    },
    request_query: {
      type: DataTypes.JSON,
      allowNull: true
    },
    response_status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    response_body: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false // Audit logs are never updated
  });

  return AuditLog;
};

