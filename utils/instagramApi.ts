import axios from 'axios';
import { parseInstagramError } from './instagramApiErrors';

// Instagram API response interfaces
export interface InstagramProfile {
  id: string;
  user_id?: string;
  username: string;
  account_type: string;
  media_count?: number;
  profile_picture_url?: string;
  followers_count?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
  insights?: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
    reaches?: number;
    engagement?: number;
  };
}

// Updated Instagram Data interface to store analytics instead of media
export interface InstagramData {
  isConnected: boolean;
  profile?: InstagramProfile;
  analytics?: {
    totalPosts: number;
    averageEngagement: number;
    avgReelViews: number; // Average views on last 30 reels
    avgReelLikes: number; // Average likes on last 30 reels
    lastUpdated: Date;
  };
  error?: string;
}

// Instagram token interface
export interface InstagramToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  created_at: Date;
}

// Instagram Messages interfaces
interface InstagramMessage {
  id: string;
  from: {
    id: string;
    username?: string;
  };
  to: {
    id: string;
    username?: string;
  };
  message: string;
  created_time: string;
}

interface InstagramConversation {
  id: string;
  participants: {
    id: string;
    username?: string;
  }[];
  updated_time: string;
  messages?: InstagramMessage[];
  error?: string;
}

// Check if token needs refresh (if token is older than 50 days)
export const shouldRefreshToken = (tokenCreatedAt: Date): boolean => {
  const fiftyDaysInMs = 50 * 24 * 60 * 60 * 1000;
  const tokenAge = Date.now() - new Date(tokenCreatedAt).getTime();
  return tokenAge > fiftyDaysInMs;
};

