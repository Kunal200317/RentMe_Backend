import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "vehicles", // Cloudinary folder name
      resource_type: "auto", // auto-detect (image, video, pdf, etc.)
      public_id: file.originalname.split(".")[0], // optional: use filename as ID
    };
  },
});

// Multer parser
const parser = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for safety
});

export default parser;
