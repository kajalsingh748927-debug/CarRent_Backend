import express from 'express';
import upload from '../middleware/multer.js';
import { registerUser, loginUser, getUserData, logoutUser, uploadProfileImage, deleteProfileImage } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';

const userRoute = express.Router();

userRoute.post('/register', registerUser);
userRoute.post('/login', loginUser);
userRoute.post('/logout', logoutUser);
userRoute.get('/data', protect, getUserData);
userRoute.patch('/profile-image', protect, upload.single('image'), uploadProfileImage);
userRoute.delete('/profile-image', protect, deleteProfileImage);

export default userRoute;