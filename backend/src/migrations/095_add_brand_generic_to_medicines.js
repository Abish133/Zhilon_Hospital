'use strict';

/**
 * India medicine identity: a drug is prescribed/dispensed by its generic
 * (molecular / composition / salt) name and sold under a brand name. We keep the
 * existing `medicine_name` (display) and add:
 *   - brand_name   → trade/brand name (e.g. "Dolo 650")
 *   - generic_name → molecule / composition / salt (e.g. "Paracetamol")
 * (strength already exists on the medicines table.)
 */
const COLS = [
  ['brand_name',   (S) => ({ type: S.STRING(200), allowNull: true })],
  ['generic_name', (S) => ({ type: S.STRING(200), allowNull: true })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('medicines');
    for (const [name, defFn] of COLS) {
      if (!table[name]) {
        await queryInterface.addColumn('medicines', name, defFn(Sequelize));
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('medicines');
    for (const [name] of COLS) {
      if (table[name]) {
        try { await queryInterface.removeColumn('medicines', name); } catch (e) { /* ignore */ }
      }
    }
  }
};
