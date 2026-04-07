import express from "express";
import { createBooking ,verifyPayment} from "../controllers/bookingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createBooking);
router.post("/verifyPayment", verifyToken, verifyPayment);

export default router;
