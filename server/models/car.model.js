import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    image: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, required: true },
    // Changed to camelCase for consistency
    seatingCapacity: { type: Number, required: true }, 
    fuelType: { type: String, required: true },
    transmission: { type: String, required: true },
    pricePerDay: { type: Number, required: true }, // Changed String to Number for math
    location: { type: String, required: true },
    description: { type: String, required: true },
    isAvailable: { type: Boolean, default: true } // Fixed typo: Avaliable -> Available
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
export default Car;