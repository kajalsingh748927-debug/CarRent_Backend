import express from 'express';
import { protect } from '../middleware/auth.js';
import { isCarAvailable, createBooking, changeBookingStatus, getMyBookings } from '../controllers/booking.controller.js';

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', isCarAvailable);
bookingRouter.get('/my', protect, getMyBookings);
bookingRouter.post('/create', protect, createBooking);
bookingRouter.put('/change-status', protect, changeBookingStatus);

export default bookingRouter;