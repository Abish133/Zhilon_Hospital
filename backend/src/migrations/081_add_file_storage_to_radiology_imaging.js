'use strict';

const COLS = [
  ['file_path', (S) => ({ type: S.STRING(500), allowNull: true, comment: 'Local file path or cloud URL for stored image' })],
  ['file_name', (S) => ({ type: S.STRING(255), allowNull: true, comment: 'Original filename' })],
  ['file_size', (S) => ({ type: S.BIGINT, allowNull: true, comment: 'File size in bytes' })],
  ['mime_type', (S) => ({ type: S.STRING(100), allowNull: true, comment: 'MIME type (image/jpeg, image/png, application/pdf)' })],
  ['storage_type', (S) => ({ type: S.ENUM('local', 'cloud', 'base64'), defaultValue: 'local', comment: 'Storage backend type' })],
  ['upload_date', (S) => ({ type: S.DATE, allowNull: true, defaultValue: S.NOW })],
  ['downloaded_count', (S) => ({ type: S.INTEGER, defaultValue: 0, comment: 'Number of times image was downloaded' })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('radiology_imaging');
    for (const [name, defFn] of COLS) {
      if (!table[name]) {
        await queryInterface.addColumn('radiology_imaging', name, defFn(Sequelize));
      }
    }
    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('radiology_imaging', cols); } catch (e) { /* index may exist */ }
    };
    await safeIndex(['file_path']);
    await safeIndex(['storage_type']);
    await safeIndex(['upload_date']);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('radiology_imaging');
    for (const [name] of COLS) {
      if (table[name]) await queryInterface.removeColumn('radiology_imaging', name);
    }
  }
};
