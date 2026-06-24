'use strict';

/**
 * Pharmacy operating model, chosen once at hospital registration:
 *   - 'in_house'      → medicines/OT consumables are billed to the patient's
 *                       hospital bill (OPD/IPD episode). [default, legacy flow]
 *   - 'self_purchase' → the patient buys & pays at the pharmacy counter; those
 *                       items are NOT added to the hospital bill.
 * Read-only after registration (the API strips it from updates).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('hospitals');
    if (!table.pharmacy_mode) {
      await queryInterface.addColumn('hospitals', 'pharmacy_mode', {
        type: Sequelize.ENUM('in_house', 'self_purchase'),
        allowNull: false,
        defaultValue: 'in_house'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('hospitals');
    if (table.pharmacy_mode) {
      try { await queryInterface.removeColumn('hospitals', 'pharmacy_mode'); } catch (e) { /* ignore */ }
    }
  }
};
