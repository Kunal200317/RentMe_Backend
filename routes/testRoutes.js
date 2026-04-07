import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/protected", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully!",
    user: req.user,
  });
});

export default router;
