'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

enum PaymentStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.LOADING);
  const [message, setMessage] = useState<string>('Verifying payment status...');
  const [dealId, setDealId] = useState<string | null>(null);
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null);

  useEffect(() => {
    const dealIdParam = searchParams?.get('dealId');
    const merchantOrderIdParam = searchParams?.get('merchantOrderId');
    const transactionIdParam = searchParams?.get('transactionId');
    const code = searchParams?.get('code'); // PhonePe sometimes returns a code parameter

    if (dealIdParam) {
      setDealId(dealIdParam);
    }

    // Case 1: We have the merchant order ID - ideal case
    if (merchantOrderIdParam) {
      setMerchantOrderId(merchantOrderIdParam);
      checkPaymentStatus(merchantOrderIdParam);
    }
    // Case 2: We have a transaction ID but no merchant order ID
    else if (transactionIdParam) {
      setMessage('Processing payment with transaction ID...');
      // Try to verify the payment using the transaction ID
      verifyPaymentByTransactionId(transactionIdParam, dealIdParam);
    }
    // Case 3: We have a deal ID and possibly a code (PhonePe redirect)
    else if (dealIdParam && code) {
      setMessage('Verifying payment status...');
      // Try to verify the payment using the deal ID
      verifyPaymentByDealId(dealIdParam);
    }
    // Case 4: We have only a deal ID
    else if (dealIdParam) {
      setMessage('Checking payment status for this deal...');
      verifyPaymentByDealId(dealIdParam);
    }
    // Case 5: No useful parameters
    else {
      setStatus(PaymentStatus.ERROR);
      setMessage('Missing payment information. Please contact support.');
    }
  // Define the functions outside useEffect to avoid dependency issues
  }, [searchParams, router]);

  // Check payment status using merchant order ID (primary method)
  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await axios.get(`/api/payments/status/${orderId}`);

      if (response.data.success) {
        const paymentStatus = response.data.payment.status;

        if (paymentStatus === 'success') {
          setStatus(PaymentStatus.SUCCESS);
          setMessage('Payment successful! Your deal has been moved to the ongoing tab.');
        } else if (paymentStatus === 'failed') {
          setStatus(PaymentStatus.FAILED);
          setMessage('Payment failed. Please try again.');
        } else if (paymentStatus === 'cancelled') {
          setStatus(PaymentStatus.CANCELLED);
          setMessage('Payment was cancelled.');
        } else {
          // Payment is still pending or in another state
          setStatus(PaymentStatus.LOADING);
          setMessage('Payment is being processed. Please wait...');

          // Check again after 3 seconds
          setTimeout(() => {
            checkPaymentStatus(orderId);
          }, 3000);
        }
      } else {
        setStatus(PaymentStatus.ERROR);
        setMessage(response.data.error || 'Failed to verify payment status.');
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      setStatus(PaymentStatus.ERROR);
      setMessage(error.response?.data?.error || 'An error occurred while checking payment status.');
    }
  };

  // Verify payment using transaction ID (fallback method 1)
  const verifyPaymentByTransactionId = async (transactionId: string, dealId: string | null) => {
    try {
      const response = await axios.post('/api/payments/verify-by-transaction', {
        transactionId,
        dealId
      });

      if (response.data.success) {
        setStatus(PaymentStatus.SUCCESS);
        setMessage('Payment successful! Your deal has been moved to the ongoing tab.');
      } else {
        // If verification fails, try the deal ID as a last resort
        if (dealId) {
          verifyPaymentByDealId(dealId);
        } else {
          setStatus(PaymentStatus.ERROR);
          setMessage(response.data.error || 'Could not verify payment status.');
        }
      }
    } catch (error: any) {
      console.error('Error verifying payment by transaction ID:', error);
      // If API endpoint doesn't exist or fails, try the deal ID method
      if (dealId) {
        verifyPaymentByDealId(dealId);
      } else {
        setStatus(PaymentStatus.ERROR);
        setMessage('Could not verify payment. Please check your deals page to confirm payment status.');
      }
    }
  };

  // Verify payment using deal ID (fallback method 2)
  const verifyPaymentByDealId = async (dealId: string) => {
    try {
      const response = await axios.get(`/api/deals/${dealId}`);

      if (response.data.success && response.data.deal) {
        const deal = response.data.deal;

        // Check if the deal payment status indicates success
        if (deal.paymentStatus === 'paid') {
          setStatus(PaymentStatus.SUCCESS);
          setMessage('Payment confirmed! Your deal has been moved to the ongoing tab.');
        } else if (deal.status === 'ongoing') {
          setStatus(PaymentStatus.SUCCESS);
          setMessage('Deal is active! Payment has been processed successfully.');
        } else {
          // If we can't confirm payment success, show a more helpful message
          setStatus(PaymentStatus.ERROR);
          setMessage('Payment status could not be confirmed. Please check your deals page or contact support if payment was made.');
        }
      } else {
        setStatus(PaymentStatus.ERROR);
        setMessage('Could not verify deal status. Please check your deals page.');
      }
    } catch (error: any) {
      console.error('Error verifying payment by deal ID:', error);
      setStatus(PaymentStatus.ERROR);
      setMessage('Could not verify payment. Please check your deals page to confirm payment status.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return <CheckCircle className="h-16 w-16 text-white" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.ERROR:
        return <XCircle className="h-16 w-16 text-white" />;
      case PaymentStatus.CANCELLED:
        return <AlertCircle className="h-16 w-16 text-white" />;
      default:
        return <Loader2 className="h-16 w-16 text-white animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return 'Payment Successful';
      case PaymentStatus.FAILED:
        return 'Payment Failed';
      case PaymentStatus.CANCELLED:
        return 'Payment Cancelled';
      case PaymentStatus.ERROR:
        return 'Error';
      default:
        return 'Processing Payment';
    }
  };

  const handleContinue = () => {
    if (status === PaymentStatus.SUCCESS) {
      router.push('/brand/deals?tab=ongoing');
    } else {
      router.push('/brand/deals?tab=pending');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md shadow-lg overflow-hidden">
        {/* Card header with background color based on status */}
        <CardHeader
          className={`flex flex-col items-center pb-6 ${status === PaymentStatus.SUCCESS
            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
            : status === PaymentStatus.ERROR
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
              : status === PaymentStatus.CANCELLED
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                : status === PaymentStatus.FAILED
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'}`}
        >
          <div className="mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {getStatusTitle()}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center py-8">
          <p className="text-gray-700">{message}</p>

          {/* Additional help text for error state */}
          {status === PaymentStatus.ERROR && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
              <h3 className="font-medium text-gray-900 mb-2">What to do next:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Check your deals page to see if the payment was processed</li>
                <li>Verify your PhonePe transaction history</li>
                <li>If payment was deducted but not reflected, contact support</li>
                <li>Try refreshing this page</li>
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pb-8 pt-2">
          {status !== PaymentStatus.LOADING && (
            <Button
              onClick={handleContinue}
              className={status === PaymentStatus.SUCCESS
                ? 'bg-green-600 hover:bg-green-700'
                : status === PaymentStatus.ERROR
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : ''}
              size="lg"
            >
              Continue to Deals
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
