'use strict';

// Adds a nullable FK on every billable child table that points to the bill_charges row
// posted when a Package is applied to an episode. When this FK is set, the auto-bill
// code paths skip creating their own BillCharge — preventing double-billing when a test,
// imaging, or consultation is covered by an already-charged package.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fk = (refColumn) => ({
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'bill_charges', key: 'charge_id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('lab_order_details', 'covered_by_package_charge_id', fk('charge_id'));
    await queryInterface.addColumn('radiology_orders', 'covered_by_package_charge_id', fk('charge_id'));
    await queryInterface.addColumn('opd_consultations', 'covered_by_package_charge_id', fk('charge_id'));

    await queryInterface.addIndex('lab_order_details', ['covered_by_package_charge_id'], { name: 'idx_lod_covered_by_pkg' });
    await queryInterface.addIndex('radiology_orders',  ['covered_by_package_charge_id'], { name: 'idx_rad_covered_by_pkg' });
    await queryInterface.addIndex('opd_consultations', ['covered_by_package_charge_id'], { name: 'idx_opdc_covered_by_pkg' });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('lab_order_details', 'idx_lod_covered_by_pkg').catch(() => {});
    await queryInterface.removeIndex('radiology_orders',  'idx_rad_covered_by_pkg').catch(() => {});
    await queryInterface.removeIndex('opd_consultations', 'idx_opdc_covered_by_pkg').catch(() => {});
    await queryInterface.removeColumn('lab_order_details', 'covered_by_package_charge_id');
    await queryInterface.removeColumn('radiology_orders',  'covered_by_package_charge_id');
    await queryInterface.removeColumn('opd_consultations', 'covered_by_package_charge_id');
  }
};
