const express = require('express');
const OtRoomsController = require('../controllers/OtRoomsController');
const router = express.Router();
 
router.get('/', OtRoomsController.getAllOtRooms);
router.get('/:id', OtRoomsController.getOtRoomById);
router.post('/', OtRoomsController.createOtRoom);
router.put('/:id', OtRoomsController.updateOtRoom);
router.delete('/:id', OtRoomsController.deleteOtRoom);
 
module.exports = router;
 