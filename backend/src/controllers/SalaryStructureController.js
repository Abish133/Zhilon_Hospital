'use strict';
const { SalaryStructure, Employee, Hospital } = require('../models');
const { Op } = require('sequelize');

class SalaryStructureController {
  // Get all salary structures
  static async getAll(req, res) {
    try {
      const { employee_id, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {
        is_active: true
      };

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (employee_id) {
        whereClause.employee_id = employee_id;
      }

      const structures = await SalaryStructure.findAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName']
          }
        ],
        order: [['effective_from', 'DESC']]
      });

      res.json({
        success: true,
        data: structures
      });
    } catch (error) {
      console.error('Error fetching salary structures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary structures',
        error: error.message
      });
    }
  }

  // Get salary structure by employee
  static async getByEmployee(req, res) {
    try {
      const { employeeId } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        employee_id: employeeId,
        is_active: true
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      // Get current active structure
      const structure = await SalaryStructure.findOne({
        where: {
          ...whereClause,
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: new Date() } }
          ]
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          }
        ],
        order: [['effective_from', 'DESC']]
      });

      if (!structure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found for this employee'
        });
      }

      res.json({
        success: true,
        data: structure
      });
    } catch (error) {
      console.error('Error fetching salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary structure',
        error: error.message
      });
    }
  }

  // Create salary structure
  static async create(req, res) {
    try {
      const {
        employee_id,
        basic_salary,
        hra,
        medical_allowance,
        transport_allowance,
        other_allowances,
        bonus,
        gratuity,
        pf_percentage,
        pt_amount,
        esi_percentage,
        lwf_amount,
        tds_percentage,
        other_deductions,
        effective_from,
        effective_to,
        hospital_id
      } = req.body;

      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!employee_id || !basic_salary || !effective_from || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'employee_id, basic_salary, effective_from, and hospital_id are required'
        });
      }

      // Check if employee exists
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // If there's an existing structure, set its effective_to
      const existingStructure = await SalaryStructure.findOne({
        where: {
          employee_id,
          hospital_id: hospitalId,
          is_active: true,
          effective_to: null
        }
      });

      if (existingStructure) {
        // Set effective_to to day before new structure starts
        const newEffectiveFrom = new Date(effective_from);
        newEffectiveFrom.setDate(newEffectiveFrom.getDate() - 1);
        await existingStructure.update({
          effective_to: newEffectiveFrom.toISOString().split('T')[0]
        });
      }

      const structure = await SalaryStructure.create({
        employee_id,
        basic_salary: parseFloat(basic_salary) || 0,
        hra: parseFloat(hra) || 0,
        medical_allowance: parseFloat(medical_allowance) || 0,
        transport_allowance: parseFloat(transport_allowance) || 0,
        other_allowances: parseFloat(other_allowances) || 0,
        bonus: parseFloat(bonus) || 0,
        gratuity: parseFloat(gratuity) || 0,
        pf_percentage: parseFloat(pf_percentage) || 0,
        pt_amount: parseFloat(pt_amount) || 0,
        esi_percentage: parseFloat(esi_percentage) || 0,
        lwf_amount: parseFloat(lwf_amount) || 0,
        tds_percentage: parseFloat(tds_percentage) || 0,
        other_deductions: parseFloat(other_deductions) || 0,
        effective_from,
        effective_to: effective_to || null,
        hospital_id: hospitalId
      });

      const structureWithEmployee = await SalaryStructure.findByPk(structure.structure_id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Salary structure created successfully',
        data: structureWithEmployee
      });
    } catch (error) {
      console.error('Error creating salary structure:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Employee already has an active salary structure'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create salary structure',
        error: error.message
      });
    }
  }

  // Update salary structure
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        basic_salary,
        hra,
        medical_allowance,
        transport_allowance,
        other_allowances,
        bonus,
        gratuity,
        pf_percentage,
        pt_amount,
        esi_percentage,
        lwf_amount,
        tds_percentage,
        other_deductions,
        effective_from,
        effective_to
      } = req.body;

      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        structure_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const structure = await SalaryStructure.findOne({ where: whereClause });

      if (!structure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      const updateData = {};
      if (basic_salary !== undefined) updateData.basic_salary = parseFloat(basic_salary);
      if (hra !== undefined) updateData.hra = parseFloat(hra);
      if (medical_allowance !== undefined) updateData.medical_allowance = parseFloat(medical_allowance);
      if (transport_allowance !== undefined) updateData.transport_allowance = parseFloat(transport_allowance);
      if (other_allowances !== undefined) updateData.other_allowances = parseFloat(other_allowances);
      if (bonus !== undefined) updateData.bonus = parseFloat(bonus);
      if (gratuity !== undefined) updateData.gratuity = parseFloat(gratuity);
      if (pf_percentage !== undefined) updateData.pf_percentage = parseFloat(pf_percentage);
      if (pt_amount !== undefined) updateData.pt_amount = parseFloat(pt_amount);
      if (esi_percentage !== undefined) updateData.esi_percentage = parseFloat(esi_percentage);
      if (lwf_amount !== undefined) updateData.lwf_amount = parseFloat(lwf_amount);
      if (tds_percentage !== undefined) updateData.tds_percentage = parseFloat(tds_percentage);
      if (other_deductions !== undefined) updateData.other_deductions = parseFloat(other_deductions);
      if (effective_from) updateData.effective_from = effective_from;
      if (effective_to !== undefined) updateData.effective_to = effective_to;

      await structure.update(updateData);

      const updatedStructure = await SalaryStructure.findByPk(structure.structure_id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Salary structure updated successfully',
        data: updatedStructure
      });
    } catch (error) {
      console.error('Error updating salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update salary structure',
        error: error.message
      });
    }
  }

  // Delete salary structure (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        structure_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const structure = await SalaryStructure.findOne({ where: whereClause });

      if (!structure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      await structure.update({ is_active: false });

      res.json({
        success: true,
        message: 'Salary structure deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete salary structure',
        error: error.message
      });
    }
  }
}

module.exports = SalaryStructureController;

