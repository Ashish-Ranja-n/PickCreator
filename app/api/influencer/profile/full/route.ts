import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for getting all influencer profile data needed for the profile page
 */
export async function GET(request: NextRequest) {
  try {
    await connect();
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid token - No user ID' }, { status: 401 });
    }
    // Get influencer and user data
    let influencer = await Influencer.findById(userId).lean();
    if (!influencer) {
      influencer = await Influencer.findOne({ user: userId }).lean();
    }
    // Defensive: if influencer is an array, use first element
    if (Array.isArray(influencer)) {
      influencer = influencer[0];
    }
    if (!influencer) {
      return NextResponse.json({ success: false, error: 'Influencer not found' }, { status: 404 });
    }
    let user = await User.findById(userId, 'name email role').lean();
    if (Array.isArray(user)) {
      user = user[0];
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // Compose all needed fields
    const profile = {
      name: user.name,
      email: user.email,
      bio: influencer.bio || '',
      socialMediaLinks: influencer.socialMediaLinks || [],
      rating: influencer.rating || 0,
      completedDeals: influencer.completedDeals || 0,
      mobile: influencer.mobile || '',
      city: influencer.city || '',
      gender: influencer.gender || '',
      age: influencer.age || '',
      instagramUsername: influencer.instagramUsername || '',
      followerCount: influencer.followerCount || 0,
      profilePictureUrl: influencer.profilePictureUrl || influencer.profilePicture || '',
      onboardingCompleted: influencer.onboardingCompleted || false,
      onboardingStep: influencer.onboardingStep || 0,
      pricingModels: influencer.pricingModels || {},
      brandPreferences: influencer.brandPreferences || {},
      availability: influencer.availability || [],
      isInstagramVerified: influencer.isInstagramVerified || false,
    };
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get influencer profile', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
