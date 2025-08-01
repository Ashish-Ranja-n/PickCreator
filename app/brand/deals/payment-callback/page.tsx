'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  progressiveVerifyPayment
}: {
  setStatus: (status: PaymentStatus) => void;
  setMessage: (message: string) => void;
  setDealId: (dealId: string | null) => void;
  setMerchantOrderId: (merchantOrderId: string | null) => void;
  progressiveVerifyPayment: (merchantOrderId?: string | null, transactionId?: string | null, dealId?: string | null, attempt?: number) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const dealIdParam = searchParams?.get('dealId') ?? null;
    const merchantOrderIdParam = searchParams?.get('merchantOrderId') ?? null;
    const transactionIdParam = searchParams?.get('transactionId') ?? null;

    if (dealIdParam) {
      setDealId(dealIdParam);
    }

    if (merchantOrderIdParam) {
      setMerchantOrderId(merchantOrderIdParam);
    }

    // Use progressive verification for all cases
    if (merchantOrderIdParam || transactionIdParam || dealIdParam) {
      setMessage('Verifying payment status...');
      progressiveVerifyPayment(merchantOrderIdParam, transactionIdParam, dealIdParam);
    } else {
      setStatus(PaymentStatus.ERROR);
      setMessage('Missing payment information. Please contact support.');
    }
  }, [searchParams, router, setStatus, setMessage, setDealId, setMerchantOrderId, progressiveVerifyPayment]);

  return null; // This component doesn't render anything
};

