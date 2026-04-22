'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('charge_master', {
      charge_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      service_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      service_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      service_type: {
        type: Sequelize.ENUM('Consultation', 'Procedure', 'Investigation', 'Room', 'Other'),
        allowNull: false
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      charge_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      gst_percentage: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
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
    await queryInterface.dropTable('charge_master');
  }
};
