'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('grn_details')) return;

    const cols = await queryInterface.describeTable('grn_details');
    if (!cols.grn_id) {
      await queryInterface.addColumn('grn_details', 'grn_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        after: 'grn_detail_id'
      });
    }

    try {
      await queryInterface.addConstraint('grn_details', {
        fields: ['grn_id'],
        type: 'foreign key',
        name: 'fk_grn_details_grn_id',
        references: { table: 'goods_receipt_notes', field: 'grn_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    } catch (e) { /* constraint may already exist */ }
  },

  async down(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('grn_details')) return;

    try { await queryInterface.removeConstraint('grn_details', 'fk_grn_details_grn_id'); } catch (e) { /* may not exist */ }

    const cols = await queryInterface.describeTable('grn_details');
    if (cols.grn_id) {
      try { await queryInterface.removeColumn('grn_details', 'grn_id'); } catch (e) { /* may have implicit FK */ }
    }
  }
};
