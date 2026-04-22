'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('radiology_orders', {
      rad_order_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'patient_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      visit_type: {
        type: Sequelize.ENUM('OPD', 'IPD'),
        allowNull: false
      },
      visit_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rad_test_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'radiology_tests',
          key: 'rad_test_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      test_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      modality: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      clinical_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ordered_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      scheduled_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      scheduled_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Ordered', 'Scheduled', 'In Progress', 'Completed', 'Reported'),
        allowNull: false,
        defaultValue: 'Ordered'
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
    await queryInterface.dropTable('radiology_orders');
  }
};