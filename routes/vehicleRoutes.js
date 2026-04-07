import express from "express";
import { addVehicle, getAllVehicles,getNearbyVehicles,getMyVehicles,findparticularVehicle } from "../controllers/vehicleController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import  upload  from "../middlewares/upload.js";
import { verifyOwner } from "../middlewares/verifyOwner.js";



const router = express.Router();

// Only logged-in owner can add vehicle
router.post("/add", verifyToken, verifyOwner, upload.array("images", 5), addVehicle);
// Anyone can see vehicles
router.get("/", getAllVehicles);
// Anyone can see nearby vehicles
router.get("/nearby", verifyToken, getNearbyVehicles);

router.get("/my", verifyToken, getMyVehicles);

router.get("/:id", verifyToken, findparticularVehicle);





export default router;
