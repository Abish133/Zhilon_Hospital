'use strict';
 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicines', {
      medicine_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      medicine_code: {
        type: Sequelize.STRING(30),
        allowNull: true,
        unique: true
      },
      medicine_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'medicine_categories',
          key: 'category_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      strength: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      dosage_form: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      manufacturer: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      hsn_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      gst_percentage: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
      },
      schedule: {
        type: Sequelize.STRING(10),
        allowNull: true
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
    await queryInterface.dropTable('medicines');
  }
};
 