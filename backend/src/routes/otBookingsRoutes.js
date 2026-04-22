const express = require('express');
const OtBookingsController = require('../controllers/OtBookingsController');
const router = express.Router();
 
router.get('/', OtBookingsController.getAllOtBookings);
router.get('/:id', OtBookingsController.getOtBookingById);
router.post('/', OtBookingsController.createOtBooking);
router.put('/:id', OtBookingsController.updateOtBooking);
router.delete('/:id', OtBookingsController.deleteOtBooking);
 
module.exports = router;
 