
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, unique: true },
  address: { type: String },
  profileImage: { type: String },
  pincode: { type: Number },
  city: { type: String },
  state: { type: String },
  landmark: { type: String },
  role: { type: String, enum: ["user", "owner"], required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("User", userSchema);
