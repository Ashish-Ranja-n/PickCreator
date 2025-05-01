import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { processInstagramMessages } from '@/utils/instagramAutomation';

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  // Extract the query parameters
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Verify token from environment variable
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  
  console.log('Instagram webhook verification attempt', { mode, token: token?.substring(0, 5) + '...' });
  
  // Verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge);
  }
  
  console.error('Webhook verification failed');
  return new NextResponse('Verification failed', { status: 403 });
}

// Handle POST requests for webhook events
export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const data = await request.json();
    console.log('Instagram webhook event received:', JSON.stringify(data, null, 2));
    
    // Connect to database
    await connect();
    
    // Process Instagram events
    if (data.object === 'instagram' && data.entry) {
      for (const entry of data.entry) {
        // Check for messaging events
        if (entry.messaging) {
          await processInstagramMessages(entry.messaging);
        }
      }
    }
    
    // Acknowledge receipt of the event
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Error processing Instagram webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
} 