import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for updating influencer UPI information
 */
export async function PATCH(request: NextRequest) {
  try {
    await connect();
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Verify user is an influencer
    if (userRole !== 'Influencer') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Only influencers can update UPI information' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { upiId, upiUsername } = body;
    
    // Validate required fields
    if (!upiId || !upiUsername) {
      return NextResponse.json({ 
        success: false, 
        error: 'UPI ID and UPI username are required' 
      }, { status: 400 });
    }
    
    // Basic UPI ID validation
    if (!upiId.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please enter a valid UPI ID (e.g., username@paytm)' 
      }, { status: 400 });
    }
    
    // Validate UPI username length
    if (upiUsername.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'UPI username must be at least 2 characters' 
      }, { status: 400 });
    }
    
    // Find and update the influencer
    const influencer = await Influencer.findByIdAndUpdate(
      userId,
      {
        upiId: upiId.trim(),
        upiUsername: upiUsername.trim(),
      },
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!influencer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Influencer not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'UPI information updated successfully',
      data: {
        upiId: influencer.upiId,
        upiUsername: influencer.upiUsername,
      }
    });
    
  } catch (error) {
    console.error('Error updating UPI information:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update UPI information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
