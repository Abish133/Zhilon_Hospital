'use strict';

const COLS = [
  ['insurance_provider', (S) => ({ type: S.STRING(255), allowNull: false })],
  ['policy_number', (S) => ({ type: S.STRING(100), allowNull: false })],
  ['member_id', (S) => ({ type: S.STRING(100), allowNull: true })],
  ['claim_amount', (S) => ({ type: S.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })],
  ['deductible', (S) => ({ type: S.DECIMAL(10, 2), allowNull: true, defaultValue: 0 })],
  ['copay', (S) => ({ type: S.DECIMAL(10, 2), allowNull: true, defaultValue: 0 })],
  ['approved_amount', (S) => ({ type: S.DECIMAL(12, 2), allowNull: true })],
  ['paid_amount', (S) => ({ type: S.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })],
  ['status', (S) => ({ type: S.ENUM('pending', 'submitted', 'approved', 'paid', 'rejected'), defaultValue: 'pending' })],
  ['claim_date', (S) => ({ type: S.DATE, allowNull: false, defaultValue: S.NOW })],
  ['submission_date', (S) => ({ type: S.DATE, allowNull: true })],
  ['approval_date', (S) => ({ type: S.DATE, allowNull: true })],
  ['approval_comments', (S) => ({ type: S.TEXT, allowNull: true })],
  ['approver_id', (S) => ({
    type: S.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })],
  ['paid_date', (S) => ({ type: S.DATE, allowNull: true })],
  ['payment_reference', (S) => ({ type: S.STRING(100), allowNull: true })],
  ['is_active', (S) => ({ type: S.BOOLEAN, defaultValue: true })]
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());

    if (!tables.includes('insurance_claims')) {
      await queryInterface.createTable('insurance_claims', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        bill_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'bills', key: 'bill_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        patient_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'patients', key: 'patient_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        hospital_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'hospitals', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        ...Object.fromEntries(COLS.map(([name, defFn]) => [name, defFn(Sequelize)])),
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
    } else {
      const table = await queryInterface.describeTable('insurance_claims');
      for (const [name, defFn] of COLS) {
        if (!table[name]) {
          await queryInterface.addColumn('insurance_claims', name, defFn(Sequelize));
        }
      }
    }

    const safeIndex = async (cols) => {
      try { await queryInterface.addIndex('insurance_claims', cols); } catch (e) { /* may exist */ }
    };
    await safeIndex(['bill_id']);
    await safeIndex(['patient_id']);
    await safeIndex(['hospital_id']);
    await safeIndex(['status']);
    await safeIndex(['claim_date']);
    await safeIndex(['approver_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('insurance_claims');
  }
};
