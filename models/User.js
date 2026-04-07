import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  mobile: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true 
  },
  address: { type: String },
  profileImage: { type: String },
  pincode: { type: Number },
  city: { type: String },
  state: { type: String },
  landmark: { type: String },
  role: { 
    type: String, 
    enum: ["user", "owner"], 
    required: true,
    default: "user" 
  },
  location: {
    type: { 
      type: String, 
      enum: ["Point"], 
      default: "Point" 
    },
    coordinates: { 
      type: [Number], 
      default: [0, 0] 
    } 
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true }); 

userSchema.index({ location: "2dsphere" });
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;