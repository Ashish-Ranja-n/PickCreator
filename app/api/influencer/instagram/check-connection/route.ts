import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';

/**
 * API route to check if an influencer has connected their Instagram account
 * This is used to decide whether to redirect to the connection page
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Instagram check: Connected to database");
    
    // Get user data from token (automatically checks Authorization header and cookies)
    const userData = await getDataFromToken(request);
    console.log("Instagram check: User data from token:", userData ? "Found" : "Not found");

    if (!userData) {
      console.log("Instagram check: Invalid token");
      return NextResponse.json({ 
        isConnected: false, 
        error: 'Unauthorized - Invalid token',
        status: 'unauthorized'
      }, { status: 401 });
    }
    
    // Check for both possible ID fields
    const userId = (userData as any).id || (userData as any)._id;
    
    if (!userId) {
      console.log("Instagram check: No user ID in token payload");
      return NextResponse.json({ 
        isConnected: false, 
        error: 'Unauthorized - Missing user ID',
        status: 'unauthorized'
      }, { status: 401 });
    }
    
    console.log("Instagram check: Looking for influencer with user ID:", userId);
    
    // Try to find the influencer using both possible references
    let influencer = await Influencer.findOne({ user: userId }).lean();
    
    // If not found, try looking for the influencer directly by ID
    if (!influencer) {
      console.log("Instagram check: Influencer not found by user reference, trying direct ID");
      influencer = await Influencer.findById(userId).lean();
    }
    
    console.log("Instagram check: Influencer found:", !!influencer);
    
    // If still not found, return not connected
    if (!influencer) {
      console.log("Instagram check: Influencer not found in database");
      return NextResponse.json({
        isConnected: false,
        message: 'Instagram account is not connected - User not found',
        status: 'not_connected'
      });
    }
    
    // Type assertion to fix TypeScript errors
    const influencerData = influencer as unknown as {
      instagramConnected?: boolean;
    };
    
    // Check if Instagram is connected
    const isConnected = !!influencerData?.instagramConnected;
    console.log("Instagram check: Is connected:", isConnected);
    
    // Return the connection status
    return NextResponse.json({
      isConnected,
      message: isConnected 
        ? 'Instagram account is connected' 
        : 'Instagram account is not connected',
      status: isConnected ? 'connected' : 'not_connected'
    });
  } catch (error) {
    console.error('Error checking Instagram connection:', error);
    
    // In case of error, assume not connected
    return NextResponse.json({ 
      isConnected: false, 
      error: 'Failed to check Instagram connection',
      status: 'error'
    }, { status: 500 });
  }
} 