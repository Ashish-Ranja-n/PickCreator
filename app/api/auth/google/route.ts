import { NextResponse } from 'next/server';

/**
 * API route for initiating Google OAuth authentication
 * This returns the Google OAuth authorization URL
 */
export async function GET() {
  try {
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';
    
    if (!googleClientId) {
      console.error('Google OAuth client ID not configured');
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Build Google OAuth authorization URL
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const scope = 'email profile';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${encodeURIComponent(responseType)}&` +
      `access_type=${encodeURIComponent(accessType)}&` +
      `prompt=${encodeURIComponent(prompt)}`;

    console.log("Google auth URL:", googleAuthUrl);
    
    // Return the URL in the response for client-side redirect
    return NextResponse.json({ 
      url: googleAuthUrl,
      success: true 
    });
  } catch (error) {
    console.error('Error initiating Google authentication:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
}
