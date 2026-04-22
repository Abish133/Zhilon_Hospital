'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hospitals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      hospitalName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      licenseNumber: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      hospitalEmail: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      hospitalType: {
        type: Sequelize.ENUM('general', 'specialty', 'clinic', 'emergency', 'pediatric', 'maternity'),
        allowNull: false,
        defaultValue: 'general'
      },
      isActive: {
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
    await queryInterface.dropTable('hospitals');
  }
};