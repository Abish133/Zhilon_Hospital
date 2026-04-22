const {
  Patient, OpdAppointment, IpdAdmission, Bill, BillCharge,
  Medicine, MedicineBatch, InventoryItem, StockIssue,
  Doctor, Department, sequelize
} = require('../models');
const { Op } = require('sequelize');

class ReportController {
  // Patient Statistics Report
  static async getPatientStatistics(req, res) {
    try {
      const { from_date, to_date, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;
      const where = {};
      if (hospitalId) where.hospital_id = hospitalId;

      if (from_date && to_date) {
        where.createdAt = {
          [Op.between]: [new Date(from_date), new Date(to_date)]
        };
      }

      const totalPatients = await Patient.count({ where });

      const opdWhere = hospitalId ? { hospital_id: hospitalId } : {};
      if (from_date && to_date) {
        opdWhere.appointment_date = { [Op.between]: [new Date(from_date), new Date(to_date)] };
      }
      const opdCount = await OpdAppointment.count({ where: opdWhere });

      const ipdAdmitWhere = hospitalId ? { hospital_id: hospitalId } : {};
      if (from_date && to_date) {
        ipdAdmitWhere.admission_date = { [Op.between]: [new Date(from_date), new Date(to_date)] };
      }
      const ipdAdmissions = await IpdAdmission.count({ where: ipdAdmitWhere });

      // Count discharges using IpdDischargeSummary table
      const { IpdDischargeSummary } = require('../models');
      const ipdDischargeWhere = hospitalId ? { hospital_id: hospitalId } : {};
      if (from_date && to_date) {
        ipdDischargeWhere.discharge_date = { [Op.between]: [new Date(from_date), new Date(to_date)] };
      }
      const ipdDischarges = await IpdDischargeSummary.count({ where: ipdDischargeWhere });

      res.json({
        success: true,
        data: {
          total_patients: totalPatients,
          opd_appointments: opdCount,
          ipd_admissions: ipdAdmissions,
          ipd_discharges: ipdDischarges
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Doctor Productivity Report
  static async getDoctorProductivity(req, res) {
    try {
      const { from_date, to_date, doctor_id, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (from_date && to_date) {
        filters.push(`AND (oa.appointment_date BETWEEN :from_date AND :to_date OR ia.admission_date BETWEEN :from_date AND :to_date)`);
        replacements.from_date = from_date;
        replacements.to_date = to_date;
      }
      if (doctor_id) {
        filters.push(`AND d.id = :doctor_id`);
        replacements.doctor_id = doctor_id;
      }
      if (hospitalId) {
        filters.push(`AND d.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          d.id,
          d.name,
          d.specialization,
          COUNT(DISTINCT oa.appointment_id) as total_opd_appointments,
          COUNT(DISTINCT ia.admission_id) as total_ipd_admissions,
          AVG(DATEDIFF(ids.discharge_date, ia.admission_date)) as avg_stay_days
        FROM doctors d
        LEFT JOIN opd_appointments oa ON d.id = oa.doctor_id
        LEFT JOIN ipd_admissions ia ON d.id = ia.admitting_doctor_id
        LEFT JOIN ipd_discharge_summary ids ON ia.admission_id = ids.admission_id
        WHERE 1=1
        ${filters.join(' ')}
        GROUP BY d.id, d.name, d.specialization
        ORDER BY total_opd_appointments DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Pharmacy Sales Report
  static async getPharmacySalesReport(req, res) {
    try {
      const { from_date, to_date, medicine_id, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (from_date && to_date) {
        filters.push(`AND ps.sale_date BETWEEN :from_date AND :to_date`);
        replacements.from_date = from_date;
        replacements.to_date = to_date;
      }
      if (medicine_id) {
        filters.push(`AND m.medicine_id = :medicine_id`);
        replacements.medicine_id = medicine_id;
      }
      if (hospitalId) {
        filters.push(`AND ps.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          m.medicine_id,
          m.medicine_name,
          mc.category_name,
          SUM(psd.quantity) as total_quantity_sold,
          SUM(psd.quantity * psd.rate) as total_sales_amount,
          COUNT(DISTINCT ps.sale_id) as total_transactions
        FROM medicines m
        LEFT JOIN medicine_categories mc ON m.category_id = mc.category_id
        LEFT JOIN pharmacy_sale_details psd ON m.medicine_id = psd.medicine_id
        LEFT JOIN pharmacy_sales ps ON psd.sale_id = ps.sale_id
        WHERE 1=1
        ${filters.join(' ')}
        GROUP BY m.medicine_id, m.medicine_name, mc.category_name
        ORDER BY total_sales_amount DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Inventory Expiry Report
  static async getInventoryExpiryReport(req, res) {
    try {
      const { from_date, to_date, category_id, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (from_date && to_date) {
        filters.push(`AND mb.expiry_date BETWEEN :from_date AND :to_date`);
        replacements.from_date = from_date;
        replacements.to_date = to_date;
      }
      if (category_id) {
        filters.push(`AND m.category_id = :category_id`);
        replacements.category_id = category_id;
      }
      if (hospitalId) {
        filters.push(`AND mb.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          mb.batch_id,
          m.medicine_name,
          mc.category_name,
          mb.batch_number,
          mb.available_quantity as quantity,
          mb.expiry_date,
          DATEDIFF(mb.expiry_date, CURDATE()) as days_until_expiry,
          CASE
            WHEN DATEDIFF(mb.expiry_date, CURDATE()) <= 0 THEN 'EXPIRED'
            WHEN DATEDIFF(mb.expiry_date, CURDATE()) <= 30 THEN 'EXPIRING_SOON'
            ELSE 'OK'
          END as status
        FROM medicine_batches mb
        JOIN medicines m ON mb.medicine_id = m.medicine_id
        LEFT JOIN medicine_categories mc ON m.category_id = mc.category_id
        WHERE mb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND mb.available_quantity > 0
        ${filters.join(' ')}
        ORDER BY mb.expiry_date ASC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      const summary = {
        expired: results.filter(r => r.status === 'EXPIRED').length,
        expiring_soon: results.filter(r => r.status === 'EXPIRING_SOON').length,
        all_items: results.length
      };

      res.json({ success: true, data: results, summary, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Outstanding Payments Report
  static async getOutstandingPaymentsReport(req, res) {
    try {
      const { hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (hospitalId) {
        filters.push(`AND b.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          b.bill_id,
          b.bill_number,
          p.patient_id,
          p.first_name,
          p.last_name,
          p.mobile_number as phone,
          b.net_amount as total_amount,
          COALESCE(b.paid_amount, 0) as paid_amount,
          COALESCE(b.balance_amount, b.net_amount) as outstanding_amount,
          b.bill_date,
          DATEDIFF(CURDATE(), b.bill_date) as days_outstanding
        FROM bills b
        JOIN patients p ON b.patient_id = p.patient_id
        WHERE b.payment_status IN ('Unpaid', 'Partial')
        ${filters.join(' ')}
        ORDER BY days_outstanding DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      const totalOutstanding = results.reduce((sum, item) => sum + parseFloat(item.outstanding_amount || 0), 0);

      res.json({
        success: true,
        data: results,
        summary: { total_bills: results.length, total_outstanding: totalOutstanding },
        count: results.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Bed Occupancy Report
  static async getBedOccupancyReport(req, res) {
    try {
      const { hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (hospitalId) {
        filters.push(`AND b.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          w.ward_id,
          w.ward_name,
          COUNT(b.bed_id) as total_beds,
          SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
          SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available_beds,
          CASE WHEN COUNT(b.bed_id) > 0
            THEN SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) * 100.0 / COUNT(b.bed_id)
            ELSE 0 END as occupancy_percentage
        FROM wards w
        LEFT JOIN beds b ON w.ward_id = b.ward_id
        WHERE 1=1
        ${filters.join(' ')}
        GROUP BY w.ward_id, w.ward_name
        ORDER BY occupancy_percentage DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Department Performance Report
  static async getDepartmentPerformance(req, res) {
    try {
      const { from_date, to_date, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (from_date && to_date) {
        filters.push(`AND (oa.appointment_date BETWEEN :from_date AND :to_date OR ia.admission_date BETWEEN :from_date AND :to_date)`);
        replacements.from_date = from_date;
        replacements.to_date = to_date;
      }
      if (hospitalId) {
        filters.push(`AND d.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          d.id,
          d.department_name as name,
          COUNT(DISTINCT oa.appointment_id) as total_opd_patients,
          COUNT(DISTINCT ia.admission_id) as total_ipd_patients,
          COALESCE(SUM(b.net_amount), 0) as total_revenue
        FROM departments d
        LEFT JOIN doctors doc ON d.id = doc.department_id
        LEFT JOIN opd_appointments oa ON doc.id = oa.doctor_id
        LEFT JOIN opd_visits ov ON oa.appointment_id = ov.appointment_id
        LEFT JOIN ipd_admissions ia ON doc.id = ia.admitting_doctor_id
        LEFT JOIN billing_episodes be
          ON be.opd_visit_id = ov.visit_id OR be.admission_id = ia.admission_id
        LEFT JOIN bills b ON b.episode_id = be.episode_id
        WHERE 1=1
        ${filters.join(' ')}
        GROUP BY d.id, d.department_name
        ORDER BY total_revenue DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Revenue Report
  static async getRevenueReport(req, res) {
    try {
      const { from_date, to_date, department_id, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (from_date && to_date) {
        filters.push(`AND b.bill_date BETWEEN :from_date AND :to_date`);
        replacements.from_date = from_date;
        replacements.to_date = to_date;
      }
      if (hospitalId) {
        filters.push(`AND b.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          DATE(b.bill_date) as bill_date,
          SUM(b.net_amount) as total_revenue,
          COUNT(DISTINCT b.bill_id) as total_bills,
          COUNT(DISTINCT b.patient_id) as total_patients
        FROM bills b
        LEFT JOIN patients p ON b.patient_id = p.patient_id
        WHERE b.payment_status != 'Cancelled'
        ${filters.join(' ')}
        GROUP BY DATE(b.bill_date)
        ORDER BY bill_date DESC
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      const totalRevenue = results.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);

      res.json({
        success: true,
        data: results,
        summary: {
          total_revenue: totalRevenue,
          total_bills: results.reduce((sum, item) => sum + Number(item.total_bills || 0), 0),
          total_patients: results.reduce((sum, item) => sum + Number(item.total_patients || 0), 0)
        },
        count: results.length
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Inventory Stock Report
  static async getInventoryStockReport(req, res) {
    try {
      const { category_id, low_stock_only, hospital_id } = req.query;
      const hospitalId = hospital_id || req.user?.hospital_id;

      const filters = [];
      const replacements = {};

      if (category_id) {
        filters.push(`AND ic.id = :category_id`);
        replacements.category_id = category_id;
      }
      if (low_stock_only) {
        filters.push(`AND ii.current_stock <= ii.reorder_level`);
      }
      if (hospitalId) {
        filters.push(`AND ii.hospital_id = :hospital_id`);
        replacements.hospital_id = hospitalId;
      }

      const query = `
        SELECT
          ic.id as category_id,
          ic.category_name,
          ii.id as item_id,
          ii.item_name,
          ii.current_stock,
          ii.reorder_level,
          ii.unit_price,
          (ii.current_stock * ii.unit_price) as stock_value,
          CASE
            WHEN ii.current_stock <= ii.reorder_level THEN 'LOW_STOCK'
            WHEN ii.current_stock <= (ii.reorder_level * 1.5) THEN 'MEDIUM_STOCK'
            ELSE 'SUFFICIENT'
          END as stock_status
        FROM inventory_categories ic
        LEFT JOIN inventory_items ii ON ic.id = ii.category_id
        WHERE 1=1
        ${filters.join(' ')}
        ORDER BY ic.category_name, ii.item_name
      `;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ReportController;
