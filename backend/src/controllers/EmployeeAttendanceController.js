const { EmployeeAttendance, Employee, Doctor } = require('../models');
const { Op } = require('sequelize');

// IST-safe date/time helpers. Server may run in UTC; attendance must use Asia/Kolkata.
const istParts = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date()).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return parts;
};
const today = () => {
  const p = istParts();
  return `${p.year}-${p.month}-${p.day}`;
};
const nowTime = () => {
  const p = istParts();
  // Intl gives "24" at midnight in some engines — normalise to "00".
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${hh}:${p.minute}:${p.second}`;
};

class EmployeeAttendanceController {
  // Resolve the Employee record for the authenticated user.
  // Order: explicit employee_id → email match → doctor's email match (Doctor users
  // typically have only doctor_id set, so we look up the Employee by their email).
  static async _resolveEmployee(req) {
    if (req.user?.employee_id) {
      const found = await Employee.findByPk(req.user.employee_id);
      if (found) return found;
    }
    if (req.user?.email) {
      const found = await Employee.findOne({ where: { email: req.user.email } });
      if (found) return found;
    }
    if (req.user?.doctor_id) {
      const doctor = await Doctor.findByPk(req.user.doctor_id);
      if (doctor?.email) {
        const found = await Employee.findOne({ where: { email: doctor.email } });
        if (found) return found;
      }
    }
    return null;
  }

  // GET /api/employee-attendance/today
  static async getToday(req, res) {
    try {
      const employee = await EmployeeAttendanceController._resolveEmployee(req);
      if (!employee) {
        return res.json({ success: true, data: null, message: 'No employee profile linked to this user.' });
      }
      const record = await EmployeeAttendance.findOne({
        where: {
          employee_id: employee.employee_id,
          attendance_date: today()
        }
      });
      res.json({
        success: true,
        data: record ? { ...record.toJSON(), employee: { employee_id: employee.employee_id, full_name: employee.full_name, emp_code: employee.emp_code } } : null
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/employee-attendance/check-in
  static async checkIn(req, res) {
    try {
      const employee = await EmployeeAttendanceController._resolveEmployee(req);
      if (!employee) return res.status(400).json({ success: false, message: 'No employee profile is linked to this user. Please ask HR to create your employee record (matching your login email) so attendance can be marked.' });

      const date = today();
      let record = await EmployeeAttendance.findOne({
        where: { employee_id: employee.employee_id, attendance_date: date }
      });
      if (record && record.check_in_time) {
        return res.status(400).json({ success: false, message: 'Already checked in today.' });
      }
      const payload = {
        employee_id: employee.employee_id,
        attendance_date: date,
        check_in_time: nowTime(),
        status: 'Present',
        hospital_id: req.user?.hospital_id || employee.hospital_id
      };
      record = record ? await record.update(payload) : await EmployeeAttendance.create(payload);
      res.json({ success: true, data: { ...record.toJSON(), employee: { employee_id: employee.employee_id, full_name: employee.full_name, emp_code: employee.emp_code } } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/employee-attendance/check-out
  static async checkOut(req, res) {
    try {
      const employee = await EmployeeAttendanceController._resolveEmployee(req);
      if (!employee) return res.status(400).json({ success: false, message: 'No employee profile is linked to this user. Please ask HR to create your employee record (matching your login email) so attendance can be marked.' });

      const record = await EmployeeAttendance.findOne({
        where: { employee_id: employee.employee_id, attendance_date: today() }
      });
      if (!record || !record.check_in_time) {
        return res.status(400).json({ success: false, message: 'Check-in required before check-out.' });
      }
      if (record.check_out_time) {
        return res.status(400).json({ success: false, message: 'Already checked out today.' });
      }
      await record.update({ check_out_time: nowTime() });
      res.json({ success: true, data: { ...record.toJSON(), employee: { employee_id: employee.employee_id, full_name: employee.full_name, emp_code: employee.emp_code } } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }


  static async createEmployeeAttendance(req, res) {
    try {
      if (!req.body.employee_id) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      if (!req.body.attendance_date) {
        return res.status(400).json({
          success: false,
          message: 'Attendance date is required'
        });
      }

      const employeeAttendance = await EmployeeAttendance.create(req.body);
      const employee = await Employee.findByPk(req.body.employee_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...employeeAttendance.toJSON(),
          employee: employee ? { id: employee.id, name: employee.name, employee_id: employee.employee_id } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllEmployeeAttendance(req, res) {
    try {
      const where = {};
      if (req.user?.hospital_id) where.hospital_id = req.user.hospital_id;
      if (req.query.date) where.attendance_date = req.query.date;
      else if (req.query.from_date && req.query.to_date) {
        where.attendance_date = { [Op.between]: [req.query.from_date, req.query.to_date] };
      }
      if (req.query.employee_id) where.employee_id = req.query.employee_id;

      const records = await EmployeeAttendance.findAll({
        where,
        order: [['attendance_date', 'DESC'], ['check_in_time', 'DESC']]
      });

      const empIds = [...new Set(records.map(r => r.employee_id))];
      const employees = empIds.length ? await Employee.findAll({ where: { employee_id: empIds } }) : [];
      const empMap = Object.fromEntries(employees.map(e => [e.employee_id, { employee_id: e.employee_id, full_name: e.full_name, emp_code: e.emp_code, role: e.role }]));

      res.json({
        success: true,
        data: records.map(r => ({ ...r.toJSON(), employee: empMap[r.employee_id] || null }))
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getEmployeeAttendanceById(req, res) {
    try {
      const employeeAttendance = await EmployeeAttendance.findOne({ where: { attendance_id: req.params.id, hospital_id: req.hospitalId } });
      if (!employeeAttendance) {
        return res.status(404).json({ success: false, message: 'Employee attendance record not found' });
      }
     
      const employee = await Employee.findByPk(employeeAttendance.employee_id);
     
      res.json({
        success: true,
        data: {
          ...employeeAttendance.toJSON(),
          employee: employee ? { id: employee.id, name: employee.name, employee_id: employee.employee_id } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateEmployeeAttendance(req, res) {
    try {
      const [updated] = await EmployeeAttendance.update(req.body, {
        where: { attendance_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Employee attendance record not found' });
      }
      const updatedAttendance = await EmployeeAttendance.findOne({ where: { attendance_id: req.params.id, hospital_id: req.hospitalId } });
      const employee = await Employee.findByPk(updatedAttendance.employee_id);
     
      res.json({
        success: true,
        data: {
          ...updatedAttendance.toJSON(),
          employee: employee ? { id: employee.id, name: employee.name, employee_id: employee.employee_id } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteEmployeeAttendance(req, res) {
    try {
      const deleted = await EmployeeAttendance.destroy({
        where: { attendance_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Employee attendance record not found' });
      }
      res.json({ success: true, message: 'Employee attendance record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = EmployeeAttendanceController;