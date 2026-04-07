import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Simple Transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Aapka Gmail address
    pass: process.env.EMAIL_PASS, // Aapka 16-digit APP PASSWORD
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'My App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully: ", info.messageId);
  } catch (err) {
    console.error("sendEmail error:", err.message);
  }
};