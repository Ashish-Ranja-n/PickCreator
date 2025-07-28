import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const req = request as NextRequest;

    // Get user data from token (automatically checks Authorization header and cookies)
    const userData = await getDataFromToken(req);
    
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
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds for native app-like persistence
      sameSite: "lax",
      path: "/",
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}