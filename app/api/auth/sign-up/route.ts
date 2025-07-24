'use server'

import {connect} from "@/lib/mongoose";
import User from "@/models/user";
import bcryptjs from "bcryptjs";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

connect();

export async function POST(request: Request) {
    try {
        const reqBody = await request.json();
        console.log(reqBody);
        const { email, password, role, name } = reqBody;
        console.log(reqBody);
        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ error: "User already exists" }, { status: 489 });
        }
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);
        
        // Create the user with the right model based on role
        let newUser;
        
        try {
            if (role === 'Influencer') {
                // Dynamically import the Influencer model to avoid circular dependencies
                const { Influencer } = await import('@/models/influencer');
                
                // Create a new Influencer (which is a type of User via discriminator)
                newUser = new Influencer({
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    isVerified: true,
                    // Influencer-specific fields
                    socialMediaLinks: [],
                    followers: 0,
                    instagramConnected: true,
                    // Add explicit fields to prevent caching issues
                    onboardingCompleted: false,
                    onboardingStep: 0
                });
                
                // Ensure the instagramConnected flag is explicitly false
                // This prevents issues with AuthGuard redirects
                newUser.instagramConnected = false;
            } else {
                // For other roles, create a standard User
                newUser = new User({
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    isVerified: true
                });
            }
            
            // Save the user/influencer
            const savedUser = await newUser.save();
            console.log('Saved user successfully:', savedUser._id);
            
            // Find the newly created user to ensure we have all fields
            const newUser2 = await User.findOne({ email });
            
            // Create token data with both id and _id to ensure compatibility
            const tokenData = {
                id: newUser2._id, // Add id field for compatibility
                _id: newUser2._id,
                email: newUser2.email,
                role: newUser2.role,
                // Add these fields for Influencers to prevent state inconsistency
                ...(role === 'Influencer' ? {
                    instagramConnected: false,
                    onboardingCompleted: false
                } : {})
            };
            
            // Sign token using jose with extended expiration for native app-like persistence
            const token = await new SignJWT(tokenData)
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('30d') // Extended from 1d to 30d for better persistence
                .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
            
            
            // When creating the response, ensure we return a clear success message
            const response = NextResponse.json({
                message: "User created successfully",
                success: true,
                role: role,
                requiresInstagramConnection: role === 'Influencer'
            },
            {
                status: 200
            });
            
            response.cookies.set("token", token, {
                httpOnly: true,
                secure: true,
                maxAge: 30 * 24 * 60 * 60, // 30 days in seconds for native app-like persistence
                sameSite: "lax",
                path: "/",
            });

            return response;
        } catch (error: any) {
            console.error('Error during user creation:', error);
            return NextResponse.json({ 
                error: "Failed to create user account", 
                details: error.message 
            }, { status: 500 });
        }
    } catch (error:any) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
