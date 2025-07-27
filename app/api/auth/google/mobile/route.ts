import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';
import { SignJWT } from 'jose';

// Utility to build token data for a user
function buildTokenData(user: any) {
  const base = {
    id: user._id,
    _id: user._id,
    email: user.email || '',
    role: user.role || "needed",
  };
  if (user.role === 'Influencer') {
    return {
      ...base,
      instagramConnected: true,
      isInstagramVerified: user.isInstagramVerified || false,
      onboardingCompleted: user.onboardingCompleted || false,
    };
  }
  return base;
}

/**
 * API route for handling Google OAuth from mobile apps
 * This receives access tokens from mobile Google Sign-In
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Mobile Google auth: Processing mobile Google sign-in");

    // Connect to the database
    await connect();

    // Get the request body
    const body = await request.json();
    const { accessToken, idToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log("Mobile Google auth: Access token received, getting profile");

    try {
      // Get the user profile from Google using the access token
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        console.error('Failed to get Google profile from mobile');
        return NextResponse.json(
          { success: false, message: 'Failed to verify Google token' },
          { status: 400 }
        );
      }

      const profile = await profileResponse.json();
      console.log("Mobile Google auth: Profile received:", JSON.stringify(profile));

      const email = profile.email;
      if (!email) {
        console.error('No email in Google profile from mobile');
        return NextResponse.json(
          { success: false, message: 'No email found in Google account' },
          { status: 400 }
        );
      }

      // Find or create user in the database - following OTP login pattern exactly
      let user = await User.findOne({ email });
      let isNew = false;
      console.log('Mobile Google auth: Query:', { email });
      console.log('Mobile Google auth: User found:', user);

      if (!user) {
        try {
          user = await User.create({
            email: email,
            isVerified: true,
          });
          isNew = true;
          console.log("Mobile Google auth: New user created");
        } catch (err: any) {
          // Handle duplicate key error (race condition)
          if (err.code === 11000) {
            user = await User.findOne({ email });
            if (!user) {
              return NextResponse.json(
                { success: false, message: 'Failed to create user account' },
                { status: 500 }
              );
            }
          } else {
            console.error("User creation error:", err);
            return NextResponse.json(
              { success: false, message: 'Failed to create user account' },
              { status: 500 }
            );
          }
        }
      }

      // Create JWT token
      const tokenDataForJWT = buildTokenData(user);
      console.log('Mobile Google auth: tokenData:', tokenDataForJWT);
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json(
          { success: false, message: 'Server configuration error' },
          { status: 500 }
        );
      }
      
      const token = await new SignJWT(tokenDataForJWT)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d") // Extended for mobile app persistence
        .sign(new TextEncoder().encode(jwtSecret));

      // Return success response with token and user data
      return NextResponse.json({
        success: true,
        token: token,
        user: user,
        isNew: isNew,
      });

    } catch (error) {
      console.error('Error during mobile Google OAuth process:', error);
      return NextResponse.json(
        { success: false, message: 'Google authentication failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error handling mobile Google auth:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during authentication' },
      { status: 500 }
    );
  }
}
