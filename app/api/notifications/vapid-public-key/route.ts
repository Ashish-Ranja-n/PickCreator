import { NextResponse } from 'next/server';

// Default VAPID keys for development ONLY
// In production, use proper environment variables
const DEFAULT_PUBLIC_KEY = 'BPYXkWxFKdLWk42QJLiP1P6yFB7mHPZVY7gKlG5EwGgFMjyjq6iYj7MCwIY4XwHkNIKJ_aQzaYu0QH_k9NJ7wKE';

export async function GET() {
  try {
    // VAPID keys should be generated only once and stored securely
    // In a production environment, these should be set as environment variables
    // For testing, we're using the keys from process.env or our default development key
    
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.error('VAPID public key not found in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    console.log('Returning VAPID public key');
    return NextResponse.json({ vapidPublicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 