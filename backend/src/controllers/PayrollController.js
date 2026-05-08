'use strict';
const { Payroll, Employee, SalaryStructure, EmployeeAttendance, Hospital, User, Department } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class PayrollController {
  // Get all payroll records
  static async getAll(req, res) {
    try {
      const { month, year, employee_id, status, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {};

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (month) {
        whereClause.month = parseInt(month);
      }

      if (year) {
        whereClause.year = parseInt(year);
      }

      if (employee_id) {
        whereClause.employee_id = employee_id;
      }

      if (status) {
        whereClause.status = status;
      }

      const payrolls = await Payroll.findAll({
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
        order: [['year', 'DESC'], ['month', 'DESC'], ['employee_id', 'ASC']]
      });

      res.json({
        success: true,
        data: payrolls
      });
    } catch (error) {
      console.error('Error fetching payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll',
        error: error.message
      });
    }
  }

  // Get payroll by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        payroll_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          },
          {
            model: User,
            as: 'generator',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: User,
            as: 'processor',
            attributes: ['id', 'name', 'email'],
            required: false
          }
        ]
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found'
        });
      }

      res.json({
        success: true,
        data: payroll
      });
    } catch (error) {
      console.error('Error fetching payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll',
        error: error.message
      });
    }
  }

  // Generate payroll for month/year
  static async generate(req, res) {
    try {
      const { month, year, department_id, hospital_id } = req.body;
      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!month || !year || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'month, year, and hospital_id are required'
        });
      }

      // Validate month
      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }

      // Check if payroll already exists. Scope this by department too so the
      // user can generate per-department incrementally (department A in pass 1,
      // department B in pass 2) without the second pass being blocked.
      const existingWhere = {
        month: parseInt(month),
        year: parseInt(year),
        hospital_id: hospitalId
      };
      if (department_id) {
        // Limit "exists" check to employees in the chosen department.
        const deptEmps = await Employee.findAll({
          where: { hospital_id: hospitalId, department_id },
          attributes: ['employee_id']
        });
        const deptEmpIds = deptEmps.map(e => e.employee_id);
        if (deptEmpIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No employees exist in the selected department.'
          });
        }
        existingWhere.employee_id = deptEmpIds;
      }
      const existingPayroll = await Payroll.findAll({ where: existingWhere });

      if (existingPayroll.length > 0) {
        const scope = department_id ? `the selected department for ${month}/${year}` : `${month}/${year}`;
        return res.status(400).json({
          success: false,
          message: `Payroll for ${scope} already exists. Delete the existing payrolls first or pick a different period.`,
          data: existingPayroll
        });
      }

      // Get target employees, with diagnostic counts so the error tells the
      // user exactly what's missing instead of a generic "not found".
      const totalInHospital = await Employee.count({ where: { hospital_id: hospitalId } });
      const activeInHospital = await Employee.count({ where: { hospital_id: hospitalId, is_active: true } });

      const employeeWhere = {
        hospital_id: hospitalId,
        is_active: true
      };
      if (department_id) {
        employeeWhere.department_id = department_id;
      }

      const employees = await Employee.findAll({ where: employeeWhere });

      if (employees.length === 0) {
        // Compose an actionable message explaining which filter eliminated everyone.
        let detail;
        if (totalInHospital === 0) {
          detail = 'There are no employees registered for this hospital. Add employees under HR → Employees first.';
        } else if (activeInHospital === 0) {
          detail = `${totalInHospital} employee(s) exist for this hospital but none are marked active. Activate them under HR → Employees.`;
        } else if (department_id) {
          detail = `No active employees in the selected department. The hospital has ${activeInHospital} active employee(s) overall — try removing the department filter or pick a different department.`;
        } else {
          detail = `Unexpected: ${activeInHospital} active employee(s) exist but none matched. Please report this.`;
        }
        return res.status(400).json({
          success: false,
          message: detail,
          stats: {
            employees_in_hospital: totalInHospital,
            active_employees_in_hospital: activeInHospital,
            department_filter_applied: !!department_id
          }
        });
      }

      const generatedPayrolls = [];
      const errors = [];

      // Get days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      for (const employee of employees) {
        try {
          // Get salary structure
          const salaryStructure = await SalaryStructure.findOne({
            where: {
              employee_id: employee.employee_id,
              hospital_id: hospitalId,
              is_active: true,
              [Op.or]: [
                { effective_to: null },
                { effective_to: { [Op.gte]: startDate } }
              ],
              effective_from: { [Op.lte]: endDate }
            },
            order: [['effective_from', 'DESC']]
          });

          if (!salaryStructure) {
            errors.push({
              employee_id: employee.employee_id,
              employee_name: employee.full_name,
              error: 'No active salary structure found'
            });
            continue;
          }

          // Get attendance for the month
          const attendance = await EmployeeAttendance.findAll({
            where: {
              employee_id: employee.employee_id,
              attendance_date: {
                [Op.between]: [startDate, endDate]
              }
            }
          });

          const fullDays = attendance.filter(a => a.status === 'Present').length;
          const halfDays = attendance.filter(a => a.status === 'Half Day').length;
          // Paid leave (Casual/Medical/Earned) is recorded as status 'Leave' and counts as a worked day for pay.
          // Unpaid leave is recorded as 'Absent' so the absence reduces prorated salary.
          const leaveDays = attendance.filter(a => a.status === 'Leave').length;
          const daysAbsent = attendance.filter(a => a.status === 'Absent').length;
          const overtimeHours = attendance.reduce((sum, a) => sum + (parseFloat(a.overtime_hours) || 0), 0);

          // Half Day counts as 0.5 working day for proration (India payroll norm).
          // Paid leave counts as a full day so monthly salary is unaffected.
          const effectiveDaysWorked = fullDays + halfDays * 0.5 + leaveDays;

          // Calculate salary components
          const basicSalary = parseFloat(salaryStructure.basic_salary) || 0;
          const hra = parseFloat(salaryStructure.hra) || 0;
          const medicalAllowance = parseFloat(salaryStructure.medical_allowance) || 0;
          const transportAllowance = parseFloat(salaryStructure.transport_allowance) || 0;
          const otherAllowances = parseFloat(salaryStructure.other_allowances) || 0;

          const proratedBasic = (basicSalary / daysInMonth) * effectiveDaysWorked;
          const proratedHra = (hra / daysInMonth) * effectiveDaysWorked;
          const proratedMedical = (medicalAllowance / daysInMonth) * effectiveDaysWorked;
          const proratedTransport = (transportAllowance / daysInMonth) * effectiveDaysWorked;
          const proratedOther = (otherAllowances / daysInMonth) * effectiveDaysWorked;
          const totalAllowances = proratedHra + proratedMedical + proratedTransport + proratedOther;

          // Overtime pay: standard hourly = basic / (days * 8), OT multiplier 2x per Factories Act
          const hourlyRate = basicSalary / (daysInMonth * 8);
          const overtimePay = hourlyRate * 2 * overtimeHours;

          const grossSalary = proratedBasic + totalAllowances + overtimePay;

          // Deductions
          const pfAmount = (proratedBasic * (parseFloat(salaryStructure.pf_percentage) || 0)) / 100;
          const ptAmount = parseFloat(salaryStructure.pt_amount) || 0;
          const taxableAmount = Math.max(0, grossSalary - pfAmount - ptAmount);
          const tdsAmount = (taxableAmount * (parseFloat(salaryStructure.tds_percentage) || 0)) / 100;
          const otherDeductions = parseFloat(salaryStructure.other_deductions) || 0;
          const totalDeductions = pfAmount + ptAmount + tdsAmount + otherDeductions;

          const finalDeductions = totalDeductions; // absence already reduces prorated basic
          const netSalary = grossSalary - finalDeductions;

          // Create payroll record
          const payroll = await Payroll.create({
            employee_id: employee.employee_id,
            month: parseInt(month),
            year: parseInt(year),
            days_worked: effectiveDaysWorked,
            days_absent: daysAbsent,
            overtime_hours: overtimeHours,
            basic_salary: proratedBasic,
            total_allowances: totalAllowances,
            total_deductions: finalDeductions,
            gross_salary: grossSalary,
            net_salary: netSalary,
            status: 'Generated',
            hospital_id: hospitalId,
            generated_by: req.user?.id || null
          });

          generatedPayrolls.push(payroll);
        } catch (error) {
          errors.push({
            employee_id: employee.employee_id,
            employee_name: employee.full_name,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Generated ${generatedPayrolls.length} payroll records`,
        data: {
          generated: generatedPayrolls.length,
          total: employees.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error generating payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate payroll',
        error: error.message
      });
    }
  }

  // Approve payroll
  static async approve(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        payroll_id: id,
        status: 'Generated'
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({ where: whereClause });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found or already processed'
        });
      }

      await payroll.update({
        status: 'Approved',
        approved_by: req.user?.id || null,
        remarks: remarks || payroll.remarks
      });

      res.json({
        success: true,
        message: 'Payroll approved successfully',
        data: payroll
      });
    } catch (error) {
      console.error('Error approving payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve payroll',
        error: error.message
      });
    }
  }

  // Process payment
  static async process(req, res) {
    try {
      const { id } = req.params;
      const { payment_date, payment_mode, transaction_reference, remarks } = req.body;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        payroll_id: id,
        status: 'Approved'
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({ where: whereClause });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found or not approved'
        });
      }

      await payroll.update({
        status: 'Paid',
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        payment_mode: payment_mode || null,
        transaction_reference: transaction_reference || null,
        processed_by: req.user?.id || null,
        remarks: remarks || payroll.remarks
      });

      res.json({
        success: true,
        message: 'Payroll processed successfully',
        data: payroll
      });
    } catch (error) {
      console.error('Error processing payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payroll',
        error: error.message
      });
    }
  }

  // Adjust payroll
  static async adjust(req, res) {
    try {
      const { id } = req.params;
      const { component, amount, type, reason } = req.body;
      const hospital_id = req.user?.hospital_id;

      if (!component || amount === undefined || !type || !reason) {
        return res.status(400).json({
          success: false,
          message: 'component, amount, type, and reason are required'
        });
      }

      const whereClause = {
        payroll_id: id,
        status: { [Op.in]: ['Generated', 'Approved'] }
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({ where: whereClause });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found or already paid'
        });
      }

      const adjustmentAmount = parseFloat(amount);

      if (type === 'allowance') {
        await payroll.update({
          total_allowances: parseFloat(payroll.total_allowances) + adjustmentAmount,
          gross_salary: parseFloat(payroll.gross_salary) + adjustmentAmount,
          net_salary: parseFloat(payroll.net_salary) + adjustmentAmount,
          remarks: `${payroll.remarks || ''}\nAdjustment: ${component} ${type} ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} (${reason})`.trim()
        });
      } else if (type === 'deduction') {
        await payroll.update({
          total_deductions: parseFloat(payroll.total_deductions) + adjustmentAmount,
          net_salary: parseFloat(payroll.net_salary) - adjustmentAmount,
          remarks: `${payroll.remarks || ''}\nAdjustment: ${component} ${type} ${adjustmentAmount} (${reason})`.trim()
        });
      }

      res.json({
        success: true,
        message: 'Payroll adjusted successfully',
        data: payroll
      });
    } catch (error) {
      console.error('Error adjusting payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust payroll',
        error: error.message
      });
    }
  }

  // Generate payslip PDF
  static async getPayslip(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        payroll_id: id,
        status: 'Paid'
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'employee',
            // Pull bank/PAN/UAN/designation so the payslip can show full identity.
            attributes: [
              'employee_id', 'emp_code', 'full_name', 'mobile', 'email',
              'designation', 'role', 'joining_date',
              'bank_account_number', 'ifsc_code', 'pan_number', 'uan_number',
              'department_id'
            ],
            include: [
              { model: Department, as: 'department', attributes: ['id', 'department_name'] }
            ]
          },
          {
            model: Hospital,
            as: 'hospital'
          }
        ]
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found or not paid'
        });
      }

      const format = (req.query.format || 'pdf').toLowerCase();
      if (format === 'json') {
        return res.json({
          success: true,
          data: {
            payroll,
            payslip: {
              month: payroll.month,
              year: payroll.year,
              employee: payroll.employee,
              hospital: payroll.hospital,
              earnings: { basic: payroll.basic_salary, allowances: payroll.total_allowances, gross: payroll.gross_salary },
              deductions: { total: payroll.total_deductions, net: payroll.net_salary },
              payment_date: payroll.payment_date,
              payment_mode: payroll.payment_mode
            }
          }
        });
      }

      // Active salary structure for this employee during the payroll period.
      // Used to itemize the lump-sum allowances/deductions stored on Payroll.
      const periodEnd = new Date(payroll.year, payroll.month, 0); // last day of the month
      const structure = await SalaryStructure.findOne({
        where: {
          employee_id: payroll.employee_id,
          hospital_id: payroll.hospital_id,
          effective_from: { [Op.lte]: periodEnd },
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: periodEnd } }
          ]
        },
        order: [['effective_from', 'DESC']]
      });

      const { generatePayslipPDF } = require('../utils/pdfGenerator');
      generatePayslipPDF(res, {
        payroll: payroll.toJSON ? payroll.toJSON() : payroll,
        employee: payroll.employee,
        hospital: payroll.hospital,
        structure: structure ? (structure.toJSON ? structure.toJSON() : structure) : null
      });
    } catch (error) {
      console.error('Error generating payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate payslip',
        error: error.message
      });
    }
  }

  // Cancel payroll
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        payroll_id: id,
        status: { [Op.in]: ['Generated', 'Approved'] }
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const payroll = await Payroll.findOne({ where: whereClause });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found or cannot be cancelled'
        });
      }

      await payroll.update({
        status: 'Cancelled',
        remarks: remarks || payroll.remarks
      });

      res.json({
        success: true,
        message: 'Payroll cancelled successfully',
        data: payroll
      });
    } catch (error) {
      console.error('Error cancelling payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel payroll',
        error: error.message
      });
    }
  }
}

module.exports = PayrollController;

