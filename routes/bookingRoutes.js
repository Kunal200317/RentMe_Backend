import express from "express";
import {
  getUserBookings,
  ownerBookings, 
  handleBookingApproval,
  updateBookingStatus,
  createBookingRequest,
  handledeleteBooking,
  getBookingById
} from "../controllers/bookingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/my-bookings", verifyToken, getUserBookings);
router.get("/owner-bookings", verifyToken, ownerBookings);
router.put("/approve/:bookingId", handleBookingApproval); 
router.put("/:id", verifyToken, updateBookingStatus);
router.post("/request", verifyToken, createBookingRequest); 
router.delete("/rejected/:id", verifyToken, handledeleteBooking);
router.get('/:id', verifyToken, getBookingById);

export default router;