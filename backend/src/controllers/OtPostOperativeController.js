const { OtPostOperative, OtBooking, Patient, User } = require('../models');
 
class OtPostOperativeController {
  static async createOtPostOperative(req, res) {
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
      const otPostOperative = await OtPostOperative.create({ ...req.body, hospital_id });
      const otBooking = await OtBooking.findByPk(req.body.booking_id);
      const patient = await Patient.findByPk(req.body.patient_id);
      const recordedBy = await User.findByPk(req.body.recorded_by);
     
      res.status(201).json({
        success: true,
        data: {
          ...otPostOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllOtPostOperatives(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otPostOperatives = await OtPostOperative.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
     
      const postOperativesWithDetails = await Promise.all(
        otPostOperatives.map(async (postOp) => {
          const otBooking = await OtBooking.findByPk(postOp.booking_id);
          const patient = await Patient.findByPk(postOp.patient_id);
          const recordedBy = await User.findByPk(postOp.recorded_by);
          return {
            ...postOp.toJSON(),
            otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
          };
        })
      );
     
      res.json({ success: true, data: postOperativesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getOtPostOperativeById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otPostOperative = await OtPostOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!otPostOperative || (hospital_id && otPostOperative.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'OT post-operative record not found' });
      }
     
      const otBooking = await OtBooking.findByPk(otPostOperative.booking_id);
      const patient = await Patient.findByPk(otPostOperative.patient_id);
      const recordedBy = await User.findByPk(otPostOperative.recorded_by);
     
      res.json({
        success: true,
        data: {
          ...otPostOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateOtPostOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { post_op_id: req.params.id, hospital_id }
        : { post_op_id: req.params.id };
      const [updated] = await OtPostOperative.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT post-operative record not found' });
      }
      const updatedPostOp = await OtPostOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const otBooking = await OtBooking.findByPk(updatedPostOp.booking_id);
      const patient = await Patient.findByPk(updatedPostOp.patient_id);
      const recordedBy = await User.findByPk(updatedPostOp.recorded_by);
     
      res.json({
        success: true,
        data: {
          ...updatedPostOp.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: recordedBy ? { id: recordedBy.id, name: recordedBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteOtPostOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { post_op_id: req.params.id, hospital_id }
        : { post_op_id: req.params.id };
      const deleted = await OtPostOperative.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'OT post-operative record not found' });
      }
      res.json({ success: true, message: 'OT post-operative record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = OtPostOperativeController;
 