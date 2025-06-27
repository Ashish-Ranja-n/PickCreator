
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
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

/**
 * API endpoint to refresh the authentication token
 * This extends the session without requiring the user to log in again
 */
export async function GET(request: NextRequest) {
  await connect();
  try {
    // Get the existing token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated", success: false }, { status: 401 });
    }

    // Validate the existing token
    const userData = await getDataFromToken(request, token);
    if (!userData || !(userData._id || userData.id)) {
      return NextResponse.json({ error: "Invalid token", success: false }, { status: 401 });
    }

    // Get the latest user data from database
    const user = await User.findById(userData._id || userData.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found", success: false }, { status: 404 });
    }

    // Build token data
    const tokenData = buildTokenData(user);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: "JWT secret not configured", success: false }, { status: 500 });
    }

    // Sign a new token
    const newToken = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(jwtSecret));

    // Create the response
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      user: tokenData,
    });

    // Set the new token in the cookies
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh token", success: false },
      { status: 500 }
    );
  }
}