'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, IndianRupee, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deal: {
    _id: string;
    dealName: string;
    totalAmount: number;
    influencers: Array<{
      name: string;
      offeredPrice: number;
    }>;
  };
}

export function PaymentSummaryDialog({
  isOpen,
  onClose,
  deal,
}: PaymentSummaryDialogProps) {
  // No router needed for this component
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceedToPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the payment initiation API
      const response = await axios.post('/api/payments/initiate', {
        dealId: deal._id,
      });

      if (response.data.success && response.data.paymentUrl) {
        // Redirect to PhonePe payment page
        window.location.href = response.data.paymentUrl;
      } else {
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-2xl">
        {/* Header with gradient background and icon */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Payment Summary</h2>
              <p className="text-blue-100 text-sm mt-1">
                Review the payment details before proceeding
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Deal Details Card */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-gray-200 dark:border-zinc-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Deal Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Deal Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {deal.dealName}
                </p>
              </div>

              {deal.influencers.length > 1 ? (
                <div className="mt-3 border-t border-gray-200 dark:border-zinc-600 pt-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Influencers:</p>
                  <ul className="space-y-2">
                    {deal.influencers.map((influencer, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>{influencer.name}</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="h-3 w-3 mr-1" />
                          {formatCurrency(influencer.offeredPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Payment Amount Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Payment</p>
                <span className="font-medium text-blue-900 dark:text-blue-100">Amount to be paid</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
                  <IndianRupee className="h-6 w-6 mr-1" />
                  {formatCurrency(deal.totalAmount)}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Inclusive of all charges</p>
              </div>
            </div>

            {/* Escrow Information */}
            <div className="flex items-start gap-2 bg-white p-3 rounded-md border border-blue-100">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-0.5">Secure Escrow Payment</p>
                <p className="text-xs text-blue-700">
                  This amount will be held in escrow until the content is approved by you.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
              <div className="pl-7 text-xs text-red-600">
                <p>Please try again or contact support if the issue persists.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-6 flex flex-col sm:flex-row gap-4 bg-gray-50 dark:bg-zinc-800/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 px-6 py-3 rounded-lg font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceedToPayment}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
