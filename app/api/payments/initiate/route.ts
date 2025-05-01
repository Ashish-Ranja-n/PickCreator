import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { createPaymentRequest } from '@/utils/phonepe';

export async function POST(request: NextRequest) {
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

    // Only brands can make payments
    if (userRole !== 'Brand') {
      return NextResponse.json({
        success: false,
        error: 'Only brands can make payments',
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { dealId } = body;

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

    // Verify that the brand owns this deal
    if (deal.brandId.toString() !== userId.toString()) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to pay for this deal',
      }, { status: 403 });
    }

    // Verify that the deal is in the correct state for payment
    if (deal.status !== 'accepted') {
      return NextResponse.json({
        success: false,
        error: 'This deal is not in the correct state for payment',
      }, { status: 400 });
    }

    // Verify that payment hasn't already been made
    if (deal.paymentStatus === 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Payment has already been made for this deal',
      }, { status: 400 });
    }

    // Create the redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://pickcreator.com';
    const redirectUrl = `${baseUrl}/brand/deals/payment-callback?dealId=${dealId}`;

    // Create payment request
    const payment = await createPaymentRequest(
      dealId,
      userId.toString(),
      deal.totalAmount,
      redirectUrl
    );

    return NextResponse.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      merchantOrderId: payment.merchantOrderId,
    });
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate payment',
    }, { status: 500 });
  }
}
