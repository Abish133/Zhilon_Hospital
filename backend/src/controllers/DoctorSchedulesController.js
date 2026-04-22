const { DoctorSchedules, Doctor } = require('../models');

class DoctorSchedulesController {
  static async createDoctorSchedule(req, res) {
    try {
      if (!req.body.doctor_id) {
        return res.status(400).json({
          success: false,
          message: 'Doctor ID is required'
        });
      }
      if (!req.body.day_of_week) {
        return res.status(400).json({
          success: false,
          message: 'Day of week is required'
        });
      }

      const hospital_id = req.user?.hospital_id;
      const doctorSchedule = await DoctorSchedules.create({ ...req.body, hospital_id });
      const doctor = await Doctor.findByPk(req.body.doctor_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...doctorSchedule.toJSON(),
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllDoctorSchedules(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const doctorSchedules = await DoctorSchedules.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
     
      const schedulesWithDetails = await Promise.all(
        doctorSchedules.map(async (schedule) => {
          const doctor = await Doctor.findByPk(schedule.doctor_id);
          return {
            ...schedule.toJSON(),
            doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null
          };
        })
      );
     
      res.json({ success: true, data: schedulesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDoctorScheduleById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const doctorSchedule = await DoctorSchedules.findOne({ where: { schedule_id: req.params.id, hospital_id: req.hospitalId } });
      if (!doctorSchedule || (hospital_id && doctorSchedule.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
      }
     
      const doctor = await Doctor.findByPk(doctorSchedule.doctor_id);
     
      res.json({
        success: true,
        data: {
          ...doctorSchedule.toJSON(),
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDoctorSchedule(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { schedule_id: req.params.id, hospital_id }
        : { schedule_id: req.params.id };
      const [updated] = await DoctorSchedules.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
      }
      const updatedSchedule = await DoctorSchedules.findOne({ where: { schedule_id: req.params.id, hospital_id: req.hospitalId } });
      const doctor = await Doctor.findByPk(updatedSchedule.doctor_id);
     
      res.json({
        success: true,
        data: {
          ...updatedSchedule.toJSON(),
          doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDoctorSchedule(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { schedule_id: req.params.id, hospital_id }
        : { schedule_id: req.params.id };
      const deleted = await DoctorSchedules.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
      }
      res.json({ success: true, message: 'Doctor schedule deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DoctorSchedulesController;