import express from "express";
import { getCars, getCarById } from "../controllers/cars.controller.js";

const carsRouter = express.Router();
carsRouter.get("/", getCars);
carsRouter.get("/:id", getCarById);

export default carsRouter;
