const { Op } = require('sequelize');
const { Patient, Bill, BillingEpisode, OpdAppointment, IpdAdmission, Doctor, Hospital, InventoryItem, MedicineBatch, Medicine } = require('../models');
const { exportData } = require('../utils/exportHelpers');

// Generic export dispatcher: /api/reports-export/:type?format=csv|xlsx&from_date=&to_date=
class ReportExportController {
  static async export(req, res) {
    try {
      const type = String(req.params.type || '').toLowerCase();
      const hospitalId = req.user?.hospital_id;
      const { from_date, to_date } = req.query;

      if (type === 'patients') {
        const where = hospitalId ? { hospital_id: hospitalId } : {};
        if (from_date && to_date) where.createdAt = { [Op.between]: [new Date(from_date), new Date(to_date)] };
        const rows = (await Patient.findAll({ where, order: [['patient_id', 'DESC']] }))
          .map(p => ({
            patient_id: p.patient_id,
            uhid: p.uhid,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            gender: p.gender,
            dob: p.date_of_birth,
            mobile: p.mobile_number,
            address: p.address,
            created: p.createdAt
          }));
        return exportData(req, res, {
          baseName: 'patients',
          sheetName: 'Patients',
          columns: [
            { key: 'patient_id', label: 'ID' },
            { key: 'uhid', label: 'UHID' },
            { key: 'name', label: 'Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'dob', label: 'DOB' },
            { key: 'mobile', label: 'Mobile' },
            { key: 'address', label: 'Address' },
            { key: 'created', label: 'Registered On' }
          ],
          rows
        });
      }

      if (type === 'bills') {
        const where = hospitalId ? { hospital_id: hospitalId } : {};
        if (from_date && to_date) where.bill_date = { [Op.between]: [new Date(from_date), new Date(to_date)] };
        const rows = (await Bill.findAll({ where, order: [['bill_date', 'DESC']] }))
          .map(b => ({
            bill_id: b.bill_id,
            bill_number: b.bill_number,
            bill_date: b.bill_date,
            gross: b.gross_amount,
            discount: b.discount_amount,
            tax: b.tax_amount,
            net: b.net_amount,
            status: b.status
          }));
        return exportData(req, res, {
          baseName: 'bills',
          sheetName: 'Bills',
          columns: [
            { key: 'bill_id', label: 'ID' },
            { key: 'bill_number', label: 'Bill Number' },
            { key: 'bill_date', label: 'Date' },
            { key: 'gross', label: 'Gross (INR)' },
            { key: 'discount', label: 'Discount (INR)' },
            { key: 'tax', label: 'Tax (INR)' },
            { key: 'net', label: 'Net (INR)' },
            { key: 'status', label: 'Status' }
          ],
          rows
        });
      }

      if (type === 'appointments') {
        const where = hospitalId ? { hospital_id: hospitalId } : {};
        if (from_date && to_date) where.appointment_date = { [Op.between]: [from_date, to_date] };
        const rows = (await OpdAppointment.findAll({ where, order: [['appointment_date', 'DESC']] }))
          .map(a => ({
            appointment_id: a.appointment_id,
            date: a.appointment_date,
            time: a.appointment_time,
            patient_id: a.patient_id,
            doctor_id: a.doctor_id,
            status: a.status,
            visit_type: a.visit_type
          }));
        return exportData(req, res, {
          baseName: 'appointments',
          sheetName: 'Appointments',
          columns: [
            { key: 'appointment_id', label: 'ID' },
            { key: 'date', label: 'Date' },
            { key: 'time', label: 'Time' },
            { key: 'patient_id', label: 'Patient ID' },
            { key: 'doctor_id', label: 'Doctor ID' },
            { key: 'status', label: 'Status' },
            { key: 'visit_type', label: 'Type' }
          ],
          rows
        });
      }

      if (type === 'ipd-admissions') {
        const where = hospitalId ? { hospital_id: hospitalId } : {};
        if (from_date && to_date) where.admission_date = { [Op.between]: [new Date(from_date), new Date(to_date)] };
        const rows = (await IpdAdmission.findAll({ where, order: [['admission_date', 'DESC']] }))
          .map(a => ({
            admission_id: a.admission_id,
            patient_id: a.patient_id,
            uhid: a.uhid,
            admission_date: a.admission_date,
            discharge_date: a.discharge_date,
            status: a.status,
            admitting_doctor_id: a.admitting_doctor_id,
            ward_id: a.ward_id,
            bed_id: a.bed_id
          }));
        return exportData(req, res, {
          baseName: 'ipd-admissions',
          sheetName: 'IPD',
          columns: [
            { key: 'admission_id', label: 'Admission ID' },
            { key: 'patient_id', label: 'Patient ID' },
            { key: 'uhid', label: 'UHID' },
            { key: 'admission_date', label: 'Admission Date' },
            { key: 'discharge_date', label: 'Discharge Date' },
            { key: 'status', label: 'Status' },
            { key: 'admitting_doctor_id', label: 'Doctor ID' },
            { key: 'ward_id', label: 'Ward' },
            { key: 'bed_id', label: 'Bed' }
          ],
          rows
        });
      }

      if (type === 'inventory') {
        const where = hospitalId ? { hospital_id: hospitalId, is_active: true } : { is_active: true };
        const rows = (await InventoryItem.findAll({ where, order: [['item_name', 'ASC']] }))
          .map(i => ({
            item_id: i.item_id,
            item_code: i.item_code,
            item_name: i.item_name,
            current_stock: i.current_stock,
            reorder_level: i.reorder_level,
            unit: i.unit,
            unit_price: i.unit_price
          }));
        return exportData(req, res, {
          baseName: 'inventory',
          sheetName: 'Inventory',
          columns: [
            { key: 'item_id', label: 'ID' },
            { key: 'item_code', label: 'Code' },
            { key: 'item_name', label: 'Name' },
            { key: 'current_stock', label: 'Stock' },
            { key: 'reorder_level', label: 'Reorder Level' },
            { key: 'unit', label: 'Unit' },
            { key: 'unit_price', label: 'Unit Price' }
          ],
          rows
        });
      }

      if (type === 'expiring-batches') {
        const days = Math.max(0, parseInt(req.query.days, 10) || 30);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + days);
        const where = { is_active: true, available_quantity: { [Op.gt]: 0 }, expiry_date: { [Op.lte]: cutoff } };
        if (hospitalId) where.hospital_id = hospitalId;
        const batches = await MedicineBatch.findAll({ where, order: [['expiry_date', 'ASC']] });
        const medIds = [...new Set(batches.map(b => b.medicine_id).filter(Boolean))];
        const meds = medIds.length ? await Medicine.findAll({ where: { medicine_id: medIds } }) : [];
        const medMap = Object.fromEntries(meds.map(m => [m.medicine_id, m.medicine_name]));
        const rows = batches.map(b => ({
          batch_id: b.batch_id,
          medicine: medMap[b.medicine_id] || '',
          batch_number: b.batch_number,
          expiry_date: b.expiry_date,
          available_quantity: b.available_quantity,
          mrp: b.mrp
        }));
        return exportData(req, res, {
          baseName: 'expiring-batches',
          sheetName: 'Expiring',
          columns: [
            { key: 'batch_id', label: 'ID' },
            { key: 'medicine', label: 'Medicine' },
            { key: 'batch_number', label: 'Batch' },
            { key: 'expiry_date', label: 'Expiry' },
            { key: 'available_quantity', label: 'Available' },
            { key: 'mrp', label: 'MRP' }
          ],
          rows
        });
      }

      return res.status(400).json({ success: false, message: `Unknown export type: ${type}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ReportExportController;
