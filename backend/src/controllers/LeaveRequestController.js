const { LeaveRequest, Employee, User, EmployeeAttendance, sequelize } = require('../models');
const { Op } = require('sequelize');

class LeaveRequestController {
  static async createLeaveRequest(req, res) {
    const t = await sequelize.transaction();
    try {
      const { employee_id, leave_type, from_date, to_date, reason } = req.body;

      if (!employee_id || !leave_type || !from_date || !to_date || !reason) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'employee_id, leave_type, from_date, to_date, and reason are required'
        });
      }

      // Verify employee exists
      const employee = await Employee.findByPk(employee_id, { transaction: t });
      if (!employee) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Calculate number of days
      const startDate = new Date(from_date);
      const endDate = new Date(to_date);
      const noOfDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

      if (noOfDays <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      const hospital_id = req.user?.hospital_id;
      const leaveRequest = await LeaveRequest.create({
        employee_id,
        leave_type,
        from_date: startDate,
        to_date: endDate,
        no_of_days: noOfDays,
        reason,
        status: 'pending',
        requested_date: new Date(),
        hospital_id
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Leave request created successfully',
        data: leaveRequest
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const { status, employee_id, from_date, to_date } = req.query;
      const where = {};

      if (status) where.status = status;
      if (employee_id) where.employee_id = employee_id;
      if (hospital_id) where.hospital_id = hospital_id;

      if (from_date && to_date) {
        where.from_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)]
        };
      }

      const requests = await LeaveRequest.findAll({
        where,
        include: [
          // The LeaveRequest.belongsTo(Employee) association uses `as: 'employee'`
          // — matching aliases here is required, otherwise Sequelize throws EagerLoadingError.
          { model: Employee, as: 'employee', attributes: ['employee_id', 'full_name', 'emp_code'] },
          { model: User, as: 'approver', attributes: ['id', 'name'] }
        ],
        order: [['requested_date', 'DESC']]
      });

      res.json({
        success: true,
        data: requests,
        count: requests.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const request = await LeaveRequest.findByPk(req.params.id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (!request || (hospital_id && request.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      res.json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByEmployee(req, res) {
    try {
      const { employee_id } = req.params;
      const hospital_id = req.user?.hospital_id;
      const where = { employee_id };
      if (hospital_id) where.hospital_id = hospital_id;

      const requests = await LeaveRequest.findAll({
        where,
        include: [
          { model: User, as: 'approver', attributes: ['id', 'name'] }
        ],
        order: [['requested_date', 'DESC']]
      });

      res.json({
        success: true,
        data: requests,
        count: requests.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async approveLeaveRequest(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { approval_comments } = req.body;
      const approver_id = req.user?.id;
      const hospital_id = req.user?.hospital_id;

      if (!approver_id) {
        await t.rollback();
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const leaveRequest = await LeaveRequest.findByPk(id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!leaveRequest || (hospital_id && leaveRequest.hospital_id !== hospital_id)) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      if (leaveRequest.status !== 'pending') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Leave request cannot be approved. Current status: ${leaveRequest.status}`
        });
      }

      await leaveRequest.update({
        status: 'approved',
        approved_by: approver_id,
        approval_date: new Date(),
        approval_comments: approval_comments || null
      }, { transaction: t });

      // Create attendance entries for every day in the leave window so payroll prorating
      // treats the period correctly. Paid leave types -> 'Leave' (paid), 'unpaid' -> 'Absent'.
      // Idempotent: skip dates that already have an attendance row.
      const isUnpaid = leaveRequest.leave_type === 'unpaid';
      const attendanceStatus = isUnpaid ? 'Absent' : 'Leave';
      const fromDate = new Date(leaveRequest.from_date);
      const toDate = new Date(leaveRequest.to_date);
      const attendanceRows = [];
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        const existing = await EmployeeAttendance.findOne({
          where: { employee_id: leaveRequest.employee_id, attendance_date: dateStr },
          transaction: t
        });
        if (!existing) {
          attendanceRows.push({
            employee_id: leaveRequest.employee_id,
            attendance_date: dateStr,
            status: attendanceStatus,
            remarks: `Auto: ${leaveRequest.leave_type} leave (request #${leaveRequest.id})`,
            hospital_id: leaveRequest.hospital_id
          });
        }
      }
      if (attendanceRows.length) {
        await EmployeeAttendance.bulkCreate(attendanceRows, { transaction: t });
      }

      await t.commit();

      res.json({
        success: true,
        message: 'Leave request approved successfully',
        data: { leaveRequest, attendance_entries_created: attendanceRows.length }
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async rejectLeaveRequest(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const approver_id = req.user?.id;
      const hospital_id = req.user?.hospital_id;

      if (!approver_id) {
        await t.rollback();
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!rejection_reason) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const leaveRequest = await LeaveRequest.findByPk(id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!leaveRequest || (hospital_id && leaveRequest.hospital_id !== hospital_id)) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      if (leaveRequest.status !== 'pending') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Leave request cannot be rejected. Current status: ${leaveRequest.status}`
        });
      }

      await leaveRequest.update({
        status: 'rejected',
        approved_by: approver_id,
        approval_date: new Date(),
        rejection_reason
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Leave request rejected successfully',
        data: leaveRequest
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLeaveStats(req, res) {
    try {
      const { employee_id } = req.query;
      const hospital_id = req.user?.hospital_id;
      const where = {};
      if (employee_id) where.employee_id = employee_id;
      if (hospital_id) where.hospital_id = hospital_id;

      const stats = await LeaveRequest.findAll({
        where: {
          ...where,
          status: 'approved'
        },
        attributes: [
          'leave_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('no_of_days')), 'total_days']
        ],
        group: ['leave_type'],
        raw: true
      });

      const summary = {
        casual: { count: 0, total_days: 0 },
        medical: { count: 0, total_days: 0 },
        earned: { count: 0, total_days: 0 },
        unpaid: { count: 0, total_days: 0 }
      };

      for (const stat of stats) {
        if (summary[stat.leave_type]) {
          summary[stat.leave_type] = {
            count: parseInt(stat.count),
            total_days: parseFloat(stat.total_days || 0)
          };
        }
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LeaveRequestController;
