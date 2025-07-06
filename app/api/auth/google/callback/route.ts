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
 * API route for handling Google OAuth callback
 * This receives the authorization code from Google and exchanges it for an access token
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Google callback: Processing callback");

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';
    console.log("Using base URL for redirects:", baseUrl);

    // Connect to the database
    await connect();

    // Get the authorization code from the query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // If user denied access or there's an error
    if (error) {
      console.log("Google callback: Error from Google:", error);
      return NextResponse.redirect(`${baseUrl}/welcome?error=access_denied`);
    }

    // If no code is provided, return an error
    if (!code) {
      console.log("Google callback: No code provided");
      return NextResponse.redirect(`${baseUrl}/welcome?error=missing_code`);
    }

    console.log("Google callback: Code received, exchanging for token");

    try {
      // Exchange the authorization code for an access token
      const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      if (!googleClientId || !googleClientSecret) {
        console.error('Google OAuth credentials not configured');
        return NextResponse.redirect(`${baseUrl}/welcome?error=config_error`);
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Google token exchange failed:', errorText);
        return NextResponse.redirect(`${baseUrl}/welcome?error=token_exchange_failed`);
      }

      const tokenData = await tokenResponse.json();
      console.log("Google callback: Token received, getting profile");

      // Get the user profile from Google
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        console.error('Failed to get Google profile');
        return NextResponse.redirect(`${baseUrl}/welcome?error=profile_fetch_failed`);
      }

      const profile = await profileResponse.json();
      console.log("Google callback: Profile received:", JSON.stringify(profile));

      const email = profile.email;
      if (!email) {
        console.error('No email in Google profile');
        return NextResponse.redirect(`${baseUrl}/welcome?error=no_email`);
      }

      // Find or create user in the database - following OTP login pattern exactly
      let user = await User.findOne({ email });
      let isNew = false;
      console.log('Google callback: Query:', { email });
      console.log('Google callback: User found:', user);

      if (!user) {
        try {
          user = await User.create({
            email: email,
            isVerified: true,
          });
          isNew = true;
          console.log("Google callback: New user created");
        } catch (err: any) {
          // Handle duplicate key error (race condition)
          if (err.code === 11000) {
            user = await User.findOne({ email });
            if (!user) {
              return NextResponse.redirect(`${baseUrl}/welcome?error=user_creation_failed`);
            }
          } else {
            console.error("User creation error:", err);
            return NextResponse.redirect(`${baseUrl}/welcome?error=user_creation_failed`);
          }
        }
      }

      // Create JWT token
      const tokenDataForJWT = buildTokenData(user);
      console.log('Google callback: tokenData:', tokenDataForJWT);
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.redirect(`${baseUrl}/welcome?error=jwt_config_error`);
      }
      
      const token = await new SignJWT(tokenDataForJWT)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(jwtSecret));

      // Create response with redirect
      let redirectUrl;
      if (isNew) {
        redirectUrl = `${baseUrl}/pickRole`;
      } else {
        if (user.role === "Brand") {
          redirectUrl = `${baseUrl}/brand`;
        } else if (user.role === "Influencer") {
          redirectUrl = `${baseUrl}/influencer`;
        } else {
          redirectUrl = `${baseUrl}/`;
        }
      }

      const response = NextResponse.redirect(redirectUrl);

      // Set the token in the cookies
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        sameSite: "lax",
        path: "/",
      });

      return response;

    } catch (error) {
      console.error('Error during Google OAuth process:', error);
      return NextResponse.redirect(`${baseUrl}/welcome?error=oauth_process_failed`);
    }

  } catch (error) {
    console.error('Error handling Google callback:', error);

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';

    // Redirect with a generic error
    return NextResponse.redirect(`${baseUrl}/welcome?error=api_error`);
  }
}
