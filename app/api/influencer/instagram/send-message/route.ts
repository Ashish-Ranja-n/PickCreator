import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import { sendInstagramMessage, shouldRefreshToken, refreshInstagramToken } from '@/utils/instagramApi';
import { requiresInstagramReconnect } from '@/utils/instagramApiErrors';
import axios from 'axios';

/**
 * API route for sending Instagram messages
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Instagram send message API route: Processing request");
    
    // Connect to the database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      console.error("Unauthorized access attempt to send Instagram message");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { conversationId, message, recipientId } = body;
    
    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }
    
    // Need either conversationId or recipientId
    if (!conversationId && !recipientId) {
      return NextResponse.json(
        { error: 'Missing required field: either conversationId or recipientId must be provided' },
        { status: 400 }
      );
    }
    
    console.log(`Sending Instagram message for user: ${userData.id}, to ${recipientId ? 'recipient' : 'conversation'}: ${recipientId || conversationId}`);
    
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
      // Send the Instagram message using the utility function
      let result;
      
      if (recipientId) {
        // If recipient ID is provided, use a direct message approach
        console.log(`Using direct recipient ID: ${recipientId}`);
        
        try {
          // First, get user's Instagram account ID
          const profileResponse = await axios.get('https://graph.instagram.com/me', {
            params: {
              fields: 'id,username',
              access_token: influencerData.instagramToken.accessToken,
            },
          });
          
          const profile = profileResponse.data;
          // We don't necessarily need the instagramAccountId here if using /me/messages
          // const instagramAccountId = profile.id;
          
          // Send message directly to the recipient using /me/messages endpoint and JSON payload
          const sendMessageUrl = `https://graph.instagram.com/v22.0/me/messages`; // Use graph.instagram.com based on provided docs - Updated to v22.0
          
          // Construct the JSON payload
          const jsonData = {
            recipient: { id: recipientId },
            message: { text: message }
          };
          
          // Make the POST request to send the message with JSON payload and token in URL
          const response = await axios.post(sendMessageUrl, jsonData, {
            headers: {
              'Content-Type': 'application/json', // Send as JSON
            },
            params: {
              access_token: influencerData.instagramToken.accessToken // Access token as URL parameter
            }
          });
          
          result = {
            success: true,
            messageId: response.data?.id,
            data: response.data
          };
        } catch (error: any) {
          console.error(
            'Error sending direct Instagram message:',
            // Log the full Axios error object, including the response data if available
            error.response?.data || error.message || error
          );
          throw error;
        }
      } else {
        // Use the utility function with conversation ID
        result = await sendInstagramMessage(
          influencerData.instagramToken.accessToken,
          conversationId,
          message
        );
      }
      
      // Check if the message was sent successfully
      if (!result.success) {
        console.error('Error sending Instagram message:', result.error);
        return NextResponse.json(
          { error: result.error || 'Failed to send message' },
          { status: 500 }
        );
      }
      
      // Return success response with the message ID
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: {
          id: result.messageId,
          from: {
            id: influencerData.instagramId || influencerData._id,
          },
          message: message,
          created_time: new Date().toISOString()
        }
      }, { status: 200 });
      
    } catch (error: any) {
      console.error('Error in sending Instagram message:', error);
      
      // Check if error is due to permissions
      if (error.message && error.message.includes('permission')) {
        return NextResponse.json({
          success: false,
          error: 'Missing Instagram permissions. Please reconnect your account with messaging permissions.'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send Instagram message: ' + (error.message || 'Unknown error')
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Instagram send message API:', error);
    return NextResponse.json(
      { error: 'Failed to send Instagram message' },
      { status: 500 }
    );
  }
} 