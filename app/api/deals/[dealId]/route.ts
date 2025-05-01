import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import { getDataFromToken } from '@/helpers/getDataFromToken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    // Connect to MongoDB
    await connect();

    // Validate user authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token',
      }, { status: 401 });
    }

    // Extract user data
    const { id: userId, role: userRole } = userData;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 401 });
    }

    // Get deal ID from params
    const { dealId } = await params;
    if (!dealId) {
      return NextResponse.json({
        success: false,
        error: 'Deal ID is required',
      }, { status: 400 });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return NextResponse.json({
        success: false,
        error: 'Deal not found',
      }, { status: 404 });
    }

    // Verify that the user has permission to view this deal
    if (
      (userRole === 'Brand' && deal.brandId.toString() !== userId.toString()) ||
      (userRole === 'Influencer' && !deal.influencers.some((inf: any) => inf.id.toString() === userId.toString()))
    ) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to view this deal',
      }, { status: 403 });
    }

    // Return the deal
    return NextResponse.json({
      success: true,
      deal: {
        _id: deal._id,
        dealName: deal.dealName,
        status: deal.status,
        paymentStatus: deal.paymentStatus,
        totalAmount: deal.totalAmount,
        brandId: deal.brandId,
        influencers: deal.influencers,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting deal:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get deal',
    }, { status: 500 });
  }
}
