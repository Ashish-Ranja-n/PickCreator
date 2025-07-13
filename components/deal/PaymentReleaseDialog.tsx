import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IndianRupee, CheckCircle } from 'lucide-react';

interface PaymentReleaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dealName: string;
  amount: number;
  influencerName: string;
  isLoading?: boolean;
}

export const PaymentReleaseDialog: React.FC<PaymentReleaseDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dealName,
  amount,
  influencerName,
  isLoading = false
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 w-[90vw] max-w-md mx-auto rounded-xl overflow-hidden shadow-2xl">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold">
                Release Payment
              </AlertDialogTitle>
              <p className="text-green-100 text-sm mt-1">
                Complete the deal and release payment
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <AlertDialogDescription className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            You are about to release payment for the completed deal. This action cannot be undone.
          </AlertDialogDescription>

          {/* Deal Details */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Deal:</span>
                <span className="text-xs text-gray-900 dark:text-white font-medium">{dealName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Influencer:</span>
                <span className="text-xs text-gray-900 dark:text-white font-medium">{influencerName}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-zinc-700">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                <div className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-green-400">
                  <IndianRupee className="w-3 h-3" />
                  <span>{amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Once released, the payment will be added to the influencer's earnings and the deal will be marked as completed.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 flex flex-row gap-3">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {isLoading ? 'Releasing...' : 'Release'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentReleaseDialog;
