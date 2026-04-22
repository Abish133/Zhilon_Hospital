'use strict';

/**
 * Add performance indexes for frequently queried columns
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Helper function to safely add index
      const addIndexSafely = async (table, columns, options = {}) => {
        try {
          await queryInterface.addIndex(table, columns, { ...options, transaction });
        } catch (error) {
          if (!error.message.includes('Duplicate key name')) {
            throw error;
          }
        }
      };
      
      // Patient indexes
      await addIndexSafely('patients', ['uhid']);
      await addIndexSafely('patients', ['hospital_id', 'isActive']);
      await addIndexSafely('patients', ['mobile_number']);
      
      // User indexes
      await addIndexSafely('users', ['email']);
      await addIndexSafely('users', ['hospital_id', 'isActive']);
      await addIndexSafely('users', ['role']);
      
      // Employee indexes
      await addIndexSafely('employees', ['emp_code']);
      await addIndexSafely('employees', ['hospital_id', 'is_active']);
      await addIndexSafely('employees', ['department_id']);
      
      // OPD indexes
      await addIndexSafely('opd_visits', ['patient_id']);
      await addIndexSafely('opd_visits', ['hospital_id', 'visit_date']);
      await addIndexSafely('opd_visits', ['doctor_id', 'status']);
      await addIndexSafely('opd_appointments', ['patient_id', 'appointment_date']);
      
      // IPD indexes
      await addIndexSafely('ipd_admissions', ['patient_id']);
      await addIndexSafely('ipd_admissions', ['hospital_id', 'status']);
      await addIndexSafely('ipd_admissions', ['bed_id', 'status']);
      
      // Billing indexes
      await addIndexSafely('bills', ['bill_number']);
      await addIndexSafely('bills', ['patient_id', 'createdAt']);
      await addIndexSafely('bill_charges', ['episode_id']);
      await addIndexSafely('payments', ['bill_id']);
      
      // Pharmacy indexes
      await addIndexSafely('pharmacy_sales', ['patient_id', 'sale_date']);
      await addIndexSafely('medicine_batches', ['medicine_id', 'is_active']);
      
      // Lab indexes
      await addIndexSafely('lab_orders', ['patient_id', 'order_date']);
      await addIndexSafely('lab_samples', ['order_id']);
      
      // Audit log indexes
      await addIndexSafely('audit_logs', ['createdAt']);
      await addIndexSafely('audit_logs', ['user_id', 'createdAt']);
      await addIndexSafely('audit_logs', ['hospital_id', 'createdAt']);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove Patient indexes
      await queryInterface.removeIndex('patients', 'uhid', { transaction });
      await queryInterface.removeIndex('patients', 'hospital_id_isActive', { transaction });
      await queryInterface.removeIndex('patients', 'mobile_number', { transaction });
      
      // Remove User indexes
      await queryInterface.removeIndex('users', 'email', { transaction });
      await queryInterface.removeIndex('users', 'hospital_id_isActive', { transaction });
      await queryInterface.removeIndex('users', 'role', { transaction });
      
      // Remove Employee indexes
      await queryInterface.removeIndex('employees', 'emp_code', { transaction });
      await queryInterface.removeIndex('employees', 'hospital_id_is_active', { transaction });
      await queryInterface.removeIndex('employees', 'department_id', { transaction });
      
      // Remove OPD indexes
      await queryInterface.removeIndex('opd_visits', 'patient_id', { transaction });
      await queryInterface.removeIndex('opd_visits', 'hospital_id_visit_date', { transaction });
      await queryInterface.removeIndex('opd_visits', 'doctor_id_status', { transaction });
      await queryInterface.removeIndex('opd_appointments', 'patient_id_appointment_date', { transaction });
      
      // Remove IPD indexes
      await queryInterface.removeIndex('ipd_admissions', 'patient_id', { transaction });
      await queryInterface.removeIndex('ipd_admissions', 'hospital_id_status', { transaction });
      await queryInterface.removeIndex('ipd_admissions', 'bed_id_status', { transaction });
      
      // Remove Billing indexes
      await queryInterface.removeIndex('bills', 'bill_number', { transaction });
      await queryInterface.removeIndex('bills', 'patient_id_createdAt', { transaction });
      await queryInterface.removeIndex('bill_charges', 'episode_id', { transaction });
      await queryInterface.removeIndex('payments', 'bill_id', { transaction });
      
      // Remove Pharmacy indexes
      await queryInterface.removeIndex('pharmacy_sales', 'patient_id_sale_date', { transaction });
      await queryInterface.removeIndex('medicine_batches', 'medicine_id_is_active', { transaction });
      
      // Remove Lab indexes
      await queryInterface.removeIndex('lab_orders', 'patient_id_order_date', { transaction });
      await queryInterface.removeIndex('lab_samples', 'order_id', { transaction });
      
      // Remove Audit log indexes
      await queryInterface.removeIndex('audit_logs', 'createdAt', { transaction });
      await queryInterface.removeIndex('audit_logs', 'user_id_createdAt', { transaction });
      await queryInterface.removeIndex('audit_logs', 'hospital_id_createdAt', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
