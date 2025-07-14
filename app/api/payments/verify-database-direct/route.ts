import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Payment, PaymentStatus } from '@/models/payment';
import { Deal } from '@/models/deal';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

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

    // Get request body
    const body = await request.json();
    const { dealId } = body;

    if (!dealId) {
      return NextResponse.json({
        success: false,
        error: 'Deal ID is required',
      }, { status: 400 });
    }

    console.log(`[DatabaseDirect] Verifying payment for deal ${dealId} by user ${userId}`);

    // Find the deal and verify user has access
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return NextResponse.json({
        success: false,
        error: 'Deal not found',
      }, { status: 404 });
    }

    // Check if user has access to this deal
    const hasAccess = 
      (userRole === 'Brand' && deal.brandId.toString() === userId.toString()) ||
      (userRole === 'Influencer' && deal.influencers.some((inf: any) => inf.id === userId.toString()));

    if (!hasAccess) {
      return NextResponse.json({
        success: false,
        error: 'You do not have access to this deal',
      }, { status: 403 });
    }

    // Find the most recent payment for this deal
    const payment = await Payment.findOne({ dealId }).sort({ createdAt: -1 });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'No payment found for this deal',
        status: 'pending'
      });
    }

    console.log(`[DatabaseDirect] Found payment ${payment.merchantOrderId} with status ${payment.status}`);

    // Check current deal and payment status
    if (deal.paymentStatus === 'paid' && deal.status === 'ongoing') {
      return NextResponse.json({
        success: true,
        status: 'success',
        message: 'Payment already confirmed and deal is ongoing',
        payment: {
          merchantOrderId: payment.merchantOrderId,
          status: payment.status,
          amount: payment.amount,
          dealStatus: deal.status,
          paymentStatus: deal.paymentStatus
        }
      });
    }

    // If payment is successful but deal hasn't been updated, update it now
    if (payment.status === PaymentStatus.SUCCESS && deal.paymentStatus !== 'paid') {
      console.log(`[DatabaseDirect] Payment is successful but deal not updated. Updating deal ${dealId}`);
      
      // Use atomic update to prevent race conditions
      const updateResult = await Deal.updateOne(
        { 
          _id: dealId,
          paymentStatus: { $ne: 'paid' } // Only update if not already paid
        },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'ongoing',
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`[DatabaseDirect] Deal ${dealId} successfully updated to ongoing status`);
        
        // Notify influencers about payment
        if (deal.influencers && deal.influencers.length > 0) {
          for (const influencer of deal.influencers) {
            sendBackgroundNotification(
              influencer.id,
              'Payment Received',
              `Payment has been received for deal ${deal.dealName}`,
              {
                url: `/influencer/deals?tab=ongoing&id=${deal._id}`,
                type: 'payment_received',
                dealName: deal.dealName,
                dealId: deal._id.toString(),
                amount: deal.totalAmount
              }
            );
          }
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment verified and deal updated to ongoing status',
          payment: {
            merchantOrderId: payment.merchantOrderId,
            status: payment.status,
            amount: payment.amount,
            dealStatus: 'ongoing',
            paymentStatus: 'paid'
          }
        });
      } else {
        console.log(`[DatabaseDirect] Deal ${dealId} was already updated by another process`);
        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment verified (deal was already updated)',
          payment: {
            merchantOrderId: payment.merchantOrderId,
            status: payment.status,
            amount: payment.amount,
            dealStatus: deal.status,
            paymentStatus: deal.paymentStatus
          }
        });
      }
    }

    // Return current status
    let status = 'pending';
    let message = 'Payment is still being processed';

    switch (payment.status) {
      case PaymentStatus.SUCCESS:
        status = 'success';
        message = 'Payment successful';
        break;
      case PaymentStatus.FAILED:
        status = 'failed';
        message = 'Payment failed';
        break;
      case PaymentStatus.CANCELLED:
        status = 'cancelled';
        message = 'Payment was cancelled';
        break;
      case PaymentStatus.PENDING:
      case PaymentStatus.INITIATED:
        status = 'pending';
        message = 'Payment is still being processed';
        break;
      default:
        status = 'error';
        message = 'Unknown payment status';
    }

    return NextResponse.json({
      success: status === 'success',
      status,
      message,
      payment: {
        merchantOrderId: payment.merchantOrderId,
        status: payment.status,
        amount: payment.amount,
        dealStatus: deal.status,
        paymentStatus: deal.paymentStatus
      }
    });

  } catch (error: any) {
    console.error('[DatabaseDirect] Error verifying payment:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to verify payment',
      status: 'error'
    }, { status: 500 });
  }
}
