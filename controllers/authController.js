import Otp from "../models/Otp.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/notify.js";
import connectDB from "../utils/db.js";


export const sendOtp = async (req, res) => {
  try {
    
    await connectDB();
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    await Otp.create({ email, otp });
    console.log(otp);

    // prepare email
    const html = `
      <p>Hi,</p>
      <p>Your login OTP is: <strong style="font-size:20px">${otp}</strong></p>
      <p>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `;


    // send email
    await sendEmail({ to: email, subject: "Your OTP for Login", html });

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }

};


export const verifyOtp = async (req, res) => {
  await connectDB();
  const { email, otp, name, role } = req.body;
  if (!email || !otp || !name || !role) return res.status(400).json({ message: "Email, OTP, name, and role are required" });

  const valid = await Otp.findOne({ email, otp });
  if (!valid) return res.status(400).json({ message: "Invalid OTP" });

  // check expiry (extra guard)
  const expireMinutes = Number(process.env.OTP_EXPIRE_MINUTES || 5);
  const ageMs = Date.now() - new Date(valid.createdAt).getTime();
  if (ageMs > expireMinutes * 60 * 1000) {
    await Otp.deleteMany({ email });
    return res.status(400).json({ message: "OTP expired" });
  }
  let user = await User.findOne({ email });
  if (user) {
    user.name = name;
    user.role = role;
    await user.save();
  } else {
    user = await User.create({ name: name || "NoName", email, role: role || "user" });

  }

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

  await Otp.deleteMany({ email });

  return res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" }).json({
    success: true,
    token,
    user,
  });
};




export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('user', {
      path: '/',
    });
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.clearCookie('token');
    res.clearCookie('user');
  
    res.json({
      success: true,
      message: 'Logged out (session cleared)'
    });
  }
};


export const checkUserExists = async (req, res) => {
    try {
      await connectDB();
        const { email } = req.body;
        
        // Check if email exists in database
        const user = await User.findOne({ email });
        
        if (user) {
            res.json({
                registered: true,
                user: {
                    name: user.name,
                    role: user.role
                }
            });
        } else {
            res.json({
                registered: false
            });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}


export const UserProfile = async (req, res) => {
  try {
    await connectDB();
    const user = req.id;
    const profile = await User.findById(user).select("-__v");
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }

}

export const UpdateProfile = async (req, res) => {
  try {
    await connectDB();
    
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    
    const { name, email, mobile, address, pincode, city, state, landmark, latitude, longitude } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    //  Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updateData = {
      name,
      mobile,
      address,
      pincode,
      city, 
      state,
      landmark,
      location: { 
        type: "Point", 
        coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0] 
      }
    };

    //  Agar file hai toh profileImage add karo
    if (req.file) {
      updateData.profileImage = req.file.path;
    }
    const updatedProfile = await User.findOneAndUpdate(
      { email }, 
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedProfile 
    });

  } catch (error) {
    console.error('Update Profile Error:', error);

    res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
}

