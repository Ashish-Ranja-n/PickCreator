import axios from 'axios';
import { AutomationRule } from '@/models/automationRule';
import { Influencer } from '@/models/influencer';

interface InstagramMessageEvent {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message: {
    mid: string;
    text: string;
  };
}

/**
 * Process Instagram message events from webhook
 */
export async function processInstagramMessages(messagingEvents: InstagramMessageEvent[]) {
  try {
    console.log(`Processing ${messagingEvents.length} Instagram message events`);
    
    for (const event of messagingEvents) {
      if (event.message && event.message.text) {
        await handleIncomingMessage(event);
      }
    }
  } catch (error) {
    console.error('Error processing Instagram messages:', error);
  }
}

/**
 * Handle an incoming Instagram message and trigger automation if applicable
 */
async function handleIncomingMessage(event: InstagramMessageEvent) {
  try {
    const recipientId = event.recipient.id; // The Instagram account that received the message
    const senderId = event.sender.id; // The Instagram user who sent the message
    const messageText = event.message.text;
    
    console.log(`Handling incoming message to ${recipientId} from ${senderId}: ${messageText.substring(0, 50)}`);
    
    // First try to find the influencer with the webhook recipientId
    let influencer = await Influencer.findOne({ instagramWebhookId: recipientId });
    
    // If not found, try with the regular instagramId as fallback
    if (!influencer) {
      influencer = await Influencer.findOne({ instagramId: recipientId });
      
      if (!influencer) {
        console.log(`No influencer found with Instagram ID or webhook ID: ${recipientId}`);
        return;
      } else {
        // If found by instagramId but instagramWebhookId is not set,
        // update the document to set the webhook ID for future use
        console.log(`Updating influencer with webhook ID: ${recipientId}`);
        await Influencer.updateOne(
          { _id: influencer._id },
          { $set: { instagramWebhookId: recipientId } }
        );
        // Make sure we have the updated field in memory
        influencer.instagramWebhookId = recipientId;
      }
    }
    
    // Find all active automation rules for this influencer (using _id)
    const automationRules = await AutomationRule.find({
      user: influencer._id, // Use influencer's own _id
      active: true
    });
    
    if (!automationRules || automationRules.length === 0) {
      console.log(`No active automation rules found for user: ${influencer._id}`);
      return;
    }
    
    // Find a matching rule based on the message content
    const matchingRule = findMatchingRule(automationRules, messageText);
    
    if (!matchingRule) {
      console.log('No matching automation rule found for this message');
      return;
    }
    
    console.log(`Found matching rule "${matchingRule.name}" for message`);
    
    // Define Max Delay and calculate effective delay
    const MAX_DELAY_SECONDS = 30;
    let effectiveDelaySeconds = matchingRule.delaySeconds;

    if (effectiveDelaySeconds > 0) {
      if (effectiveDelaySeconds > MAX_DELAY_SECONDS) {
        console.warn(`Warning: Rule delay (${effectiveDelaySeconds}s) exceeds maximum (${MAX_DELAY_SECONDS}s). Clamping delay.`);
        effectiveDelaySeconds = MAX_DELAY_SECONDS;
      }

      console.log(`Waiting ${effectiveDelaySeconds}s before sending response...`);
      // Wait for the specified (potentially clamped) delay
      await new Promise(resolve => setTimeout(resolve, effectiveDelaySeconds * 1000));
      console.log(`Delay finished. Sending response now.`);
      // Now call sendInstagramResponse directly
      await sendInstagramResponse(influencer, senderId, matchingRule.responseTemplate);
    } else {
      // Send immediately if no delay
       console.log(`No delay configured. Sending response immediately.`);
      await sendInstagramResponse(influencer, senderId, matchingRule.responseTemplate);
    }
  } catch (error) {
    console.error('Error handling incoming Instagram message:', error);
  }
}

/**
 * Find a matching automation rule for the message text
 */
function findMatchingRule(rules: any[], messageText: string) {
  // First, try to find a keyword match
  for (const rule of rules) {
    if (rule.triggerType === 'keyword' && rule.keywords.length > 0) {
      // Check if any keyword is in the message
      const hasMatch = rule.keywords.some((keyword: string) => 
        messageText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasMatch) {
        return rule;
      }
    }
  }
  
  // If no keyword match is found, look for an 'all_messages' rule
  return rules.find(rule => rule.triggerType === 'all_messages');
}

/**
 * Send an automated response to an Instagram user
 */
async function sendInstagramResponse(influencer: any, recipientId: string, responseTemplate: string) {
  console.log(`[sendInstagramResponse] Entered function for recipient: ${recipientId}`); // Log entry
  try {
    console.log(`[sendInstagramResponse] Attempting to send automated response to ${recipientId}`);
    
    // Check if Instagram token exists
    if (!influencer.instagramToken || !influencer.instagramToken.accessToken) {
      console.error('No Instagram token found for influencer');
      return;
    }
    
    // Get the access token
    const accessToken = influencer.instagramToken.accessToken;
    console.log(`[sendInstagramResponse] Using token: ${accessToken.substring(0, 5)}... and recipientId: ${recipientId}`); // Log data before call
    
    // Get Instagram account ID
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username',
        access_token: accessToken,
      },
    });
    
    const instagramAccountId = profileResponse.data.id; // We can keep this if needed, but /me/messages is preferred
    
    // Send the message via Instagram Graph API using /me/messages
    const url = `https://graph.instagram.com/v22.0/me/messages`; // Use graph.instagram.com /me/messages - Updated to v22.0
    
    // Construct the JSON payload
    const jsonData = {
      recipient: { id: recipientId },
      message: { text: responseTemplate }
    };
    
    // Send the request with JSON payload and token in URL
    console.log(`[sendInstagramResponse] Making axios.post call to /me/messages...`); // Log before API call
    const response = await axios.post(url, jsonData, {
      headers: {
        'Content-Type': 'application/json', // Send as JSON
      },
      params: {
        access_token: accessToken // Access token as URL parameter
      }
    });
    console.log(`[sendInstagramResponse] axios.post call finished.`); // Log after API call completes
    
    console.log('[sendInstagramResponse] Automated response sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    // Log the detailed error including response data if available
    console.error(
      'Error sending automated Instagram response:', 
      error.response?.data || error.message || error
    );
    return null;
  }
} 