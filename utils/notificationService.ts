import axios from 'axios';

// Convert a base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register the service worker
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  console.warn('Service workers are not supported in this browser');
  return null;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string, userType: 'brand' | 'influencer' | 'admin'): Promise<boolean> {
  try {
    console.log('Starting push notification subscription process...');
    
    // Check for notification permission
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted, requesting...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }
    }

    console.log('Registering service worker...');
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Failed to register service worker');
      return false;
    }

    console.log('Service worker registered successfully');
    
    // Get public key from server
    console.log('Fetching VAPID public key...');
    const response = await axios.get('/api/notifications/vapid-public-key');
    const publicKey = response.data.vapidPublicKey;
    
    if (!publicKey) {
      console.error('No VAPID public key received from server');
      return false;
    }
    
    console.log('VAPID public key received');

    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If subscription exists, unsubscribe first
    if (subscription) {
      console.log('Existing subscription found, unsubscribing first...');
      await subscription.unsubscribe();
      console.log('Successfully unsubscribed from existing subscription');
    }

    // Subscribe with the VAPID public key
    console.log('Creating new push subscription...');
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log('Push subscription created successfully');
    } catch (err) {
      console.error('Error creating push subscription:', err);
      return false;
    }

    // Verify subscription was created
    if (!subscription) {
      console.error('Failed to create push subscription');
      return false;
    }

    // Send subscription to server
    console.log('Sending subscription to server...');
    await axios.post('/api/notifications/subscribe', {
      subscription: subscription,
      userId,
      userType
    });

    console.log('Push notification subscription successful');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true; // Already unsubscribed

    // Unsubscribe from browser
    const success = await subscription.unsubscribe();
    
    if (success) {
      // Notify server about unsubscription
      await axios.post('/api/notifications/unsubscribe', {
        userId,
        endpoint: subscription.endpoint
      });
      console.log('Successfully unsubscribed from push notifications');
    }
    
    return success;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if push notifications are supported and permission is granted
export async function arePushNotificationsSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         Notification.permission === 'granted';
}

// Check subscription status
export async function getSubscriptionStatus(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return false;
  }
  
  try {
    // Check if service worker is ready
    if (navigator.serviceWorker.controller === null) {
      console.log('Service worker not controlling the page');
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Existing push subscription found');
    } else {
      console.log('No push subscription found');
    }
    
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
} 