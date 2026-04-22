'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('radiology_reports', {
      rad_report_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      rad_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'radiology_orders',
          key: 'rad_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      findings: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      impression: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reported_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reported_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      report_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Approved'),
        allowNull: false,
        defaultValue: 'Draft'
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hospitals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('radiology_reports');
  }
};