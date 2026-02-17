import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import userRoute from "./routers/user.route.js";
import ownerRouter from "./routers/owner.route.js";
import bookingRouter from "./routers/booking.route.js";
import carsRouter from "./routers/cars.route.js";

const app = express();

await connectDB();


app.use(
  cors({
    origin: "https://car-rental-k18a.vercel.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/user", userRoute);
app.use("/api/owner", ownerRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/cars", carsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
