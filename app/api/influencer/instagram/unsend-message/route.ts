import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import { shouldRefreshToken, refreshInstagramToken } from '@/utils/instagramApi';
import { requiresInstagramReconnect } from '@/utils/instagramApiErrors';
import axios from 'axios';

/**
 * API route for unsending Instagram messages
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Instagram unsend message API route: Processing request");
    
    // Connect to the database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      console.error("Unauthorized access attempt to unsend Instagram message");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { conversationId, messageId } = body;
    
    // Validate required fields
    if (!messageId) {
      return NextResponse.json(
        { error: 'Missing required field: messageId' },
        { status: 400 }
      );
    }
    
    // Need conversationId for context
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required field: conversationId' },
        { status: 400 }
      );
    }
    
    console.log(`Unsending Instagram message for user: ${userData.id}, messageId: ${messageId} in conversation: ${conversationId}`);
    
    // Find the influencer in the database using the authenticated user's ID
    let influencer = await Influencer.findOne({ user: userData.id });
    
    // If influencer is not found based on user ID, try finding by direct _id as a fallback
    if (!influencer) {
      console.log(`Could not find influencer with user: ${userData.id}, trying direct _id lookup...`);
      influencer = await Influencer.findById(userData.id);
    }

    // Check if influencer was found either way
    if (!influencer) {
      console.error(`No influencer found for authenticated user ID: ${userData.id}`);
      return NextResponse.json(
        { error: 'Influencer profile not found for logged-in user.' },
        { status: 404 } 
      );
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
      // Call the Instagram Graph API to unsend the message
      // Try direct DELETE request on the message ID endpoint
      console.log(`Attempting to unsend message with ID: ${messageId}`);
      
      // Approach 1: Use DELETE directly on the message ID
      const unsendUrl = `https://graph.instagram.com/v22.0/${messageId}`;
      
      // First try with DELETE method
      const response = await axios.delete(unsendUrl, {
        params: {
          access_token: influencerData.instagramToken.accessToken
        }
      });
      
      console.log('Unsend response:', response.data);
      
      // Return success if it worked
      return NextResponse.json({
        success: true,
        message: 'Message unsent successfully'
      }, { status: 200 });
    } catch (firstError: any) {
      console.error('First unsend attempt failed:', firstError.message);
      
      try {
        // Approach 2: Try with POST to me/messages endpoint
        const alternativeUrl = `https://graph.instagram.com/v22.0/me/messages`;
        
        const response = await axios.post(alternativeUrl, {
          message_id: messageId,
          operation: "delete"
        }, {
          params: {
            access_token: influencerData.instagramToken.accessToken
          }
        });
        
        console.log('Alternative unsend response:', response.data);
        
        return NextResponse.json({
          success: true,
          message: 'Message unsent successfully with alternative method'
        }, { status: 200 });
      } catch (secondError) {
        // If both methods fail, throw the second error to the catch block
        console.error('Both unsend attempts failed');
        throw secondError;
      }
    }
  } catch (error) {
    console.error('Error in Instagram unsend message API:', error);
    
    // Create a more helpful error message based on the response
    let errorMessage = 'Failed to unsend Instagram message';
    let statusCode = 500;
    
    if ((error as any).response) {
      console.error('API error response:', (error as any).response.data);
      
      // Extract Facebook/Instagram API error details if available
      const fbError = (error as any).response.data?.error;
      
      if (fbError) {
        // Check for common Instagram API errors
        
        // Permission issues
        if (fbError.message && fbError.message.includes('permission')) {
          errorMessage = 'Missing Instagram permissions. Please reconnect your account with messaging permissions.';
          statusCode = 403;
        }
        // Time window expired (Instagram only allows unsending messages for a limited time)
        else if (fbError.message && (fbError.message.includes('time') || fbError.message.includes('expired'))) {
          errorMessage = 'Unable to unsend this message. Instagram only allows unsending recent messages.';
          statusCode = 400;
        }
        // Message not found
        else if (fbError.code === 100 || (fbError.message && fbError.message.includes('not found'))) {
          errorMessage = 'Message not found or already deleted.';
          statusCode = 404;
        }
        // Other API errors
        else {
          errorMessage = fbError.message || 'Instagram API error';
        }
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
} 