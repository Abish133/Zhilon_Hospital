const {
  Patient,
  Hospital,
  Doctor,
  Department,
  OpdAppointment,
  OpdVisit,
  OpdVital,
  OpdConsultation,
  OpdPrescription,
  Medicine,
  IpdAdmission,
  IpdVital,
  IpdProgressNote,
  IpdMedication,
  Ward,
  Bed,
  LabOrder,
  LabOrderDetail,
  LabResult,
  LabTest,
  RadiologyOrders,
  RadiologyReports,
  RadiologyTests,
  OtBooking,
  OtRoom,
  PharmacySale,
  PharmacySaleDetail,
  Bill,
  BillingEpisode,
  PatientMedicalHistory,
  PatientClinicalHistory,
  PatientMedicationHistory,
  sequelize
} = require('../models');
const { generateSequentialNumber } = require('../utils/numberGenerator');
const { parsePaging } = require('../utils/pagination');

class PatientController {
  static async createPatient(req, res) {
    const t = await sequelize.transaction();
    try {
      if (!req.body.first_name || !req.body.last_name || !req.body.hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'First name, last name, and hospital_id are required'
        });
      }

      // Atomically generate UHID if not provided
      if (!req.body.uhid) {
        req.body.uhid = await generateSequentialNumber({
          model: Patient,
          field: 'uhid',
          prefix: 'UHID',
          hospitalId: req.body.hospital_id,
          transaction: t,
          pad: 6
        });
      }

