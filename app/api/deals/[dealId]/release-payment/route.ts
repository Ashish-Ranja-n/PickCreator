import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    // Connect to MongoDB
    await connect();

    // Extract parameters
    const { dealId } = await params;

    if (!dealId) {
      return NextResponse.json({
        success: false,
        error: 'Missing dealId parameter',
      }, { status: 400 });
    }

    // Validate user authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token',
      }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token - No user ID',
      }, { status: 401 });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return NextResponse.json({
        success: false,
        error: 'Deal not found',
      }, { status: 404 });
    }

    // Only brands can release payment
    if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
      return NextResponse.json({
        success: false,
        error: 'Only the brand that created the deal can release payment',
      }, { status: 403 });
    }

    // Check if deal is in the correct state for payment release
    if (deal.status !== 'content_approved') {
      return NextResponse.json({
        success: false,
        error: 'Payment can only be released after content is approved',
      }, { status: 400 });
    }

    // Check if payment has been made
    if (deal.paymentStatus !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Payment must be made before it can be released',
      }, { status: 400 });
    }

    // Check if payment has already been released
    if (deal.paymentReleased) {
      return NextResponse.json({
        success: false,
        error: 'Payment has already been released for this deal',
      }, { status: 400 });
    }

    // Update deal status to completed and mark payment as released
    deal.status = 'completed';
    deal.paymentReleased = true;
    await deal.save();

    // Update influencer earnings
    for (const influencer of deal.influencers) {
      const influencerUser = await User.findById(influencer.id);
      if (influencerUser && influencerUser.role === 'Influencer') {
        // Initialize earnings if not set
        if (!influencerUser.earnings) {
          influencerUser.earnings = 0;
        }

        // Add the deal amount to influencer's earnings
        influencerUser.earnings += influencer.offeredPrice;
        await influencerUser.save();

        // Send notification to influencer about payment release
        sendBackgroundNotification(
          influencer.id,
          'Payment Released',
          `Payment of ₹${influencer.offeredPrice.toLocaleString()} has been released for deal ${deal.dealName}`,
          {
            url: `/influencer/deals?tab=history&id=${deal._id}`,
            type: 'payment_released',
            dealName: deal.dealName,
            dealId: deal._id.toString(),
            amount: influencer.offeredPrice
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment released successfully and deal completed',
      data: {
        dealId: deal._id,
        status: 'completed',
        paymentReleased: true
      }
    });

  } catch (error: any) {
    console.error('Error releasing payment:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
