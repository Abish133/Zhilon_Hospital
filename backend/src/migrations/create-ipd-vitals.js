'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());

    if (!tables.includes('ipd_vitals')) {
      await queryInterface.createTable('ipd_vitals', {
        vital_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        admission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'ipd_admissions', key: 'admission_id' }
        },
        patient_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'patients', key: 'patient_id' }
        },
        recorded_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        recorded_date: { type: Sequelize.DATEONLY, allowNull: false },
        recorded_time: { type: Sequelize.TIME, allowNull: false },
        systolic_bp: Sequelize.INTEGER,
        diastolic_bp: Sequelize.INTEGER,
        pulse_rate: Sequelize.INTEGER,
        temperature: Sequelize.DECIMAL(4, 1),
        respiratory_rate: Sequelize.INTEGER,
        spo2: Sequelize.INTEGER,
        blood_sugar: Sequelize.DECIMAL(5, 1),
        consciousness_level: Sequelize.STRING(50),
        pain_scale: Sequelize.INTEGER,
        intake_ml: Sequelize.INTEGER,
        output_ml: Sequelize.INTEGER,
        notes: Sequelize.TEXT,
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('ipd_vitals', cols); } catch (e) { /* may exist */ }
    };
    await safeIndex(['admission_id']);
    await safeIndex(['recorded_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ipd_vitals');
  }
};
