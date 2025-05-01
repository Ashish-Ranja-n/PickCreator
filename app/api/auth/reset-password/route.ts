import { NextResponse } from "next/server";
import User from "@/models/user";
import { connect } from "@/lib/mongoose";
import bcryptjs from "bcryptjs";

connect();

export async function POST(req: Request) {
  try {
    const reqBody = await req.json();
    const { email, password } = reqBody;
    console.log("Password reset: Resetting password for email:", email);

    if (!email || !password) {
      console.log("Password reset: Email and password are required");
      return NextResponse.json({
        error: "Email and password are required"
      }, { status: 400 });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Password reset: User not found for email:", email);
      return NextResponse.json({
        error: "Invalid or expired reset session. Please start the password reset process again."
      }, { status: 400 });
    }

    // Check if the user has a valid forgotPasswordToken
    if (!user.forgotPasswordToken || !user.forgotPasswordTokenExpiry) {
      console.log("Password reset: No valid reset token found");
      return NextResponse.json({
        error: "Invalid or expired reset session. Please start the password reset process again."
      }, { status: 400 });
    }

    // Check if the token has expired
    if (user.forgotPasswordTokenExpiry < new Date()) {
      console.log("Password reset: Token expired");
      return NextResponse.json({
        error: "Reset session has expired. Please start the password reset process again."
      }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Update the user's password and clear the reset token
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save();

    console.log("Password reset: Password reset successful for email:", email);
    return NextResponse.json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error: any) {
    console.error("Password reset: Error resetting password:", error);
    return NextResponse.json({
      error: "Failed to reset password. Please try again."
    }, { status: 500 });
  }
}
