import Car from "../models/car.model.js";

/** GET /api/cars - list all available cars (public) */
export const getCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: { $ne: null }, isAvailable: true });
    res.json({ success: true, cars });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/cars/:id - get one car by id (public) */
export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    res.json({ success: true, car });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
