'use strict';

const COLS = [
  ['bonus',      (S) => ({ type: S.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })],
  ['gratuity',   (S) => ({ type: S.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })],
  ['lwf_amount', (S) => ({ type: S.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('salary_structures');
    for (const [name, defFn] of COLS) {
      if (!table[name]) await queryInterface.addColumn('salary_structures', name, defFn(Sequelize));
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('salary_structures');
    for (const [name] of COLS) {
      if (table[name]) { try { await queryInterface.removeColumn('salary_structures', name); } catch (e) { /* ignore */ } }
    }
  }
};
