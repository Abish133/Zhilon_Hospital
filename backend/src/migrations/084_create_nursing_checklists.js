'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (tables.includes('nursing_checklists')) return;

    await queryInterface.createTable('nursing_checklists', {
      checklist_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      admission_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ipd_admissions', key: 'admission_id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      hospital_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'hospitals', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      nurse_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      shift: {
        type: Sequelize.ENUM('Morning', 'Afternoon', 'Night'),
        allowNull: false
      },
      check_date: { type: Sequelize.DATEONLY, allowNull: false },
      items: { type: Sequelize.JSON, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('nursing_checklists', cols); } catch (e) { /* may exist */ }
    };
    await safeIndex(['admission_id']);
    await safeIndex(['nurse_id']);
    await safeIndex(['check_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('nursing_checklists');
  }
};
