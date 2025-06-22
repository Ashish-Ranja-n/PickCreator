import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

/**
 * API route for searching influencers with filters
 * This endpoint supports filtering by city and sorting by followers
 */
export async function GET(request: NextRequest) {
  try {
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is a brand
    if (userData.role !== 'Brand') {
      return NextResponse.json({
        success: false,
        error: 'Only brands can access this endpoint'
      }, { status: 403 });
    }

    // Connect to the database
    await connect();

    // Get query parameters
    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const sortBy = url.searchParams.get('sortBy') || 'followers';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Build query filters
    const filters: any = {
      onboardingCompleted: true,
      $or: [
        { instagramConnected: true },
        { isInstagramVerified: true }
      ]
    };

    // Add city filter if provided
    if (city && city !== 'all') {
      filters.city = city;
    }

    // Sort configuration
    const sortConfig: any = {};
    if (sortBy === 'followers') {
      sortConfig.followerCount = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'instagramAnalytics.avgReelViews') {
      // Sort by average reel views from Instagram analytics
      sortConfig['instagramAnalytics.avgReelViews'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'engagement') {
      // Legacy sort option, fallback to followers
      sortConfig.followerCount = sortOrder === 'asc' ? 1 : -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find influencers matching filters
    const influencers = await Influencer.find(filters)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total number of matching influencers for pagination
    const totalCount = await Influencer.countDocuments(filters);

    // Get user data for these influencers
    const influencerUserIds = influencers.map(inf => inf._id);
    const users = await User.find({ _id: { $in: influencerUserIds } }, 'name').lean();

    // Create a map of user IDs to names
    const userMap = users.reduce((map: Record<string, any>, user) => {
      const id = (user._id as mongoose.Types.ObjectId).toString();
      map[id] = user;
      return map;
    }, {});

    // Format response data, excluding sensitive information
    const formattedInfluencers = influencers.map((influencer: any) => {
      const userId = (influencer._id as mongoose.Types.ObjectId).toString();

      return {
        id: userId,
        name: userMap[userId]?.name || 'Influencer',
        city: influencer.city || 'Unknown Location',
        profilePictureUrl: influencer.profilePictureUrl || influencer.profilePicture || '',
        followers: influencer.followerCount || 0,
        bio: influencer.bio || '',
        // Instagram data
        instagramUsername: influencer.instagramUsername || '',
        // Include Instagram analytics data
        instagramAnalytics: influencer.instagramAnalytics ? {
          totalPosts: influencer.instagramAnalytics.totalPosts || 0,
          avgReelViews: influencer.instagramAnalytics.avgReelViews || 0,
          avgReelLikes: influencer.instagramAnalytics.avgReelLikes || 0,
          averageEngagement: influencer.instagramAnalytics.averageEngagement || 0,
          lastUpdated: influencer.instagramAnalytics.lastUpdated
        } : {
          totalPosts: 0,
          avgReelViews: 0,
          avgReelLikes: 0,
          averageEngagement: 0
        },
        lastUpdated: influencer.lastInstagramUpdate,

        // Include onboarding data
        pricingModels: influencer.pricingModels || null,
        brandPreferences: influencer.brandPreferences || null,
        availability: influencer.availability || []
      };
    });

    return NextResponse.json({
      success: true,
      influencers: formattedInfluencers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error searching influencers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search influencers'
    }, { status: 500 });
  }
}