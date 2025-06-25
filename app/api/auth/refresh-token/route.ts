import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { SignJWT } from "jose";

connect();

/**
 * API endpoint to refresh the authentication token
 * This extends the session without requiring the user to log in again
 */
export async function GET(request: NextRequest) {
  try {
    // Get the existing token
    const token = request.cookies.get("token")?.value || "";
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated", success: false },
        { status: 401 }
      );
    }
    
    // Validate the existing token
    const userData = await getDataFromToken(request, token);
    
    if (!userData || !userData._id) {
      return NextResponse.json(
        { error: "Invalid token", success: false },
        { status: 401 }
      );
    }
    
    // Get the latest user data from database
    const user = await User.findById(userData._id).select("-password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found", success: false },
        { status: 404 }
      );
    }
    
    // Create token data with both id and _id to ensure compatibility
    const tokenData = {
      id: user._id,
      _id: user._id,
      email: user.email || '',
      role: user.role || "needed",
      // Add role-specific fields
      ...(user.role === 'Influencer' ? {
        instagramConnected: true,
        isInstagramVerified: user.isInstagramVerified || false,
        onboardingCompleted: user.onboardingCompleted || false
      } : {})
    };
    
    // Sign a new token
    const newToken = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    
    // Create the response
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully"
    });
    
    // Set the new token in the cookies
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
    
    return response;
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token", success: false },
      { status: 500 }
    );
  }
}