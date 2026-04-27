'use strict';

const { Op, fn, col, literal } = require('sequelize');
const {
    OpdVisit,
    OpdAppointment,
    IpdAdmission,
    Bed,
    Bill,
    BillCharge,
    Payment,
    Doctor,
    Patient,
    MedicineBatch,
    InventoryItem,
    Hospital,
    StockIssue,
    Department,
    LabOrder
} = require('../models');

class ReportController {
    // GET /api/reports/dashboard-stats
    getDashboardStats = async (req, res) => {
        try {
            const hospitalId = req.user?.hospital_id || req.query.hospital_id || 1;
            const today = new Date();
            const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endToday = new Date(startToday);
            endToday.setDate(endToday.getDate() + 1);
            const startYesterday = new Date(startToday);
            startYesterday.setDate(startYesterday.getDate() - 1);

            const todayDateStr = startToday.toISOString().slice(0, 10);
            const yesterdayDateStr = startYesterday.toISOString().slice(0, 10);

            const safe = async (p, fallback = 0) => {
                try { return await p; } catch (e) { console.error('dashboard-stats sub-query failed:', e.message); return fallback; }
            };

            const [
                totalPatients,
                patientsYesterday,
                opdToday,
                opdYesterday,
                ipdActive,
                ipdAdmittedToday,
                ipdAdmittedYesterday,
                revenueTodayRow,
                revenueYesterdayRow,
                pendingBills,
                pendingLabs,
                bedTotal,
                bedOccupied,
                appointmentsToday
            ] = await Promise.all([
                safe(Patient.count({ where: { hospital_id: hospitalId } })),
                safe(Patient.count({ where: { hospital_id: hospitalId, createdAt: { [Op.lt]: startToday } } })),
                safe(OpdAppointment.count({ where: { hospital_id: hospitalId, appointment_date: todayDateStr } })),
                safe(OpdAppointment.count({ where: { hospital_id: hospitalId, appointment_date: yesterdayDateStr } })),
                safe(IpdAdmission.count({ where: { hospital_id: hospitalId, status: 'Admitted' } })),
                safe(IpdAdmission.count({ where: { hospital_id: hospitalId, admission_date: { [Op.gte]: startToday, [Op.lt]: endToday } } })),
                safe(IpdAdmission.count({ where: { hospital_id: hospitalId, admission_date: { [Op.gte]: startYesterday, [Op.lt]: startToday } } })),
                safe(Bill.findOne({
                    where: { hospital_id: hospitalId, bill_date: { [Op.gte]: startToday, [Op.lt]: endToday } },
                    attributes: [[fn('COALESCE', fn('SUM', col('paid_amount')), 0), 'total']],
                    raw: true
                }), { total: 0 }),
                safe(Bill.findOne({
                    where: { hospital_id: hospitalId, bill_date: { [Op.gte]: startYesterday, [Op.lt]: startToday } },
                    attributes: [[fn('COALESCE', fn('SUM', col('paid_amount')), 0), 'total']],
                    raw: true
                }), { total: 0 }),
                safe(Bill.count({ where: { hospital_id: hospitalId, payment_status: { [Op.in]: ['Unpaid', 'Partial'] } } })),
                safe(LabOrder ? LabOrder.count({ where: { hospital_id: hospitalId, status: { [Op.in]: ['Ordered', 'Sample Collected', 'In Progress'] } } }) : 0),
                safe(Bed.count({ where: { hospital_id: hospitalId } })),
                safe(Bed.count({ where: { hospital_id: hospitalId, status: 'Occupied' } })),
                safe(OpdAppointment.findAll({
                    where: { hospital_id: hospitalId, appointment_date: todayDateStr },
                    include: [
                        { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
                        { model: Doctor, as: 'doctor', attributes: ['name'] }
                    ],
                    order: [['appointment_time', 'ASC']],
                    limit: 10
                }), [])
            ]);

            const revenueToday = Number(revenueTodayRow?.total || 0);
            const revenueYesterday = Number(revenueYesterdayRow?.total || 0);

            const trend = (today, prev) => {
                if (!prev) return today > 0 ? 100 : 0;
                return Math.round(((today - prev) / prev) * 100);
            };

            const bedOccupancy = bedTotal > 0 ? Math.round((bedOccupied / bedTotal) * 100) : 0;

            const opdAppointments = (appointmentsToday || []).map(a => {
                const json = a.toJSON ? a.toJSON() : a;
                const p = json.patient || {};
                return {
                    appointment_id: json.appointment_id,
                    patient_name: [p.first_name, p.last_name].filter(Boolean).join(' '),
                    doctor_name: json.doctor?.name || null,
                    appointment_time: json.appointment_time,
                    status: json.status
                };
            });

            res.json({
                success: true,
                data: {
                    userName: req.user?.name || null,
                    totalPatients,
                    patientsTrend: trend(totalPatients, patientsYesterday),
                    opdToday,
                    opdTrend: trend(opdToday, opdYesterday),
                    ipdAdmissions: ipdActive,
                    ipdTrend: trend(ipdAdmittedToday, ipdAdmittedYesterday),
                    revenueToday,
                    revenueTrend: trend(revenueToday, revenueYesterday),
                    bedOccupancy,
                    pendingBills,
                    pendingLabTests: pendingLabs,
                    opdAppointments
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // GET /api/reports/opd-statistics
    getOPDStatistics = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            const whereClause = {
                hospital_id: hospitalId
            };

            if (from && to) {
                whereClause.visit_date = {
                    [Op.between]: [new Date(from), new Date(to)]
                };
            }

            // Get OPD visit statistics
            const visits = await OpdVisit.findAll({
                where: whereClause,
                attributes: [
                    [fn('DATE', col('visit_date')), 'date'],
                    [fn('COUNT', col('visit_id')), 'total_appointments'],
                    [fn('SUM', literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed'],
                    [fn('SUM', literal("CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END")), 'cancelled'],
                    [fn('SUM', literal("CASE WHEN status = 'No-show' THEN 1 ELSE 0 END")), 'no_show']
                ],
                group: [fn('DATE', col('visit_date'))],
                order: [[fn('DATE', col('visit_date')), 'DESC']],
                raw: true
            });

            res.json({
                success: true,
                data: visits
            });
        } catch (error) {
            console.error('Error fetching OPD statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch OPD statistics',
                error: error.message
            });
        }
    };

    // GET /api/reports/ipd-occupancy
    getIPDOccupancy = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            // Get total beds
            const totalBeds = await Bed.count({
                where: { hospital_id: hospitalId, is_active: true }
            });

            // Get occupied beds
            const occupiedBeds = await Bed.count({
                where: { hospital_id: hospitalId, is_active: true, status: 'Occupied' }
            });

            const availableBeds = totalBeds - occupiedBeds;
            const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

            // Get daily admission data
            const whereClause = { hospital_id: hospitalId };
            if (from && to) {
                whereClause.admission_date = {
                    [Op.between]: [new Date(from), new Date(to)]
                };
            }

            const dailyData = await IpdAdmission.findAll({
                where: whereClause,
                attributes: [
                    [fn('DATE', col('admission_date')), 'date'],
                    [fn('COUNT', col('admission_id')), 'admissions']
                ],
                group: [fn('DATE', col('admission_date'))],
                order: [[fn('DATE', col('admission_date')), 'DESC']],
                raw: true
            });

            // Transform data to include occupancy info
            const data = dailyData.map(d => ({
                date: d.date,
                total_beds: totalBeds,
                occupied: occupiedBeds,
                available: availableBeds,
                occupancy_rate: occupancyRate,
                admissions: d.admissions
            }));

            // If no data, return current status
            if (data.length === 0) {
                data.push({
                    date: new Date().toISOString().split('T')[0],
                    total_beds: totalBeds,
                    occupied: occupiedBeds,
                    available: availableBeds,
                    occupancy_rate: occupancyRate,
                    admissions: 0
                });
            }

            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error fetching IPD occupancy:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch IPD occupancy',
                error: error.message
            });
        }
    };

    // GET /api/reports/revenue
    getRevenue = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            const whereClause = { hospital_id: hospitalId };
            if (from && to) {
                whereClause.bill_date = {
                    [Op.between]: [new Date(from), new Date(to)]
                };
            }

            // Get revenue breakdown by bill type
            const revenue = await Bill.findAll({
                where: whereClause,
                attributes: [
                    ['bill_type', 'service'],
                    [fn('COUNT', col('bill_id')), 'count'],
                    [fn('SUM', col('net_amount')), 'revenue']
                ],
                group: ['bill_type'],
                raw: true
            });

            res.json({
                success: true,
                data: revenue
            });
        } catch (error) {
            console.error('Error fetching revenue:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch revenue',
                error: error.message
            });
        }
    };

    // GET /api/reports/doctor-performance
    getDoctorPerformance = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            // Get doctors with consultation counts
            const doctors = await Doctor.findAll({
                where: { hospital_id: hospitalId, is_active: true },
                attributes: ['doctor_id', 'name'],
                raw: true
            });

            const performance = await Promise.all(doctors.map(async (doctor) => {
                const visitWhere = { doctor_id: doctor.doctor_id };
                if (from && to) {
                    visitWhere.visit_date = {
                        [Op.between]: [new Date(from), new Date(to)]
                    };
                }

                const consultations = await OpdVisit.count({ where: visitWhere });

                return {
                    doctor_id: doctor.doctor_id,
                    doctor_name: doctor.name,
                    consultations,
                    surgeries: 0, // Can be added from OT data if needed
                    revenue: 0 // Can be computed from billing
                };
            }));

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            console.error('Error fetching doctor performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch doctor performance',
                error: error.message
            });
        }
    };

    // GET /api/reports/inventory/expiry
    getStockExpiry = async (req, res) => {
        try {
            const { months = 6, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + parseInt(months));

            // Get expiring medicine batches
            const expiringMedicines = await MedicineBatch.findAll({
                where: {
                    hospital_id: hospitalId,
                    expiry_date: {
                        [Op.between]: [new Date(), expiryDate]
                    },
                    available_quantity: {
                        [Op.gt]: 0
                    }
                },
                include: [{
                    model: require('../models').Medicine,
                    as: 'medicine',
                    attributes: ['medicine_name']
                }],
                raw: true,
                nest: true
            });

            const data = expiringMedicines.map(batch => {
                const today = new Date();
                const expiry = new Date(batch.expiry_date);
                const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

                return {
                    item_name: batch.medicine?.medicine_name || 'Unknown',
                    batch_number: batch.batch_number,
                    expiry_date: batch.expiry_date,
                    quantity: batch.available_quantity,
                    days_to_expiry: daysToExpiry
                };
            });

            res.json({
                success: true,
                data: data.sort((a, b) => a.days_to_expiry - b.days_to_expiry)
            });
        } catch (error) {
            console.error('Error fetching stock expiry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stock expiry',
                error: error.message
            });
        }
    };

    // GET /api/reports/outstanding-payments
    getOutstandingPayments = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id || 1;

            const whereClause = {
                hospital_id: hospitalId,
                payment_status: {
                    [Op.in]: ['Unpaid', 'Partial']
                }
            };

            if (from && to) {
                whereClause.bill_date = {
                    [Op.between]: [new Date(from), new Date(to)]
                };
            }

            const bills = await Bill.findAll({
                where: whereClause,
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['first_name', 'last_name']
                }],
                order: [['balance_amount', 'DESC']],
                raw: true,
                nest: true
            });

            const data = bills.map(bill => ({
                bill_number: bill.bill_number,
                patient_name: bill.patient ? `${bill.patient.first_name} ${bill.patient.last_name}` : 'Unknown',
                bill_amount: parseFloat(bill.net_amount) || 0,
                paid_amount: parseFloat(bill.paid_amount) || 0,
                outstanding: parseFloat(bill.balance_amount) || 0
            }));

            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error fetching outstanding payments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch outstanding payments',
                error: error.message
            });
        }
    };

    // GET /api/reports/export/:reportType?format=csv|xlsx
    exportReport = async (req, res) => {
        try {
            const ReportExportController = require('./ReportExportController');
            // Map ReportController's report type names to ReportExportController types
            const map = {
                'opd-statistics': 'appointments',
                'ipd-occupancy': 'ipd-admissions',
                'revenue': 'bills',
                'patients': 'patients',
                'inventory': 'inventory',
                'expiring-batches': 'expiring-batches',
                'expiry': 'expiring-batches'
            };
            const mapped = map[req.params.reportType] || req.params.reportType;
            req.params.type = mapped;
            return ReportExportController.export(req, res);
        } catch (error) {
            console.error('Error exporting report:', error);
            res.status(500).json({ success: false, message: 'Failed to export report', error: error.message });
        }
    };

    // GET /api/reports/collection-by-mode?from=&to= — daily collection grouped by payment mode
    getCollectionByMode = async (req, res) => {
        try {
            const { from, to, hospital_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id;
            const where = {};
            if (hospitalId) where.hospital_id = hospitalId;
            where.is_active = true;
            if (from && to) {
                where.payment_date = { [Op.between]: [new Date(from), new Date(to)] };
            }
            const rows = await Payment.findAll({
                where,
                attributes: [
                    'payment_mode',
                    [fn('DATE', col('payment_date')), 'date'],
                    [fn('COUNT', col('payment_id')), 'count'],
                    [fn('SUM', col('amount_paid')), 'total']
                ],
                group: ['payment_mode', fn('DATE', col('payment_date'))],
                order: [[fn('DATE', col('payment_date')), 'DESC'], ['payment_mode', 'ASC']],
                raw: true
            });
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching collection-by-mode:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // GET /api/reports/medicine-velocity?from=&to= — fast / slow movers from PharmacySaleDetail
    getMedicineVelocity = async (req, res) => {
        try {
            const { from, to, hospital_id, limit = 50 } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id;

            const { PharmacySaleDetail, PharmacySale, Medicine } = require('../models');
            const saleWhere = {};
            if (hospitalId) saleWhere.hospital_id = hospitalId;
            if (from && to) saleWhere.sale_date = { [Op.between]: [new Date(from), new Date(to)] };

            const saleIds = (await PharmacySale.findAll({ where: saleWhere, attributes: ['sale_id'] }))
                .map(s => s.sale_id);
            if (!saleIds.length) return res.json({ success: true, data: [] });

            const detailRows = await PharmacySaleDetail.findAll({
                where: { sale_id: saleIds },
                attributes: [
                    'medicine_id',
                    [fn('SUM', col('quantity')), 'total_qty'],
                    [fn('SUM', col('total_amount')), 'total_amount'],
                    [fn('COUNT', col('detail_id')), 'sale_count']
                ],
                group: ['medicine_id'],
                order: [[literal('total_qty'), 'DESC']],
                limit: Number(limit),
                raw: true
            });

            const medIds = detailRows.map(d => d.medicine_id).filter(Boolean);
            const meds = medIds.length ? await Medicine.findAll({ where: { medicine_id: medIds } }) : [];
            const medMap = Object.fromEntries(meds.map(m => [m.medicine_id, m]));

            const data = detailRows.map((r, idx) => ({
                rank: idx + 1,
                medicine_id: r.medicine_id,
                medicine_name: medMap[r.medicine_id]?.medicine_name || 'Unknown',
                total_qty: Number(r.total_qty || 0),
                total_amount: Number(r.total_amount || 0),
                sale_count: Number(r.sale_count || 0),
                velocity: Number(r.total_qty || 0) > 50 ? 'Fast' : Number(r.total_qty || 0) > 10 ? 'Medium' : 'Slow'
            }));

            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching medicine-velocity:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // GET /api/reports/inventory/consumption?from=&to=
    getInventoryConsumption = async (req, res) => {
        try {
            const { from, to, hospital_id, item_id, department_id } = req.query;
            const hospitalId = hospital_id || req.user?.hospital_id;

            const where = { is_active: true };
            if (hospitalId) where.hospital_id = hospitalId;
            if (item_id) where.item_id = item_id;
            if (department_id) where.department_id = department_id;
            if (from && to) {
                where.issue_date = { [Op.between]: [new Date(from), new Date(to)] };
            }

            const consumption = await StockIssue.findAll({
                where,
                attributes: [
                    'item_id',
                    'department_id',
                    [fn('SUM', col('quantity')), 'total_quantity'],
                    [fn('COUNT', col('issue_id')), 'issue_count']
                ],
                include: [
                    { model: InventoryItem, as: 'item', attributes: ['item_name', 'uom'] },
                    { model: Department, as: 'department', attributes: ['department_name'] }
                ],
                group: ['item_id', 'department_id', 'item.item_id', 'department.id'],
                order: [[literal('total_quantity'), 'DESC']],
                raw: true,
                nest: true
            });

            res.json({
                success: true,
                data: consumption.map(c => ({
                    item_id: c.item_id,
                    item_name: c.item?.item_name || 'Unknown',
                    department_name: c.department?.department_name || 'Unknown',
                    total_quantity: Number(c.total_quantity || 0),
                    uom: c.item?.uom || '-',
                    issue_count: Number(c.issue_count || 0)
                }))
            });
        } catch (error) {
            console.error('Error fetching inventory consumption:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch inventory consumption', error: error.message });
        }
    };
}

module.exports = new ReportController();
