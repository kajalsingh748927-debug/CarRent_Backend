import express from 'express'
import { protect } from '../middleware/auth.js';
import { addCar, changeRoleToOwner, getOwnerCars, getOwnerBookings, deleteCar, toggleCarAvailability, getOwnerDashboard } from '../controllers/owner.controller.js';
import upload from '../middleware/multer.js';
const ownerRouter = express.Router();
ownerRouter.post("/change-role",protect,changeRoleToOwner);
ownerRouter.post("/add-car", protect, upload.single("image"), addCar);
ownerRouter.get("/cars", protect, getOwnerCars);
ownerRouter.get("/bookings", protect, getOwnerBookings);
ownerRouter.delete("/delete-car", protect, deleteCar);
ownerRouter.post("/toggle-car", protect, toggleCarAvailability);
ownerRouter.get("/dashboard", protect, getOwnerDashboard);



export default ownerRouter;