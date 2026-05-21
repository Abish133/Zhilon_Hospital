const { OtRoom, Hospital } = require('../models');
 
class OtRoomsController {
  static async createOtRoom(req, res) {
    try {
      if (!req.body.hospital_id) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is required'
        });
      }
 
      const otRoom = await OtRoom.create(req.body);
      const hospital = await Hospital.findByPk(req.body.hospital_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...otRoom.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllOtRooms(req, res) {
    try {
      const otRooms = await OtRoom.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const roomsWithHospital = await Promise.all(
        otRooms.map(async (room) => {
          const hospital = await Hospital.findByPk(room.hospital_id);
          return {
            ...room.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );
     
      res.json({ success: true, data: roomsWithHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getOtRoomById(req, res) {
    try {
      const otRoom = await OtRoom.findOne({ where: { room_id: req.params.id, hospital_id: req.hospitalId } });
      if (!otRoom) {
        return res.status(404).json({ success: false, message: 'OT room not found' });
      }
     
      const hospital = await Hospital.findByPk(otRoom.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...otRoom.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateOtRoom(req, res) {
    try {
      const [updated] = await OtRoom.update(req.body, {
        where: { room_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'OT room not found' });
      }
      const updatedRoom = await OtRoom.findOne({ where: { room_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedRoom.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...updatedRoom.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteOtRoom(req, res) {
    try {
      const deleted = await OtRoom.destroy({
        where: { room_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'OT room not found' });
      }
      res.json({ success: true, message: 'OT room deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = OtRoomsController;
 