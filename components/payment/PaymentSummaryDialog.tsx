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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Payment Summary</h2>
          <p className="text-blue-100 text-sm">
            Review the payment details before proceeding
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Deal Details Card */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Deal Details
            </h3>
            <p className="text-sm text-gray-700 mb-2 font-medium">
              {deal.dealName}
            </p>

            {deal.influencers.length > 1 ? (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="text-sm font-medium text-gray-900 mb-2">Influencers:</p>
                <ul className="space-y-2">
                  {deal.influencers.map((influencer, index) => (
                    <li key={index} className="text-sm text-gray-700 flex justify-between">
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

          {/* Payment Amount Card */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-blue-900">Total Amount</span>
              <div className="text-2xl font-bold text-blue-900 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {formatCurrency(deal.totalAmount)}
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
        <div className="border-t border-gray-200 p-4 flex flex-col sm:flex-row sm:justify-end gap-3 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="sm:order-1 order-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceedToPayment}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 sm:order-2 order-1"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
