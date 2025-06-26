import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const req = request as NextRequest;
    // Get the actual token from request
    const token = req.cookies.get("token")?.value || "";
    
    // Get user data from token
    const userData = await getDataFromToken(req, token);
    
    // If we can get the user data, the token is valid
    if (!userData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Refresh the token cookie with the same token but reset expiry
    const response = NextResponse.json(
      { success: true, authenticated: true },
      { status: 200 }
    );
    
    // Set the cookie again with refreshed expiry
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}