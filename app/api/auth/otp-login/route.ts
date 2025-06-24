import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

await connect();

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();
    let user = null;
    const identifier = email || phone;
    let query = {};
    // Improved query logic: check for both email and phone if both are provided
    if (email && phone) query = { $or: [{ email }, { phoneNumber: phone }] };
    else if (email) query = { email };
    else if (phone) query = { phoneNumber: phone };
    if (!identifier) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }
    user = await User.findOne(query);
    let tokenData;
    if (user) {
      tokenData = {
        id: user._id,
        _id: user._id,
        email: user.email,
        role: user.role,
      };
    } else {
      try {
        // New user: create in DB without role, assign role 'needed' only in token
        const newUser = await User.create({ email: email || undefined, phoneNumber: phone || undefined });
        tokenData = {
          id: newUser._id,
          _id: newUser._id,
          role: "needed",
        };
        user = newUser;
      } catch (createErr: any) {
        // Handle duplicate key error gracefully
        if (createErr.code === 11000) {
          // Find the user again
          user = await User.findOne(query);
          if (user) {
            tokenData = {
              id: user._id,
              _id: user._id,
              email: user.email,
              role: user.role,
            };
          } else {
            return NextResponse.json({ error: "Duplicate key error but user not found." }, { status: 500 });
          }
        } else {
          // Log and return the actual error for debugging
          console.error("User creation error:", createErr);
          return NextResponse.json({ error: createErr.message || "User creation failed" }, { status: 500 });
        }
      }
    }
    const token = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    const response = NextResponse.json({
      message: user ? (user.role === "needed" ? "New user" : "User exists") : "New user",
      user,
      isNew: !user || user.role === "needed",
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error: any) {
    // Log and return the actual error for debugging
    console.error("POST /api/auth/otp-login error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
