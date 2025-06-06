import axios from 'axios';

/**
 * Send notification to a user without blocking the request flow
 * @param userId - The ID of the user to send notification to
 * @param title - The notification title
 * @param message - The notification message
 * @param data - Additional data to include in the notification
 * @returns Promise<void>
 */
export const sendDealNotification = async (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pickcreator.com';
    const notificationUrl = `${API_URL}/api/notifications/send`;
    
    // Send notification to user
    await axios.post(notificationUrl, {
      title,
      message,
      userId,
      singleUser: true, // Ensure notification only goes to this specific user
      icon: '/icon1.png',
      badge: '/icon.png',
      data: data || {}
    });
    
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error - we don't want the process to fail if notification fails
  }
};

/**
 * Send notification asynchronously in the background
 * @param userId - The ID of the user to send notification to
 * @param title - The notification title
 * @param message - The notification message
 * @param data - Additional data to include in the notification
 */
export const sendBackgroundNotification = (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): void => {
  setTimeout(() => {
    sendDealNotification(userId, title, message, data)
      .catch(err => console.error('Background notification failed:', err));
  }, 100);
}; 