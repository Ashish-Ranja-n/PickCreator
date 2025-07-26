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

        if (!token) {
            return null;
        }

        try {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));

            // Check if payload contains the expected user ID field
            if (!payload.id && payload._id) {
                // @ts-ignore - Adding id field to payload
                payload.id = payload._id;
            }

            return payload as unknown as UserData;
        } catch (jwtError: any) {
            if(jwtError.code === "ERR_JWT_EXPIRED") {
                return null;
            }
            return null;
        }
    } catch (error: any) {
        return null;
    }
};


