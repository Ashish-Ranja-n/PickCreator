import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Paperclip, Send, Mic, MoreVertical, X, Trash2, Loader2, AlertTriangle, Image as ImageIcon, FileAudio, FileVideo, File } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { useSocket } from "@/lib/useSocket";
import axios from "axios";
import { uploadFile, isImageFile, isVideoFile, isAudioFile, getFileSize } from "@/utils/uploadMedia";
import { MediaDisplay } from '@/components/MediaDisplay';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  publicId: string;
}

interface Message1 {
  sender: string;
  text?: string;
  media?: MediaItem[];
  timestamp: string;
}

interface Message {
  _id: string;
  sender: string;
  text?: string;
  media?: MediaItem[];
  createdAt: Date;
}

interface OtherUser {
  _id: string;
  name: string;
  avatar?: string;
  profilePictureUrl?: string;
  role: string;
}

// Add pagination interface
interface PaginationInfo {
  nextCursor?: string;
  hasMore: boolean;
}

// Helper function to format dates
const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }
};

// Helper function to safely get profile picture
const getProfilePicture = (user: any) => {
  if (!user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;

  // For admin users with Instagram profile
  if (user.instagram?.profilePicture &&
      user.instagram.profilePicture !== "undefined" &&
      user.instagram.profilePicture !== "null") {
    return user.instagram.profilePicture;
  }

  // For influencers, check profilePictureUrl first
  if (user.profilePictureUrl &&
      user.profilePictureUrl !== "undefined" &&
      user.profilePictureUrl !== "null") {
    return user.profilePictureUrl;
  }

  // For influencers, check profilePicture next
  if (user.profilePicture &&
      user.profilePicture !== "undefined" &&
      user.profilePicture !== "null") {
    return user.profilePicture;
  }

  // Check for admin/brand avatar
  if (user.avatar &&
      user.avatar !== "undefined" &&
      user.avatar !== "null" &&
      user.avatar !== "/default-avatar.png") {
    return user.avatar;
  }

  // Return default avatar with user's name for consistent fallback
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;
};

export const ChatWindow = () => {
  const param = useParams();
  const conversationId = param?.conversationId as string;
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const router = useRouter();
  const pathname = usePathname();

  // Socket-related hooks and state
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendSocketMessage,
    updateTypingStatus,
    isUserOnline,
    onlineUsers
  } = useSocket();

  // All state declarations in one place
  const [newMessage, setNewMessage] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]); // Single source of truth for all messages
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [virtualKeyboardHeight, setVirtualKeyboardHeight] = useState(0);
  const [visualHeight, setVisualHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("24px");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Add pagination states
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({ hasMore: false });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // All refs in one place
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Browser detection - add iOS detection
  const basePath = pathname?.split("/")[1];
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS devices
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
  }, []);

  // Enhanced keyboard detection with iOS-specific handling
  useEffect(() => {
    // Initial height setup
    const setupHeights = () => {
      const height = Math.trunc(window.visualViewport?.height || window.innerHeight);
      const keyboardHeight = Math.trunc(window.innerHeight - height);
      setVisualHeight(height);
      setVirtualKeyboardHeight(keyboardHeight);
      setIsKeyboardOpen(keyboardHeight > 150);
    };

    // Main resize handler
    const resizeHandler = () => {
      if (!window.visualViewport) return;

      const height = Math.trunc(window.visualViewport.height);
      const keyboardHeight = Math.trunc(window.innerHeight - height);

      // iOS-specific adjustments
      if (isIOS) {
        // iOS needs special handling for softer transitions
        setTimeout(() => {
          setVisualHeight(height);
          setVirtualKeyboardHeight(keyboardHeight);
          setIsKeyboardOpen(keyboardHeight > 150);
        }, 50);
      } else {
        setVisualHeight(height);
        setVirtualKeyboardHeight(keyboardHeight);
        setIsKeyboardOpen(keyboardHeight > 150);
      }

      // Force scroll to bottom when keyboard appears
      if (keyboardHeight > 150) {
        setTimeout(() => scrollToBottom(true), 100);
      }
    };

    setupHeights();
    window.visualViewport?.addEventListener("resize", resizeHandler);
    window.addEventListener('orientationchange', setupHeights);

    // Add extra event for iOS to improve keyboard transition
    if (isIOS) {
      window.addEventListener('focusin', () => {
        if (document.activeElement?.tagName === 'TEXTAREA') {
          setTimeout(() => scrollToBottom(true), 500);
        }
      });
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", resizeHandler);
      window.removeEventListener('orientationchange', setupHeights);
      if (isIOS) {
        window.removeEventListener('focusin', () => {});
      }
    };
  }, [isIOS]);

  // PAGINATION IMPLEMENTATION
  /*
   * How the pagination system works:
   *
   * 1. Initial Load:
   *    - Fetch first batch of messages (newest 20) with limit parameter
   *    - Server returns messages and a nextCursor for pagination
   *    - Scroll to bottom automatically on initial load
   *
   * 2. Loading More Messages:
   *    - When user scrolls to top or clicks "Load more", fetch older messages
   *    - Use the nextCursor to tell server which messages to fetch next
   *    - Prepend older messages to existing messages
   *    - Maintain scroll position so user doesn't lose context
   * If server returns nextCursor as null, we've reached the end of messages
   */

  useEffect(() => {
    if(!conversationId || !currentUserId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      // Reset states when switching conversations
      setAllMessages([]);
      setPaginationInfo({ hasMore: false });
      setInitialScrollDone(false);

      try {
        // Request first batch of messages with limit
        const response = await axios.get(`/api/messages/${conversationId}`, {
          headers: { userId: currentUserId },
          params: { limit: 20 } // Request first 20 messages
        });

        setAllMessages(response.data.messages);
        setOtherUser(response.data.otherUser);

        // Store pagination info for loading more later
        setPaginationInfo({
          nextCursor: response.data.nextCursor,
          hasMore: response.data.hasMore
        });

      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (isConnected && conversationId) {
      // Only join the conversation here - other handlers are in dedicated effects
      joinConversation(conversationId);
      console.log(`Joining conversation: ${conversationId}`);

      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [isConnected, conversationId, joinConversation, leaveConversation]);

  useEffect(() => {
    // Debug log when typing status changes
    console.log(`[Debug] Current typing user: ${typingUser}, isOtherUser: ${typingUser === otherUser?._id}`);
  }, [typingUser, otherUser]);

  // Debug log for online users
  useEffect(() => {
    if (otherUser && otherUser._id) {
      const isOnline = isUserOnline(otherUser._id);
      console.log(`[Debug] Other user ${otherUser.name} (${otherUser._id}) online status: ${isOnline}`);
    }
  }, [otherUser, isUserOnline, onlineUsers]);

  // Add this debugging useEffect right after the online users debug useEffect
  useEffect(() => {
    // Log all socket-related state on component render
    console.log(`[DEBUG] Component render state:`, {
      socketConnected: isConnected,
      hasOtherUser: !!otherUser,
      otherUserId: otherUser?._id,
      onlineUsersCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers.entries()),
      typingUserId: typingUser,
      isTyping: typingUser === otherUser?._id
    });
  }, [onlineUsers, isConnected, otherUser, typingUser]);

  // Add a debug effect to log online status changes
  useEffect(() => {
    if (otherUser?._id) {
      const isOnline = isUserOnline(otherUser._id);
      console.log(`[Debug] Other user ${otherUser.name} (${otherUser._id}) online status: ${isOnline}`);
      console.log(`[Debug] Current online users:`, Array.from(onlineUsers.entries()));
    }
  }, [otherUser, isUserOnline, onlineUsers, forceUpdate]);

  // Helper function to deduplicate messages by ID
  const deduplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set<string>();
    return messages.filter(message => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  };

  // Helper function to merge and sort messages
  const mergeMessages = (existingMessages: Message[], newMessages: Message[]): Message[] => {
    const combined = [...existingMessages, ...newMessages];
    const deduplicated = deduplicateMessages(combined);
    return deduplicated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (!paginationInfo.hasMore || isLoadingMore || !conversationId || !currentUserId) return;

    setIsLoadingMore(true);

    try {
      // Capture current scroll height before adding new messages
      const container = messageContainerRef.current;
      const scrollHeight = container?.scrollHeight || 0;

      // Request next batch of messages using cursor-based pagination
      const response = await axios.get(`/api/messages/${conversationId}`, {
        headers: { userId: currentUserId },
        params: {
          cursor: paginationInfo.nextCursor,
          limit: 20
        }
      });

      // Merge older messages with existing messages and deduplicate
      setAllMessages(prevMessages => {
        const mergedMessages = mergeMessages(response.data.messages, prevMessages);
        return mergedMessages;
      });

      // Update pagination info for next fetch
      setPaginationInfo({
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore
      });

      // After rendering, restore scroll position to prevent jumping
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const heightDiff = newScrollHeight - scrollHeight;
          container.scrollTop = heightDiff; // User will see same messages as before the load
        }
        setIsLoadingMore(false);
      }, 0);

    } catch (error) {
      console.error("Error loading more messages:", error);
      setIsLoadingMore(false);
    }
  };

  // Scroll handler to detect when to load more messages
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Store current scroll position for reference
      scrollPositionRef.current = container.scrollTop;

      // Load more when scrolled near the top (e.g., 100px from top)
      if (container.scrollTop < 100 && paginationInfo.hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [paginationInfo.hasMore, isLoadingMore]);

  // Improved scroll to bottom function
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;

    // Only force scroll on initial load or when specifically requested (new message sent/received)
    if (force || !initialScrollDone) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      setInitialScrollDone(true);
    } else if (
      // Auto-scroll only if user is already near the bottom (within 100px)
      // This prevents interrupting the user if they're scrolling through history
      messageContainerRef.current &&
      messageContainerRef.current.scrollHeight - messageContainerRef.current.scrollTop - messageContainerRef.current.clientHeight < 100
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom only once after initial messages load
  useEffect(() => {
    if (!isLoading && allMessages.length > 0 && !initialScrollDone) {
      // Use setTimeout to ensure all messages are rendered before scrolling
      setTimeout(() => scrollToBottom(true), 0);
    }
  }, [isLoading, initialScrollDone]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1GB limit)
    if (file.size > 1024 * 1024 * 1024) {
      alert("File size exceeds the 1GB limit");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile || isUploading || !currentUserId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to Cloudinary using the utility function
      const result = await uploadFile(
        selectedFile,
        'chat',
        conversationId,
        (progress) => setUploadProgress(progress)
      );

      if (!result || !result.url || !result.publicId) {
        throw new Error('Upload failed: Invalid response from server');
      }

      // Create media item
      const mediaItem: MediaItem = {
        url: result.url,
        publicId: result.publicId,
        type: getMediaType(result.resourceType || 'other')
      };

      // Create message data
      const messageData = {
        conversationId,
        sender: currentUserId,
        text: newMessage.trim() || undefined,
        media: [mediaItem],
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      };

      // Send via socket
      sendSocketMessage(messageData);

      // Send to server
      await axios.post("/api/messages", messageData);

      // Reset states
      setSelectedFile(null);
      setNewMessage("");
      setTextareaHeight("24px");
      setUploadProgress(0);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Force scroll to bottom after sending a media message
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("Error uploading and sending file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getMediaType = (resourceType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
    switch (resourceType) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      default:
        return 'other';
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending || !currentUserId) return;

    // If there's a file, upload and send it
    if (selectedFile) {
      handleUploadAndSend();
      return;
    }

    // Set sending state to prevent duplicate sends
    setIsSending(true);

    // Create message data
    const messageData = {
      conversationId,
      sender: currentUserId,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    };

    // Send via socket
    sendSocketMessage(messageData);

    try {
      // Send to server
      await axios.post("/api/messages", messageData);
      setNewMessage("");
      setTextareaHeight("24px");

      // Force scroll to bottom after sending a message
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      // Reset sending state
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Auto-resize textarea
    e.target.style.height = "24px";
    const scrollHeight = e.target.scrollHeight;
    const newHeight = scrollHeight > 80 ? "80px" : `${scrollHeight}px`;
    setTextareaHeight(newHeight);
    e.target.style.height = newHeight;

    // Handle typing indicator
    if (conversationId && currentUserId && socket && isConnected) {
      // Clear previous timeout if any
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing status based on if there's text
      const isTyping = value.length > 0;

      // Log the typing event being sent
      console.log(`[Socket] Sending typing status: ${isTyping} for user ${currentUserId} in conversation ${conversationId}`);

      // Emit typing status to server
      updateTypingStatus(conversationId, currentUserId, isTyping);

      // If typing, set a timeout to clear typing status after 2 seconds of inactivity
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          console.log('[Socket] Clearing typing status after timeout');
          updateTypingStatus(conversationId, currentUserId, false);
        }, 2000);
      }
    }
  };

  // Group messages by date - simplified with unified message system
  const groupMessagesByDate = () => {
    // Use the unified allMessages array (already sorted by date)
    const processedMessages = allMessages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: new Date(msg.createdAt)
    }));

    // Define a type for the grouped messages
    type GroupedMessage = {
      _id: string;
      sender: string;
      text?: string;
      media?: MediaItem[];
      date: Date;
      timestamp: string;
      createdAt: Date;
    };

    const groups: Record<string, GroupedMessage[]> = {};

    processedMessages.forEach(message => {
      const dateKey = formatMessageDate(message.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  // Function to handle delete conversation
  const handleDeleteConversation = async () => {
    if (!conversationId || isDeleting) return;

    setIsDeleting(true);

    try {
      // Send delete request to the API
      await axios.delete(`/api/delete-conversation/${conversationId}`);

      // Close the confirmation dialog
      setShowDeleteConfirm(false);

      // Navigate back to the chat list
      router.push(`/${basePath}/chat/`);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setIsDeleting(false);
    }
  };


  const messageGroups = groupMessagesByDate();

  // Handle audio message send
  const handleAudioSend = (audioUrl: string, publicId: string) => {
    if (!currentUserId || !audioUrl || !publicId) return;

    // Create media item
    const mediaItem: MediaItem = {
      url: audioUrl,
      publicId: publicId,
      type: 'audio'
    };

    // Create message data
    const messageData = {
      conversationId,
      sender: currentUserId,
      media: [mediaItem],
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    };

    // Send via socket
    sendSocketMessage(messageData);

    // Send to server
    axios.post("/api/messages", messageData)
      .catch(error => {
        console.error("Error sending audio message:", error);
      });

    // Hide audio recorder
    setShowAudioRecorder(false);

    // Force scroll to bottom after sending an audio message
    setTimeout(() => scrollToBottom(true), 100);
  };

  // Handle audio recorder cancel
  const handleAudioRecorderCancel = () => {
    setShowAudioRecorder(false);
  };

  // Update the socket effect for handling new messages to properly clear typing status
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    console.log(`[Socket] Setting up message handlers for conversation: ${conversationId}`);

    // Handle new messages from socket
    const handleNewMessage = (message: Message1) => {
      console.log(`[Socket] Received new message in conversation ${conversationId}:`, message);

      // Convert socket message to database message format
      const dbMessage: Message = {
        _id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Temporary unique ID
        sender: message.sender,
        text: message.text,
        media: message.media,
        createdAt: new Date() // Current timestamp
      };

      // Add the new message to the unified messages state with deduplication
      setAllMessages((prevMessages) => {
        const updatedMessages = mergeMessages(prevMessages, [dbMessage]);
        return updatedMessages;
      });

      // Clear typing indicator when a message is received from the other user
      if (message.sender !== currentUserId && message.sender === otherUser?._id) {
        console.log(`[Socket] Clearing typing indicator for ${otherUser?.name} after receiving message`);
        setTypingUser(null);
      }

      // Force scroll to bottom for new messages
      setTimeout(() => scrollToBottom(true), 100);
    };

    // Register handlers
    socket.on('newMessage', handleNewMessage);

    // Cleanup function
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, isConnected, conversationId, currentUserId, otherUser]);

  // Add the socket effect for online status and typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('[Socket] Setting up online status and typing handlers');

    // Global handler for user status changes
    const handleUserStatus = ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      console.log(`[Socket] User ${userId} status changed to ${status}`);

      // Force a re-render if this is our chat partner
      if (otherUser && userId === otherUser._id) {
        console.log(`[Socket] Chat partner ${otherUser.name} status changed to ${status}`);
        setForceUpdate(prev => prev + 1);
      }
    };

    // Global handler for typing status
    const handleTyping = ({ userId, conversationId: convId, isTyping }:
      { userId: string, conversationId: string, isTyping: boolean }) => {

      console.log(`[Socket] User ${userId} typing status in ${convId}: ${isTyping}`);

      // Only update typing status if it's for the current conversation and not from current user
      if (convId === conversationId && userId !== currentUserId) {
        console.log(`[UI] Setting typing status for ${userId} to ${isTyping ? 'typing' : 'not typing'}`);
        setTypingUser(isTyping ? userId : null);
      }
    };

    // Handler for online users list
    const handleOnlineUsers = (users: string[]) => {
      console.log('[Socket] Received online users list:', users);
      setForceUpdate(prev => prev + 1);
    };

    // Register global handlers
    socket.on('userStatusChange', handleUserStatus);
    socket.on('userTyping', handleTyping);
    socket.on('getOnlineUsers', handleOnlineUsers);

    // Emit that we're online and request online users list when socket connects
    socket.emit('userOnline', currentUserId);
    socket.emit('getOnlineUsers');

    // Cleanup function
    return () => {
      socket.off('userStatusChange', handleUserStatus);
      socket.off('userTyping', handleTyping);
      socket.off('getOnlineUsers', handleOnlineUsers);
    };
  }, [socket, isConnected, conversationId, currentUserId, otherUser]);

  if (!currentUser) return null;

  return (
<div className="fixed inset-0 flex flex-col overflow-hidden z-20 bg-white dark:bg-black">
      {/* Fixed Header */}
      <header className="z-30 h-[60px] bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 shadow-sm"
      style={{
        position: 'fixed',
        top: `${virtualKeyboardHeight - 5}px`,
        left: 0,
        right: 0,
      }}
      >
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors h-9 w-9"
              onClick={() => router.push(`/${basePath}/chat/`)}
            >
              <ArrowLeft size={18} className="text-gray-600 dark:text-zinc-400" />
            </Button>

            <div className="relative">
              <Avatar className="h-10 w-10">
                {otherUser && (
                  <div className="h-full w-full absolute inset-0">
                    <Image
                      src={getProfilePicture(otherUser)}
                      alt={otherUser?.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 font-medium">
                  {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </Avatar>
              {otherUser && otherUser._id && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                    isUserOnline(otherUser._id) ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white text-base truncate">{otherUser?.name}</h2>
              <div className="flex items-center gap-2">
                {otherUser?._id && (
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {isUserOnline(otherUser._id) ? 'online' : 'offline'}
                  </span>
                )}
                {typingUser === otherUser?._id && (
                  <span className="text-xs text-green-600 dark:text-green-400">typing...</span>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOptions(!showOptions)}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200 h-10 w-10"
            >
              <MoreVertical size={20} className="text-gray-700 dark:text-zinc-300" />
            </Button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-800 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                <div className="p-1">
                  {/* Delete Chat button - only available to admins */}
                  {currentUser?.role === 'Admin' && (
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900 rounded-md transition-colors"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowOptions(false);
                      }}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Chat
                    </button>
                  )}

                  {/* Show message if no options available */}
                  {currentUser?.role !== 'Admin' && (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 text-center">
                      No options available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Messages */}
      <main
  className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-hide bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-black"
  ref={messageContainerRef}
  style={{
    overscrollBehavior: 'contain', // Prevent overscroll on iOS
    paddingTop: `${virtualKeyboardHeight + 60}px`, // Adjust padding for keyboard
    paddingBottom: '90px',
  }}
>
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="relative">
                <Loader2 size={40} className="text-slate-600 animate-spin mb-4" />
                <div className="absolute inset-0 blur-sm animate-pulse"></div>
              </div>
              <p className="text-slate-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Loading indicator for pagination */}
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <div className="flex items-center space-x-2">
                  <Loader2 size={18} className="text-slate-500 animate-spin" />
                  <span className="text-slate-500 text-sm">Loading older messages...</span>
                </div>
              </div>
            )}

            {/* Load more button */}
            {paginationInfo.hasMore && !isLoadingMore && (
              <div className="flex justify-center py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreMessages}
                  className="text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm"
                >
                  <Loader2 size={14} className={`mr-1 ${isLoadingMore ? 'animate-spin' : 'hidden'}`} />
                  Load older messages
                </Button>
              </div>
            )}

            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} className="space-y-3">
                <div className="flex justify-center">
                  <div className="bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-zinc-800">
                    {date}
                  </div>
                </div>

                {msgs.map((message) => (
                  <div
                    key={message._id}
                    className={`flex mb-3 ${
                      message.sender === currentUserId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] ${
                        message.sender === currentUserId
                          ? message.media && message.media.length > 0 && !message.text
                            ? "bg-transparent p-0"
                            : "bg-blue-500 text-white rounded-2xl rounded-br-md px-3 py-2"
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-2xl rounded-bl-md px-3 py-2"
                      }`}
                    >
                      {message.text && (
                        <p className="break-words leading-relaxed text-sm">
                          {message.text}
                        </p>
                      )}

                      {message.media && message.media.length > 0 && (
                        <div className={`mt-2 space-y-2 ${message.sender === currentUserId ? "media-sent" : "media-received"}`}>
                          {message.media.map((item: MediaItem, index: number) => (
                            <MediaDisplay
                              key={index}
                              media={item}
                              allMedia={message.media}
                              initialIndex={index}
                            />
                          ))}
                        </div>
                      )}

                      {/* Simple timestamp */}
                      <div className={`mt-1 ${
                        message.sender === currentUserId ? "text-right" : "text-left"
                      }`}>
                        <span className={`text-sm ${
                          message.sender === currentUserId
                            ? "text-white/80"
                            : "text-gray-500 dark:text-zinc-400"
                        }`}>
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* File preview - shows above input when active */}
      {selectedFile && (
        <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 z-40 shadow-lg p-3">
          <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-md mr-3 border border-slate-200 dark:border-zinc-800">
                  {isImageFile(selectedFile) ? (
                    <ImageIcon size={20} className="text-slate-700" />
                  ) : isVideoFile(selectedFile) ? (
                    <FileVideo size={20} className="text-slate-700" />
                  ) : isAudioFile(selectedFile) ? (
                    <FileAudio size={20} className="text-slate-700" />
                  ) : (
                    <File size={20} className="text-slate-700" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate max-w-[200px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{getFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full"
                onClick={() => setSelectedFile(null)}
              >
                <X size={16} className="text-slate-500" />
              </Button>
            </div>
            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            <Button
              onClick={handleUploadAndSend}
              disabled={isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-700 dark:hover:bg-indigo-800"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Clean Input Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
        {/* Audio recorder when active */}
        {showAudioRecorder ? (
          <div className="p-3" style={{
            paddingBottom: isIOS && !isKeyboardOpen ? `max(env(safe-area-inset-bottom), 12px)` : '12px',
          }}>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
              <AudioRecorder
                onSend={handleAudioSend}
                onCancel={handleAudioRecorderCancel}
              />
            </div>
          </div>
        ) : (
          /* Separated Input Components Design */
          <div className="p-4" style={{
            paddingBottom: isIOS && !isKeyboardOpen ? `max(env(safe-area-inset-bottom), 16px)` : '16px',
          }}>
            <div className="flex items-end gap-3">
              {/* Standalone Attach File Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full shadow-md hover:shadow-lg border border-gray-200 dark:border-zinc-700 transition-all duration-200 hover:scale-105"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip size={22} className="stroke-2" />
                </Button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="*/*"
                onChange={handleFileSelect}
              />

              {/* Standalone Message Input */}
              <div className="flex-1">
                <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-md border border-gray-200 dark:border-zinc-700 px-4 py-2 hover:shadow-lg transition-all duration-200">
                  <textarea
                    value={newMessage}
                    onKeyDown={(e) => {
                      if(e.key === "Enter" && !e.shiftKey) {
                        handleKeyPress(e);
                      }
                    }}
                    onChange={handleTextareaChange}
                    placeholder="Type a message..."
                    className="w-full resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-white scrollbar-hide placeholder:text-gray-500 dark:placeholder:text-zinc-400 text-base leading-snug"
                    style={{
                      height: textareaHeight,
                      maxHeight: "80px",
                      minHeight: "24px"
                    }}
                  />
                </div>
              </div>

              {/* Standalone Mic Button (when no text or file) */}
              {!newMessage.trim() && !selectedFile && (
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAudioRecorder(true)}
                    className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                    title="Record audio message"
                  >
                    <Mic size={22} className="stroke-2" />
                  </Button>
                </div>
              )}

              {/* Standalone Send Button (when has text or file) */}
              {(newMessage.trim() || selectedFile) && (
                <div className="flex-shrink-0">
                  <Button
                    onClick={handleSend}
                    disabled={((!newMessage.trim() && !selectedFile) || isSending || isUploading)}
                    className={`h-12 w-12 p-0 flex items-center justify-center rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                      (newMessage.trim() || selectedFile) && !isSending && !isUploading
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
                        : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    {isSending || isUploading ? (
                      <Loader2 size={22} className="animate-spin stroke-2" />
                    ) : (
                      <Send size={22} className="stroke-2" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </footer>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-100 dark:bg-rose-900 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Delete Conversation</h3>
            </div>

            <p className="text-slate-600 dark:text-zinc-300 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-slate-700 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