      const patient = await Patient.create(req.body, { transaction: t });
      await t.commit();
      const hospital = await Hospital.findByPk(req.body.hospital_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Patient registered successfully',
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* already committed or rolled back */ }
      console.error('Full error:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.errors.map(e => `${e.path}: ${e.message}`)
        });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Duplicate value',
          details: error.errors.map(e => `${e.path}: ${e.value} already exists`)
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllPatients(req, res) {
    try {
      const { limit, offset, order, page, pageSize } = parsePaging(req.query, {
        defaultOrder: [['patient_id', 'DESC']],
        allowedSortFields: ['patient_id', 'first_name', 'last_name', 'uhid', 'createdAt']
      });

      const where = {};
      if (req.query.hospital_id) where.hospital_id = req.query.hospital_id;
      if (req.query.search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { first_name: { [Op.like]: `%${req.query.search}%` } },
          { last_name: { [Op.like]: `%${req.query.search}%` } },
          { uhid: { [Op.like]: `%${req.query.search}%` } },
          { mobile_number: { [Op.like]: `%${req.query.search}%` } }
        ];
      }

      const { rows, count } = await Patient.findAndCountAll({ where, limit, offset, order });

      // Batch-fetch hospitals (O(N) queries → 1 query)
      const hospitalIds = [...new Set(rows.map(p => p.hospital_id).filter(Boolean))];
      const hospitals = hospitalIds.length
        ? await Hospital.findAll({ where: { id: hospitalIds } })
        : [];
      const hMap = Object.fromEntries(hospitals.map(h => [h.id, h]));

      const data = rows.map(p => ({
        ...p.toJSON(),
        hospital: hMap[p.hospital_id] ? { id: hMap[p.hospital_id].id, hospitalName: hMap[p.hospital_id].hospitalName } : null
      }));

      res.json({
        success: true,
        data,
        pagination: { page, pageSize, total: count, totalPages: Math.max(1, Math.ceil(count / pageSize)) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getPatientById(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const patient = await Patient.findOne({ where });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      
      const hospital = await Hospital.findByPk(patient.hospital_id);
      
      res.json({ 
        success: true, 
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updatePatient(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const [updated] = await Patient.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      
      const patient = await Patient.findOne({ where });
      const hospital = await Hospital.findByPk(patient.hospital_id);
      
      res.json({ 
        success: true,
        message: 'Patient updated successfully',
        data: {
          ...patient.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deletePatient(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      
      // Support both patient_id and UHID
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }
      
      const deleted = await Patient.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Comprehensive patient drill-down: groups everything by date for timeline UI
  static async getPatientTimeline(req, res) {
    try {
      const where = { hospital_id: req.hospitalId };
      if (isNaN(req.params.id)) {
        where.uhid = req.params.id;
      } else {
        where.patient_id = req.params.id;
      }

      const patient = await Patient.findOne({ where });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      const patientId = patient.patient_id;
      const hospitalId = req.hospitalId;
      const baseWhere = { patient_id: patientId, hospital_id: hospitalId };

      const safe = async (p) => {
        try { return await p; } catch (e) { return []; }
      };

      const [
        appointments,
        visits,
        consultations,
        prescriptions,
        admissions,
        ipdProgress,
        ipdVitals,
        ipdMedications,
        labOrders,
        radiologyOrders,
        otBookings,
        pharmacySales,
        bills,
        medicalHistory,
        clinicalHistory,
        medicationHistory
      ] = await Promise.all([
        safe(OpdAppointment.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
            { model: Department, as: 'department', attributes: ['id', 'department_name'] }
          ],
          order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
        })),
        safe(OpdVisit.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
            { model: Department, as: 'department', attributes: ['id', 'department_name'] }
          ],
          order: [['visit_date', 'DESC']]
        })),
        safe(OpdConsultation.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] }
          ],
          order: [['consultation_date', 'DESC']]
        })),
        safe(OpdPrescription.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'prescribedBy', attributes: ['id', 'name', 'specialization'] },
            { model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength', 'dosage_form'] }
          ],
          order: [['prescribed_at', 'DESC'], ['createdAt', 'DESC']]
        })),
        safe(IpdAdmission.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'admittingDoctor', attributes: ['id', 'name', 'specialization'] },
            { model: Department, as: 'department', attributes: ['id', 'department_name'] },
            { model: Ward, as: 'ward' },
            { model: Bed, as: 'bed' }
          ],
          order: [['admission_date', 'DESC']]
        })),
        safe(IpdProgressNote.findAll({
          where: baseWhere,
          order: [['progress_date', 'DESC'], ['progress_time', 'DESC']]
        })),
        safe(IpdVital.findAll({
          where: { patient_id: patientId },
          order: [['recorded_date', 'DESC'], ['recorded_time', 'DESC']]
        })),
        safe((async () => {
          const adms = await IpdAdmission.findAll({ where: baseWhere, attributes: ['admission_id'] });
          const ids = adms.map(a => a.admission_id);
          if (!ids.length) return [];
          return IpdMedication.findAll({
            where: { admission_id: ids },
            include: [{ model: Medicine, as: 'medicine', attributes: ['medicine_id', 'medicine_name', 'strength', 'dosage_form'] }],
            order: [['start_date', 'DESC']]
          });
        })()),
        safe(LabOrder.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'orderedBy', attributes: ['id', 'name', 'specialization'] },
            { model: LabOrderDetail, as: 'details' }
          ],
          order: [['order_date', 'DESC'], ['createdAt', 'DESC']]
        })),
        safe(RadiologyOrders.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'orderedBy', attributes: ['id', 'name', 'specialization'] },
            { model: RadiologyTests, as: 'radiologyTest' }
          ],
          order: [['order_date', 'DESC']]
        })),
        safe(OtBooking.findAll({
          where: baseWhere,
          include: [
            { model: Doctor, as: 'surgeon', attributes: ['id', 'name', 'specialization'] },
            { model: Doctor, as: 'anesthetist', attributes: ['id', 'name', 'specialization'] },
            { model: OtRoom, as: 'otRoom' }
          ],
          order: [['surgery_date', 'DESC']]
        })),
        safe(PharmacySale.findAll({
          where: baseWhere,
          include: [
            { model: PharmacySaleDetail, as: 'details' }
          ],
          order: [['sale_date', 'DESC']]
        })),
        safe(Bill.findAll({
          where: baseWhere,
          order: [['bill_date', 'DESC']]
        })),
        safe(PatientMedicalHistory ? PatientMedicalHistory.findAll({ where: { patient_id: patientId } }) : []),
        safe(PatientClinicalHistory ? PatientClinicalHistory.findAll({ where: { patient_id: patientId } }) : []),
        safe(PatientMedicationHistory ? PatientMedicationHistory.findAll({ where: { patient_id: patientId } }) : [])
      ]);

      // Lab results — fetch by order_ids in a single query
      const labOrderIds = (labOrders || []).map(o => o.order_id);
      const labResults = labOrderIds.length
        ? await safe(LabResult.findAll({ where: { order_id: labOrderIds }, include: [{ model: LabTest, as: 'test' }] }))
        : [];
      const labResultsByOrder = {};
      for (const r of labResults) {
        const oid = r.order_id;
        if (!labResultsByOrder[oid]) labResultsByOrder[oid] = [];
        labResultsByOrder[oid].push(r);
      }
      const enrichedLabOrders = (labOrders || []).map(o => ({
        ...o.toJSON(),
        results: labResultsByOrder[o.order_id] || []
      }));

      // Radiology reports — fetch by order_ids in one query
      const radOrderIds = (radiologyOrders || []).map(o => o.rad_order_id);
      const radReports = radOrderIds.length
        ? await safe(RadiologyReports.findAll({ where: { rad_order_id: radOrderIds } }))
        : [];
      const radReportsByOrder = {};
      for (const r of radReports) {
        const oid = r.rad_order_id;
        if (!radReportsByOrder[oid]) radReportsByOrder[oid] = [];
        radReportsByOrder[oid].push(r);
      }
      const enrichedRadOrders = (radiologyOrders || []).map(o => ({
        ...o.toJSON(),
        reports: radReportsByOrder[o.rad_order_id] || []
      }));

      // OPD vitals — fetch by visit_ids
      const visitIds = (visits || []).map(v => v.visit_id);
      const opdVitals = visitIds.length
        ? await safe(OpdVital.findAll({ where: { visit_id: visitIds } }))
        : [];

      // Build a unified day-by-day timeline: each entry has a date and type
      const events = [];

      const addEvent = (date, type, summary, data) => {
        if (!date) return;
        events.push({ date, type, summary, data });
      };

      for (const a of appointments || []) {
        addEvent(a.appointment_date, 'appointment',
          `OPD Appointment with Dr. ${a.doctor?.name || '—'} (${a.visit_type})`,
          a);
      }
      for (const v of visits || []) {
        addEvent(v.visit_date, 'visit',
          `OPD Visit — Dr. ${v.doctor?.name || '—'} • Token ${v.token_number}`,
          v);
      }
      for (const c of consultations || []) {
        const d = c.consultation_date || c.createdAt;
        addEvent(d, 'consultation',
          `Consultation by Dr. ${c.doctor?.name || '—'}${c.diagnosis_description ? ` — ${c.diagnosis_description}` : ''}`,
          c);
      }
      for (const p of prescriptions || []) {
        const d = p.prescribed_at || p.createdAt;
        const med = p.medicine?.medicine_name || p.medicine_name || 'Medicine';
        addEvent(d, 'prescription',
          `Prescription: ${med} ${p.dosage || ''} ${p.frequency || ''}`.trim(),
          p);
      }
      for (const a of admissions || []) {
        addEvent(a.admission_date, 'admission',
          `IPD Admission (${a.admission_type}) — Dr. ${a.admittingDoctor?.name || '—'}`,
          a);
      }
      for (const n of ipdProgress || []) {
        addEvent(n.progress_date, 'ipd_progress',
          `IPD Progress Note (${n.note_type})`,
          n);
      }
      for (const v of ipdVitals || []) {
        addEvent(v.recorded_date, 'ipd_vital',
          `IPD Vitals — BP ${v.systolic_bp || '-'}/${v.diastolic_bp || '-'}, Pulse ${v.pulse_rate || '-'}, Temp ${v.temperature || '-'}`,
          v);
      }
      for (const m of ipdMedications || []) {
        addEvent(m.start_date, 'ipd_medication',
          `IPD Medication: ${m.medicine_name || m.medicine?.medicine_name} ${m.dosage} ${m.frequency}`,
          m);
      }
      for (const o of enrichedLabOrders) {
        addEvent(o.order_date || o.createdAt, 'lab_order',
          `Lab Order: ${(o.details || []).map(d => d.test_name).filter(Boolean).join(', ') || 'Tests'}`,
          o);
      }
      for (const o of enrichedRadOrders) {
        addEvent(o.order_date, 'radiology_order',
          `Radiology Order: ${o.test_name} (${o.modality})`,
          o);
      }
      for (const b of otBookings || []) {
        addEvent(b.surgery_date, 'ot_booking',
          `OT Booking: ${b.surgery_name || 'Surgery'} (${b.surgery_type || ''})`,
          b);
      }
      for (const s of pharmacySales || []) {
        addEvent(s.sale_date, 'pharmacy_sale',
          `Pharmacy Sale ₹${s.net_amount || 0} (${(s.details || []).length} items)`,
          s);
      }
      for (const b of bills || []) {
        addEvent(b.bill_date, 'bill',
          `Bill ${b.bill_number} (${b.bill_type}) — ₹${b.net_amount} [${b.payment_status}]`,
          b);
      }

      // Group by date (YYYY-MM-DD)
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      const groupedByDate = {};
      for (const e of events) {
        const dateKey = String(e.date).slice(0, 10);
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(e);
      }
      const timeline = Object.keys(groupedByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(date => ({ date, events: groupedByDate[date] }));

      // Stats summary
      const stats = {
        total_appointments: (appointments || []).length,
        total_visits: (visits || []).length,
        total_consultations: (consultations || []).length,
        total_prescriptions: (prescriptions || []).length,
        total_admissions: (admissions || []).length,
        total_lab_orders: (labOrders || []).length,
        total_radiology_orders: (radiologyOrders || []).length,
        total_ot_bookings: (otBookings || []).length,
        total_pharmacy_sales: (pharmacySales || []).length,
        total_bills: (bills || []).length,
        total_billed: (bills || []).reduce((s, b) => s + Number(b.net_amount || 0), 0),
        total_paid: (bills || []).reduce((s, b) => s + Number(b.paid_amount || 0), 0),
        balance: (bills || []).reduce((s, b) => s + Number(b.balance_amount || 0), 0),
        first_visit: (visits || [])[(visits || []).length - 1]?.visit_date || null,
        last_visit: (visits || [])[0]?.visit_date || null,
        unique_doctors: [...new Set([
          ...(appointments || []).map(a => a.doctor?.name).filter(Boolean),
          ...(consultations || []).map(c => c.doctor?.name).filter(Boolean),
          ...(admissions || []).map(a => a.admittingDoctor?.name).filter(Boolean)
        ])]
      };

      return res.json({
        success: true,
        data: {
          patient: patient.toJSON(),
          stats,
          timeline,
          appointments,
          visits,
          opdVitals,
          consultations,
          prescriptions,
          admissions,
          ipdProgress,
          ipdVitals,
          ipdMedications,
          labOrders: enrichedLabOrders,
          radiologyOrders: enrichedRadOrders,
          otBookings,
          pharmacySales,
          bills,
          medicalHistory,
          clinicalHistory,
          medicationHistory
        }
      });
    } catch (error) {
      console.error('getPatientTimeline error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async searchPatients(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
      }

      const { Op } = require('sequelize');
      const searchTerm = q.replace(/^UHID:\s*/i, '').trim();
      
      const patients = await Patient.findAll({
        where: {
          hospital_id: req.hospitalId,
          [Op.or]: [
            { uhid: { [Op.like]: `%${searchTerm}%` } },
            { first_name: { [Op.like]: `%${searchTerm}%` } },
            { last_name: { [Op.like]: `%${searchTerm}%` } },
            { mobile_number: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: 20
      });

      res.json({ success: true, data: patients });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = PatientController;
 