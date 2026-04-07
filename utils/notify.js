import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Simple Transporter for Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // For cloud environments
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
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