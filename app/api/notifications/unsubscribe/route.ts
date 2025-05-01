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
  userType: 'brand' | 'influencer';
  createdAt: Date;
  updatedAt: Date;
}

// Check if Subscription model exists
let Subscription: Model<ISubscription>;
try {
  Subscription = mongoose.model<ISubscription>('Subscription');
} catch (e: any) {
  // Model definition should match the one in subscribe/route.ts
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

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    const body = await request.json();
    const { userId, endpoint } = body;
    
    if (!userId || !endpoint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Delete the subscription
    const result = await Subscription.deleteOne({ 
      endpoint,
      userId
    });
    
    if (result.deletedCount === 0) {
      // Subscription not found or already deleted
      return NextResponse.json({ 
        success: true, 
        message: 'No matching subscription found' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 