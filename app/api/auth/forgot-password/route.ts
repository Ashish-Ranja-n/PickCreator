import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Otp from "@/models/otp";
import User from "@/models/user";
import { connect } from "@/lib/mongoose";
import crypto from "crypto";

connect();

// Function to generate a 6-digit OTP
const generateOTP = () => {
  // Ensure we always get a 6-digit number as a string
  const otpNumber = Math.floor(100000 + Math.random() * 900000);
  return otpNumber.toString().padStart(6, '0');
};

export async function POST(req: Request) {
  let email: string = "";

  try {
    const reqBody = await req.json();
    email = reqBody.email || "";
    console.log("Password reset: Sending OTP to email:", email);

    if (!email) {
      console.log("Password reset: Email is required but not provided");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Password reset: User not found for email:", email);
      // Return a specific error for non-existent accounts
      return NextResponse.json({
        error: "No account found with this email address. Please check your email or create a new account."
      }, { status: 404 });
    }

    // Delete any existing OTP for this email to avoid conflicts
    await Otp.deleteOne({ email });

    const otp = generateOTP(); // Generate OTP
    console.log("Password reset: Generated OTP:", otp, "for email:", email);

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use other providers or SMTP settings
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // App password (not your Gmail password)
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Verification Code",
      text: `Your password reset verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Password Reset Verification Code</h2>
          <p>Please use the following code to reset your password:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    // Send email
    console.log("Password reset: Sending email to:", email);
    await transporter.sendMail(mailOptions);

    // Create new OTP record
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration
    await Otp.create({ email, otp, expiresAt });
    console.log("Password reset: OTP saved in database, expires at:", expiresAt);

    // Update user's forgotPasswordToken
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.forgotPasswordToken = resetToken;
    user.forgotPasswordTokenExpiry = expiresAt;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully"
    });
  } catch (error: any) {
    console.error("Password reset: Error sending OTP:", error);
    return NextResponse.json({
      error: "Failed to send verification code. Please try again."
    }, { status: 500 });
  }
}
