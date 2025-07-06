import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import WithdrawalRequest from '@/models/withdrawalRequest';
import { Influencer } from '@/models/influencer';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for completing withdrawal requests (admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    
    // Get the user ID and role from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Verify user is an admin
    if (userRole !== 'Admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Admin privileges required' 
      }, { status: 403 });
    }
    
    // Get the withdrawal request ID from the URL
    const params = await context.params;
    const requestId = params.id;
    
    if (!requestId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Withdrawal request ID is required' 
      }, { status: 400 });
    }
    
    // Find the withdrawal request
    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    
    if (!withdrawalRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'Withdrawal request not found' 
      }, { status: 404 });
    }
    
    // Check if already completed
    if (withdrawalRequest.status === 'completed') {
      return NextResponse.json({ 
        success: false, 
        error: 'Withdrawal request is already completed' 
      }, { status: 400 });
    }
    
    // Find the influencer to update their earnings
    const influencer = await Influencer.findById(withdrawalRequest.influencerId);
    
    if (!influencer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Influencer not found' 
      }, { status: 404 });
    }
    
    // Check if influencer has sufficient earnings
    const currentEarnings = influencer.earnings || 0;
    if (currentEarnings < withdrawalRequest.amount) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient earnings. Current: ₹${currentEarnings}, Requested: ₹${withdrawalRequest.amount}` 
      }, { status: 400 });
    }
    
    // Start a transaction to ensure data consistency
    const session = await WithdrawalRequest.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update withdrawal request status
        await WithdrawalRequest.findByIdAndUpdate(
          requestId,
          {
            status: 'completed',
            completedAt: new Date(),
          },
          { session }
        );
        
        // Deduct the amount from influencer's earnings
        await Influencer.findByIdAndUpdate(
          withdrawalRequest.influencerId,
          {
            $inc: { earnings: -withdrawalRequest.amount }
          },
          { session }
        );
      });
      
      await session.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: 'Withdrawal request completed successfully',
        data: {
          requestId: requestId,
          amount: withdrawalRequest.amount,
          newEarnings: currentEarnings - withdrawalRequest.amount,
        }
      });
      
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }
    
  } catch (error) {
    console.error('Error completing withdrawal request:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to complete withdrawal request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
