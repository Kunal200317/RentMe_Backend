// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "waiting_for_approval", "approved", "on_the_way", "completed", "rejected"], 
    default: "pending" 
  },
  paymentStatus: { type: String, enum: ["pending", "half_paid", "full_paid"], default: "pending", },
  advancePaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
   razorpay: {
    orderId: String,
    paymentId: String,
    signature: String,
  },
  userLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  ownerLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


export default mongoose.model("Booking", bookingSchema);
