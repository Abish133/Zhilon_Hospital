'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'NULL for system actions'
      },
      action_type: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT'),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Patient, OPD, IPD, Billing, etc.'
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      request_method: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'GET, POST, PUT, DELETE'
      },
      request_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      request_body: {
        type: Sequelize.JSON,
        allowNull: true
      },
      request_params: {
        type: Sequelize.JSON,
        allowNull: true
      },
      request_query: {
        type: Sequelize.JSON,
        allowNull: true
      },
      response_status: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      response_body: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'hospitals',
          key: 'id'
        }
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action_type']);
    await queryInterface.addIndex('audit_logs', ['entity_type']);
    await queryInterface.addIndex('audit_logs', ['entity_id']);
    await queryInterface.addIndex('audit_logs', ['hospital_id']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
    await queryInterface.addIndex('audit_logs', ['user_id', 'createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};

