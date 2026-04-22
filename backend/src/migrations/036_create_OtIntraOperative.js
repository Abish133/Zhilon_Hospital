'use strict';
 
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ot_intra_operatives', {
      intra_op_id: {
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
      procedure_performed: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      anesthesia_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      anesthesia_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      intra_op_findings: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      procedure_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      complications: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      blood_loss_ml: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fluids_given: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      instruments_used: {
        type: Sequelize.JSON,
        allowNull: true
      },
      specimens_sent: {
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
    await queryInterface.dropTable('ot_intra_operatives');
  }
};
 