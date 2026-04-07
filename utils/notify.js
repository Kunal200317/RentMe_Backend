import dotenv from "dotenv";
dotenv.config();

/**
 * Resend API ka use karke email bhejna (Built-in fetch use kiya hai, no package needed!)
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `RentMe <onboarding@resend.dev>`, // Testing sender for Resend
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Email sent successfully via Resend API! ID:", data.id);
    } else {
      console.error("Resend API Error:", data.message || data);
    }
  } catch (err) {
    console.error("sendEmail fetch error:", err.message);
  }
};