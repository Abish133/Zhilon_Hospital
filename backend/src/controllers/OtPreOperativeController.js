const { OtPreOperative, OtBooking, Patient, User } = require('../models');
 
class OtPreOperativeController {
  static async createOtPreOperative(req, res) {
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
      const otPreOperative = await OtPreOperative.create({ ...req.body, hospital_id });
      const otBooking = await OtBooking.findByPk(req.body.booking_id);
      const patient = await Patient.findByPk(req.body.patient_id);
      const checklistBy = await User.findByPk(req.body.pre_op_checklist_by);
     
      res.status(201).json({
        success: true,
        data: {
          ...otPreOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          checklistBy: checklistBy ? { id: checklistBy.id, name: checklistBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllOtPreOperatives(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otPreOperatives = await OtPreOperative.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
     
      const preOperativesWithDetails = await Promise.all(
        otPreOperatives.map(async (preOp) => {
          const otBooking = await OtBooking.findByPk(preOp.booking_id);
          const patient = await Patient.findByPk(preOp.patient_id);
          const checklistBy = await User.findByPk(preOp.pre_op_checklist_by);
          return {
            ...preOp.toJSON(),
            otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            checklistBy: checklistBy ? { id: checklistBy.id, name: checklistBy.name } : null
          };
        })
      );
     
      res.json({ success: true, data: preOperativesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getOtPreOperativeById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const otPreOperative = await OtPreOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!otPreOperative || (hospital_id && otPreOperative.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'OT pre-operative record not found' });
      }
     
      const otBooking = await OtBooking.findByPk(otPreOperative.booking_id);
      const patient = await Patient.findByPk(otPreOperative.patient_id);
      const checklistBy = await User.findByPk(otPreOperative.pre_op_checklist_by);
     
      res.json({
        success: true,
        data: {
          ...otPreOperative.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          checklistBy: checklistBy ? { id: checklistBy.id, name: checklistBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateOtPreOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { pre_op_id: req.params.id, hospital_id }
        : { pre_op_id: req.params.id };
      const [updated] = await OtPreOperative.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT pre-operative record not found' });
      }
      const updatedPreOp = await OtPreOperative.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const otBooking = await OtBooking.findByPk(updatedPreOp.booking_id);
      const patient = await Patient.findByPk(updatedPreOp.patient_id);
      const checklistBy = await User.findByPk(updatedPreOp.pre_op_checklist_by);
     
      res.json({
        success: true,
        data: {
          ...updatedPreOp.toJSON(),
          otBooking: otBooking ? { booking_id: otBooking.booking_id, surgery_name: otBooking.surgery_name } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          checklistBy: checklistBy ? { id: checklistBy.id, name: checklistBy.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteOtPreOperative(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { pre_op_id: req.params.id, hospital_id }
        : { pre_op_id: req.params.id };
      const deleted = await OtPreOperative.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'OT pre-operative record not found' });
      }
      res.json({ success: true, message: 'OT pre-operative record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = OtPreOperativeController;
 