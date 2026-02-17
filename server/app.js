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

// Database Connection
await connectDB();

// ✅ Define Allowed Origins
const allowedOrigins = [
                  // Local Vite/React Dev
  "https://car-rental-k18a.vercel.app"      // Production URL
];

// ✅ Updated CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ Trust proxy (Required for cookies on platforms like Vercel/Heroku)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/user", userRoute);
app.use("/api/owner", ownerRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/cars", carsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
