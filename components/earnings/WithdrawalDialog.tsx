'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader, Send, BadgeIndianRupee, CreditCard, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface WithdrawalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentEarnings: number;
  upiId: string;
  upiUsername: string;
  onSuccess: () => void;
}

const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({ 
  isOpen, 
  onClose, 
  currentEarnings, 
  upiId, 
  upiUsername,
  onSuccess 
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    
    if (!value.trim()) {
      return 'Amount is required';
    }
    
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }
    
    if (numValue > currentEarnings) {
      return `Amount cannot exceed your current earnings (₹${currentEarnings.toLocaleString()})`;
    }
    
    if (numValue < 1) {
      return 'Minimum withdrawal amount is ₹1';
    }
    
    return '';
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(sanitizedValue);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/influencer/withdrawal-request', {
        amount: parseFloat(amount),
      });

      if (response.data.success) {
        toast({
          title: "Withdrawal Request Submitted",
          description: `Your withdrawal request for ₹${parseFloat(amount).toLocaleString()} has been submitted successfully. You will be notified once it's processed.`,
          variant: "default",
        });

        onSuccess();
        handleClose();
      } else {
        throw new Error(response.data.error || 'Failed to submit withdrawal request');
      }
    } catch (error: any) {
      console.error('Error submitting withdrawal request:', error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.error || error.message || "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAmount('');
      setError('');
      onClose();
    }
  };

  const handleMaxAmount = () => {
    setAmount(currentEarnings.toString());
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent flex items-center">
            <Send className="h-5 w-5 mr-2 text-green-500" />
            Request Withdrawal
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-zinc-400">
            Enter the amount you want to withdraw from your earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Current Earnings Display */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BadgeIndianRupee className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Available Earnings</span>
              </div>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                ₹{currentEarnings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* UPI Details Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Payment Details</h4>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>{upiId}</span>
              </div>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <User className="h-4 w-4 mr-2" />
                <span>{upiUsername}</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Withdrawal Amount *
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMaxAmount}
                className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 h-auto"
                disabled={isLoading}
              >
                Max: ₹{currentEarnings.toLocaleString()}
              </Button>
            </div>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`pl-8 ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-zinc-600'} bg-white dark:bg-zinc-800 text-gray-900 dark:text-white`}
                disabled={isLoading}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500">₹</span>
            </div>
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> Withdrawal requests are processed within 1-3 business days. You will receive a notification once your payment is processed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
