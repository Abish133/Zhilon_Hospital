const { LabOrder, LabOrderDetail, Patient, Doctor, Hospital } = require('../models');

class LabOrderController {
  static async createLabOrder(req, res) {
    try {
      const { patient_id, uhid, visit_type, visit_id, ordered_by, order_date, status, hospital_id } = req.body;
      
      if (!patient_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'patient_id and hospital_id are required' 
        });
      }

      const labOrder = await LabOrder.create({ 
        patient_id,
        uhid,
        visit_type,
        visit_id,
        ordered_by,
        order_date: order_date || new Date(),
        status: status || 'Ordered',
        hospital_id
      });

      const patient = await Patient.findByPk(patient_id);
      const doctor = ordered_by ? await Doctor.findByPk(ordered_by) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Lab order created successfully',
        data: {
          ...labOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          orderedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabOrders(req, res) {
    try {
      const { patient_id, visit_type, status, ordered_by } = req.query;
      const hospital_id = req.user?.hospital_id;
      const where = { is_active: true };

      if (hospital_id) where.hospital_id = hospital_id;
      if (patient_id) where.patient_id = patient_id;
      if (visit_type) where.visit_type = visit_type;
      if (status) where.status = status;
      if (ordered_by) where.ordered_by = ordered_by;

      const labOrders = await LabOrder.findAll({
        where,
        include: [
          { model: Patient, as: 'patient', attributes: ['patient_id', 'first_name', 'last_name', 'uhid'] },
          { model: Doctor, as: 'orderedBy', attributes: ['id', 'name', 'specialization'], required: false },
          { model: LabOrderDetail, as: 'details', required: false }
        ],
        order: [['order_date', 'DESC']]
      });

      res.json({ success: true, data: labOrders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabOrderById(req, res) {
    try {
      const labOrder = await LabOrder.findOne({ where: { order_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labOrder) {
        return res.status(404).json({ success: false, message: 'Lab order not found' });
      }

      const patient = await Patient.findByPk(labOrder.patient_id);
      const doctor = labOrder.ordered_by ? await Doctor.findByPk(labOrder.ordered_by) : null;
      const hospital = await Hospital.findByPk(labOrder.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          orderedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabOrder(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabOrder.update(
          { is_active: false },
          { where: { order_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab order not found' });
        }
        const deactivatedLabOrder = await LabOrder.findOne({ where: { order_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab order deactivated successfully', data: deactivatedLabOrder });
      }

      const [updated] = await LabOrder.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { order_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab order not found' });
      }

      const updatedLabOrder = await LabOrder.findOne({ where: { order_id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedLabOrder.patient_id);
      const doctor = updatedLabOrder.ordered_by ? await Doctor.findByPk(updatedLabOrder.ordered_by) : null;
      const hospital = await Hospital.findByPk(updatedLabOrder.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          orderedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabOrder(req, res) {
    try {
      const deleted = await LabOrder.destroy({
        where: { order_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab order not found' });
      }

      res.json({ success: true, message: 'Lab order permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabOrdersByPatientId(req, res) {
    try {
      const labOrders = await LabOrder.findAll({
        where: { 
          patient_id: req.params.patientId,
          is_active: true 
        },
        order: [['order_date', 'DESC']]
      });

      const labOrdersWithDetails = await Promise.all(
        labOrders.map(async (labOrder) => {
          const patient = await Patient.findByPk(labOrder.patient_id);
          const doctor = labOrder.ordered_by ? await Doctor.findByPk(labOrder.ordered_by) : null;
          const hospital = await Hospital.findByPk(labOrder.hospital_id);
          
          return {
            ...labOrder.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            orderedBy: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null,
            ordered_by_name: doctor ? doctor.name : null,
            test_name: 'Lab Test', // Default name, should be from lab order details
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labOrdersWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabOrderController;
