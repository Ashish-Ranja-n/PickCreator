import { NextResponse, NextRequest } from "next/server";
import { connect } from "@/lib/mongoose";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import User from "@/models/user";

// Connect to MongoDB
connect();

/**
 * API endpoint to get consolidated status information for influencers
 * This combines multiple status checks into a single API call to avoid
 * cascading API calls and potential race conditions
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenCookie = cookieHeader
      .split("; ")
      .find((cookie) => cookie.startsWith("token="));

    if (!tokenCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = tokenCookie.split("=")[1];

    // Verify and decode token
    const tokenData = await getDataFromToken(request, token);
    if (!tokenData || !tokenData._id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find user and check role
    const user = await User.findById(tokenData._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is an influencer
    if (user.role !== "Influencer") {
      return NextResponse.json(
        { error: "Only influencers can access this endpoint" },
        { status: 403 }
      );
    }

    // Get and process status information
    try {
      // Load the Influencer model dynamically to avoid circular dependencies
      const { Influencer } = await import("@/models/influencer");

      // Find influencer with populated data
      const influencer = await Influencer.findById(user._id);
      
      if (!influencer) {
        return NextResponse.json(
          { error: "Influencer profile not found" },
          { status: 404 }
        );
      }

      // Prepare response with all necessary status information
      const statusResponse = {
        isConnected: influencer.instagramConnected || false,
        onboardingCompleted: influencer.onboardingCompleted || false,
        instagramUsername: influencer.instagramUsername || null,
        instagramData: influencer.instagramData || null,
        // Add any other status information that might be needed
      };

      return NextResponse.json(statusResponse);
    } catch (error) {
      console.error("Error getting influencer status:", error);
      return NextResponse.json(
        { error: "Error retrieving status information" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in status API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 