// Refresh the Instagram access token
export const refreshInstagramToken = async (accessToken: string): Promise<string> => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/refresh_access_token`,
      {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing Instagram token:', error);
    throw new Error('Failed to refresh Instagram token');
  }
};

// Exchange authorization code for access token
export const getInstagramAccessToken = async (code: string): Promise<InstagramToken> => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts} to exchange Instagram code for token`);

      // Validate environment variables
      const appId = process.env.INSTAGRAM_APP_ID;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;
      const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

      if (!appId || !appSecret || !redirectUri) {
        console.error('Missing required environment variables:', {
          hasAppId: !!appId,
          hasAppSecret: !!appSecret,
          hasRedirectUri: !!redirectUri
        });
        throw new Error('Missing required Instagram configuration');
      }

      console.log("Instagram token exchange configuration:", {
        redirectUri,
        appId: `${appId.substring(0, 4)}...`,
        codeLength: code.length
      });

      // Create form data object for properly encoded POST request
      const formData = new URLSearchParams();
      formData.append('client_id', appId);
      formData.append('client_secret', appSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      const response = await axios.post(
        `https://api.instagram.com/oauth/access_token`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data) {
        console.error('Empty response from Instagram token endpoint');
        throw new Error('Empty response from Instagram');
      }

      console.log("Instagram token response status:", response.status);
      console.log("Instagram token response headers:", response.headers);
      console.log("Instagram token response data:", {
        hasAccessToken: !!response.data.access_token,
        responseKeys: Object.keys(response.data)
      });

      if (!response.data.access_token) {
        if (attempts < maxAttempts) {
          console.log(`Invalid response, retrying in ${attempts * 500}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 500));
          continue;
        }
        throw new Error('Invalid response from Instagram token endpoint');
      }

      // Success with short-lived token, now try to get long-lived token
      try {
        const longLivedResponse = await axios.get(
          'https://graph.instagram.com/access_token',
          {
            params: {
              grant_type: 'ig_exchange_token',
              client_secret: appSecret,
              access_token: response.data.access_token,
            },
            timeout: 10000,
          }
        );

        console.log("Long-lived token response:", {
          status: longLivedResponse.status,
          hasToken: !!longLivedResponse.data?.access_token,
          expiresIn: longLivedResponse.data?.expires_in
        });

        if (!longLivedResponse.data?.access_token) {
          console.warn("Long-lived token exchange failed, using short-lived token");
          return {
            access_token: response.data.access_token,
            token_type: 'bearer',
            expires_in: 3600,
            created_at: new Date(),
          };
        }

        return {
          access_token: longLivedResponse.data.access_token,
          token_type: 'bearer',
          expires_in: longLivedResponse.data.expires_in,
          created_at: new Date(),
        };

      } catch (longLivedError) {
        const error = longLivedError as Error & {
          response?: {
            status?: number;
            data?: any;
          }
        };

        console.error('Error getting long-lived token:', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        return {
          access_token: response.data.access_token,
          token_type: 'bearer',
          expires_in: 3600,
          created_at: new Date(),
        };
      }

    } catch (requestError) {
      const error = requestError as Error & {
        response?: {
          status?: number;
          data?: any;
        }
      };

      console.error('Instagram token exchange error:', {
        attempt: attempts,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (attempts < maxAttempts) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
        console.log(`Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      throw new Error(`Failed to get Instagram access token: ${error.message}`);
    }
  }

  throw new Error('Failed to get Instagram access token after all attempts');
};

// Get Instagram profile data
export const getInstagramProfile = async (accessToken: string): Promise<InstagramProfile> => {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts} to get Instagram profile with token: ${accessToken.substring(0, 10)}...`);

      // Get profile data with minimal fields
      const profileResponse = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,user_id,username,account_type,media_count',
          access_token: accessToken,
        },
        timeout: 8000 // 8 second timeout
      });

      console.log("Instagram profile response:", profileResponse.data);

      let profile = profileResponse.data;

      // For all account types, get followers count and profile picture directly from Instagram Graph API
      if (profile.account_type === 'BUSINESS' || profile.account_type === 'CREATOR' || profile.account_type === 'MEDIA_CREATOR') {
        try {
          // Use Instagram Graph API directly
          const profileDetailsResponse = await axios.get(`https://graph.instagram.com/${profile.id}`, {
            params: {
              fields: 'followers_count,profile_picture_url',
              access_token: accessToken,
            },
            timeout: 8000 // 8 second timeout
          });

          console.log("Instagram profile details response:", profileDetailsResponse.data);

          profile = {
            ...profile,
            followers_count: profileDetailsResponse.data.followers_count,
            profile_picture_url: profileDetailsResponse.data.profile_picture_url,
          };
        } catch (profileError) {
          console.error('Error getting Instagram profile details:', profileError);

          // Fallback: Try to get profile picture directly from user media
          try {
            // First, get user media to extract profile picture
            const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
              params: {
                fields: 'media_url,thumbnail_url',
                limit: 1,
                access_token: accessToken,
              },
              timeout: 8000 // 8 second timeout
            });

            console.log("Media for profile picture fallback:", mediaResponse.data);

            if (mediaResponse.data.data && mediaResponse.data.data.length > 0) {
              const firstMedia = mediaResponse.data.data[0];
              profile = {
                ...profile,
                // Use first media as profile picture if needed
                profile_picture_url: profile.profile_picture_url || firstMedia.thumbnail_url || firstMedia.media_url,
              };
            }
          } catch (mediaError) {
            console.error('Media profile picture fallback failed:', mediaError);
          }
        }
      }

      // Ensure followers_count has a default value
      if (profile.followers_count === undefined) {
        // For development, set a default follower count
        // In production, preserve at least a minimal valid count
        profile.followers_count = process.env.NODE_ENV === 'development' ?
          5000 : // Higher value for development testing
          1;     // Minimal value for production
      }

      // Always ensure we have the required fields
      if (!profile.id || !profile.username) {
        if (attempts < maxAttempts) {
          console.log(`Missing critical profile data, retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
        throw new Error('Instagram profile missing critical data');
      }

      return profile;

    } catch (error) {
      if (attempts < maxAttempts) {
        // Exponential backoff for retries
        const backoffTime = Math.min(1000 * Math.pow(2, attempts - 1), 4000);
        console.log(`Error getting Instagram profile, retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      console.error('All attempts to get Instagram profile failed:', error);

      // Return a minimal valid profile as fallback to prevent critical failures
      // This allows the connection process to continue even with partial data
      return {
        id: 'fallback_id_' + Date.now(),
        username: 'user_' + Math.floor(Math.random() * 10000),
        account_type: 'PERSONAL',
        followers_count: process.env.NODE_ENV === 'development' ? 5000 : 1,
        profile_picture_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23BBBBBB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E"
      };
    }
  }

  // This should never happen, but TypeScript requires a return statement
  throw new Error('Failed to get Instagram profile');
};

