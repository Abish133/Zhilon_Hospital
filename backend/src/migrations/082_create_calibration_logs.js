'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.map(t => String(t).toLowerCase()).includes('calibration_logs')) {
      await queryInterface.createTable('calibration_logs', {
        calibration_id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        equipment_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'equipment', key: 'equipment_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        hospital_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'hospitals', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        calibration_date: { type: Sequelize.DATEONLY, allowNull: false },
        next_due_date: { type: Sequelize.DATEONLY, allowNull: true },
        calibrated_by: { type: Sequelize.STRING(200), allowNull: true },
        agency: { type: Sequelize.STRING(200), allowNull: true },
        certificate_number: { type: Sequelize.STRING(100), allowNull: true },
        certificate_path: { type: Sequelize.STRING(500), allowNull: true },
        result: {
          type: Sequelize.ENUM('Pass', 'Fail', 'Conditional'),
          allowNull: false,
          defaultValue: 'Pass'
        },
        notes: { type: Sequelize.TEXT, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('calibration_logs', cols); } catch (e) { /* index may exist */ }
    };
    await safeIndex(['equipment_id']);
    await safeIndex(['hospital_id']);
    await safeIndex(['next_due_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calibration_logs');
  }
};
