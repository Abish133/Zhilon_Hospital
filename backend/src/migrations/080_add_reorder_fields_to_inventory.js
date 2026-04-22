'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('inventory_items');

    if (!table.reorder_point) {
      await queryInterface.addColumn('inventory_items', 'reorder_point', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Minimum stock level that triggers reorder'
      });
    }

    if (!table.reorder_quantity) {
      await queryInterface.addColumn('inventory_items', 'reorder_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Quantity to reorder when below reorder point'
      });
    }

    if (!table.vendor_id) {
      await queryInterface.addColumn('inventory_items', 'vendor_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'vendors', key: 'vendor_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Primary vendor for this item'
      });
    }

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('inventory_items', cols); } catch (e) { /* index may exist */ }
    };
    await safeIndex(['reorder_point']);
    await safeIndex(['current_stock']);
    await safeIndex(['vendor_id']);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('inventory_items');
    if (table.reorder_point) await queryInterface.removeColumn('inventory_items', 'reorder_point');
    if (table.reorder_quantity) await queryInterface.removeColumn('inventory_items', 'reorder_quantity');
    if (table.vendor_id) await queryInterface.removeColumn('inventory_items', 'vendor_id');
  }
};
