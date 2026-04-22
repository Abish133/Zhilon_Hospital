'use strict';
 
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ot_post_operatives', {
      post_op_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ot_bookings',
          key: 'booking_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      recovery_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      post_op_vitals: {
        type: Sequelize.JSON,
        allowNull: true
      },
      post_op_orders: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pain_management: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      wound_status: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      drains_inserted: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transferred_to_ward: {
        type: Sequelize.DATE,
        allowNull: true
      },
      post_op_complications: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
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
    await queryInterface.dropTable('ot_post_operatives');
  }
};
 