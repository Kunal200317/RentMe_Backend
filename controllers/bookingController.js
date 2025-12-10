import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import connectDB from "../utils/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";


// Create Booking
export const createBooking = async (req, res) => {
  try {
    await connectDB();
    const { bookingData, amount } = req.body;

    // PEHLE CHECK VEHICLE AVAILABILITY - IMPORTANT
    const existingBooking = await Booking.findOne({
      vehicleId: bookingData.vehicleId,
      status: "approved",
      paymentStatus: { $in: ["half_paid", "full_paid"] },
      $or: [
        {
          startDate: { $lte: bookingData.endDate },
          endDate: { $gte: bookingData.startDate }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already booked for these dates. Please select different dates."
      });
    }

    // PHIR RAZORPAY ORDER CREATE KAREIN
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    const pending = {
      ...bookingData,
      razorpayOrderId: order.id,
      amount: Number(amount),
      createdAt: new Date(),
    };

    // Return order and key id to frontend
    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      pendingBooking: pending,
    });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    await connectDB();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData, amount, bookingId } = req.body;



    // verify signature
    const bodyString = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(bodyString)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    // Signature valid -> save booking
    const totalAmount = Number(bookingData.totalPrice); // rupees
    const advancePaid = Number(amount); // rupees (amount paid now)
    const remaining = totalAmount - advancePaid;



    // Check if vehicle exists
    const vehicle = await Vehicle.findById(bookingData.vehicleId);
    let ownerId = vehicle.ownerId;
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });


    const booking = await Booking.findByIdAndUpdate(bookingId, {
      vehicleId: bookingData.vehicleId,
      userId: req.id,
      ownerId: ownerId,
      ownerLocation: vehicle.locationGeo,
      userLocation: { type: "Point", coordinates: [bookingData.userLocation.longitude, bookingData.userLocation.latitude] },
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalDays: bookingData.totalDays,
      totalPrice: bookingData.totalPrice,
      paymentStatus: "half_paid",
      advancePaid: advancePaid,
      remainingAmount: remaining,
      razorpay: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    await Vehicle.findByIdAndUpdate(bookingData.vehicleId, { $set: { available: false } });

    return res.json({ success: true, booking });

  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
};


export const getUserBookings = async (req, res) => {
  try {
    await connectDB();
    const userId = req.id;

    const bookings = await Booking.find({ userId ,paymentStatus: { $in: ['half_paid', 'full_paid'] }})
      .populate("vehicleId")
      .populate("ownerId");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const ownerBookings = async (req, res) => {
  try {
    await connectDB();
    const ownerId = req.id; // token se aayega (verifyToken middleware)

    const bookings = await Booking.find({ ownerId })
      .populate("vehicleId", "brand model rentPerDay ownerId")
      .populate("userId", "name mobile");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const handleBookingApproval = async (req, res) => {
  try {
    await connectDB();
    const { bookingId } = req.params;
    const { action } = req.query;

    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("vehicleId");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (action === "approve") {
      booking.status = "approved";
    } else if (action === "reject") {
      booking.status = "rejected";
    }

    await booking.save();

    //  REAL-TIME RESPONSE TO USER
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${booking.userId._id}`).emit("booking-status-update", {
        bookingId: booking._id,
        status: booking.status,
        message: `Booking ${action}ed by owner`
      });
    }

    res.json({
      success: true,
      message: `Booking ${action}d successfully`,
      status: booking.status
    });

  } catch (err) {
    console.error("Booking approval error:", err);
    res.status(500).json({ success: false, message: "Error updating booking status" });
  }
};


export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// createBookingRequest function mein yeh ensure karein
export const createBookingRequest = async (req, res) => {
  try {
    await connectDB();
    const { vehicleId, startDate, endDate, totalDays, totalPrice, userLocation } = req.body;
    const userId = req.id;

    console.log("📦 Booking Request Data:", req.body);

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    console.log("🚗 Vehicle Owner ID:", vehicle.ownerId);

    //  CREATE BOOKING
    const booking = await Booking.create({
      vehicleId,
      userId,
      ownerId: vehicle.ownerId,
      startDate,
      endDate,
      totalDays,
      totalPrice,
      status: "pending",
      paymentStatus: "pending",
      userLocation: {
        type: "Point",
        coordinates: [userLocation.longitude, userLocation.latitude]
      },
      ownerLocation: vehicle.locationGeo
    });

    console.log(" Booking Created:", booking._id);

    //  REAL-TIME NOTIFICATION - YEH IMPORTANT HAI
    const io = req.app.get("io");
    console.log("🔌 IO Instance Available:", !!io);

    if (io) {
      const ownerRoom = `owner-${vehicle.ownerId}`;
      console.log("📢 Emitting to owner room:", ownerRoom);

      //  CORRECT EVENT EMIT
      io.to(ownerRoom).emit("new-booking-request", {
        bookingId: booking._id, //  Real booking ID
        vehicle: `${vehicle.brand} ${vehicle.model}`,
        startDate: startDate,
        endDate: endDate,
        totalPrice: totalPrice
      });

      console.log(" Notification sent to owner");
    }

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      message: "Booking request sent to owner"
    });

  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handledeleteBooking = async (req, res) => {
 try {
    await connectDB();
    const { id } = req.params;
    const deletedBooking = await Booking.findByIdAndDelete(id);
    
    res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('vehicleId')
      .populate('ownerId', 'name mobile')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};