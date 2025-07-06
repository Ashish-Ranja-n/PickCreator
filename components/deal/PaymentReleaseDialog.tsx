import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Release Payment
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-left">
            You are about to release payment for the completed deal. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deal:</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium">{dealName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Influencer:</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium">{influencerName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-zinc-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount:</span>
              <div className="flex items-center gap-1 text-lg font-bold text-green-600 dark:text-green-400">
                <IndianRupee className="w-4 h-4" />
                <span>{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Once released, the payment will be added to the influencer's earnings and the deal will be marked as completed.
          </p>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-700"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
          >
            {isLoading ? 'Releasing...' : 'Release Payment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentReleaseDialog;
