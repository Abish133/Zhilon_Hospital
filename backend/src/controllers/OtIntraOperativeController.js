const { OtIntraOperative, OtBooking, Patient, User, Doctor } = require('../models');
 
class OtIntraOperativeController {
  static async createOtIntraOperative(req, res) {
    try {
      if (!req.body.booking_id) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID is required'
        });
      }
      if (!req.body.patient_id) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
 
      const hospital_id = req.user?.hospital_id;
      const otIntraOperative = await OtIntraOperative.create({ ...req.body, hospital_id });
      const otBooking = await OtBooking.findByPk(req.body.booking_id);
      const patient = await Patient.findByPk(req.body.patient_id);
      const recordedBy = await User.findByPk(req.body.recorded_by);
      const surgeon = await Doctor.findByPk(req.body.surgeon_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...otIntraOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name, specialization: surgeon.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllOtIntraOperatives(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otIntraOperatives = await OtIntraOperative.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
     
      const intraOperativesWithDetails = await Promise.all(
        otIntraOperatives.map(async (intraOp) => {
          const otBooking = await OtBooking.findByPk(intraOp.booking_id);
          const patient = await Patient.findByPk(intraOp.patient_id);
          const recordedBy = await User.findByPk(intraOp.recorded_by);
          const surgeon = await Doctor.findByPk(intraOp.surgeon_id);
          return {
            ...intraOp.toJSON(),
            otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null,
            surgeon: surgeon ? { id: surgeon.id, name: surgeon.name, specialization: surgeon.specialization } : null
          };
        })
      );
     
      res.json({ success: true, data: intraOperativesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getOtIntraOperativeById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otIntraOperative = await OtIntraOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!otIntraOperative || (hospital_id && otIntraOperative.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'OT intra-operative record not found' });
      }
     
      const otBooking = await OtBooking.findByPk(otIntraOperative.booking_id);
      const patient = await Patient.findByPk(otIntraOperative.patient_id);
      const recordedBy = await User.findByPk(otIntraOperative.recorded_by);
      const surgeon = await Doctor.findByPk(otIntraOperative.surgeon_id);
     
      res.json({
        success: true,
        data: {
          ...otIntraOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name, specialization: surgeon.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateOtIntraOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { intra_op_id: req.params.id, hospital_id }
        : { intra_op_id: req.params.id };
      const [updated] = await OtIntraOperative.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT intra-operative record not found' });
      }
      const updatedIntraOp = await OtIntraOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const otBooking = await OtBooking.findByPk(updatedIntraOp.booking_id);
      const patient = await Patient.findByPk(updatedIntraOp.patient_id);
      const recordedBy = await User.findByPk(updatedIntraOp.recorded_by);
      const surgeon = await Doctor.findByPk(updatedIntraOp.surgeon_id);
     
      res.json({
        success: true,
        data: {
          ...updatedIntraOp.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name, specialization: surgeon.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteOtIntraOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { intra_op_id: req.params.id, hospital_id }
        : { intra_op_id: req.params.id };
      const deleted = await OtIntraOperative.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'OT intra-operative record not found' });
      }
      res.json({ success: true, message: 'OT intra-operative record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = OtIntraOperativeController;
 