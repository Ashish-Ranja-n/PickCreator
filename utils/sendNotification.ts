import axios from 'axios';

interface NotificationOptions {
  title: string;
  message: string;
  userId?: string;
  userType?: 'brand' | 'influencer';
  data?: Record<string, any>;
  url?: string;
}

/**
 * Send a push notification to users
 * @param options - Notification options
 * @returns Promise resolving to success or failure
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  try {
    // If URL is provided, add it to the data
    const data = {
      ...options.data,
      ...(options.url && { url: options.url })
    };

    // Prepare payload
    const payload = {
      title: options.title,
      message: options.message,
      userId: options.userId,
      userType: options.userType,
      data,
      singleUser: !!options.userId
    };

    // Send notification request to the API
    const response = await axios.post('/api/notifications/send', payload);
    
    if (response.data.success) {
      return true;
    } else {
      console.error('Failed to send notification:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string, 
  title: string, 
  message: string,
  url?: string,
  data?: Record<string, any>
): Promise<boolean> {
  return sendNotification({
    userId,
    title,
    message,
    url,
    data
  });
}

/**
 * Send notification to all users of a specific type
 */
export async function sendNotificationToUserType(
  userType: 'brand' | 'influencer',
  title: string,
  message: string,
  url?: string,
  data?: Record<string, any>
): Promise<boolean> {
  return sendNotification({
    userType,
    title,
    message,
    url,
    data
  });
}

/**
 * Send deal notification to a user
 */
export async function sendDealNotification(
  userId: string,
  dealTitle: string,
  status: string,
  dealId: string
): Promise<boolean> {
  const title = 'Deal Update';
  const message = `${dealTitle}: ${status}`;
  const url = `/deals/${dealId}`;
  
  return sendNotificationToUser(userId, title, message, url, { 
    type: 'deal', 
    dealId, 
    status 
  });
}

/**
 * Send chat notification to a user
 */
export async function sendChatNotification(
  userId: string,
  senderName: string,
  conversationId: string,
  messagePreview: string
): Promise<boolean> {
  const title = `New message from ${senderName}`;
  const message = messagePreview.length > 50 
    ? `${messagePreview.substring(0, 50)}...` 
    : messagePreview;
  const url = `/chat/${conversationId}`;
  
  return sendNotificationToUser(userId, title, message, url, { 
    type: 'chat', 
    conversationId 
  });
} 