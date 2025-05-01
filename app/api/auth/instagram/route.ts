import {  NextResponse } from 'next/server';
import { getInstagramAuthUrl } from '@/utils/instagramApi';

/**
 * API route for initiating Instagram authentication
 * This returns the Instagram OAuth authorization URL
 */
export async function GET() {
  try {
    // Get Instagram authorization URL
    const instagramAuthUrl = getInstagramAuthUrl();
    console.log("Instagram auth URL:", instagramAuthUrl);
    
    // Return the URL in the response for client-side redirect
    return NextResponse.json({ 
      url: instagramAuthUrl,
      success: true 
    });
  } catch (error) {
    console.error('Error initiating Instagram authentication:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to initiate Instagram authentication' },
      { status: 500 }
    );
  }
} 