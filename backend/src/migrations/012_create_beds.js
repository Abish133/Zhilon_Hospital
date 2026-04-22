'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beds', {
      bed_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wards',
          key: 'ward_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      room_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      bed_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      bed_type: {
        type: Sequelize.ENUM('General', 'Oxygen', 'Ventilator'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Available', 'Occupied', 'Under Maintenance'),
        allowNull: false,
        defaultValue: 'Available'
      },
      charge_per_day: {
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
    await queryInterface.dropTable('beds');
  }
};
