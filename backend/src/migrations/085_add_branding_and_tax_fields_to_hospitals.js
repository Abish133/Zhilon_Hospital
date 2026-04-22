'use strict';

const COLS = [
  ['logo_url',           (S) => ({ type: S.STRING(500), allowNull: true })],
  ['header_html',        (S) => ({ type: S.TEXT,        allowNull: true })],
  ['footer_html',        (S) => ({ type: S.TEXT,        allowNull: true })],
  ['gst_number',         (S) => ({ type: S.STRING(50),  allowNull: true })],
  ['pan_number',         (S) => ({ type: S.STRING(20),  allowNull: true })],
  ['registration_number',(S) => ({ type: S.STRING(100), allowNull: true })],
  ['website',            (S) => ({ type: S.STRING(200), allowNull: true })],
  ['numbering_prefixes', (S) => ({ type: S.JSON,        allowNull: true })],
  ['settings',           (S) => ({ type: S.JSON,        allowNull: true })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('hospitals');
    for (const [name, defFn] of COLS) {
      if (!table[name]) {
        await queryInterface.addColumn('hospitals', name, defFn(Sequelize));
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('hospitals');
    for (const [name] of COLS) {
      if (table[name]) {
        try { await queryInterface.removeColumn('hospitals', name); } catch (e) { /* ignore */ }
      }
    }
  }
};
