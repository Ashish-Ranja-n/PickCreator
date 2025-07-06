'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader, CreditCard, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface UpiInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (upiData: { upiId: string; upiUsername: string }) => void;
}

const UpiInfoDialog: React.FC<UpiInfoDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [upiId, setUpiId] = useState('');
  const [upiUsername, setUpiUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ upiId?: string; upiUsername?: string }>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { upiId?: string; upiUsername?: string } = {};

    // Validate UPI ID format (basic validation)
    if (!upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else if (!upiId.includes('@')) {
      newErrors.upiId = 'Please enter a valid UPI ID (e.g., username@paytm)';
    }

    // Validate UPI username
    if (!upiUsername.trim()) {
      newErrors.upiUsername = 'UPI username is required';
    } else if (upiUsername.trim().length < 2) {
      newErrors.upiUsername = 'UPI username must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.patch('/api/influencer/profile/upi', {
        upiId: upiId.trim(),
        upiUsername: upiUsername.trim(),
      });

      if (response.data.success) {
        toast({
          title: "UPI Information Saved",
          description: "Your UPI details have been saved successfully.",
          variant: "default",
        });

        onSuccess({
          upiId: upiId.trim(),
          upiUsername: upiUsername.trim(),
        });

        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to save UPI information');
      }
    } catch (error: any) {
      console.error('Error saving UPI information:', error);
      toast({
        title: "Save Failed",
        description: error.response?.data?.error || error.message || "Failed to save UPI information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUpiId('');
      setUpiUsername('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-500" />
            UPI Payment Information
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-zinc-400">
            Please provide your UPI details to enable withdrawals. This information will be used for processing your payments.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* UPI ID Field */}
          <div className="space-y-2">
            <Label htmlFor="upiId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UPI ID *
            </Label>
            <div className="relative">
              <Input
                id="upiId"
                type="text"
                placeholder="e.g., yourname@paytm"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (errors.upiId) {
                    setErrors(prev => ({ ...prev, upiId: undefined }));
                  }
                }}
                className={`pl-10 ${errors.upiId ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-zinc-600'} bg-white dark:bg-zinc-800 text-gray-900 dark:text-white`}
                disabled={isLoading}
              />
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            </div>
            {errors.upiId && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.upiId}</p>
            )}
          </div>

          {/* UPI Username Field */}
          <div className="space-y-2">
            <Label htmlFor="upiUsername" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UPI Username *
            </Label>
            <div className="relative">
              <Input
                id="upiUsername"
                type="text"
                placeholder="e.g., John Doe"
                value={upiUsername}
                onChange={(e) => {
                  setUpiUsername(e.target.value);
                  if (errors.upiUsername) {
                    setErrors(prev => ({ ...prev, upiUsername: undefined }));
                  }
                }}
                className={`pl-10 ${errors.upiUsername ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-zinc-600'} bg-white dark:bg-zinc-800 text-gray-900 dark:text-white`}
                disabled={isLoading}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            </div>
            {errors.upiUsername && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.upiUsername}</p>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Your UPI information is securely stored and will only be used for processing withdrawal payments. You can update this information anytime.
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
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save UPI Details'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpiInfoDialog;
