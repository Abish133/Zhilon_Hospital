'use strict';
const { EmployeeRoster, Employee, Shift, Hospital, User } = require('../models');
const { Op } = require('sequelize');

class RosterController {
  // Get all roster entries
  static async getAll(req, res) {
    try {
      const { employee_id, start_date, end_date, shift_id, status, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {};

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (employee_id) {
        whereClause.employee_id = employee_id;
      }

      if (shift_id) {
        whereClause.shift_id = shift_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (start_date && end_date) {
        whereClause.roster_date = {
          [Op.between]: [start_date, end_date]
        };
      } else if (start_date) {
        whereClause.roster_date = {
          [Op.gte]: start_date
        };
      } else if (end_date) {
        whereClause.roster_date = {
          [Op.lte]: end_date
        };
      }

      const rosters = await EmployeeRoster.findAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          },
          {
            model: Shift,
            as: 'shift',
            attributes: ['shift_id', 'shift_name', 'start_time', 'end_time']
          },
          {
            model: Employee,
            as: 'swapWithEmployee',
            attributes: ['employee_id', 'emp_code', 'full_name'],
            required: false
          }
        ],
        order: [['roster_date', 'ASC'], ['employee_id', 'ASC']]
      });

      res.json({
        success: true,
        data: rosters
      });
    } catch (error) {
      console.error('Error fetching roster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roster',
        error: error.message
      });
    }
  }

  // Create single roster entry
  static async create(req, res) {
    try {
      const { employee_id, shift_id, roster_date, remarks, hospital_id } = req.body;
      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!employee_id || !shift_id || !roster_date || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'employee_id, shift_id, roster_date, and hospital_id are required'
        });
      }

      // Check if employee already has a shift on this date
      const existingRoster = await EmployeeRoster.findOne({
        where: {
          employee_id,
          roster_date,
          hospital_id: hospitalId
        }
      });

      if (existingRoster) {
        return res.status(400).json({
          success: false,
          message: 'Employee already has a shift assigned on this date'
        });
      }

      const roster = await EmployeeRoster.create({
        employee_id,
        shift_id,
        roster_date,
        remarks: remarks || null,
        hospital_id: hospitalId,
        created_by: req.user?.id || null,
        status: 'Scheduled'
      });

      const rosterWithDetails = await EmployeeRoster.findByPk(roster.roster_id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          },
          {
            model: Shift,
            as: 'shift',
            attributes: ['shift_id', 'shift_name', 'start_time', 'end_time']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Roster entry created successfully',
        data: rosterWithDetails
      });
    } catch (error) {
      console.error('Error creating roster:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Employee already has a shift on this date'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create roster entry',
        error: error.message
      });
    }
  }

  // Bulk create roster entries
  static async bulkCreate(req, res) {
    try {
      const { employee_ids, shift_id, start_date, end_date, hospital_id } = req.body;
      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'employee_ids array is required'
        });
      }

      if (!shift_id || !start_date || !end_date || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'shift_id, start_date, end_date, and hospital_id are required'
        });
      }

      const rosterEntries = [];
      const errors = [];
      const start = new Date(start_date);
      const end = new Date(end_date);

      // Generate dates between start and end
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Create roster entries for each employee and date
      for (const employee_id of employee_ids) {
        for (const date of dates) {
          try {
            // Check if entry already exists
            const existing = await EmployeeRoster.findOne({
              where: {
                employee_id,
                roster_date: date,
                hospital_id: hospitalId
              }
            });

            if (!existing) {
              rosterEntries.push({
                employee_id,
                shift_id,
                roster_date: date,
                hospital_id: hospitalId,
                created_by: req.user?.id || null,
                status: 'Scheduled',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (error) {
            errors.push({
              employee_id,
              date,
              error: error.message
            });
          }
        }
      }

      if (rosterEntries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No new roster entries to create (all may already exist)',
          errors
        });
      }

      const created = await EmployeeRoster.bulkCreate(rosterEntries, {
        ignoreDuplicates: true
      });

      res.status(201).json({
        success: true,
        message: `Created ${created.length} roster entries`,
        data: {
          created: created.length,
          total: rosterEntries.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error bulk creating roster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk create roster entries',
        error: error.message
      });
    }
  }

  // Update roster entry
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { shift_id, status, remarks, leave_type } = req.body;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        roster_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const roster = await EmployeeRoster.findOne({ where: whereClause });

      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster entry not found'
        });
      }

      const updateData = {};
      if (shift_id) updateData.shift_id = shift_id;
      if (status) updateData.status = status;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (leave_type) updateData.leave_type = leave_type;

      await roster.update(updateData);

      const updatedRoster = await EmployeeRoster.findByPk(roster.roster_id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'emp_code', 'full_name']
          },
          {
            model: Shift,
            as: 'shift',
            attributes: ['shift_id', 'shift_name', 'start_time', 'end_time']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Roster entry updated successfully',
        data: updatedRoster
      });
    } catch (error) {
      console.error('Error updating roster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update roster entry',
        error: error.message
      });
    }
  }

  // Delete roster entry
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        roster_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const roster = await EmployeeRoster.findOne({ where: whereClause });

      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster entry not found'
        });
      }

      await roster.destroy();

      res.json({
        success: true,
        message: 'Roster entry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting roster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete roster entry',
        error: error.message
      });
    }
  }

  // Request shift swap
  static async requestSwap(req, res) {
    try {
      const { roster_id, swap_with_employee_id, swap_date } = req.body;
      const hospital_id = req.user?.hospital_id;

      if (!roster_id || !swap_with_employee_id || !swap_date) {
        return res.status(400).json({
          success: false,
          message: 'roster_id, swap_with_employee_id, and swap_date are required'
        });
      }

      const roster = await EmployeeRoster.findOne({
        where: {
          roster_id,
          hospital_id: hospital_id
        }
      });

      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster entry not found'
        });
      }

      // Check if swap employee has a shift on swap_date
      const swapRoster = await EmployeeRoster.findOne({
        where: {
          employee_id: swap_with_employee_id,
          roster_date: swap_date,
          hospital_id: hospital_id
        }
      });

      if (!swapRoster) {
        return res.status(400).json({
          success: false,
          message: 'Swap employee does not have a shift on the specified date'
        });
      }

      // Update both roster entries
      await roster.update({
        status: 'Swap Requested',
        swap_with_employee_id,
        remarks: `Swap requested with employee ${swap_with_employee_id} for ${swap_date}`
      });

      res.json({
        success: true,
        message: 'Swap request created. Waiting for approval.',
        data: {
          roster_id: roster.roster_id,
          status: 'Swap Requested'
        }
      });
    } catch (error) {
      console.error('Error requesting swap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request swap',
        error: error.message
      });
    }
  }

  // Approve swap
  static async approveSwap(req, res) {
    try {
      const { roster_id } = req.params;
      const { approve } = req.body; // true or false
      const hospital_id = req.user?.hospital_id;

      const roster = await EmployeeRoster.findOne({
        where: {
          roster_id,
          hospital_id: hospital_id,
          status: 'Swap Requested'
        }
      });

      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Swap request not found'
        });
      }

      if (approve) {
        // Swap the shifts
        const swapRoster = await EmployeeRoster.findOne({
          where: {
            employee_id: roster.swap_with_employee_id,
            roster_date: roster.roster_date,
            hospital_id: hospital_id
          }
        });

        if (swapRoster) {
          const tempShiftId = roster.shift_id;
          await roster.update({
            shift_id: swapRoster.shift_id,
            status: 'Confirmed'
          });
          await swapRoster.update({
            shift_id: tempShiftId,
            status: 'Confirmed'
          });
        }

        res.json({
          success: true,
          message: 'Swap approved and shifts exchanged'
        });
      } else {
        await roster.update({
          status: 'Scheduled',
          swap_with_employee_id: null,
          remarks: 'Swap request rejected'
        });

        res.json({
          success: true,
          message: 'Swap request rejected'
        });
      }
    } catch (error) {
      console.error('Error approving swap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve swap',
        error: error.message
      });
    }
  }

  // Mark as leave
  static async markLeave(req, res) {
    try {
      const { id } = req.params;
      const { leave_type, remarks } = req.body;
      const hospital_id = req.user?.hospital_id;

      if (!leave_type) {
        return res.status(400).json({
          success: false,
          message: 'leave_type is required'
        });
      }

      const roster = await EmployeeRoster.findOne({
        where: {
          roster_id: id,
          hospital_id: hospital_id
        }
      });

      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster entry not found'
        });
      }

      await roster.update({
        status: 'On Leave',
        leave_type,
        remarks: remarks || null
      });

      res.json({
        success: true,
        message: 'Roster marked as leave',
        data: roster
      });
    } catch (error) {
      console.error('Error marking leave:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark leave',
        error: error.message
      });
    }
  }

  // Generate monthly roster
  static async generateMonthly(req, res) {
    try {
      const { month, year, hospital_id, rotation_pattern } = req.body;
      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!month || !year || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'month, year, and hospital_id are required'
        });
      }

      // Get all active employees
      const employees = await Employee.findAll({
        where: {
          hospital_id: hospitalId,
          is_active: true
        }
      });

      // Get all active shifts
      const shifts = await Shift.findAll({
        where: {
          hospital_id: hospitalId,
          is_active: true
        },
        order: [['start_time', 'ASC']]
      });

      if (shifts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No shifts found. Please create shifts first.'
        });
      }

      // Get days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const rosterEntries = [];

      for (const employee of employees) {
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Simple rotation: assign shifts in order, rotating by day
          const shiftIndex = (day - 1) % shifts.length;
          const shift = shifts[shiftIndex];

          // Check if entry already exists
          const existing = await EmployeeRoster.findOne({
            where: {
              employee_id: employee.employee_id,
              roster_date: date,
              hospital_id: hospitalId
            }
          });

          if (!existing) {
            rosterEntries.push({
              employee_id: employee.employee_id,
              shift_id: shift.shift_id,
              roster_date: date,
              hospital_id: hospitalId,
              created_by: req.user?.id || null,
              status: 'Scheduled',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      if (rosterEntries.length === 0) {
        return res.json({
          success: true,
          message: 'No new roster entries to create (all may already exist)',
          data: { created: 0 }
        });
      }

      const created = await EmployeeRoster.bulkCreate(rosterEntries, {
        ignoreDuplicates: true
      });

      res.status(201).json({
        success: true,
        message: `Generated ${created.length} roster entries for ${month}/${year}`,
        data: {
          created: created.length,
          total: rosterEntries.length,
          month,
          year
        }
      });
    } catch (error) {
      console.error('Error generating monthly roster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly roster',
        error: error.message
      });
    }
  }
}

module.exports = RosterController;

