import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Model } from 'mongoose';
import { connect } from '@/lib/mongoose';
import webpush from 'web-push';

// Define subscription interface
interface ISubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  userType: 'brand' | 'influencer';
  createdAt: Date;
  updatedAt: Date;
}

// Check if we have the Subscription model
let Subscription: Model<ISubscription>;
try {
  Subscription = mongoose.model<ISubscription>('Subscription');
} catch (e: any) {
  // Define the schema if it doesn't exist - should match subscribe/route.ts
  const SubscriptionSchema = new mongoose.Schema<ISubscription>({
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userId: { type: String, required: true },
    userType: { type: String, enum: ['brand', 'influencer'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  SubscriptionSchema.index({ userId: 1 });
  SubscriptionSchema.index({ endpoint: 1 }, { unique: true });
  
  Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
}

// Configure web-push with VAPID keys
const setupWebPush = () => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@pickcreator.com';
  
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not set in environment variables');
  }
  
  webpush.setVapidDetails(subject, publicKey, privateKey);
};

export async function POST(request: NextRequest) {
  try {
    // Setup web-push
    setupWebPush();
    
    // Connect to database
    await connect();
    
    const body = await request.json();
    const { title, message, userId, userType, data, singleUser = false } = body;
    
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }
    
    // Find subscriptions to send to
    let query = {};
    
    if (singleUser && userId) {
      // Send to a specific user
      query = { userId };
    } else if (userType) {
      // Send to all users of a specific type
      query = { userType };
    }
    
    const subscriptions = await Subscription.find(query);
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No subscriptions found for the given criteria' 
      });
    }
    
    // Send notifications
    const notificationPayload = {
      title,
      body: message,
      icon: '/icon.png', // Use existing app icon
      badge: '/icons/notification-badge.png', // Use a smaller monochrome badge for the status bar
      data: data || {}
    };
    
    const sendPromises = subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };
      
      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
        return { success: true, endpoint: subscription.endpoint };
      } catch (error: any) {
        // If subscription is no longer valid, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Removing expired subscription (${error.statusCode}) for endpoint: ${subscription.endpoint}`);
          await Subscription.deleteOne({ endpoint: subscription.endpoint });
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: 'Subscription expired or no longer valid'
          };
        }
        
        console.error(`Error sending notification to endpoint ${subscription.endpoint}:`, error);
        return { 
          success: false, 
          endpoint: subscription.endpoint, 
          error: error.message || 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(sendPromises);
    const successful = results.filter(result => result.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Sent ${successful} notifications successfully out of ${results.length} attempts`,
      results
    });
  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to send notifications', 
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 