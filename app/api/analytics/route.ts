import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';
import Post from '@/models/post';
import { Deal } from '@/models/deal';
import Conversation from '@/models/conversation';

export async function GET(request: NextRequest) {
  try {
    await connect();

    // User stats
    const totalUsers = await User.countDocuments({});
    const totalInfluencers = await User.countDocuments({ role: 'Influencer' });
    const totalBrands = await User.countDocuments({ role: 'Brand' });
    const verifiedInfluencers = await User.countDocuments({ role: 'Influencer', isInstagramVerified: true });
    const verifiedBrands = await User.countDocuments({ role: 'Brand', isVerified: true });

    // Content stats
    const totalPosts = await Post.countDocuments({});
    const totalDeals = await Deal.countDocuments({});
    const activeDeals = await Deal.countDocuments({ status: { $in: ['accepted', 'ongoing', 'content_approved'] } });
    const completedDeals = await Deal.countDocuments({ status: 'completed' });

    // Conversation stats
    const activeConversations = await Conversation.countDocuments({});

    return NextResponse.json({
      totalUsers,
      totalInfluencers,
      totalBrands,
      verifiedInfluencers,
      verifiedBrands,
      totalPosts,
      totalDeals,
      activeDeals,
      completedDeals,
      activeConversations
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}