import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Payment, PaymentStatus } from '@/models/payment';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { checkPaymentStatus, updatePaymentStatus } from '@/utils/phonepe';
import { Deal } from '@/models/deal';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantOrderId: string }> }
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

    // Get merchant order ID from params
    const { merchantOrderId } = await params;
    if (!merchantOrderId) {
      return NextResponse.json({
        success: false,
        error: 'Merchant order ID is required',
      }, { status: 400 });
    }

    // Find the payment
    const payment = await Payment.findOne({ merchantOrderId });
    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found',
      }, { status: 404 });
    }

    // Verify that the user has permission to check this payment
    if (userRole === 'Brand' && payment.brandId.toString() !== userId.toString()) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to check this payment',
      }, { status: 403 });
    }

    // If payment is already in a final state, return the current status
    if (
      payment.status === PaymentStatus.SUCCESS ||
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return NextResponse.json({
        success: true,
        payment: {
          merchantOrderId: payment.merchantOrderId,
          status: payment.status,
          amount: payment.amount,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      });
    }

    // Check payment status from PhonePe
    try {
      const statusResponse = await checkPaymentStatus(merchantOrderId);

      // Map PhonePe state to our payment status
      let paymentStatus: PaymentStatus;
      switch (statusResponse.state) {
        case 'COMPLETED':
          paymentStatus = PaymentStatus.SUCCESS;
          break;
        case 'FAILED':
          paymentStatus = PaymentStatus.FAILED;
          break;
        case 'CANCELLED':
          paymentStatus = PaymentStatus.CANCELLED;
          break;
        default:
          paymentStatus = PaymentStatus.PENDING;
      }

      // Update payment status
      const updatedPayment = await updatePaymentStatus(merchantOrderId, paymentStatus, statusResponse);

      // If payment is successful, update the deal with idempotency check
      if (paymentStatus === PaymentStatus.SUCCESS) {
        const deal = await Deal.findById(payment.dealId);
        if (deal) {
          // Idempotency check - only update if not already paid
          if (deal.paymentStatus !== 'paid' || deal.status !== 'ongoing') {
            console.log(`Updating deal ${deal._id} status to ongoing (payment successful)`);

            // Use atomic update to prevent race conditions
            const updateResult = await Deal.updateOne(
              {
                _id: payment.dealId,
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

            // Only send notifications if the update was successful
            if (updateResult.modifiedCount > 0) {
              console.log(`Deal ${deal._id} successfully updated to ongoing status`);

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
            } else {
              console.log(`Deal ${deal._id} was already updated to paid status`);
            }
          } else {
            console.log(`Deal ${deal._id} is already in paid/ongoing status`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        payment: {
          merchantOrderId: updatedPayment.merchantOrderId,
          status: updatedPayment.status,
          amount: updatedPayment.amount,
          createdAt: updatedPayment.createdAt,
          updatedAt: updatedPayment.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check payment status',
        payment: {
          merchantOrderId: payment.merchantOrderId,
          status: payment.status,
          amount: payment.amount,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get payment status',
    }, { status: 500 });
  }
}
