// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketServer } from "socket.io";
import connectDB from "./utils/db.js";


import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/payments.js";
import chatRoute from "./routes/chatRoutes.js"

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT","DELETE","PATCH","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization","params","Cache-Control"],
  }
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT","DELETE","PATCH","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization","params","Cache-Control"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat",chatRoute);


//  Socket connection with DEBUGGING
io.on("connection", (socket) => {
  console.log("🔥 NEW USER CONNECTED:", socket.id);
  
  socket.on("join-user", (userId) => {
    console.log("👤 USER JOINED ROOM: user-" + userId);
    socket.join(`user-${userId}`);
    console.log("📋 Current rooms:", Array.from(socket.rooms));
  });

  socket.on("join-owner", (ownerId) => {
    console.log("👨‍💼 OWNER JOINED ROOM: owner-" + ownerId);
    socket.join(`owner-${ownerId}`);
    console.log("📋 Current rooms for owner:", Array.from(socket.rooms));
  });

    //  NEW CHAT EVENTS
  socket.on("join-chat", (bookingId) => {
    console.log(`💬 User joined chat room: chat-${bookingId}`);
    socket.join(`chat-${bookingId}`);
    console.log("📋 Current chat rooms:", Array.from(socket.rooms));
  });

socket.on("send-message", (messageData) => {
  console.log("🚀 SENDING MESSAGE TO ROOM:", `chat-${messageData.bookingId}`);
  console.log("📨 Message data:", messageData);
  
  //  Room ko message bhejo
  io.to(`chat-${messageData.bookingId}`).emit("receive-message", messageData);
  
  //  Debugging - Kitne users connected hain
  const room = io.sockets.adapter.rooms.get(`chat-${messageData.bookingId}`);
  console.log(`👥 Users in room: ${room ? room.size : 0}`);
});

  //  DEBUG: Check all incoming events
  socket.onAny((eventName, ...args) => {
    console.log(`📨 Socket ${socket.id} received: ${eventName}`, args);
  });

  socket.on("disconnect", () => {
    console.log("❌ USER DISCONNECTED:", socket.id);
  });
});

//  Make io available in routes
app.set("io", io);


setInterval(async () => {
  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const result = await mongoose.model('Booking').deleteMany({
      status: 'approved',          
      paymentStatus: 'pending',   
      createdAt: { $lte: threeMinutesAgo } 
    });
    
    if (result.deletedCount > 0) {
      console.log(`Auto-deleted ${result.deletedCount} unpaid approved bookings`);
    }
  } catch (error) {
    console.error('❌ Auto-delete error:', error);
  }
}, 60 * 1000);


main()
async function main() {
  await connectDB();
}


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));