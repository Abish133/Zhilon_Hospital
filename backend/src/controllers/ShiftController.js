'use strict';
const { Shift, Hospital } = require('../models');
const { Op } = require('sequelize');

class ShiftController {
  // Get all shifts
  static async getAll(req, res) {
    try {
      const { hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {
        is_active: true
      };

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      const shifts = await Shift.findAll({
        where: whereClause,
        include: [
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName']
          }
        ],
        order: [['start_time', 'ASC']]
      });

      res.json({
        success: true,
        data: shifts
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shifts',
        error: error.message
      });
    }
  }

  // Get shift by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        shift_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const shift = await Shift.findOne({
        where: whereClause,
        include: [
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName']
          }
        ]
      });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found'
        });
      }

      res.json({
        success: true,
        data: shift
      });
    } catch (error) {
      console.error('Error fetching shift:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shift',
        error: error.message
      });
    }
  }

  // Create shift
  static async create(req, res) {
    try {
      const { shift_name, start_time, end_time, hospital_id } = req.body;
      const hospitalId = hospital_id || req.user?.hospital_id;

      if (!shift_name || !start_time || !end_time || !hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'shift_name, start_time, end_time, and hospital_id are required'
        });
      }

      // Calculate duration
      const start = new Date(`2000-01-01 ${start_time}`);
      const end = new Date(`2000-01-01 ${end_time}`);
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      const diffMs = end - start;
      const duration_hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

      const shift = await Shift.create({
        shift_name,
        start_time,
        end_time,
        duration_hours,
        hospital_id: hospitalId
      });

      const shiftWithHospital = await Shift.findByPk(shift.shift_id, {
        include: [
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: shiftWithHospital
      });
    } catch (error) {
      console.error('Error creating shift:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.errors.map(e => `${e.path}: ${e.message}`)
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create shift',
        error: error.message
      });
    }
  }

  // Update shift
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { shift_name, start_time, end_time } = req.body;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        shift_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const shift = await Shift.findOne({ where: whereClause });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found'
        });
      }

      const updateData = {};
      if (shift_name) updateData.shift_name = shift_name;
      if (start_time) updateData.start_time = start_time;
      if (end_time) updateData.end_time = end_time;

      // Recalculate duration if times changed
      if (start_time || end_time) {
        const start = new Date(`2000-01-01 ${start_time || shift.start_time}`);
        const end = new Date(`2000-01-01 ${end_time || shift.end_time}`);
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        const diffMs = end - start;
        updateData.duration_hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      }

      await shift.update(updateData);

      const updatedShift = await Shift.findByPk(shift.shift_id, {
        include: [
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Shift updated successfully',
        data: updatedShift
      });
    } catch (error) {
      console.error('Error updating shift:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shift',
        error: error.message
      });
    }
  }

  // Delete shift (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        shift_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const shift = await Shift.findOne({ where: whereClause });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found'
        });
      }

      await shift.update({ is_active: false });

      res.json({
        success: true,
        message: 'Shift deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete shift',
        error: error.message
      });
    }
  }
}

module.exports = ShiftController;

