import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getInstagramMessages, shouldRefreshToken, refreshInstagramToken } from '@/utils/instagramApi';
import { requiresInstagramReconnect } from '@/utils/instagramApiErrors';

/**
 * API route for fetching Instagram messages for an influencer
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Instagram messages API route: Processing request");

    // Connect to the database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      console.error("Unauthorized access attempt to Instagram messages");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`Fetching Instagram messages for user: ${userData.id}`);
    
    // Find the influencer in the database by user ID
    let influencer = await Influencer.findOne({ user: userData.id }).lean();
    
    // If not found by user ID, try finding by direct _id
    if (!influencer) {
      console.log(`No influencer found with user: ${userData.id}, trying direct ID lookup...`);
      influencer = await Influencer.findById(userData.id).lean();
      
      if (!influencer) {
        console.log(`No influencer found with ID: ${userData.id}`);
        return NextResponse.json(
          { error: 'Influencer profile not found' },
          { status: 404 }
        );
      }
    }
    
    // Type assertion to fix TypeScript errors
    const influencerData = influencer as unknown as {
      instagramConnected?: boolean;
      instagramToken?: {
        accessToken: string;
        expiresIn: number;
        createdAt: Date;
      };
      instagramId?: string;
      _id?: string;
    };
    
    // If influencer not found or Instagram not connected
    if (!influencerData || !influencerData.instagramToken?.accessToken) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 }
      );
    }
    
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
            { error: 'Instagram token expired, please reconnect' },
            { status: 401 }
          );
        }
        
        // Log but continue with old token
        console.warn('Token refresh failed, continuing with existing token');
      }
    }
    
    try {
      // Get Instagram messages
      console.log("Calling getInstagramMessages with token");
      const instagramMessages = await getInstagramMessages(influencerData.instagramToken.accessToken);
      
      // Log message data for debugging (without sensitive content)
      console.log("Instagram messages retrieved:", {
        conversationCount: instagramMessages?.length || 0,
        sampleConversation: instagramMessages && instagramMessages.length > 0 ? {
          id: instagramMessages[0].id,
          participantCount: (() => {
            const participants = instagramMessages[0].participants;
            if (!participants) return 0;
            
            // Handle nested data structure
            if (typeof participants === 'object') {
              if ('data' in participants && Array.isArray(participants.data)) {
                return participants.data.length;
              }
              if (Array.isArray(participants)) {
                return participants.length;
              }
            }
            return 0;
          })(),
          messageCount: instagramMessages[0].messages?.length || 0
        } : null
      });
      
      // Process messages to ensure consistency in format
      const processedMessages = instagramMessages.map(conversation => {
        // If conversation already has a valid format, return it
        if (conversation && !conversation.error && conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
          return conversation;
        }
        
        // If conversation has error or no messages, check if messages are present elsewhere in the response
        // This handles some variations in the Instagram API response format
        if (conversation) {
          // Type assertion to handle dynamic properties
          const convAny = conversation as any;
          
          if (convAny.data && Array.isArray(convAny.data)) {
            // Sometimes the messages are in a data property
            return {
              ...conversation,
              messages: convAny.data
            };
          }
          
          if (convAny.comments && convAny.comments.data && Array.isArray(convAny.comments.data)) {
            // Sometimes messages are returned as comments
            return {
              ...conversation,
              messages: convAny.comments.data.map((comment: any) => ({
                id: comment.id,
                from: comment.from || { id: 'unknown' },
                to: comment.to || { id: 'unknown' },
                message: comment.text || comment.message,
                created_time: comment.created_time || comment.timestamp
              }))
            };
          }
        }
        
        return conversation;
      });
      
      // If no messages or empty array, return empty conversations array
      if (!processedMessages || processedMessages.length === 0) {
        console.log("No Instagram messages found");
        return NextResponse.json({
          success: true,
          conversations: [],
          instagramProfile: {
            id: influencerData.instagramId || influencerData._id || userData.id
          }
        }, { status: 200 });
      }
      
      // Get Instagram profile data to include in the response
      const instagramProfile = {
        id: influencerData.instagramId || influencerData._id || userData.id
      };
      
      return NextResponse.json({
        success: true,
        conversations: processedMessages,
        instagramProfile
      }, { status: 200 });
    } catch (error: any) {
      console.error('Error getting Instagram messages:', error);
      
      // Check if error is due to permissions
      if (error.message && error.message.includes('permission')) {
        return NextResponse.json({
          success: false,
          error: 'Missing Instagram permissions. Please reconnect your account with messaging permissions.',
          conversations: []
        }, { status: 200 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Instagram messages: ' + (error.message || 'Unknown error'),
        conversations: []
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in Instagram messages API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram messages', conversations: [] },
      { status: 500 }
    );
  }
} 