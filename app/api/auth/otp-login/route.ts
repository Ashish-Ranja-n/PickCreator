
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// Utility to build token data for a user
function buildTokenData(user: any) {
  const base = {
    id: user._id,
    _id: user._id,
    email: user.email || '',
    role: user.role || "needed",
  };
  if (user.role === 'Influencer') {
    return {
      ...base,
      instagramConnected: true,
      isInstagramVerified: user.isInstagramVerified || false,
      onboardingCompleted: user.onboardingCompleted || false,
    };
  }
  return base;
}

export async function POST(req: Request) {
  await connect();
  try {
    const { email, phone } = await req.json();
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }

    const query: Record<string, any> = email ? { email } : { phoneNumber: phone };
    let user = await User.findOne(query);
    let isNew = false;
    console.log('OTP-LOGIN API: Query:', query);
    console.log('OTP-LOGIN API: User found:', user);

    if (!user) {
      try {
        user = await User.create({
          email: email || undefined,
          phoneNumber: phone || undefined,
          isVerified: true,
        });
        isNew = true;
      } catch (err: any) {
        // Handle duplicate key error (race condition)
        if (err.code === 11000) {
          user = await User.findOne(query);
          if (!user) {
            return NextResponse.json({ error: "Duplicate key error but user not found." }, { status: 500 });
          }
        } else {
          console.error("User creation error:", err);
          return NextResponse.json({ error: err.message || "User creation failed" }, { status: 500 });
        }
      }
    }

    const tokenData = buildTokenData(user);
    console.log('OTP-LOGIN API: tokenData:', tokenData);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: "JWT secret not configured" }, { status: 500 });
    }
    const token = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(jwtSecret));

    const response = NextResponse.json({
      message: isNew ? "New user" : "User exists",
      user,
      isNew,
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("POST /api/auth/otp-login error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
