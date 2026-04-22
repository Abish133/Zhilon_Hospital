'use strict';
const { AuditLog, User, Hospital } = require('../models');
const { Op } = require('sequelize');

class AuditLogController {
  // Get all audit logs with filters
  static async getAll(req, res) {
    try {
      const {
        from_date,
        to_date,
        user_id,
        action_type,
        entity_type,
        entity_id,
        ip_address,
        hospital_id,
        page = 1,
        limit = 50
      } = req.query;

      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {};

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (action_type) {
        whereClause.action_type = action_type;
      }

      if (entity_type) {
        whereClause.entity_type = entity_type;
      }

      if (entity_id) {
        whereClause.entity_id = entity_id;
      }

      if (ip_address) {
        whereClause.ip_address = ip_address;
      }

      if (from_date && to_date) {
        whereClause.createdAt = {
          [Op.between]: [new Date(from_date), new Date(to_date)]
        };
      } else if (from_date) {
        whereClause.createdAt = {
          [Op.gte]: new Date(from_date)
        };
      } else if (to_date) {
        whereClause.createdAt = {
          [Op.lte]: new Date(to_date)
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  }

  // Get audit log by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        log_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const log = await AuditLog.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: Hospital,
            as: 'hospital',
            attributes: ['id', 'hospitalName'],
            required: false
          }
        ]
      });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error: error.message
      });
    }
  }

  // Export audit logs
  static async export(req, res) {
    try {
      const {
        from_date,
        to_date,
        user_id,
        action_type,
        entity_type,
        hospital_id,
        format = 'csv'
      } = req.query;

      const hospitalId = hospital_id || req.user?.hospital_id;

      const whereClause = {};

      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (action_type) {
        whereClause.action_type = action_type;
      }

      if (entity_type) {
        whereClause.entity_type = entity_type;
      }

      if (from_date && to_date) {
        whereClause.createdAt = {
          [Op.between]: [new Date(from_date), new Date(to_date)]
        };
      }

      const logs = await AuditLog.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10000 // Limit export to prevent memory issues
      });

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'Timestamp,User,Action,Entity Type,Entity ID,Details,IP Address,User Agent\n';
        const csvRows = logs.map(log => {
          const timestamp = new Date(log.createdAt).toISOString();
          const user = log.user ? log.user.name : 'System';
          const action = log.action_type;
          const entityType = log.entity_type;
          const entityId = log.entity_id || '';
          const details = (log.details || '').replace(/"/g, '""');
          const ip = log.ip_address || '';
          const userAgent = (log.user_agent || '').replace(/"/g, '""');
          
          return `"${timestamp}","${user}","${action}","${entityType}","${entityId}","${details}","${ip}","${userAgent}"`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
        res.send(csvHeader + csvRows);
      } else {
        // Return JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
        res.json({
          success: true,
          data: logs
        });
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message
      });
    }
  }
}

module.exports = AuditLogController;