export default function PaymentCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.LOADING);
  const [message, setMessage] = useState<string>('Verifying payment status...');
  const [dealId, setDealId] = useState<string | null>(null);
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const [verificationAttempts, setVerificationAttempts] = React.useState(0);
  const [currentVerificationMethod, setCurrentVerificationMethod] = React.useState<string>('primary');

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

  // Auto-redirect on successful payment with countdown
  React.useEffect(() => {
    if (status === PaymentStatus.SUCCESS) {
      setCountdown(3); // Reset countdown

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push('/brand/deals?tab=ongoing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [status, router]);

  // Simplified payment verification without recovery service
  const progressiveVerifyPayment = React.useCallback(async (
    merchantOrderId?: string | null,
    transactionId?: string | null,
    dealId?: string | null,
    attempt: number = 0
  ) => {
    setVerificationAttempts(attempt + 1);
    setCurrentVerificationMethod('primary');
    setMessage('Verifying payment status...');

    // Track callback page access via API
    try {
      await axios.post('/api/analytics/payment-flow', {
        eventType: 'payment_callback_received',
        dealId: dealId || undefined,
        merchantOrderId: merchantOrderId || undefined,
        metadata: {
          hasOrderId: !!merchantOrderId,
          hasTransactionId: !!transactionId,
          hasDealId: !!dealId,
          attempt: attempt + 1
        }
      });
    } catch (error) {
      console.log('Analytics tracking failed:', error);
      // Don't break the flow for analytics failures
    }

    try {
      // Method 1: Try merchant order ID first
      if (merchantOrderId) {
        setCurrentVerificationMethod('merchant-order');
        await checkPaymentStatus(merchantOrderId);
        return;
      }

      // Method 2: Try transaction ID verification
      if (transactionId) {
        setCurrentVerificationMethod('transaction-id');
        try {
          const response = await axios.post('/api/payments/verify-by-transaction', {
            transactionId,
            dealId
          });

          if (response.data.success) {
            setStatus(PaymentStatus.SUCCESS);
            setMessage('Payment successful! Your deal has been moved to the ongoing tab.');

            toast({
              title: "Payment Successful! 🎉",
              description: "Your deal has been moved to the ongoing tab and the influencer has been notified.",
              duration: 5000,
            });
            return;
          }
        } catch (error) {
          console.error('Transaction verification failed:', error);
        }
      }

      // Method 3: Try deal status check
      if (dealId) {
        setCurrentVerificationMethod('deal-status');
        try {
          const response = await axios.get(`/api/deals/${dealId}`);

          if (response.data.success && response.data.deal) {
            const deal = response.data.deal;

            if (deal.paymentStatus === 'paid' || deal.status === 'ongoing') {
              setStatus(PaymentStatus.SUCCESS);
              setMessage('Payment confirmed! Your deal has been moved to the ongoing tab.');

              toast({
                title: "Payment Confirmed! ✅",
                description: "Your deal is active and the influencer has been notified.",
                duration: 5000,
              });
              return;
            }
          }
        } catch (error) {
          console.error('Deal status check failed:', error);
        }
      }

      // If all methods fail
      setStatus(PaymentStatus.ERROR);
      setMessage('Unable to verify payment status. Please check your deals page or contact support.');

      toast({
        title: "Verification Failed",
        description: "Unable to verify payment status. Please check your deals page or contact support.",
        variant: "destructive",
        duration: 8000,
      });

    } catch (error: any) {
      console.error(`Payment verification failed:`, error);
      setStatus(PaymentStatus.ERROR);
      setMessage('Payment verification service encountered an error. Please check your deals page or contact support.');
    }
  }, []);

  // Check payment status using merchant order ID (primary method)
  const checkPaymentStatus = React.useCallback(async (orderId: string, attempt: number = 0) => {
    const maxAttempts = 5;
    const baseDelay = 2000; // 2 seconds

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
          // Payment is still pending - use exponential backoff
          if (attempt < maxAttempts) {
            setStatus(PaymentStatus.LOADING);
            const delay = baseDelay * Math.pow(1.5, attempt); // Exponential backoff
            setMessage(`Payment is being processed... (Check ${attempt + 1}/${maxAttempts})`);

            setTimeout(() => {
              checkPaymentStatus(orderId, attempt + 1);
            }, delay);
          } else {
            // Max attempts reached
            setStatus(PaymentStatus.ERROR);
            setMessage('Payment verification timed out. Please check your deals page or contact support.');
          }
        }
      } else {
        setStatus(PaymentStatus.ERROR);
        setMessage(response.data.error || 'Failed to verify payment status.');
      }
    } catch (error: any) {
      console.error(`Payment status check attempt ${attempt + 1} failed:`, error);

      if (attempt < maxAttempts - 1) {
        // Retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        setMessage(`Retrying payment verification... (${attempt + 1}/${maxAttempts})`);

        setTimeout(() => {
          checkPaymentStatus(orderId, attempt + 1);
        }, delay);
      } else {
        setStatus(PaymentStatus.ERROR);
        setMessage(error.response?.data?.error || 'Could not verify payment status after multiple attempts.');
      }
    }
  }, []);

  // Note: Individual verification methods removed - now using PaymentRecoveryService

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

    // Reset verification attempts for fresh start
    setVerificationAttempts(0);
    setCurrentVerificationMethod('retry');

    // Wait a moment before retrying with progressive verification
    setTimeout(async () => {
      try {
        await progressiveVerifyPayment(merchantOrderId, null, dealId);
      } catch (error) {
        console.error('Retry failed:', error);
        setStatus(PaymentStatus.ERROR);
        setMessage('Retry failed. Please check your deals page or contact support.');
      } finally {
        setIsRetrying(false);
      }
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
          progressiveVerifyPayment={progressiveVerifyPayment}
        />
      </Suspense>

      <Card className="w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-all duration-500 ease-in-out">
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
              <>
                <div className="absolute -inset-2 rounded-full border-4 border-white/30 animate-pulse"></div>
                <div className="absolute -inset-4 rounded-full border-2 border-white/20 animate-ping"></div>
              </>
            )}
            {status === PaymentStatus.LOADING && (
              <div className="absolute -inset-2 rounded-full border-4 border-white/30 animate-spin"></div>
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
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-300 mb-3">
                <li>• Your deal has been moved to the ongoing tab</li>
                <li>• You can now track the progress of your collaboration</li>
                <li>• The influencer has been notified to start working</li>
              </ul>
              <div className="flex items-center justify-center bg-green-100 dark:bg-green-800/30 p-3 rounded-lg">
                <span className="text-green-800 dark:text-green-200 text-sm font-medium">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </span>
              </div>
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

              <div className="space-y-2">
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
                        Advanced Recovery...
                      </>
                    ) : (
                      `Advanced Recovery (${retryCount}/3)`
                    )}
                  </Button>
                )}

                {/* Emergency fallback button */}
                <Button
                  onClick={() => router.push('/brand/deals?tab=pending')}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  Check Deals Page Manually
                </Button>
              </div>
            </div>
          )}

          {/* Enhanced loading state with detailed progress */}
          {status === PaymentStatus.LOADING && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300 mb-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Verifying your payment...</span>
              </div>

              {verificationAttempts > 0 && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 capitalize">
                      Method: {currentVerificationMethod.replace('-', ' ')} • Attempt {verificationAttempts}/3
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(verificationAttempts / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Verification steps indicator */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className={`text-center p-2 rounded ${verificationAttempts >= 1 ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      Order ID
                    </div>
                    <div className={`text-center p-2 rounded ${verificationAttempts >= 2 ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      Transaction
                    </div>
                    <div className={`text-center p-2 rounded ${verificationAttempts >= 3 ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      Deal Status
                    </div>
                    <div className={`text-center p-2 rounded ${verificationAttempts >= 4 ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      Database
                    </div>
                  </div>

                  <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                    We're trying multiple methods to ensure your payment is verified
                  </div>
                </div>
              )}
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
              {status === PaymentStatus.SUCCESS ? `Go Now (${countdown})` : 'Back to Deals'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
