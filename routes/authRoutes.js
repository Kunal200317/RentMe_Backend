import express from "express";
import { sendOtp, verifyOtp,UserProfile, UpdateProfile,checkUserExists,logout } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/user-profile", verifyToken, UserProfile);
router.put("/update-user", verifyToken, upload.single("profileImage"), UpdateProfile);
router.post('/check-email', checkUserExists);
router.post('/logout', verifyToken, logout);



export default router;
