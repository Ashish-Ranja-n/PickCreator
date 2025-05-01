import { NextResponse } from "next/server";

export async function GET(){
    try {
        console.log("Server: Processing logout request");
        
        // Create a response
        const response = NextResponse.json({
            message: "User logged out successfully",
            success: true,
        });
        
        // Clear the auth token cookie
        response.cookies.set("token", "", { 
            httpOnly: true,
            secure: true,
            expires: new Date(0),
            path: "/",
            sameSite: "lax"
        });
        
        // Clear any other related cookies
        const cookiesToClear = [
            "userRole",
            "userId",
            "session",
            "refreshToken",
            "instagram_auth",
            "connect.sid"
        ];
        
        cookiesToClear.forEach(cookieName => {
            response.cookies.set(cookieName, "", {
                httpOnly: true,
                secure: true,
                expires: new Date(0),
                path: "/",
                sameSite: "lax"
            });
        });
        
        console.log("Server: Auth cookies cleared");
        return response;
    } catch (error:any) {
        console.error("Server: Error during logout:", error);
        
        // Even if an error occurs, still attempt to clear cookies in the response
        const response = NextResponse.json({ 
            error: error.message,
            message: "Partial logout may have occurred"
        }, { status: 500 });
        
        // Try to clear the token cookie even if there was an error
        try {
            response.cookies.set("token", "", { 
                httpOnly: true, 
                secure: true,
                expires: new Date(0),
                path: "/"
            });
        } catch (cookieError) {
            console.error("Server: Failed to clear cookies during error handling:", cookieError);
        }
        
        return response;
    }
}