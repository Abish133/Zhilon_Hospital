'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lab_tests', {
      test_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      test_code: {
        type: Sequelize.STRING(30),
        allowNull: true,
        unique: true
      },
      test_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      test_category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      department: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      sample_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      sample_volume: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      container_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      normal_range: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      turn_around_time_hours: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      charge: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lab_tests');
  }
};
