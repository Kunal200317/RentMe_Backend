import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleType: { type: String, enum: ["car", "bike"], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  rentPerDay: { type: Number, required: true },
  location: { type: String, required: true },
  locationGeo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  images: { type: [String], required: true },
  available: { type: Boolean, default: true },
}, { timestamps: true });

// Create 2dsphere index for fast geospatial proximity searches
vehicleSchema.index({ locationGeo: "2dsphere" });

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;