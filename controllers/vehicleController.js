import Vehicle from "../models/Vehicle.js";
import connectDB from "../utils/db.js";

export const addVehicle = async (req, res) => {
  try {
    await connectDB();

    const { vehicleType, brand, model, rentPerDay, location, latitude, longitude } = req.body;
    const ownerId = req.id;

    //  Validate required fields
    if (!vehicleType || !brand || !model || !rentPerDay) {
      return res.status(400).json({ 
        success: false, 
        message: "all fields are required" 
      });
    }

    //  Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid latitude and longitude are required" 
      });
    }

    //  Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one image is required" 
      });
    }

    // Cloudinary URLs
    const images = req.files.map(file => file.path);

    const newVehicle = new Vehicle({
      ownerId,
      vehicleType,
      brand,
      model,
      rentPerDay,
      location: location || "Unknown Location",
      locationGeo: {
        type: "Point",
        coordinates: [lng, lat] //  Use parsed numbers
      },
      images,
      available: true,
    });

    await newVehicle.save();

    res.status(201).json({ 
      success: true, 
      message: "Vehicle added successfully",
      vehicle: newVehicle 
    });
    
  } catch (err) {
    console.error("Add vehicle error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};



export const getAllVehicles = async (req, res) => {
  try {
    await connectDB();
    const vehicles = await Vehicle.find({ available: true }).populate("ownerId", "name mobile");
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getMyVehicles = async (req, res) => {
  try {
    await connectDB();
    const ownerId = req.id;
    const vehicles = await Vehicle.find({ ownerId });
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getNearbyVehicles = async (req, res) => {
  try {
    await connectDB();
    const { lat, lng, maxDistance = 50000 } = req.query; // Default 50km

    // Validation improve karein
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude are required" 
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const distance = parseFloat(maxDistance);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(distance)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid coordinates or distance" 
      });
    }

    // Coordinates range check
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        success: false, 
        message: "Coordinates out of valid range" 
      });
    }

    console.log("🔍 Searching vehicles near:", [longitude, latitude], "Radius:", distance);

    const vehicles = await Vehicle.find({
      available: true,
      locationGeo: {
        $near: {
          $geometry: { 
            type: "Point", 
            coordinates: [longitude, latitude] 
          },
          $maxDistance: distance
        }
      }
    }).populate("ownerId", "name mobile");

    // Add distance calculation for each vehicle
    const vehiclesWithDistance = vehicles.map(vehicle => {
      // Simple distance calculation (optional)
      return {
        ...vehicle.toObject(),
        distance: calculateDistance(latitude, longitude, vehicle.locationGeo.coordinates[1], vehicle.locationGeo.coordinates[0])
      };
    });

    res.json({ success: true, count: vehicles.length, vehicles: vehiclesWithDistance  });

  } catch (err) {
    console.error("❌ Nearby vehicles error:", err);
    res.status(500).json({  success: false,  message: err.message 
    });
  }
};

// Helper function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}


export const findparticularVehicle = async (req, res) => {
  try {
    await connectDB();  

    const { id } = req.params;

    const vehicle = await Vehicle.findById(id).populate("ownerId", "name mobile");

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });
  } catch (err) {
    console.error("Find vehicle error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


