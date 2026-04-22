'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());

    if (!tables.includes('ipd_medications')) {
      await queryInterface.createTable('ipd_medications', {
        medication_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        admission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'ipd_admissions', key: 'admission_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        prescribed_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medicine_id: {
          type: Sequelize.INTEGER,
          references: { model: 'medicines', key: 'medicine_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        medicine_name: { type: Sequelize.STRING(200), allowNull: false },
        dosage: { type: Sequelize.STRING(100), allowNull: false },
        frequency: { type: Sequelize.STRING(100), allowNull: false },
        route: {
          type: Sequelize.ENUM('Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Rectal', 'Other'),
          defaultValue: 'Oral'
        },
        duration_days: { type: Sequelize.INTEGER },
        start_date: { type: Sequelize.DATE, allowNull: false },
        end_date: { type: Sequelize.DATE },
        instructions: { type: Sequelize.TEXT },
        status: {
          type: Sequelize.ENUM('Active', 'Completed', 'Stopped', 'On-Hold'),
          defaultValue: 'Active'
        },
        stopped_by: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        stop_reason: { type: Sequelize.TEXT },
        stopped_at: { type: Sequelize.DATE },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });
    }

    if (!tables.includes('ipd_medication_administrations')) {
      await queryInterface.createTable('ipd_medication_administrations', {
        administration_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        medication_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'ipd_medications', key: 'medication_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        admission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'ipd_admissions', key: 'admission_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        administered_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        scheduled_time: { type: Sequelize.DATE, allowNull: false },
        administered_time: { type: Sequelize.DATE },
        dosage_given: { type: Sequelize.STRING(100) },
        status: {
          type: Sequelize.ENUM('Scheduled', 'Administered', 'Missed', 'Refused', 'Held'),
          defaultValue: 'Scheduled'
        },
        notes: { type: Sequelize.TEXT },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });
    }

    const safeIndex = async (table, cols) => {
      try { await queryInterface.addIndex(table, cols); } catch (e) { /* may exist */ }
    };
    await safeIndex('ipd_medications', ['admission_id']);
    await safeIndex('ipd_medications', ['status']);
    await safeIndex('ipd_medication_administrations', ['medication_id']);
    await safeIndex('ipd_medication_administrations', ['admission_id']);
    await safeIndex('ipd_medication_administrations', ['scheduled_time']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ipd_medication_administrations');
    await queryInterface.dropTable('ipd_medications');
  }
};
