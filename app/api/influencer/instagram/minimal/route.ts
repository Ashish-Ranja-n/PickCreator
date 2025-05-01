import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getMinimalInstagramData, shouldRefreshToken, refreshInstagramToken } from '@/utils/instagramApi';
import { requiresInstagramReconnect } from '@/utils/instagramApiErrors';

// Function to check if Instagram data needs updating (older than 24 hours)
function shouldUpdateInstagramData(lastUpdate: Date | undefined): boolean {
  if (!lastUpdate) return true;

  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const dataAge = Date.now() - new Date(lastUpdate).getTime();
  return dataAge > oneDayInMs;
}

/**
 * API route for fetching minimal Instagram data for an influencer
 * This is used to display Instagram data on the influencer's profile
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Instagram minimal API route: Processing request");

    // Connect to the database
    await connect();

    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      console.error("Unauthorized access attempt to Instagram minimal data");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Fetching Instagram data for user: ${userData.id}`);

    // Find the influencer in the database by user ID
    let influencer = await Influencer.findOne({ user: userData.id }).lean();

    // If not found by user ID, try finding by direct _id
    if (!influencer) {
      console.log(`No influencer found with user: ${userData.id}, trying direct ID lookup...`);
      influencer = await Influencer.findById(userData.id).lean();

      if (!influencer) {
        console.log(`No influencer found with direct ID: ${userData.id}, creating new profile...`);

        // Check if user exists and has Influencer role
        const user = await User.findById(userData.id, 'name email role').lean();

        if (user && (user as any).role === 'Influencer') {
          // Create a new influencer profile
          const newInfluencer = new Influencer({
            _id: userData.id,
            bio: '',
            socialMediaLinks: [],
            instagramConnected: false,
            onboardingCompleted: false,
            onboardingStep: 0
          });

          // Save the new influencer profile
          await newInfluencer.save();
          console.log(`Created new influencer profile for user: ${userData.id}`);

          // Use the new influencer for the response
          influencer = newInfluencer.toObject();
        } else {
          console.log(`User not found or not an influencer: ${userData.id}`);
          return NextResponse.json(
            { isConnected: false, error: 'User not found or not an influencer' },
            { status: 200 }
          );
        }
      } else {
        console.log(`Found influencer with direct ID: ${userData.id}`);
      }
    } else {
      console.log(`Found influencer with user reference: ${userData.id}`);
    }

    // Type assertion to fix TypeScript errors
    const influencerData = influencer as unknown as {
      instagramConnected?: boolean;
      instagramToken?: {
        accessToken: string;
        expiresIn: number;
        createdAt: Date;
      };
      instagramUsername?: string;
      instagramId?: string;
      accountType?: string;
      mediaCount?: number;
      followerCount?: number;
      profilePictureUrl?: string;
      lastInstagramUpdate?: Date;
      instagramAnalytics?: {
        totalPosts: number;
        averageEngagement: number;
        avgReelViews: number;
        avgReelLikes: number;
        lastUpdated: Date;
      };
    };

    // Log influencer data for debugging (except token)
    console.log("Influencer data:", {
      hasToken: !!influencerData?.instagramToken?.accessToken,
      instagramConnected: influencerData?.instagramConnected,
      tokenCreatedAt: influencerData?.instagramToken?.createdAt,
      tokenExpiresIn: influencerData?.instagramToken?.expiresIn,
      lastInstagramUpdate: influencerData?.lastInstagramUpdate,
      hasAnalytics: !!influencerData?.instagramAnalytics
    });

    // If influencer not found or Instagram not connected
    if (!influencerData || !influencerData.instagramToken?.accessToken) {
      return NextResponse.json(
        { isConnected: false, error: 'Instagram not connected' },
        { status: 200 }
      );
    }

    // Check if we have recent cached data (less than 24 hours old)
    const needsUpdate = shouldUpdateInstagramData(influencerData.lastInstagramUpdate);

    // Check if we need to force a refresh (URL param)
    const searchParams = new URL(request.url).searchParams;
    const forceRefresh = searchParams.get('refresh') !== null;

    // If we have recent cached data and no force refresh, return it without calling Instagram API
    if (!needsUpdate && !forceRefresh &&
        influencerData.instagramUsername &&
        influencerData.instagramId &&
        influencerData.followerCount !== undefined &&
        influencerData.profilePictureUrl &&
        influencerData.instagramAnalytics) {

      console.log("Using cached Instagram data from database, last updated:", influencerData.lastInstagramUpdate);

      // Return cached data
      return NextResponse.json({
        isConnected: true,
        profile: {
          id: influencerData.instagramId,
          username: influencerData.instagramUsername,
          account_type: influencerData.accountType || 'BUSINESS',
          media_count: influencerData.mediaCount,
          profile_picture_url: influencerData.profilePictureUrl,
          followers_count: influencerData.followerCount
        },
        analytics: influencerData.instagramAnalytics,
        lastUpdated: influencerData.lastInstagramUpdate
      }, { status: 200 });
    }

    // Data needs to be updated from Instagram API
    console.log("Cached data is outdated or missing, fetching from Instagram API");

    // Check if token needs refresh (older than 50 days)
    if (influencerData.instagramToken.createdAt && shouldRefreshToken(influencerData.instagramToken.createdAt)) {
      console.log("Token needs refresh, created at:", influencerData.instagramToken.createdAt);
      try {
        // Refresh the token
        const refreshedToken = await refreshInstagramToken(influencerData.instagramToken.accessToken);
        console.log("Successfully refreshed Instagram token");

        // Update the token in the database - always use user ID for safety
        await Influencer.updateOne(
          { user: userData.id },
          {
            $set: {
              'instagramToken.accessToken': refreshedToken,
              'instagramToken.createdAt': new Date()
            }
          }
        );

        // Use refreshed token for API calls
        influencerData.instagramToken.accessToken = refreshedToken;
      } catch (refreshError) {
        console.error('Error refreshing Instagram token:', refreshError);

        // If token refresh fails and requires reconnect
        if (requiresInstagramReconnect(refreshError)) {
          return NextResponse.json(
            { isConnected: false, error: 'Instagram token expired, please reconnect' },
            { status: 200 }
          );
        }

        // Log but continue with old token
        console.warn('Token refresh failed, continuing with existing token');
      }
    }

    // Get fresh Instagram data
    console.log("Calling getMinimalInstagramData with token");
    const instagramData = await getMinimalInstagramData(influencerData.instagramToken.accessToken);

    // Log Instagram data for debugging
    console.log("Instagram data retrieved:", {
      isConnected: instagramData.isConnected,
      hasProfile: !!instagramData.profile,
      hasAnalytics: !!instagramData.analytics,
      profileSample: instagramData.profile ? {
        username: instagramData.profile.username,
        followers_count: instagramData.profile.followers_count,
        account_type: instagramData.profile.account_type,
        has_picture: !!instagramData.profile.profile_picture_url
      } : null,
      error: instagramData.error || null
    });

    // Update cached data in database if profile data is available
    if (instagramData.isConnected && instagramData.profile) {
      const profile = instagramData.profile;

      console.log("Updating Instagram data in database");

      // Create update object
      const updateData: any = {
        instagramConnected: true,
        instagramUsername: profile.username,
        instagramId: profile.id,
        accountType: profile.account_type,
        mediaCount: profile.media_count,
        followerCount: profile.followers_count || 0,
        profilePictureUrl: profile.profile_picture_url || '',
        lastInstagramUpdate: new Date()
      };

      // Add analytics data if available
      if (instagramData.analytics) {
        console.log("Instagram analytics data available:", {
          totalPosts: instagramData.analytics.totalPosts,
          averageEngagement: instagramData.analytics.averageEngagement,
          avgReelViews: instagramData.analytics.avgReelViews,
          avgReelLikes: instagramData.analytics.avgReelLikes
        });

        updateData.instagramAnalytics = {
          totalPosts: instagramData.analytics.totalPosts,
          averageEngagement: instagramData.analytics.averageEngagement,
          avgReelViews: instagramData.analytics.avgReelViews,
          avgReelLikes: instagramData.analytics.avgReelLikes,
          lastUpdated: new Date()
        };
      } else {
        console.log("No Instagram analytics data available");
      }

      // Update the database - first try updating by user reference
      let updateResult = await Influencer.updateOne(
        { user: userData.id },
        { $set: updateData }
      );

      // If no document was matched, try updating by direct ID
      if (updateResult.matchedCount === 0) {
        console.log("No influencer matched by user reference, trying direct ID update");
        updateResult = await Influencer.updateOne(
          { _id: userData.id },
          { $set: updateData }
        );

        if (updateResult.matchedCount === 0) {
          console.log("Failed to update influencer - no matching document found");
        } else {
          console.log(`Updated influencer by direct ID, modified: ${updateResult.modifiedCount}`, {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            upsertedCount: updateResult.upsertedCount,
            acknowledged: updateResult.acknowledged
          });

          // Verify stored data
          const updatedInfluencer = await Influencer.findById(userData.id).lean();
          console.log("Influencer document after update:", {
            hasAnalytics: !!updatedInfluencer && !!(updatedInfluencer as any).instagramAnalytics,
            analytics: updatedInfluencer && (updatedInfluencer as any).instagramAnalytics ? {
              totalPosts: (updatedInfluencer as any).instagramAnalytics.totalPosts,
              averageEngagement: (updatedInfluencer as any).instagramAnalytics.averageEngagement,
              avgReelViews: (updatedInfluencer as any).instagramAnalytics.avgReelViews,
              avgReelLikes: (updatedInfluencer as any).instagramAnalytics.avgReelLikes
            } : null
          });
        }
      } else {
        console.log(`Updated influencer by user reference, modified: ${updateResult.modifiedCount}`, {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          upsertedCount: updateResult.upsertedCount,
          acknowledged: updateResult.acknowledged
        });

        // Verify stored data
        const updatedInfluencer = await Influencer.findOne({ user: userData.id }).lean();
        console.log("Influencer document after update:", {
          hasAnalytics: !!updatedInfluencer && !!(updatedInfluencer as any).instagramAnalytics,
          analytics: updatedInfluencer && (updatedInfluencer as any).instagramAnalytics ? {
            totalPosts: (updatedInfluencer as any).instagramAnalytics.totalPosts,
            averageEngagement: (updatedInfluencer as any).instagramAnalytics.averageEngagement,
            avgReelViews: (updatedInfluencer as any).instagramAnalytics.avgReelViews,
            avgReelLikes: (updatedInfluencer as any).instagramAnalytics.avgReelLikes
          } : null
        });
      }

      // Since lastUpdated isn't directly on InstagramData type, add it separately in the response
      const responseWithLastUpdated = {
        ...instagramData,
        lastUpdated: new Date()
      };

      // Log the successful update
      console.log("Successfully stored Instagram data in database for user:", userData.id);

      // Return Instagram data with lastUpdated field
      return NextResponse.json(responseWithLastUpdated);
    }

    // Add right after you fetch instagramData
    console.log("Raw Instagram API response:", JSON.stringify({
      isConnected: instagramData.isConnected,
      hasProfile: !!instagramData.profile,
      profileType: instagramData.profile?.account_type,
      analytics: instagramData.analytics ? {
        averageEngagement: instagramData.analytics.averageEngagement,
        avgReelViews: instagramData.analytics.avgReelViews,
        avgReelLikes: instagramData.analytics.avgReelLikes
      } : null,
      error: instagramData.error
    }, null, 2));

    // Return the Instagram data
    return NextResponse.json(instagramData);
  } catch (error) {
    console.error("Error in Instagram minimal API route:", error);

    // Return error response
    return NextResponse.json(
      {
        error: "Failed to get Instagram data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}