import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Payment, PaymentStatus } from '@/models/payment';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { Deal } from '@/models/deal';
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

    // Only brands can verify payments
    if (userRole !== 'Brand') {
      return NextResponse.json({
        success: false,
        error: 'Only brands can verify payments',
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { transactionId, dealId } = body;

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required',
      }, { status: 400 });
    }

    // Try to find payment by transaction ID
    const payment = await Payment.findOne({ transactionId });
    
    // If payment found, check its status
    if (payment) {
      // If payment is successful, update the deal if not already updated
      if (payment.status === PaymentStatus.SUCCESS) {
        // Find the deal
        const deal = await Deal.findById(payment.dealId);
        
        if (deal && deal.paymentStatus !== 'paid') {
          // Update deal status
          deal.paymentStatus = 'paid';
          deal.status = 'ongoing';
          await deal.save();
          
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
        }
        
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
      } else {
        return NextResponse.json({
          success: false,
          error: 'Payment was found but is not successful',
          payment: {
            merchantOrderId: payment.merchantOrderId,
            status: payment.status,
          },
        });
      }
    }
    
    // If payment not found by transaction ID but we have a deal ID
    if (dealId) {
      // Try to find the most recent payment for this deal
      const dealPayment = await Payment.findOne({ dealId }).sort({ createdAt: -1 });
      
      if (dealPayment) {
        // If we found a payment and it's successful, update the deal
        if (dealPayment.status === PaymentStatus.SUCCESS) {
          // Find the deal
          const deal = await Deal.findById(dealId);
          
          if (deal && deal.paymentStatus !== 'paid') {
            // Update deal status
            deal.paymentStatus = 'paid';
            deal.status = 'ongoing';
            await deal.save();
            
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
          }
          
          return NextResponse.json({
            success: true,
            payment: {
              merchantOrderId: dealPayment.merchantOrderId,
              status: dealPayment.status,
              amount: dealPayment.amount,
              createdAt: dealPayment.createdAt,
              updatedAt: dealPayment.updatedAt,
            },
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Payment was found for this deal but is not successful',
            payment: {
              merchantOrderId: dealPayment.merchantOrderId,
              status: dealPayment.status,
            },
          });
        }
      }
    }
    
    // If we couldn't find any payment
    return NextResponse.json({
      success: false,
      error: 'No payment found with this transaction ID',
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('Error verifying payment by transaction ID:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to verify payment',
    }, { status: 500 });
  }
}
