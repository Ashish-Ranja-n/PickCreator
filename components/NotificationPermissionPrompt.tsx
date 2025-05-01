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
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close notification prompt"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4 rounded-full overflow-hidden h-12 w-12 bg-[#00BCD4] flex items-center justify-center">
          <Bell className="h-6 w-6 text-white" />
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900">Enable notifications?</h3>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Stay updated on new opportunities, messages, and activity on your account.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleAllow} 
              size="sm" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Enabling...
                </>
              ) : (
                'Allow notifications'
              )}
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={isLoading}
            >
              Not now
            </Button>
            <Button 
              onClick={handleDontShowAgain} 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-gray-500"
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