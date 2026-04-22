'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('radiology_tests', {
      rad_test_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      test_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      test_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      modality: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      body_part: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      contrast_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      preparation_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      charge: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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
    await queryInterface.dropTable('radiology_tests');
  }
};