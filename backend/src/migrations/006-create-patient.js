'use strict';
 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      patient_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      uhid: {
        type: Sequelize.STRING(30),
        unique: true,
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('M', 'F', 'O'),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      blood_group: {
        type: Sequelize.STRING(5),
        allowNull: true
      },
      marital_status: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      mobile_number: {
        type: Sequelize.STRING(15),
        unique: true,
        allowNull: true
      },
      alternate_mobile: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      address_line1: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      address_line2: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      emergency_contact_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      emergency_contact_number: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      insurance_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      insurance_provider: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      policy_number: {
        type: Sequelize.STRING(50),
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
    await queryInterface.dropTable('patients');
  }
};
 