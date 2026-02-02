import User from "../models/user.model.js";
import Car from "../models/car.model.js";
import Booking from "../models/Booking.js";
import imagekit from "../config/imagekit.js";
import fs from 'fs';

// --- Change User Role ---
export const changeRoleToOwner = async (req, res) => {
    try {
        const { _id } = req.user;
        await User.findByIdAndUpdate(_id, { role: "owner" });
        res.json({ success: true, message: "Now you can list cars" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// --- Add New Car ---
export const addCar = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carData } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        const data = JSON.parse(carData);

        const fileBuffer = fs.readFileSync(imageFile.path);
        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/cars'
        });

        const optimizedUrl = imagekit.url({
            path: uploadResponse.filePath,
            transformation: [{ width: '1280' }, { quality: 'auto' }, { format: 'webp' }]
        });

        const carObject = {
            owner: _id,
            brand: data.brand,
            model: data.model,
            year: data.year,
            category: data.category,
            image: optimizedUrl,
            location: data.location,
            description: data.description,
            pricePerDay: data.pricePerDay,
            transmission: data.transmission,
            fuelType: data.fuelType,
            seatingCapacity: data.seatingCapacity 
        };

        await Car.create(carObject);

        if (fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);

        res.json({ success: true, message: "Car Added Successfully" });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Validation Error:", error.message);
        let message = error.message;
        if (error.name === 'ValidationError' && error.errors) {
            const fields = Object.keys(error.errors)
                .map((k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1').trim());
            message = "Please fill all required fields: " + [...new Set(fields)].join(", ");
        }
        res.status(400).json({ success: false, message });
    }
};

// --- Get Owner's Cars ---
export const getOwnerCars = async (req, res) => {
    try {
        const { _id } = req.user;
        const cars = await Car.find({ owner: _id });
        res.json({ success: true, cars });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// --- Soft Delete Car (Remove owner and mark unavailable) ---
export const deleteCar = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;
        const car = await Car.findById(carId);

        if (!car || car.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        car.owner = null;
        car.isAvailable = false;
        await car.save();
        
        res.json({ success: true, message: "Car removed from your listings" });
    } catch (error) { // Added 'error' variable here
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// --- Toggle Availability ---
export const toggleCarAvailability = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;
        const car = await Car.findById(carId);

        if (!car || car.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        car.isAvailable = !car.isAvailable;
        await car.save();
        
        res.json({ success: true, message: `Car is now ${car.isAvailable ? 'available' : 'unavailable'}` });
    } catch (error) { // Added 'error' variable here
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}
// --- Get Owner's Bookings (for Manage Bookings page) ---
export const getOwnerBookings = async (req, res) => {
    try {
        const { _id } = req.user;
        const cars = await Car.find({ owner: _id }).select('_id');
        const carIds = cars.map(c => c._id);
        const bookings = await Booking.find({ car: { $in: carIds } })
            .populate('car')
            .sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOwnerDashboard = async (req, res) => {
    try {
        const { _id, role } = req.user; 
        
        if (role !== "owner") {
            return res.status(403).json({ success: false, message: "Unauthorized Access" });
        }

        // 1. Fetch all cars owned by this user
        const cars = await Car.find({ owner: _id });
        const carIds = cars.map(car => car._id);

        // 2. Fetch all bookings related to these cars (populate car for recent list)
        const bookings = await Booking.find({ car: { $in: carIds } }).populate('car');

        // 3. Calculate Stats
        const stats = {
            totalCars: cars.length,
            availableCars: cars.filter(c => c.isAvailable).length,
            totalBookings: bookings.length,
            totalEarnings: bookings
                .filter(b => b.status === "confirmed")
                .reduce((sum, b) => sum + b.price, 0),
            activeBookings: bookings.filter(b => b.status === "confirmed").length,
            pendingBookings: bookings.filter(b => b.status === "pending").length
        };

        res.json({
            success: true,
            stats,
            cars,
            recentBookings: bookings.slice(-5).reverse() // Show last 5 bookings
        });
        
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}