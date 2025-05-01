"use client";

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Send, MessageSquare, UserRound, Loader2, ArrowLeft, RefreshCw, Trash2, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Instagram message interfaces
interface InstagramMessage {
  id: string;
  from: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
  to: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
  message?: string;
  text?: string;
  content?: string;
  created_time: string;
}

interface InstagramConversation {
  id: string;
  participants: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  }[] | {
    data: {
      id: string;
      username?: string;
      profile_picture_url?: string;
    }[];
    length: number;
  };
  updated_time: string;
  messages?: InstagramMessage[];
  error?: string;
}

export const InstagramMessages = () => {
  const user = useCurrentUser();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [instagramAccountId, setInstagramAccountId] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUnsending, setIsUnsending] = useState(false);
  const [messageBeingUnsent, setMessageBeingUnsent] = useState<string | null>(null);

  // Fetch Instagram messages
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['instagramMessages'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/influencer/instagram/messages');
        console.log('Instagram API response:', response.data);
        
        // Try to extract the Instagram account ID from the response if available
        if (response.data?.instagramProfile?.id) {
          const fetchedAccountId = response.data.instagramProfile.id;
          console.log(`[Debug] Setting instagramAccountId State to: ${fetchedAccountId}`);
          setInstagramAccountId(fetchedAccountId);
        } else {
          console.warn("[Debug] instagramProfile.id not found in API response. instagramAccountId state not set.");
        }
        
        // Handle the case where API returns success but with an error message
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        // Ensure we have a conversations array, even if empty
        return response.data.conversations || [];
      } catch (err) {
        console.error('Error fetching Instagram messages:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Get currently selected conversation
  const currentConversation = data?.find((conv: InstagramConversation) => conv.id === selectedConversation);

  // Screen size detection for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768); // md breakpoint
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, h:mm a');
    } catch (e) {
      return timestamp;
    }
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      // Set sending state to true
      setIsSending(true);

      // Show loading indicator
      toast({
        title: "Sending message...",
        description: "Your reply is being sent to Instagram",
        duration: 2000,
      });

      console.log(`[Debug] Sending message to conversation: ${selectedConversation}`);
      console.log(`[Debug] Current Instagram Account ID State: ${instagramAccountId}`);
      console.log(`[Debug] Current Conversation Participants Data:`, currentConversation?.participants?.data);
      
      // Correctly identify the recipient ID - assuming it's the second participant
      let recipientId = null;
      if (currentConversation?.participants?.data && Array.isArray(currentConversation.participants.data) && currentConversation.participants.data.length > 1) {
        recipientId = currentConversation.participants.data[1]?.id;
        console.log(`[Debug] Identified recipient ID (data[1]):`, recipientId);
      } else {
        console.warn("[Debug] Could not identify recipient ID from participants data[1].");
      }
      
      // Save message content before clearing input
      const messageContent = replyMessage.trim();
      
      // Optimistically clear the input - we can restore it if sending fails
      setReplyMessage('');
      
      // Create request payload with additional recipient information if available
      const payload = {
        conversationId: selectedConversation,
        message: messageContent,
        recipientId: recipientId // Use the specifically identified recipient ID
      };
      console.log(`[Debug] Sending Payload:`, payload);

      // Call the send message API
      const response = await axios.post('/api/influencer/instagram/send-message', payload);

      console.log('Message sent response:', response.data);

      if (response.data.success) {
        // Optimistically update the UI with the new message
        if (currentConversation && Array.isArray(currentConversation.messages)) {
          // Create a new message object
          const newMessage = {
            id: response.data.messageId || `temp-${Date.now()}`,
            from: {
              id: instagramAccountId || 'current-user',
              username: currentConversation.participants?.data?.[0]?.username || 'You'
            },
            message: messageContent,
            created_time: new Date().toISOString(),
            // Add to field to match structure of outgoing messages
            to: {
              data: [{
                id: recipientId || 'recipient',
                username: currentConversation.participants?.data?.[1]?.username || 'Recipient'
              }]
            }
          };
          
          // Update the conversation with the new message
          currentConversation.messages = [newMessage, ...currentConversation.messages];
          
          // Force a refresh of the component
          setSelectedConversation(prev => {
            if (prev === selectedConversation) {
              return prev;
            }
            return selectedConversation;
          });
        }
        
        // Success notification
        toast({
          title: "Message sent",
          description: "Your reply was sent successfully",
          duration: 3000,
        });
        
        // Refresh the messages data after a short delay
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        // If sending failed but we got a response, show the error
        toast({
          title: "Error sending message",
          description: response.data.error || "Instagram couldn't process your message",
          variant: "destructive",
          duration: 5000,
        });
        
        // Restore the message to the input field
        setReplyMessage(messageContent);
      }
    } catch (error: any) {
      console.error('Error sending Instagram message:', error);
      
      // Extract most useful error message
      let errorMessage = "There was a problem sending your message";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message.includes('status code')
          ? "Instagram API rejected the message. This may be due to API limitations."
          : error.message;
      }
      
      // Show detailed error toast
      toast({
        title: "Message not sent",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      // Restore the message text so the user can try again
      setReplyMessage(replyMessage);
    } finally {
      // Always turn off sending state
      setIsSending(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setFullScreenMode(true);
  };

  // Back button handler
  const handleBack = () => {
    setSelectedConversation(null);
    setFullScreenMode(false);
  };

  // Get Instagram username from participants
  const getInstagramUsername = (conversation: InstagramConversation) => {
    // Handle nested data structure with participants.data
    if (conversation.participants && typeof conversation.participants === 'object' && 'data' in conversation.participants) {
      const participantsData = conversation.participants.data;
      if (Array.isArray(participantsData) && participantsData.length > 1) {
        // Based on the Instagram API response structure, the other participant is at index 1
        if (participantsData[1] && participantsData[1].username) {
          return participantsData[1].username;
        }
        
        // Fallback if index 1 doesn't have a username
        return participantsData.find(p => p && p.username)?.username || 'Instagram User';
      } else if (Array.isArray(participantsData) && participantsData.length > 0) {
        // If only one participant, return their username
        return participantsData[0]?.username || 'Instagram User';
      }
    }
    
    // Handle regular array of participants
    if (Array.isArray(conversation.participants)) {
      if (conversation.participants.length > 1) {
        // The other participant is at index 1
        return conversation.participants[1]?.username || 'Instagram User';
      } else if (conversation.participants.length > 0) {
        // If only one participant, return their username
        return conversation.participants[0]?.username || 'Instagram User';
      }
    }
    
    return 'Instagram User';
  };

  // Get profile picture URL if available
  const getProfilePictureUrl = (conversation: InstagramConversation) => {
    // Check if participants array exists
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      // Check if participants has a data property (from API response format)
      if (conversation.participants && typeof conversation.participants === 'object' && 'data' in conversation.participants) {
        const participantsData = (conversation.participants as any).data;
        if (Array.isArray(participantsData)) {
          // Find a participant that is not the current user
          const otherParticipant = participantsData.find((p: any) => 
            p && p.id !== user?._id);
          
          return otherParticipant?.profile_picture_url;
        }
      }
      return undefined;
    }
    
    // Regular participant array handling
    const otherParticipant = conversation.participants.find(p => 
      p && p.id !== user?._id);
    
    return otherParticipant?.profile_picture_url;
  };

  // Extract and format message preview
  const getMessagePreview = (conversation: InstagramConversation) => {
    // If conversation has an error message, display it
    if (conversation.error) {
      return conversation.error;
    }

    // Handle case when messages array is empty or missing
    if (!conversation.messages || !Array.isArray(conversation.messages) || conversation.messages.length === 0) {
      return 'No messages';
    }

    try {
      // Sort messages by time (newest first)
      const sortedMessages = [...conversation.messages].sort((a, b) => {
        if (!a.created_time || !b.created_time) return 0;
        return new Date(b.created_time).getTime() - new Date(a.created_time).getTime();
      });

      const latestMessage = sortedMessages[0];
      if (!latestMessage) {
        return 'No message content';
      }
      
      // Check if the message is in raw format or our interface format
      if (typeof latestMessage === 'object') {
        // Handle different message formats
        const messageContent = latestMessage.message || 
                               latestMessage.text ||
                               latestMessage.content;
                               
        if (!messageContent) {
          return 'No message content';
        }
        
        return messageContent.substring(0, 30) + 
          (messageContent.length > 30 ? '...' : '');
      }
      
      return 'Message available';
    } catch (e) {
      console.error('Error formatting message preview:', e);
      return 'No messages';
    }
  };

  // Helper function to get message content from different formats
  const getMessageContent = (message: InstagramMessage) => {
    return message.message || message.text || message.content || '';
  };

  // Helper function to determine if a message is from the current user
  const isMessageFromCurrentUser = (message: InstagramMessage): boolean => {
    // Based on the provided API response image:
    // We should try to identify the current user ID from the conversation's participants list.
    // The pattern suggests participants.data[0].id might be the current user.

    const participantsData = (currentConversation?.participants as any)?.data;

    // Check if participants data is available and is an array
    if (participantsData && Array.isArray(participantsData) && participantsData.length > 0) {
      // Assume the first participant in the list is the current user for this conversation context
      const currentUserId = participantsData[0]?.id;
      
      if (currentUserId) {
        // Add debug log
        console.log(`[Debug] Message from ${message.from?.id}, currentUserId: ${currentUserId}, isFromUser: ${message.from?.id === currentUserId}`);
        
        // Return true if the message's from.id matches the deduced current user ID
        return message.from?.id === currentUserId;
      }
    }

    // Fallback strategy if participants data is not structured as expected or missing:
    // Use the instagramAccountId state if it was successfully fetched (might be the page ID but better than nothing)
    if (instagramAccountId) {
      return message.from?.id === instagramAccountId;
    }
    
    // Final fallback: Check if the message has a 'to' field. 
    // In the example, the message from 'abusive_meme' has a 'to' field.
    // This is less reliable as incoming messages might also have 'to' fields in some APIs.
    return !!(message.to && typeof message.to === 'object' && 'data' in message.to && Array.isArray(message.to.data) && message.to.data.length > 0);
  };

  // Handle unsending a message
  const handleUnsendMessage = async (messageId: string) => {
    if (!selectedConversation || !messageId) return;
    
    try {
      // Set unsending state to true
      setIsUnsending(true);
      setMessageBeingUnsent(messageId);
      
      // Show loading indicator
      toast({
        title: "Unsending message...",
        description: "Your message is being removed from Instagram",
        duration: 2000,
      });
      
      // Create payload for the API request
      const payload = {
        conversationId: selectedConversation,
        messageId: messageId
      };
      
      console.log(`[Debug] Unsending message: ${messageId} from conversation: ${selectedConversation}`);
      
      // Call the unsend message API
      const response = await axios.post('/api/influencer/instagram/unsend-message', payload);
      
      if (response.data.success) {
        // Optimistically update the UI by removing the message
        if (currentConversation && Array.isArray(currentConversation.messages)) {
          currentConversation.messages = currentConversation.messages.filter(
            (msg: any) => msg.id !== messageId
          );
          
          // Force a refresh of the component
          setSelectedConversation(prev => {
            if (prev === selectedConversation) {
              return prev;
            }
            return selectedConversation;
          });
        }
        
        // Success notification
        toast({
          title: "Message unsent",
          description: "Your message was successfully removed",
          duration: 3000,
        });
        
        // Refresh the messages data after a short delay
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        // If unsending failed but we got a response, show the error
        toast({
          title: "Error unsending message",
          description: response.data.error || "Instagram couldn't unsend your message",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Error unsending Instagram message:', error);
      
      // Extract most useful error message
      let errorMessage = "There was a problem unsending your message";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message.includes('status code')
          ? "Instagram API rejected the unsend request. This may be due to API limitations."
          : error.message;
      }
      
      // Show detailed error toast
      toast({
        title: "Message not unsent",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      // Always turn off unsending state
      setIsUnsending(false);
      setMessageBeingUnsent(null);
    }
  };

  // If error occurs during fetch
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 max-w-md">
          <h3 className="font-semibold mb-1">Error loading Instagram messages</h3>
          <p className="text-sm">
            {(error as any)?.response?.data?.error || 
             (error as Error)?.message ||
             'Failed to load messages. Make sure your Instagram account has message permissions.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  // Show full screen conversation view
  if (fullScreenMode && currentConversation) {
    return (
      <div className="h-full flex flex-col bg-gray-50 fixed inset-0 z-[9999]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack} 
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="relative h-10 w-10 mr-3">
            {getProfilePictureUrl(currentConversation) ? (
              <img 
                src={getProfilePictureUrl(currentConversation)} 
                alt={getInstagramUsername(currentConversation)}
                className="rounded-full h-10 w-10 object-cover"
              />
            ) : (
              <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-10 w-10 rounded-full flex items-center justify-center text-white">
                <UserRound size={18} />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {getInstagramUsername(currentConversation)}
            </h3>
            <p className="text-xs text-gray-500">
              Instagram DM · {currentConversation.messages?.length || 0} messages
            </p>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentConversation.error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-amber-50 rounded-full p-3 mb-3">
                <MessageSquare className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-medium text-gray-700">Could not load messages</h3>
              <p className="text-sm text-amber-600 mt-1 max-w-xs">
                {currentConversation.error}
              </p>
              <p className="text-xs text-gray-500 mt-4 max-w-xs">
                Instagram requires specific messaging permissions. You may need to reconnect your Instagram account with the appropriate permissions.
              </p>
            </div>
          ) : currentConversation.messages && Array.isArray(currentConversation.messages) && currentConversation.messages.length > 0 ? (
            // Sort messages by time (oldest first for display)
            [...currentConversation.messages]
              .filter(message => message && message.created_time)
              .sort((a, b) => {
                try {
                  return new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
                } catch (e) {
                  return 0;
                }
              })
              .map(message => {
                if (!message) return null;
                
                // Get message content from any of the possible formats
                const messageContent = getMessageContent(message);
                if (!messageContent) return null;
                
                // Determine if the message is from the current user
                const isFromUser = isMessageFromCurrentUser(message);
                
                return (
                  <div 
                    key={message.id}
                    className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div 
                      className={`rounded-lg py-2 px-4 max-w-xs md:max-w-md relative ${
                        isFromUser 
                          ? 'bg-blue-500 text-white pr-8' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{messageContent}</p>
                      <span className={`text-xs mt-1 block ${isFromUser ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatTimestamp(message.created_time)}
                      </span>
                      
                      {/* Always visible menu for user's messages */}
                      {isFromUser && (
                        <div className="absolute top-2 right-2 z-50">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 p-0 hover:bg-blue-600 text-blue-100"
                              >
                                <MoreVertical size={12} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnsendMessage(message.id);
                                }}
                                className="text-red-600 cursor-pointer focus:text-red-600 hover:text-red-700"
                                disabled={isUnsending && messageBeingUnsent === message.id}
                              >
                                {isUnsending && messageBeingUnsent === message.id ? (
                                  <>
                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                    <span>Unsending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={14} className="mr-2" />
                                    <span>Unsend</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No messages in this conversation</p>
            </div>
          )}
        </div>

        {/* Reply input */}
        <div className="bg-white border-t border-gray-200 p-3 flex items-center space-x-2 sticky bottom-0">
          <Input
            placeholder="Type a reply..."
            value={replyMessage}
            onChange={e => setReplyMessage(e.target.value)}
            className="flex-1"
            disabled={isSending}
          />
          <Button 
            onClick={handleSendReply} 
            disabled={!replyMessage.trim() || isSending}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={16} className="mr-1" /> Send
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-50">
      {/* Conversations List Column */}
      <div className="md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col bg-white md:max-h-full">
        {/* Instagram Messages header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Instagram Messages</h2>
          <p className="text-sm text-gray-500">Manage your Instagram DMs</p>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && Array.isArray(data) && data.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation === conversation.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative h-10 w-10">
                      {getProfilePictureUrl(conversation) ? (
                        <img 
                          src={getProfilePictureUrl(conversation)} 
                          alt={getInstagramUsername(conversation)}
                          className="rounded-full h-10 w-10 object-cover"
                        />
                      ) : (
                        <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-10 w-10 rounded-full flex items-center justify-center text-white">
                          <UserRound size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {getInstagramUsername(conversation)}
                      </p>
                      <p className={`text-sm ${conversation.error ? 'text-amber-600' : 'text-gray-500'} truncate`}>
                        {getMessagePreview(conversation)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTimestamp(conversation.updated_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-blue-50 rounded-full p-3 mb-3">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-medium text-gray-700">No messages found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                You don't have any Instagram messages yet or your account doesn't have the required permissions.
              </p>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="mt-4"
                size="sm"
              >
                <RefreshCw size={14} className="mr-2" /> Refresh
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Conversation View Column - only visible on md+ screens when not in fullscreen mode */}
      <div className={`${
        !selectedConversation || (fullScreenMode && !isLargeScreen) ? 'hidden md:flex' : 'hidden'
      } md:flex md:w-2/3 lg:w-3/4 flex-col items-center justify-center bg-white h-full`}>
        {!selectedConversation ? (
          // Empty state when no conversation is selected
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Select a conversation</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Choose a conversation from the list to view messages
            </p>
          </div>
        ) : null}
      </div>

      {/* Fullscreen conversation view */}
      {selectedConversation && (fullScreenMode || !isLargeScreen) && (
        <div className="h-full flex flex-col bg-gray-50 fixed inset-0 z-[9999]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack} 
              className="mr-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="relative h-10 w-10 mr-3">
              {getProfilePictureUrl(currentConversation) ? (
                <img 
                  src={getProfilePictureUrl(currentConversation)} 
                  alt={getInstagramUsername(currentConversation)}
                  className="rounded-full h-10 w-10 object-cover"
                />
              ) : (
                <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-10 w-10 rounded-full flex items-center justify-center text-white">
                  <UserRound size={18} />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {getInstagramUsername(currentConversation)}
              </h3>
              <p className="text-xs text-gray-500">
                Instagram DM · {currentConversation.messages?.length || 0} messages
              </p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentConversation.error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="bg-amber-50 rounded-full p-3 mb-3">
                  <MessageSquare className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-medium text-gray-700">Could not load messages</h3>
                <p className="text-sm text-amber-600 mt-1 max-w-xs">
                  {currentConversation.error}
                </p>
                <p className="text-xs text-gray-500 mt-4 max-w-xs">
                  Instagram requires specific messaging permissions. You may need to reconnect your Instagram account with the appropriate permissions.
                </p>
              </div>
            ) : currentConversation.messages && Array.isArray(currentConversation.messages) && currentConversation.messages.length > 0 ? (
              // Sort messages by time (oldest first for display)
              [...currentConversation.messages]
                .filter(message => message && message.created_time)
                .sort((a, b) => {
                  try {
                    return new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
                  } catch (e) {
                    return 0;
                  }
                })
                .map(message => {
                  if (!message) return null;
                  
                  // Get message content from any of the possible formats
                  const messageContent = getMessageContent(message);
                  if (!messageContent) return null;
                  
                  // Determine if the message is from the current user
                  const isFromUser = isMessageFromCurrentUser(message);
                  
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div 
                        className={`rounded-lg py-2 px-4 max-w-xs md:max-w-md relative ${
                          isFromUser 
                            ? 'bg-blue-500 text-white pr-8' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{messageContent}</p>
                        <span className={`text-xs mt-1 block ${isFromUser ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTimestamp(message.created_time)}
                        </span>
                        
                        {/* Always visible menu for user's messages */}
                        {isFromUser && (
                          <div className="absolute top-2 right-2 z-50">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 p-0 hover:bg-blue-600 text-blue-100"
                                >
                                  <MoreVertical size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnsendMessage(message.id);
                                  }}
                                  className="text-red-600 cursor-pointer focus:text-red-600 hover:text-red-700"
                                  disabled={isUnsending && messageBeingUnsent === message.id}
                                >
                                  {isUnsending && messageBeingUnsent === message.id ? (
                                    <>
                                      <Loader2 size={14} className="mr-2 animate-spin" />
                                      <span>Unsending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} className="mr-2" />
                                      <span>Unsend</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">No messages in this conversation</p>
              </div>
            )}
          </div>

          {/* Reply input */}
          <div className="bg-white border-t border-gray-200 p-3 flex items-center space-x-2 sticky bottom-0">
            <Input
              placeholder="Type a reply..."
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              onClick={handleSendReply} 
              disabled={!replyMessage.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-1" /> Send
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 