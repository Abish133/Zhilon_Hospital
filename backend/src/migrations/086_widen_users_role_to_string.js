'use strict';

/**
 * The original users table created `role` as ENUM('admin','doctor','nurse','receptionist'),
 * but the User model and seed use many more roles (Pharmacist, Lab Technician,
 * Radiologist, Accountant, HR, Employee, ...). Convert the column to STRING(50)
 * to match the model and allow arbitrary role names.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('users')) return;

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'receptionist'
    });
  },

  async down(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map(t => String(t).toLowerCase());
    if (!tables.includes('users')) return;

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'doctor', 'nurse', 'receptionist'),
      allowNull: false,
      defaultValue: 'receptionist'
    });
  }
};
