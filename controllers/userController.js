import User from "../models/User.js";
import connectDB from "../utils/db.js";

export const updateUserLocation = async (req, res) => {
  try {
    await connectDB();
    const { latitude, longitude } = req.body;
    const user = await User.findByIdAndUpdate(
      req.id, // token se milega
      { location: { type: "Point", coordinates: [longitude, latitude] } },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
