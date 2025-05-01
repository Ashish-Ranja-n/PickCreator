import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Model } from 'mongoose';
import { connect } from '@/lib/mongoose';

// Define subscription interface
interface ISubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  userType: 'brand' | 'influencer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Check if we have a Mongoose model for notifications already
let Subscription: Model<ISubscription>;
try {
  Subscription = mongoose.model<ISubscription>('Subscription');
} catch (e) {
  // Define the schema if it doesn't exist
  const SubscriptionSchema = new mongoose.Schema<ISubscription>({
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userId: { type: String, required: true },
    userType: { type: String, enum: ['brand', 'influencer', 'admin'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  SubscriptionSchema.index({ userId: 1 });
  SubscriptionSchema.index({ endpoint: 1 }, { unique: true });
  
  Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    const body = await request.json();
    const { subscription, userId, userType } = body;
    
    if (!subscription || !userId || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }
    
    if (!['brand', 'influencer', 'admin'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }
    
    // Save or update the subscription
    const existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint });
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.keys = subscription.keys;
      existingSubscription.userId = userId;
      existingSubscription.userType = userType as 'brand' | 'influencer' | 'admin';
      existingSubscription.updatedAt = new Date();
      await existingSubscription.save();
    } else {
      // Create new subscription
      await Subscription.create({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId,
        userType: userType as 'brand' | 'influencer' | 'admin'
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 