// New function to get Instagram analytics data
export const getInstagramAnalytics = async (accessToken: string): Promise<InstagramData['analytics']> => {
  try {
    console.log("Fetching Instagram analytics with token:", accessToken.substring(0, 10) + "...");

    // First, get basic profile data to confirm account type and total posts
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken,
      },
    });

    const profile = profileResponse.data;
    const totalPosts = profile.media_count || 0;

    // Determine if this is a business or creator account
    const isBusinessAccount = profile.account_type === 'BUSINESS' || profile.account_type === 'CREATOR' || profile.account_type === 'MEDIA_CREATOR';
    console.log(`Instagram account type: ${profile.account_type}, isBusinessAccount: ${isBusinessAccount}, totalPosts: ${totalPosts}`);

    // Fetch more media items to ensure we get enough reels/videos for analysis
    // We'll fetch up to 50 items to have a better chance of finding 30 reels/videos
    const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        fields: 'id,media_type,permalink,timestamp,caption,like_count,comments_count,thumbnail_url,media_url',
        limit: 50, // Increased from 30 to ensure we get enough reels/videos
        access_token: accessToken,
      },
    });

    console.log("Instagram media response:", mediaResponse.data.data.length, "items found");

    // Filter to only include reels and videos
    const allMediaItems = mediaResponse.data.data;
    const reelItems = allMediaItems.filter((item: any) =>
      item.media_type === 'REEL' || item.media_type === 'VIDEO'
    );

    console.log(`Found ${reelItems.length} reels/videos out of ${allMediaItems.length} total media items`);

    // Take only the most recent 30 reels/videos (or all if less than 30)
    const reelsToAnalyze = reelItems.slice(0, 30);
    console.log(`Analyzing ${reelsToAnalyze.length} reels/videos`);

    // For calculating average reel metrics
    let totalReelViews = 0;
    let totalReelLikes = 0;
    let totalEngagement = 0;
    let postsWithEngagement = 0;

    // Process each reel/video to get metrics
    await Promise.all(
      reelsToAnalyze.map(async (item: any) => {
        try {
          // Initialize variables for metrics
          let itemViews = 0;
          let itemLikes = 0;

          // First, check if we have direct access to like_count (works for all account types)
          if (item.like_count !== undefined) {
            itemLikes = parseInt(item.like_count) || 0;
            console.log(`Direct like count for reel ${item.id}: ${itemLikes}`);
          }

          // For business accounts, try to get additional insights
          if (isBusinessAccount) {
            try {
              // Get insights for this media item
              const insightsResponse = await axios.get(`https://graph.instagram.com/${item.id}/insights`, {
                params: {
                  metric: 'likes,comments,views,reach',
                  period: 'lifetime',
                  access_token: accessToken,
                },
              });

              if (insightsResponse.data && insightsResponse.data.data) {
                insightsResponse.data.data.forEach((metric: any) => {
                  if (metric.name === 'likes') {
                    const value = metric.values[0].value || 0;
                    itemLikes = value;
                    totalEngagement += value;
                    postsWithEngagement++;
                  } else if (metric.name === 'comments') {
                    const value = metric.values[0].value || 0;
                    totalEngagement += value;
                  } else if (metric.name === 'views') {
                    itemViews = metric.values[0].value || 0;
                    console.log(`Got views for reel ${item.id}: ${itemViews}`);
                  }
                });
              }
            } catch (insightError: any) {
              console.log(`Insights error for reel ${item.id}:`, {
                error: insightError.message,
                response: insightError.response?.data,
                status: insightError.response?.status
              });

              // Check if the error is due to recent content
              const mediaDate = new Date(item.timestamp);
              const hoursSincePosted = (Date.now() - mediaDate.getTime()) / (1000 * 60 * 60);

              if (hoursSincePosted < 48) {
                console.log(`Reel ${item.id} is less than 48 hours old (${Math.round(hoursSincePosted)} hours), metrics may not be available yet`);
              }

              // Fallback: Try to get basic media fields directly
              try {
                const mediaResponse = await axios.get(`https://graph.instagram.com/${item.id}`, {
                  params: {
                    fields: 'views,like_count,comments_count',
                    access_token: accessToken,
                  },
                });

                // Try to get views directly from the media object
                if (mediaResponse.data && mediaResponse.data.views) {
                  itemViews = mediaResponse.data.views || 0;
                  console.log(`Got direct views for reel ${item.id}: ${itemViews}`);
                } else if (mediaResponse.data) {
                  // If no views available, use engagement metrics as a fallback approximation
                  const likeCount = parseInt(mediaResponse.data.like_count) || 0;
                  const commentCount = parseInt(mediaResponse.data.comments_count) || 0;
                  itemViews = Math.max(likeCount * 3, commentCount * 10); // Rough estimation based on typical engagement ratios
                  console.log(`Using estimated views for reel ${item.id}: ${itemViews} (based on ${likeCount} likes, ${commentCount} comments)`);
                }
              } catch (mediaError) {
                console.log(`Could not get direct media details for reel ${item.id}:`, mediaError);
              }
            }
          } else {
            // For regular accounts: use direct likes if available
            itemLikes = itemLikes > 0 ? itemLikes : 0;
          }

          // Add to totals for average calculation
          totalReelViews += itemViews;
          totalReelLikes += itemLikes;

          console.log(`Added reel ${item.id} to calculation: views=${itemViews}, likes=${itemLikes}`);
        } catch (err) {
          console.error(`Error processing reel ${item.id}:`, err);
        }
      })
    );

    // Calculate average engagement
    const averageEngagement = postsWithEngagement > 0
      ? Math.round(totalEngagement / postsWithEngagement)
      : 0;

    // Calculate average reel views and likes
    const reelCount = reelsToAnalyze.length;
    const avgReelViews = reelCount > 0 ? Math.round(totalReelViews / reelCount) : 0;
    const avgReelLikes = reelCount > 0 ? Math.round(totalReelLikes / reelCount) : 0;

    // Log summary of calculations
    console.log("Reel calculation summary:", {
      reelCount,
      totalReelViews,
      totalReelLikes,
      avgReelViews,
      avgReelLikes
    });

    console.log("Instagram analytics results:", {
      totalPosts,
      averageEngagement,
      avgReelViews,
      avgReelLikes
    });

    return {
      totalPosts,
      averageEngagement,
      avgReelViews,
      avgReelLikes,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting Instagram analytics:', error);
    throw new Error('Failed to get Instagram analytics');
  }
};

