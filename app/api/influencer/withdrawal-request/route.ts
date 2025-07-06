import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import WithdrawalRequest from '@/models/withdrawalRequest';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for creating withdrawal requests
 */
export async function POST(request: NextRequest) {
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
        error: 'Access denied - Only influencers can request withdrawals' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { amount } = body;
    
    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please enter a valid amount' 
      }, { status: 400 });
    }
    
    if (amount < 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'Minimum withdrawal amount is ₹100' 
      }, { status: 400 });
    }
    
    // Find the influencer and check earnings
    const influencer = await Influencer.findById(userId);
    if (!influencer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Influencer not found' 
      }, { status: 404 });
    }
    
    // Check if influencer has UPI information
    if (!influencer.upiId || !influencer.upiUsername) {
      return NextResponse.json({ 
        success: false, 
        error: 'UPI information is required. Please add your UPI details first.' 
      }, { status: 400 });
    }
    
    // Check if influencer has sufficient earnings
    const currentEarnings = influencer.earnings || 0;
    if (amount > currentEarnings) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient earnings. Your current earnings: ₹${currentEarnings.toLocaleString()}` 
      }, { status: 400 });
    }
    
    // Check for existing pending withdrawal requests
    const existingPendingRequest = await WithdrawalRequest.findOne({
      influencerId: userId,
      status: 'pending'
    });
    
    if (existingPendingRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'You already have a pending withdrawal request. Please wait for it to be processed.' 
      }, { status: 400 });
    }
    
    // Create the withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      influencerId: userId,
      amount: amount,
      upiId: influencer.upiId,
      upiUsername: influencer.upiUsername,
      status: 'pending',
      requestedAt: new Date(),
    });
    
    await withdrawalRequest.save();
    
    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        requestId: withdrawalRequest._id,
        amount: withdrawalRequest.amount,
        status: withdrawalRequest.status,
        requestedAt: withdrawalRequest.requestedAt,
      }
    });
    
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit withdrawal request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * API route for getting withdrawal requests for the authenticated influencer
 */
export async function GET(request: NextRequest) {
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
        error: 'Access denied - Only influencers can view withdrawal requests' 
      }, { status: 403 });
    }
    
    // Get withdrawal requests for this influencer
    const withdrawalRequests = await WithdrawalRequest.find({
      influencerId: userId
    }).sort({ requestedAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: withdrawalRequests
    });
    
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch withdrawal requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
