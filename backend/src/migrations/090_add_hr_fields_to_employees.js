'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('employees');
    
    if (!tableInfo.designation) {
      await queryInterface.addColumn('employees', 'designation', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    if (!tableInfo.bank_account_number) {
      await queryInterface.addColumn('employees', 'bank_account_number', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }
    if (!tableInfo.ifsc_code) {
      await queryInterface.addColumn('employees', 'ifsc_code', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    if (!tableInfo.pan_number) {
      await queryInterface.addColumn('employees', 'pan_number', {
        type: Sequelize.STRING(15),
        allowNull: true
      });
    }
    if (!tableInfo.uan_number) {
      await queryInterface.addColumn('employees', 'uan_number', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    if (!tableInfo.emergency_contact_name) {
      await queryInterface.addColumn('employees', 'emergency_contact_name', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    if (!tableInfo.emergency_contact_number) {
      await queryInterface.addColumn('employees', 'emergency_contact_number', {
        type: Sequelize.STRING(15),
        allowNull: true
      });
    }
    if (!tableInfo.id_proof_url) {
      await queryInterface.addColumn('employees', 'id_proof_url', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableInfo.reporting_manager_id) {
      await queryInterface.addColumn('employees', 'reporting_manager_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'designation');
    await queryInterface.removeColumn('employees', 'bank_account_number');
    await queryInterface.removeColumn('employees', 'ifsc_code');
    await queryInterface.removeColumn('employees', 'pan_number');
    await queryInterface.removeColumn('employees', 'uan_number');
    await queryInterface.removeColumn('employees', 'emergency_contact_name');
    await queryInterface.removeColumn('employees', 'emergency_contact_number');
    await queryInterface.removeColumn('employees', 'id_proof_url');
    await queryInterface.removeColumn('employees', 'reporting_manager_id');
  }
};
