'use client';

import React, { useEffect, useState, Suspense } from 'react';
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

// Client component that handles the search params
const PaymentParamsHandler = ({
  setStatus,
  setMessage,
  setDealId,
  setMerchantOrderId,
  checkPaymentStatus,
  verifyPaymentByTransactionId,
  verifyPaymentByDealId
}: {
  setStatus: (status: PaymentStatus) => void;
  setMessage: (message: string) => void;
  setDealId: (dealId: string | null) => void;
  setMerchantOrderId: (merchantOrderId: string | null) => void;
  checkPaymentStatus: (orderId: string) => void;
  verifyPaymentByTransactionId: (transactionId: string, dealId: string | null) => void;
  verifyPaymentByDealId: (dealId: string) => void;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const dealIdParam = searchParams?.get('dealId') ?? null;
    const merchantOrderIdParam = searchParams?.get('merchantOrderId') ?? null;
    const transactionIdParam = searchParams?.get('transactionId') ?? null;
    const code = searchParams?.get('code') ?? null; // PhonePe sometimes returns a code parameter

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
  }, [searchParams, router, setStatus, setMessage, setDealId, setMerchantOrderId, checkPaymentStatus, verifyPaymentByTransactionId, verifyPaymentByDealId]);

  return null; // This component doesn't render anything
};

export default function PaymentCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.LOADING);
  const [message, setMessage] = useState<string>('Verifying payment status...');
  const [dealId, setDealId] = useState<string | null>(null);
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Add timeout for loading state
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === PaymentStatus.LOADING) {
        setStatus(PaymentStatus.ERROR);
        setMessage('Payment verification timed out. Please check your deals page or try again.');
      }
    }, 60000); // 60 seconds timeout

    return () => clearTimeout(timeout);
  }, [status]);

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
        return <CheckCircle className="h-12 w-12 text-white" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.ERROR:
        return <XCircle className="h-12 w-12 text-white" />;
      case PaymentStatus.CANCELLED:
        return <AlertCircle className="h-12 w-12 text-white" />;
      default:
        return <Loader2 className="h-12 w-12 text-white animate-spin" />;
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

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setStatus(PaymentStatus.ERROR);
      setMessage('Maximum retry attempts reached. Please check your deals page or contact support.');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setStatus(PaymentStatus.LOADING);
    setMessage(`Retrying payment verification... (Attempt ${retryCount + 1}/3)`);

    // Wait a moment before retrying
    setTimeout(() => {
      if (merchantOrderId) {
        checkPaymentStatus(merchantOrderId);
      } else if (dealId) {
        verifyPaymentByDealId(dealId);
      }
      setIsRetrying(false);
    }, 2000);
  };

  const handleContinue = () => {
    if (status === PaymentStatus.SUCCESS) {
      router.push('/brand/deals?tab=ongoing');
    } else {
      router.push('/brand/deals?tab=pending');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
      {/* Wrap the PaymentParamsHandler in a Suspense boundary */}
      <Suspense fallback={null}>
        <PaymentParamsHandler
          setStatus={setStatus}
          setMessage={setMessage}
          setDealId={setDealId}
          setMerchantOrderId={setMerchantOrderId}
          checkPaymentStatus={checkPaymentStatus}
          verifyPaymentByTransactionId={verifyPaymentByTransactionId}
          verifyPaymentByDealId={verifyPaymentByDealId}
        />
      </Suspense>

      <Card className="w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        {/* Card header with background color based on status */}
        <CardHeader
          className={`flex flex-col items-center pb-8 pt-8 ${status === PaymentStatus.SUCCESS
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : status === PaymentStatus.ERROR
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : status === PaymentStatus.CANCELLED
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : status === PaymentStatus.FAILED
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`}
        >
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {getStatusIcon()}
            </div>
            {status === PaymentStatus.SUCCESS && (
              <div className="absolute -inset-2 rounded-full border-4 border-white/30 animate-pulse"></div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center mb-2">
            {getStatusTitle()}
          </CardTitle>
          {status === PaymentStatus.SUCCESS && (
            <p className="text-green-100 text-sm text-center">
              Your payment has been processed successfully
            </p>
          )}
        </CardHeader>

        <CardContent className="text-center py-8 px-6">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">{message}</p>

          {/* Success state additional info */}
          {status === PaymentStatus.SUCCESS && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-left">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Next Steps
              </h3>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <li>• Your deal has been moved to the ongoing tab</li>
                <li>• You can now track the progress of your collaboration</li>
                <li>• The influencer has been notified to start working</li>
              </ul>
            </div>
          )}

          {/* Additional help text for error state */}
          {status === PaymentStatus.ERROR && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 text-left">
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                What to do next:
              </h3>
              <ul className="space-y-2 text-sm text-red-700 dark:text-red-300 mb-4">
                <li>• Check your deals page to see if the payment was processed</li>
                <li>• Verify your PhonePe transaction history</li>
                <li>• If payment was deducted but not reflected, contact support</li>
                <li>• Try refreshing this page or check back in a few minutes</li>
              </ul>
              {retryCount < 3 && (
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    `Retry Verification (${retryCount}/3)`
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Loading state progress indicator */}
          {status === PaymentStatus.LOADING && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">This may take a few moments...</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pb-8 pt-4 px-6">
          {status !== PaymentStatus.LOADING && (
            <Button
              onClick={handleContinue}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                status === PaymentStatus.SUCCESS
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
              size="lg"
            >
              {status === PaymentStatus.SUCCESS ? 'View Ongoing Deals' : 'Back to Deals'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
