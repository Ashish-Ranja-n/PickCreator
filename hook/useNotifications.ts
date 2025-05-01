import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  arePushNotificationsSupported,
  getSubscriptionStatus
} from '@/utils/notificationService';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = useCurrentUser();
  const userId = currentUser?._id;
  
  // Determine user type based on role
  const getUserType = () => {
    if (!currentUser?.role) return null;
    
    if (currentUser.role.toLowerCase() === 'admin') return 'admin';
    if (currentUser.role.toLowerCase() === 'brand') return 'brand';
    return 'influencer'; // Default for influencers and other roles
  };
  
  const userType = getUserType();

  // Check if notifications are supported on this browser
  useEffect(() => {
    const checkSupport = async () => {
      try {
        setIsLoading(true);
        
        // Check if notifications are supported
        const supported = 'Notification' in window && 
                         'serviceWorker' in navigator && 
                         'PushManager' in window;
        
        setIsSupported(supported);
        
        if (supported) {
          // Check if already subscribed
          const status = await getSubscriptionStatus();
          setIsSubscribed(status);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error checking notification support:', err);
        setError('Failed to check notification support');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      checkSupport();
    }
  }, [userId]);

  // Periodically check subscription status to keep UI in sync
  useEffect(() => {
    if (!isSupported || !userId) return;
    
    // Initial check
    const checkStatus = async () => {
      try {
        const status = await getSubscriptionStatus();
        if (status !== isSubscribed) {
          console.log('Subscription status changed:', { wasSubscribed: isSubscribed, isNowSubscribed: status });
          setIsSubscribed(status);
        }
      } catch (err) {
        console.error('Error in periodic subscription check:', err);
      }
    };
    
    // Check immediately and then every 5 seconds
    checkStatus();
    const intervalId = setInterval(checkStatus, 5000);
    
    return () => clearInterval(intervalId);
  }, [isSupported, userId, isSubscribed]);

  // Subscribe to notifications
  const subscribe = async () => {
    if (!userId || !userType) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Pass the user type from our getUserType function
      const success = await subscribeToPushNotifications(userId, userType as 'brand' | 'influencer' | 'admin');
      
      if (success) {
        setIsSubscribed(true);
        return true;
      } else {
        setError('Failed to subscribe to notifications');
        return false;
      }
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setError('An error occurred while subscribing to notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from notifications
  const unsubscribe = async () => {
    if (!userId) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await unsubscribeFromPushNotifications(userId);
      
      if (success) {
        setIsSubscribed(false);
        return true;
      } else {
        setError('Failed to unsubscribe from notifications');
        return false;
      }
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err);
      setError('An error occurred while unsubscribing from notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Request permission for notifications
  const requestPermission = async () => {
    if (!userId || !userType) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      if (!('Notification' in window)) {
        setError('This browser does not support notifications');
        return false;
      }
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // If permission is granted, subscribe
        return await subscribe();
      } else {
        setError('Notification permission denied');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Failed to request notification permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission
  };
}; 