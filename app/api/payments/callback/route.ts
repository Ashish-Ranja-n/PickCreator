import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Payment, PaymentStatus } from '@/models/payment';
import { Deal } from '@/models/deal';
import { validateCallback, updatePaymentStatus } from '@/utils/phonepe';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connect();

    // Get authorization header
    const authorization = request.headers.get('authorization') || '';
    
    // Get request body as string
    const bodyText = await request.text();
    
    // Get PhonePe callback credentials from environment
    const username = process.env.PHONEPE_CALLBACK_USERNAME || '';
    const password = process.env.PHONEPE_CALLBACK_PASSWORD || '';
    
    if (!username || !password) {
      console.error('PhonePe callback credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error',
      }, { status: 500 });
    }
    
    // Validate the callback
    try {
      const callbackResponse = validateCallback(
        username,
        password,
        authorization,
        bodyText
      );
      
      // Extract data from callback
      const { payload } = callbackResponse;
      const { merchantOrderId, state } = payload;
      
      // Find the payment
      const payment = await Payment.findOne({ merchantOrderId });
      if (!payment) {
        console.error(`Payment not found for merchantOrderId: ${merchantOrderId}`);
        return NextResponse.json({
          success: false,
          error: 'Payment not found',
        }, { status: 404 });
      }
      
      // Map PhonePe state to our payment status
      let paymentStatus: PaymentStatus;
      switch (state) {
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
      await updatePaymentStatus(merchantOrderId, paymentStatus, payload);
      
      // If payment is successful, update the deal with idempotency check
      if (paymentStatus === PaymentStatus.SUCCESS) {
        const deal = await Deal.findById(payment.dealId);
        if (deal) {
          // Idempotency check - only update if not already paid
          if (deal.paymentStatus !== 'paid' || deal.status !== 'ongoing') {
            console.log(`[Callback] Updating deal ${deal._id} status to ongoing (payment successful)`);

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
              console.log(`[Callback] Deal ${deal._id} successfully updated to ongoing status`);

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
              console.log(`[Callback] Deal ${deal._id} was already updated to paid status`);
            }
          } else {
            console.log(`[Callback] Deal ${deal._id} is already in paid/ongoing status`);
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Callback processed successfully',
      });
    } catch (error: any) {
      console.error('Error validating callback:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid callback',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error processing payment callback:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process payment callback',
    }, { status: 500 });
  }
}
