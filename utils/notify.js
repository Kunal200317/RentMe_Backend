
/**
 * Universal Email Delivery using SendGrid API
 * 1. Works without a custom domain (Single Sender Verification).
 * 2. Uses HTTP API (Not blocked by Render/Vercel firewall).
 */
export const sendEmail = async ({ to, subject, html }) => {
  // If no SendGrid key is provided, we log a warning but don't crash the server
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.includes("PASTE")) {
    console.warn("⚠️ SendGrid API Key is missing. Email not sent.");
    return;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ 
          to: [{ email: to }] 
        }],
        from: { 
          email: process.env.SENDGRID_SENDER_EMAIL || "your-verified-gmail@gmail.com",
          name: "RentMe Support" 
        },
        subject: subject,
        content: [{ 
          type: "text/html", 
          value: html 
        }],
      }),
    });

    if (response.ok) {
      console.log("✅ Email sent successfully via SendGrid API!");
    } else {
      const errorData = await response.json();
      console.error("❌ SendGrid API Error:", errorData);
    }
  } catch (err) {
    console.error("⚠️ SendGrid Transmission Error:", err.message);
  }
};