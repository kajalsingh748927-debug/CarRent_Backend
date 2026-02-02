import Booking from '../models/Booking.js';
import Car from '../models/car.model.js';

/**
 * Helper function to check if a specific car is booked during the requested dates.
 * It searches for any existing booking that overlaps with the new range.
 */
const checkAvailability = async (carId, pickupDate, returnDate) => {
    // A booking overlaps if:
    // Existing Pickup is BEFORE New Return AND Existing Return is AFTER New Pickup
    const overlappingBookings = await Booking.find({
        car: carId,
        status: { $ne: "cancelled" }, // Ignore cancelled bookings
        pickupDate: { $lt: returnDate },
        returnDate: { $gt: pickupDate }
    });

    // If no overlapping bookings are found, the car is available (returns true)
    return overlappingBookings.length === 0;
};

/**
 * Controller to fetch all available cars based on location and date range.
 */
export const isCarAvailable = async (req, res) => {
    try {
        const { location, pickupDate, returnDate } = req.body;

        // 1. Find all cars in the specific location that are generally marked as available
        const allCarsInLocation = await Car.find({ location, isAvailable: true });

        // 2. Map through each car and check its specific schedule availability
        // Since database calls are asynchronous, this creates an array of Promises
        const availabilityPromises = allCarsInLocation.map(async (car) => {
            const isAvailable = await checkAvailability(
                car._id,
                new Date(pickupDate),
                new Date(returnDate)
            );

            // Return the car object if available, otherwise return null
            return isAvailable ? car : null;
        });

        // 3. Wait for all availability checks to finish
        const results = await Promise.all(availabilityPromises);

        // 4. Filter out the 'null' entries to get the final list of free cars
        const availableCars = results.filter(car => car !== null);

        res.status(200).json({
            success: true,
            count: availableCars.length,
            availableCars
        });

    } catch (error) {
        console.error("Availability Error:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * Controller to create a new booking
 */
export const createBooking = async (req, res) => {
    try {
        const { _id } = req.user; // User ID from auth middleware
        const { car, pickupDate, returnDate } = req.body;

        // 1. Verify availability one last time before creating the booking
        const isAvailable = await checkAvailability(car, new Date(pickupDate), new Date(returnDate));
        if (!isAvailable) {
            return res.status(400).json({ 
                success: false, 
                message: "Car is not available for these dates" 
            });
        }

        // 2. Fetch car details to get the price and owner information
        const carData = await Car.findById(car);
        if (!carData) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        // 3. Calculate total price based on number of days
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        
        // Difference in milliseconds divided by ms in a day
        const timeDiff = returned - picked;
        const noOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (noOfDays <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Return date must be after pickup date" 
            });
        }

        const totalPrice = carData.pricePerDay * noOfDays;

        // 4. Create the booking record in the database
        const newBooking = await Booking.create({
            car,
            user: _id,
            owner: carData.owner,
            pickupDate: picked,
            returnDate: returned,
            price: totalPrice,
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Booking Created Successfully",
            booking: newBooking
        });

    } catch (error) {
        console.error("Booking Creation Error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * Controller to change booking status (approve, reject, cancel)
 */
export const changeBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, status } = req.body;

        // Validate status (must match Booking schema enum)
        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status value" 
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({ 
                success: false, 
                message: "Booking not found" 
            });
        }

        // Authorization check: Only the car owner can change status
        if (booking.owner.toString() !== _id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized: Only the car owner can change booking status" 
            });
        }

        // Update the booking status
        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: `Booking status updated to ${status}`,
            booking
        });

    } catch (error) {
        console.error("Status Change Error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * Get current user's bookings (for My Bookings page)
 */
export const getMyBookings = async (req, res) => {
    try {
        const { _id } = req.user;
        const bookings = await Booking.find({ user: _id })
            .populate('car')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Get My Bookings Error:", error.message);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};