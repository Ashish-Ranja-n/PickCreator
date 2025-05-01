import {connect} from "@/lib/mongoose";
import User from "@/models/user";
import bcryptjs from "bcryptjs";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

connect();

export async function POST(request: Request) {
    try {
        const reqBody = await request.json();
        const { email, password } = reqBody;
        console.log(reqBody);
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User does not exist" }, { status: 489 });
        }
        const validPassword = await bcryptjs.compare(password, user.password);
        if (!validPassword) {
            return NextResponse.json({ error: "Invalid Password" }, { status: 490 });
        }
        
        // Create token data with both id and _id to ensure compatibility
        const tokenData = {
            id: user._id, // Add id field for compatibility
            _id: user._id,
            email: user.email,
            role: user.role,
        }
        
        // Sign token using jose
        const token = await new SignJWT(tokenData)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1d')
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        const response = NextResponse.json({
            message: "User logged in successfully",
            success: true,
            user
        });
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60, // 1 day in seconds
        });

        return response;

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }   
}