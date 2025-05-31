'use client';

import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNotifications } from '@/hook/useNotifications';

interface NotificationPermissionPromptProps {
  userType: 'brand' | 'influencer' | 'admin';
}

export default function NotificationPermissionPrompt({ userType }: NotificationPermissionPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isSupported, isSubscribed, isLoading: hookLoading, requestPermission } = useNotifications();
  
  useEffect(() => {
    // Check local storage to see if user has dismissed the prompt
    const hasUserDismissed = localStorage.getItem(`notification-prompt-dismissed-${userType}`);
    
    // Add debug logging
    if (typeof window !== 'undefined') {
      console.log('Notification prompt status:', {
        userType,
        isSupported,
        isSubscribed,
        hasUserDismissed,
        permissionState: Notification?.permission
      });
    }
    
    // Only show prompt if:
    // 1. Notifications are supported
    // 2. User isn't already subscribed
    // 3. User hasn't previously clicked "Don't show again"
    if (isSupported && !isSubscribed && hasUserDismissed !== 'true') {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [isSupported, isSubscribed, userType]);
  
  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const success = await requestPermission();
      if (success) {
        toast.success('Notifications enabled');
        setShowPrompt(false);
      } else {
        toast.error('Failed to enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('An error occurred while enabling notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setShowPrompt(false);
    // Don't save preference, so it will show again on next visit
  };
  
  const handleDontShowAgain = () => {
    localStorage.setItem(`notification-prompt-dismissed-${userType}`, 'true');
    setShowPrompt(false);
  };
  
  if (!showPrompt || hookLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 flex flex-col items-center">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification prompt"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg mb-4">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Enable Notifications</h2>
          <p className="text-base text-gray-600 mb-6 text-center max-w-xs">
            Stay instantly updated on new opportunities, messages, and important activity for your account. You can always manage your preferences later.
          </p>
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleAllow}
              size="lg"
              className="w-full font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:from-cyan-600 hover:to-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Enabling...
                </>
              ) : (
                'Allow Notifications'
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="lg"
              className="w-full font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Not now
            </Button>
            <Button
              onClick={handleDontShowAgain}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              Don&apos;t show again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 