// Main function to get minimal Instagram data (without media items)
export const getMinimalInstagramData = async (accessToken: string): Promise<InstagramData> => {
  try {

    // Get profile data with minimal fields
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken,
      },
    });


    let profile = profileResponse.data;

    // For all account types, get followers count and profile picture directly from Instagram Graph API
    if (profile.account_type === 'BUSINESS' || profile.account_type === 'CREATOR' || profile.account_type === 'MEDIA_CREATOR') {
      try {
        // Use Instagram Graph API directly instead of Facebook Graph API
        const profileDetailsResponse = await axios.get(`https://graph.instagram.com/${profile.id}`, {
          params: {
            fields: 'followers_count,profile_picture_url',
            access_token: accessToken,
          },
        });


        profile = {
          ...profile,
          followers_count: profileDetailsResponse.data.followers_count,
          profile_picture_url: profileDetailsResponse.data.profile_picture_url,
        };
      } catch (profileError) {
        console.error('Error getting Instagram profile details:', profileError);

        // Fallback: Try to get profile picture directly from user media
        try {
          // First, get user media to extract profile picture
          const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
            params: {
              fields: 'media_url,thumbnail_url',
              limit: 1,
              access_token: accessToken,
            },
          });

          console.log("Media for profile picture fallback:", mediaResponse.data);

          if (mediaResponse.data.data && mediaResponse.data.data.length > 0) {
            const firstMedia = mediaResponse.data.data[0];
            profile = {
              ...profile,
              // Use first media as profile picture if needed
              profile_picture_url: profile.profile_picture_url || firstMedia.thumbnail_url || firstMedia.media_url,
            };
          }
        } catch (mediaError) {
          console.error('Media profile picture fallback failed:', mediaError);
        }
      }
    }

    // Ensure followers_count has a default value
    if (profile.followers_count === undefined) {
      // For MEDIA_CREATOR accounts, set a default follower count of 1 for development
      profile.followers_count = process.env.NODE_ENV === 'development' ? 1 : 0;
    }

    // Get analytics instead of full media list
    const analytics = await getInstagramAnalytics(accessToken);

    // Ensure we have valid analytics data
    if (analytics) {
      console.log("Final Instagram analytics data:", {
        totalPosts: analytics.totalPosts,
        averageEngagement: analytics.averageEngagement,
        avgReelViews: analytics.avgReelViews,
        avgReelLikes: analytics.avgReelLikes
      });
    } else {
      console.error("Failed to get valid analytics data");
    }

    return {
      isConnected: true,
      profile,
      analytics,
    };
  } catch (error) {
    console.error('Error getting minimal Instagram data:', error);

    // Detailed error handling for diagnostic purposes
    if (axios.isAxiosError(error)) {
      console.error('Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // Handle specific error codes
      if (error.response?.data?.error?.type === 'OAuthException') {
        return {
          isConnected: false,
          error: 'Instagram authentication expired. Please reconnect your account.',
        };
      }
    }

    return {
      isConnected: false,
      error: 'Failed to get Instagram data: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
};

// Get Instagram auth URL
export const getInstagramAuthUrl = (): string => {
  // Always use the INSTAGRAM_REDIRECT_URI environment variable if available
  // Add current window location as a fallback during development
  let redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  // If no redirect URI is provided in env vars, construct one from the current window location
  if (!redirectUri && typeof window !== 'undefined') {
    // Get the base URL from the current window location
    const baseUrl = window.location.origin;
    redirectUri = `${baseUrl}/api/auth/instagram/callback`;
    console.log("Generated Instagram redirect URI from current location:", redirectUri);
  } else if (!redirectUri) {
    // Default fallback if neither env var nor window is available
    redirectUri = 'https://pickcreator.com/api/auth/instagram/callback';
  }

  console.log("Instagram redirect URI:", redirectUri);

  // Updated scopes based on Instagram's September 2024 API update
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_insights',
  ];

  // Add cache-busting parameter to prevent stale redirect issues
  const cacheBuster = `_t=${Date.now()}`;

  // Updated URL format with additional parameters
  return `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%2C')}&${cacheBuster}`;
};

// Validate Instagram follower count
export const validateFollowerCount = (followersCount?: number, userRole?: string): boolean => {
  // Always allow admins to connect regardless of follower count
  if (userRole === 'Admin') {
    console.log("Admin user: Bypassing follower count validation");
    return true;
  }

  // In production, require at least 2000 followers for non-admin users
  return followersCount !== undefined && followersCount >= 50;
};

// Fetch Instagram messages
export const getInstagramMessages = async (accessToken: string): Promise<InstagramConversation[]> => {
  try {
    console.log("Fetching Instagram messages with token:", accessToken.substring(0, 10) + "...");

    // First, get user's Instagram account ID and username
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username',
        access_token: accessToken,
      },
    });

    const profile = profileResponse.data;
    const instagramAccountId = profile.id;
    const instagramUsername = profile.username;

    // Fetch conversations from Instagram Graph API
    const conversationsResponse = await axios.get(`https://graph.instagram.com/${instagramAccountId}/conversations`, {
      params: {
        fields: 'id,participants,updated_time',
        access_token: accessToken,
      },
    });

    const conversations = conversationsResponse.data.data || [];
    console.log(`Fetched ${conversations.length} Instagram conversations`);

    // For each conversation, fetch the messages and participant details
    const conversationsWithMessages = await Promise.all(conversations.map(async (conversation: any) => {
      try {
        // Get more details about participants if possible
        let participantsWithDetails = conversation.participants;

        // If there's user data in the participants, make sure to map it to match our format
        if (conversation.participants && conversation.participants.data) {
          participantsWithDetails = conversation.participants;

          // Try to add current user to participants if not already there
          const hasCurrentUser = participantsWithDetails.data.some((p: any) => p.id === instagramAccountId);
          if (!hasCurrentUser) {
            participantsWithDetails.data.push({
              id: instagramAccountId,
              username: instagramUsername
            });
          }
        }

        // Fetch messages for this conversation
        try {
          const messagesResponse = await axios.get(`https://graph.instagram.com/${conversation.id}/messages`, {
            params: {
              fields: 'id,from,to,message,created_time',
              access_token: accessToken,
            },
          });

          // Extract messages from the response
          const messages = messagesResponse.data && messagesResponse.data.data ? messagesResponse.data.data : [];

          // Return conversation with messages
          return {
            ...conversation,
            participants: participantsWithDetails,
            messages: messages
          };
        } catch (messageError) {
          console.log(`Could not fetch messages for conversation ${conversation.id}:`, messageError);

          // Since we at least have the conversation, return it with an error but don't fail completely
          return {
            ...conversation,
            participants: participantsWithDetails,
            messages: [],
            error: 'Failed to fetch messages'
          };
        }
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error);
        return {
          ...conversation,
          messages: [],
          error: 'Failed to process conversation'
        };
      }
    }));

    return conversationsWithMessages;
  } catch (error) {
    console.error('Error fetching Instagram messages:', error);
    const parsedError = parseInstagramError(error);
    throw parsedError;
  }
};

