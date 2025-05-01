import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';

/**
 * API endpoint to fix Instagram connection status when discrepancies are detected
 * This is a safeguard against corrupt database states
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Get the user ID from token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID' 
      }, { status: 400 });
    }
    
    // Get request body to determine whether to set connected to true or false
    const body = await request.json();
    const isConnected = !!body.isConnected; // Convert to boolean
    
    console.log(`Fix Instagram status: Setting connection status to ${isConnected} for user ${userId}`);
    
    // Update both User and Influencer records to ensure consistency
    const userUpdatePromise = User.updateOne(
      { _id: userId },
      { $set: { instagramConnected: isConnected } }
    );
    
    const influencerUpdatePromise = Influencer.updateOne(
      { _id: userId },
      { $set: { instagramConnected: isConnected } }
    );
    
    // Execute updates in parallel
    await Promise.all([userUpdatePromise, influencerUpdatePromise]);
    
    // Log the fix for audit purposes
    console.log(`Fix Instagram status: Successfully updated status to ${isConnected} for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: `Instagram connection status updated to ${isConnected}`
    });
  } catch (error) {
    console.error('Error fixing Instagram status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update Instagram status'
    }, { status: 500 });
  }
} 