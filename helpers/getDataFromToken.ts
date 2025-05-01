import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define the user data type
export interface UserData {
  id?: string;
  _id?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export const getDataFromToken = async (request: NextRequest, providedToken?: string): Promise<UserData | null> => {
    try {
        const token = providedToken || request.cookies.get("token")?.value || "";
        console.log("Token verification: Token length:", token.length > 0 ? `${token.length} chars` : "No token");
        
        if (!token) {
            console.log("Token verification: Empty token");
            return null;
        }
        
        try {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
            console.log("Token verification: Success with jose, payload contains:", Object.keys(payload).join(", "));
            
            // Check if payload contains the expected user ID field
            if (!payload.id && payload._id) {
                console.log("Token verification: Converting _id to id");
                // @ts-ignore - Adding id field to payload
                payload.id = payload._id;
            }
            
            return payload as unknown as UserData;
        } catch (jwtError: any) {
            console.log("Token verification: JWT Error:", jwtError.message || "Unknown JWT error");
            if(jwtError.code === "ERR_JWT_EXPIRED") {
                console.log("Token verification: Token expired");
                return null;
            }
            console.log("Token verification: Other JWT error");
            return null;
        }
    } catch (error: any) {
        console.log("Token verification: Unexpected error:", error.message || "Unknown error");
        return null;
    }
};


