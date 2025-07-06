import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import WithdrawalRequest from '@/models/withdrawalRequest';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for getting all withdrawal requests (admin only)
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
    
    // Get all withdrawal requests with influencer details
    const withdrawalRequests = await WithdrawalRequest.find({})
      .populate({
        path: 'influencerId',
        select: 'name email city',
        model: User
      })
      .sort({ requestedAt: -1 })
      .lean();
    
    // Transform the data to include influencer details in a cleaner format
    const transformedRequests = withdrawalRequests.map(request => ({
      ...request,
      influencer: request.influencerId ? {
        _id: (request.influencerId as any)._id,
        name: (request.influencerId as any).name,
        email: (request.influencerId as any).email,
        city: (request.influencerId as any).city,
      } : null,
      // Keep the original influencerId for compatibility
      influencerId: request.influencerId ? (request.influencerId as any)._id : request.influencerId,
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedRequests
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
