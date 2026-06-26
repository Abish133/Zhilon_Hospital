const { User, Employee, Department, Hospital, Doctor } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendPasswordResetEmail } = require('../utils/mailer');

const VALID_ROLES = ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Radiologist', 'Receptionist', 'Accountant', 'HR', 'Employee'];

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role, employee_id, doctor_id, hospital_id } = req.body;

      if (!name || !email || !password || !hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, and hospital_id are required'
        });
      }

      if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        employee_id,
        doctor_id,
        hospital_id
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const hospital = await Hospital.findByPk(hospital_id);
      let employee = null;
      let doctor = null;
      
      if (employee_id) {
        employee = await Employee.findByPk(employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = {
            ...employee.toJSON(),
            department: department || null
          };
        }
      }
      
      if (doctor_id) {
        doctor = await Doctor.findByPk(doctor_id);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospital_id: hospital_id,
          employee: employee,
          doctor: doctor,
          hospital: hospital ? {
            id: hospital.id,
            hospitalName: hospital.hospitalName
          } : null,
          token
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/Username and password are required'
        });
      }

      const { Op } = require('sequelize');
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { name: email }
          ],
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const hospital = await Hospital.findByPk(user.hospital_id);
      let employee = null;
      let doctor = null;
      
      if (user.employee_id) {
        employee = await Employee.findByPk(user.employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = {
            ...employee.toJSON(),
            department: department || null
          };
        }
      }
      
      if (user.doctor_id) {
        doctor = await Doctor.findByPk(user.doctor_id);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospital_id: user.hospital_id,
          employee: employee,
          doctor: doctor,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          token
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const hospital = await Hospital.findByPk(user.hospital_id);
      let employee = null;
      if (user.employee_id) {
        employee = await Employee.findByPk(user.employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = {
            ...employee.toJSON(),
            department: department || null
          };
        }
      }

      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          employee: employee,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      if (email) {
        const { Op } = require('sequelize');
        const exists = await User.findOne({ where: { email, id: { [Op.ne]: req.user.id } } });
        if (exists) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }

      await User.update(updateData, {
        where: { id: req.user.id },
        individualHooks: true
      });

      const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(user.hospital_id);
      let employee = null;
      if (user.employee_id) {
        employee = await Employee.findByPk(user.employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = { ...employee.toJSON(), department: department || null };
        }
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...user.toJSON(),
          employee,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const valid = await user.validatePassword(current_password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = new_password;
      await user.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Public: request a password reset link by email. Always responds success so
  // the endpoint can't be used to enumerate which emails have accounts.
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const genericResponse = {
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.'
      };

      const user = await User.findOne({ where: { email, isActive: true } });
      if (!user) {
        return res.json(genericResponse);
      }

      // Generate a random token; store only its hash so a DB leak can't be used
      // to reset passwords. The raw token travels only in the emailed link.
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.reset_token_hash = hashResetToken(rawToken);
      user.reset_token_expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      // Per-tenant email: use this hospital's own SMTP if it has configured one,
      // otherwise the mailer falls back to the platform-level SMTP_* env vars.
      const hospital = await Hospital.findByPk(user.hospital_id);
      const tenantSmtp = hospital?.settings?.smtp;

      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl, {
          smtp: tenantSmtp,
          hospitalName: hospital?.hospitalName
        });
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr.message);
        // Roll back the token so a failed send doesn't leave a dangling reset.
        user.reset_token_hash = null;
        user.reset_token_expires = null;
        await user.save();
        return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
      }

      res.json(genericResponse);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Public: complete a reset using the emailed token.
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const user = await User.findOne({
        where: {
          reset_token_hash: hashResetToken(token),
          reset_token_expires: { [Op.gt]: new Date() },
          isActive: true
        }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' });
      }

      user.password = password; // hashed by the beforeUpdate hook
      user.reset_token_hash = null;
      user.reset_token_expires = null;
      await user.save();

      res.json({ success: true, message: 'Password reset successfully. You can now sign in with your new password.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        where: { 
          isActive: true,
          hospital_id: req.hospitalId
        },
        attributes: { exclude: ['password'] }
      });

      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          const hospital = await Hospital.findByPk(user.hospital_id);
          let employee = null;
          if (user.employee_id) {
            employee = await Employee.findByPk(user.employee_id);
            if (employee && employee.department_id) {
              const department = await Department.findByPk(employee.department_id);
              employee = {
                ...employee.toJSON(),
                department: department || null
              };
            }
          }
          return {
            ...user.toJSON(),
            employee: employee,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: usersWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await User.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.hospitalId
        },
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const hospital = await Hospital.findByPk(user.hospital_id);
      let employee = null;
      if (user.employee_id) {
        employee = await Employee.findByPk(user.employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = {
            ...employee.toJSON(),
            department: department || null
          };
        }
      }

      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          employee: employee,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { isActive, password, ...updateData } = req.body;

      if (isActive === 0 || isActive === false) {
        const [updated] = await User.update(
          { isActive: false },
          { where: { id: req.params.id, hospital_id: req.hospitalId }, individualHooks: true }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        const deactivatedUser = await User.findByPk(req.params.id, {
          attributes: { exclude: ['password'] }
        });
        const hospital = await Hospital.findByPk(deactivatedUser.hospital_id);
        return res.json({
          success: true,
          message: 'User deactivated successfully',
          data: {
            ...deactivatedUser.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          }
        });
      }

      if (updateData.role && !VALID_ROLES.includes(updateData.role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`
        });
      }

      const dataToUpdate = { ...updateData, isActive: isActive !== undefined ? isActive : true };
      if (password) {
        dataToUpdate.password = password;
      }

      const [updated] = await User.update(dataToUpdate, {
        where: { id: req.params.id, hospital_id: req.hospitalId },
        individualHooks: true
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const updatedUser = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      const hospital = await Hospital.findByPk(updatedUser.hospital_id);
      let employee = null;
      if (updatedUser.employee_id) {
        employee = await Employee.findByPk(updatedUser.employee_id);
        if (employee && employee.department_id) {
          const department = await Department.findByPk(employee.department_id);
          employee = {
            ...employee.toJSON(),
            department: department || null
          };
        }
      }

      res.json({
        success: true,
        data: {
          ...updatedUser.toJSON(),
          employee: employee,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const deleted = await User.destroy({
        where: { id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AuthController;