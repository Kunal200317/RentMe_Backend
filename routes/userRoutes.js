import express from "express";
import { updateUserLocation } from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/update-location", verifyToken, updateUserLocation);

export default router;
