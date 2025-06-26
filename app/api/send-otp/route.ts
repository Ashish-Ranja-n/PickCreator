import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Otp from "@/models/otp";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";

await connect();
// Function to generate a 6-digit OTP
const generateOTP = () => {
  // Ensure we always get a 6-digit number as a string
  const otpNumber = Math.floor(100000 + Math.random() * 900000);
  return otpNumber.toString().padStart(6, '0');
};

export async function POST(req: Request) {
  try {
    const reqBody = await req.json();
    const email = typeof reqBody.email === 'string' && reqBody.email.trim() !== '' ? reqBody.email.trim() : null;
    console.log("Sending OTP to email:", email);

    if (!email) {
      console.log("Email is required but not provided");
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Delete any existing OTP for this email to avoid conflicts
    await Otp.deleteOne({ email });

    const otp = generateOTP(); // Generate OTP
    console.log("Generated OTP:", otp, "for email:", email);

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net", // You can use other providers or SMTP settings
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // App password (not your Gmail password)
      },
    });

    // Email content
    const mailOptions = {
      from: `"PickCreator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email verification.",
      text: `Your verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Your Verification Code</h2>
          <p>Please use the following code to verify your account:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    // Send email
    console.log("Sending email to:", email);
    await transporter.sendMail(mailOptions);
    
    // Create new OTP record
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration
    await Otp.create({ email, otp, expiresAt });
    console.log("OTP saved in database, expires at:", expiresAt);

    return NextResponse.json({ message: "Verification code sent successfully" });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send verification code. Please try again."}, { status: 471 });
  }
}
