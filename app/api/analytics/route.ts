import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';

export async function GET(request: NextRequest) {
  try {
    await connect();

    // Count total influencers
    const totalInfluencers = await User.countDocuments({ role: 'Influencer' });

    // Count total brands
    const totalBrands = await User.countDocuments({ role: 'Brand' });

    // Count verified influencers (using isConnected instead of isVerified)
    const verifiedInfluencers = await User.countDocuments({
      role: 'Influencer',
      instagramConnected: true
    });

    // Count verified brands
    const verifiedBrands = await User.countDocuments({
      role: 'Brand',
      isVerified: true
    });

    return NextResponse.json({
      totalInfluencers,
      totalBrands,
      verifiedInfluencers,
      verifiedBrands
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}