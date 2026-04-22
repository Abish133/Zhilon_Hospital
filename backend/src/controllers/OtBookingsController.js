const { OtBooking, Patient, Doctor, OtRoom, User, Hospital, sequelize } = require('../models');
const { Op } = require('sequelize');

const addMinutes = (timeStr, mins) => {
  const [h, m, s = 0] = String(timeStr).split(':').map(Number);
  const total = h * 60 + m + Number(mins || 0);
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

class OtBookingsController {
  static async createOtBooking(req, res) {
    const t = await sequelize.transaction();
    try {
      if (!req.body.hospital_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is required'
        });
      }

      const { ot_room_id, surgery_date, surgery_time, estimated_duration_minutes, surgeon_id } = req.body;

      if (ot_room_id && surgery_date && surgery_time) {
        const duration = Number(estimated_duration_minutes) || 60;
        const endTime = addMinutes(surgery_time, duration);

        // Room conflict: overlap check
        const roomConflict = await OtBooking.findOne({
          where: {
            ot_room_id,
            surgery_date,
            status: { [Op.notIn]: ['Cancelled', 'Postponed'] },
            [Op.and]: [
              { surgery_time: { [Op.lt]: endTime } }
            ]
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (roomConflict) {
          const existDur = Number(roomConflict.estimated_duration_minutes) || 60;
          const existEnd = addMinutes(roomConflict.surgery_time, existDur);
          if (existEnd > surgery_time) {
            await t.rollback();
            return res.status(409).json({
              success: false,
              message: `OT room already booked from ${roomConflict.surgery_time} to ${existEnd}`
            });
          }
        }

        // Surgeon conflict
        if (surgeon_id) {
          const surgeonConflict = await OtBooking.findOne({
            where: {
              surgeon_id,
              surgery_date,
              status: { [Op.notIn]: ['Cancelled', 'Postponed'] },
              surgery_time: { [Op.lt]: endTime }
            },
            transaction: t
          });
          if (surgeonConflict) {
            const existDur = Number(surgeonConflict.estimated_duration_minutes) || 60;
            const existEnd = addMinutes(surgeonConflict.surgery_time, existDur);
            if (existEnd > surgery_time) {
              await t.rollback();
              return res.status(409).json({
                success: false,
                message: `Surgeon already booked from ${surgeonConflict.surgery_time} to ${existEnd}`
              });
            }
          }
        }
      }

      const otBooking = await OtBooking.create({ ...req.body, status: req.body.status || 'Scheduled' }, { transaction: t });
      await t.commit();

      const patient = await Patient.findByPk(req.body.patient_id);
      const surgeon = await Doctor.findByPk(req.body.surgeon_id);
      const assistantSurgeon = await Doctor.findByPk(req.body.assistant_surgeon_id);
      const anesthetist = await Doctor.findByPk(req.body.anesthetist_id);
      const otRoom = await OtRoom.findByPk(req.body.ot_room_id);
      const bookedByUser = await User.findByPk(req.body.booked_by);
      const hospital = await Hospital.findByPk(req.body.hospital_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...otBooking.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name } : null,
          assistantSurgeon: assistantSurgeon ? { id: assistantSurgeon.id, name: assistantSurgeon.name } : null,
          anesthetist: anesthetist ? { id: anesthetist.id, name: anesthetist.name } : null,
          otRoom: otRoom ? { room_id: otRoom.room_id, room_name: otRoom.room_name } : null,
          bookedByUser: bookedByUser ? { id: bookedByUser.id, name: bookedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllOtBookings(req, res) {
    try {
      const otBookings = await OtBooking.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const bookingsWithDetails = await Promise.all(
        otBookings.map(async (booking) => {
          const patient = await Patient.findByPk(booking.patient_id);
          const surgeon = await Doctor.findByPk(booking.surgeon_id);
          const assistantSurgeon = await Doctor.findByPk(booking.assistant_surgeon_id);
          const anesthetist = await Doctor.findByPk(booking.anesthetist_id);
          const otRoom = await OtRoom.findByPk(booking.ot_room_id);
          const bookedByUser = await User.findByPk(booking.booked_by);
          const hospital = await Hospital.findByPk(booking.hospital_id);
          return {
            ...booking.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            surgeon: surgeon ? { id: surgeon.id, name: surgeon.name } : null,
            assistantSurgeon: assistantSurgeon ? { id: assistantSurgeon.id, name: assistantSurgeon.name } : null,
            anesthetist: anesthetist ? { id: anesthetist.id, name: anesthetist.name } : null,
            otRoom: otRoom ? { room_id: otRoom.room_id, room_name: otRoom.room_name } : null,
            bookedByUser: bookedByUser ? { id: bookedByUser.id, name: bookedByUser.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );
     
      res.json({ success: true, data: bookingsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getOtBookingById(req, res) {
    try {
      const otBooking = await OtBooking.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!otBooking) {
        return res.status(404).json({ success: false, message: 'OT booking not found' });
      }
     
      const patient = await Patient.findByPk(otBooking.patient_id);
      const surgeon = await Doctor.findByPk(otBooking.surgeon_id);
      const assistantSurgeon = await Doctor.findByPk(otBooking.assistant_surgeon_id);
      const anesthetist = await Doctor.findByPk(otBooking.anesthetist_id);
      const otRoom = await OtRoom.findByPk(otBooking.ot_room_id);
      const bookedByUser = await User.findByPk(otBooking.booked_by);
      const hospital = await Hospital.findByPk(otBooking.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...otBooking.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name } : null,
          assistantSurgeon: assistantSurgeon ? { id: assistantSurgeon.id, name: assistantSurgeon.name } : null,
          anesthetist: anesthetist ? { id: anesthetist.id, name: anesthetist.name } : null,
          otRoom: otRoom ? { room_id: otRoom.room_id, room_name: otRoom.room_name } : null,
          bookedByUser: bookedByUser ? { id: bookedByUser.id, name: bookedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateOtBooking(req, res) {
    try {
      const [updated] = await OtBooking.update(req.body, {
        where: { booking_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT booking not found' });
      }
      const updatedBooking = await OtBooking.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedBooking.patient_id);
      const surgeon = await Doctor.findByPk(updatedBooking.surgeon_id);
      const assistantSurgeon = await Doctor.findByPk(updatedBooking.assistant_surgeon_id);
      const anesthetist = await Doctor.findByPk(updatedBooking.anesthetist_id);
      const otRoom = await OtRoom.findByPk(updatedBooking.ot_room_id);
      const bookedByUser = await User.findByPk(updatedBooking.booked_by);
      const hospital = await Hospital.findByPk(updatedBooking.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...updatedBooking.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          surgeon: surgeon ? { id: surgeon.id, name: surgeon.name } : null,
          assistantSurgeon: assistantSurgeon ? { id: assistantSurgeon.id, name: assistantSurgeon.name } : null,
          anesthetist: anesthetist ? { id: anesthetist.id, name: anesthetist.name } : null,
          otRoom: otRoom ? { room_id: otRoom.room_id, room_name: otRoom.room_name } : null,
          bookedByUser: bookedByUser ? { id: bookedByUser.id, name: bookedByUser.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteOtBooking(req, res) {
    try {
      const deleted = await OtBooking.destroy({
        where: { booking_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'OT booking not found' });
      }
      res.json({ success: true, message: 'OT booking deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = OtBookingsController;
 