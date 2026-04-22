'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('radiology_imaging', {
      imaging_id: {
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
      imaging_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      technologist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      images_path: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      technical_notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('radiology_imaging');
  }
};