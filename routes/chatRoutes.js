import express from 'express';
import { getMessages, sendMessage } from '../controllers/chatController.js';
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/:bookingId', verifyToken, getMessages);
router.post('/send', verifyToken, sendMessage);

export default router;