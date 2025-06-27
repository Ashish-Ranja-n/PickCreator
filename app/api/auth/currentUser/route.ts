import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { connect } from "@/lib/mongoose";

// Connect to MongoDB
await connect();

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export async function GET(req: NextRequest) {
  try {
    // Get user ID from token with timeout protection
    const tokenPromise = getDataFromToken(req);
    const payload = await withTimeout(tokenPromise, 3000);
    
    if (!payload || !payload._id) {
      return NextResponse.json(
        { error: "Invalid or missing token data" },
        { status: 401 }
      );
    }
    
    // Fetch user with timeout protection
    const userPromise = User.findById(payload._id).select("-password");
    const user = await withTimeout(userPromise, 5000);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return successful response with user data
    return NextResponse.json({
      message: "User found successfully",
      success: true,
      user
    });
  } catch (error: any) {
    console.error("Error in currentUser API:", error);
    
    // Determine appropriate status code based on error
    let statusCode = 500;
    let errorMessage = "Internal server error";
    
    if (error.message.includes("timed out")) {
      statusCode = 504; // Gateway Timeout
      errorMessage = "Request timed out";
    } else if (error.message.includes("token")) {
      statusCode = 401; // Unauthorized
      errorMessage = "Invalid token";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        success: false
      },
      { status: statusCode }
    );
  }
}
