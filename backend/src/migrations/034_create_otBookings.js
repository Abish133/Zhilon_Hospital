'use strict';
 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ot_bookings', {
      booking_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'patients',
          key: 'patient_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      uhid: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      admission_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      surgery_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      surgery_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      surgery_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      surgery_type: {
        type: Sequelize.ENUM('Elective', 'Emergency'),
        allowNull: true
      },
      surgeon_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assistant_surgeon_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      anesthetist_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ot_room_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ot_rooms',
          key: 'room_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      estimated_duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      actual_start_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actual_end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'),
        allowNull: true
      },
      booked_by: {
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
    await queryInterface.dropTable('ot_bookings');
  }
};
 