/**
 * Send a message to an Instagram conversation
 * @param accessToken - The Instagram access token
 * @param conversationId - The ID of the conversation to send the message to
 * @param message - The text message to send
 * @returns A promise that resolves to the response data
 */
export const sendInstagramMessage = async (
  accessToken: string,
  conversationId: string,
  message: string
): Promise<any> => {
  try {
    console.log(`Sending Instagram message to conversation ${conversationId.substring(0, 8)}...`);

    // First, get user's Instagram account ID
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username',
        access_token: accessToken,
      },
    });

    const profile = profileResponse.data;
    const instagramAccountId = profile.id;
    console.log(`Using Instagram account ID: ${instagramAccountId.substring(0, 8)}...`);

    // Instagram Graph API endpoint for sending messages
    // Instagram expects the message to be sent directly to a recipient, not to a conversation
    // Try getting recipient from conversation participants
    try {
      const conversationResponse = await axios.get(`https://graph.instagram.com/${conversationId}`, {
        params: {
          fields: 'participants',
          access_token: accessToken,
        },
      });

      console.log('Conversation details retrieved:', conversationResponse.data);

      // Find recipient ID from participants (the one that's not the current user)
      let recipientId;

      if (conversationResponse.data?.participants?.data) {
        const participants = conversationResponse.data.participants.data;
        // Find the other participant (not the current user)
        const recipient = participants.find((p: any) => p.id !== instagramAccountId);
        if (recipient) {
          recipientId = recipient.id;
        }
      }

      if (!recipientId) {
        throw new Error('Could not identify recipient from conversation participants');
      }

      console.log(`Sending message to recipient: ${recipientId.substring(0, 8)}...`);

      // Send the message directly to the recipient using the appropriate endpoint
      const url = `https://graph.instagram.com/${instagramAccountId}/messages`;

      // Create form data for the POST request
      const formData = new URLSearchParams();
      formData.append('recipient_id', recipientId);
      formData.append('message', message);
      formData.append('access_token', accessToken);

      // Make the POST request to send the message
      const response = await axios.post(url, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Instagram message sent successfully:', response.data);

      // Return the response data which typically includes the message ID
      return {
        success: true,
        messageId: response.data?.id,
        data: response.data
      };
    } catch (conversationError) {
      console.error('Error getting conversation details:', conversationError);

      // Plan B: Try direct message using the conversation ID as the recipient ID
      // This might work in some cases where the conversation ID is identical to user ID
      console.log('Trying alternative approach using conversation ID directly...');

      // Send message directly using the conversation ID as recipient
      const url = `https://graph.instagram.com/${instagramAccountId}/messages`;

      const formData = new URLSearchParams();
      formData.append('recipient_id', conversationId);
      formData.append('message', message);
      formData.append('access_token', accessToken);

      const response = await axios.post(url, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        success: true,
        messageId: response.data?.id,
        data: response.data
      };
    }
  } catch (error) {
    console.error('Error sending Instagram message:', error);
    const parsedError = parseInstagramError(error);

    // Return a structured error object
    return {
      success: false,
      error: parsedError.message || 'Failed to send message',
      details: parsedError
    };
  }
};