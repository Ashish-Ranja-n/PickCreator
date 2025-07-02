// lib/useSocket.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useCurrentUser } from '@/hook/useCurrentUser';

// Socket.IO server URL - configured to connect to the separate socket server
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

interface MessageContent {
  conversationId: string;
  sender: string;
  text?: string;
  timestamp: string;
  media?: Array<{
    url: string;
    publicId: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
  }>;
}

interface RoomMessageContent {
  chatRoomId: string;
  sender: string;
  content: string;
  timestamp?: string;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;

  useEffect(() => {
    // Initialize socket connection to the separate Socket.IO server
    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true,
      forceNew: true,
      autoConnect: true,
      path: '/socket.io'
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Notify server that user is online
      if (currentUserId) {
        socketInstance.emit('userOnline', currentUserId);
      }
      // Request the current list of online users
      socketInstance.emit('getOnlineUsers');
    });

    socketInstance.on('connect_error', (err) => {
      // Handle connection error if needed
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      setOnlineUsers(new Map());
    });

    // Listen for user status changes
    socketInstance.on('userStatusChange', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        if (status === 'online') {
          newMap.set(userId, status);
        } else {
          newMap.delete(userId);
        }
        return newMap;
      });
    });

    // Listen for initial online users list
    socketInstance.on('onlineUsers', (users: string[]) => {
      const newMap = new Map();
      users.forEach(userId => newMap.set(userId, 'online'));
      setOnlineUsers(newMap);
    });

    // Listen for typing status changes
    socketInstance.on('userTyping', ({ userId, conversationId, isTyping }: { userId: string, conversationId: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(conversationId)) {
          newMap.set(conversationId, new Set());
        }
        const typingSet = newMap.get(conversationId)!;
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return newMap;
      });
    });

    // Store socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      if (currentUserId) {
        socketInstance.emit('userOffline', currentUserId);
      }
      socketInstance.disconnect();
    };
  }, [currentUserId]);

  // Rest of the hook implementation stays the same...
  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', conversationId);
    }
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveRoom', conversationId);
    }
  }, [socket, isConnected]);

  // Join a chat room
  const joinChatRoom = useCallback((chatRoomId: string) => {
    if (socket && isConnected && currentUser) {
      // Create a simplified user object to avoid circular references
      const userInfo = {
        _id: currentUser._id,
        name: currentUser.name || 'Unknown User',
        role: currentUser.role || 'User',
        email: currentUser.email,
        // Enhanced profile picture handling to match API responses
        profilePicture: 
          // First check admin Instagram profile picture
          (currentUser.instagram && typeof currentUser.instagram === 'object' ? 
            (currentUser.instagram as any).profilePicture : undefined) || 
          // Then influencer profile picture URL
          currentUser.profilePictureUrl || 
          // Then regular profile picture
          currentUser.profilePicture || 
          // Then avatar
          currentUser.avatar || 
          // Fallback to generated avatar
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name || 'User')}`
      };
      
      // First disconnect the socket to update query params
      socket.disconnect();
      // Add the user info to the socket query params
      socket.io.opts.query = {
        ...socket.io.opts.query,
        userInfo: JSON.stringify(userInfo)
      };
      // Reconnect with updated params
      socket.connect();
      // Join the chat room
      socket.emit('joinChatRoom', chatRoomId);
    }
  }, [socket, isConnected, currentUser]);

  // Leave a chat room
  const leaveChatRoom = useCallback((chatRoomId: string) => {
    if (socket && isConnected && currentUser) {
      // Create a simplified user object to avoid circular references
      const userInfo = {
        _id: currentUser._id,
        name: currentUser.name || 'Unknown User',
        role: currentUser.role || 'User',
        email: currentUser.email,
        // Enhanced profile picture handling to match API responses
        profilePicture: 
          // First check admin Instagram profile picture
          (currentUser.instagram && typeof currentUser.instagram === 'object' ? 
            (currentUser.instagram as any).profilePicture : undefined) || 
          // Then influencer profile picture URL
          currentUser.profilePictureUrl || 
          // Then regular profile picture
          currentUser.profilePicture || 
          // Then avatar
          currentUser.avatar || 
          // Fallback to generated avatar
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name || 'User')}`
      };
      
      // Update the user info in the socket query params (without reconnecting)
      if (!socket.io.opts.query) {
        socket.io.opts.query = {};
      }
      socket.io.opts.query.userInfo = JSON.stringify(userInfo);
      socket.emit('leaveChatRoom', chatRoomId);
    }
  }, [socket, isConnected, currentUser]);

  // Send a message in a direct conversation
  const sendSocketMessage = useCallback((content: MessageContent) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', content);
    }
  }, [socket, isConnected]);

  // Send a message in a chat room
  const sendRoomMessage = useCallback((content: RoomMessageContent) => {
    if (socket && isConnected) {
      socket.emit('sendRoomMessage', content);
    }
  }, [socket, isConnected]);

  // Update typing status
  const updateTypingStatus = useCallback((conversationId: string, userId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        userId,
        conversationId,
        isTyping
      });
    }
  }, [socket, isConnected]);

  // Check if a user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    const isOnline = onlineUsers.has(userId);
    return isOnline;
  }, [onlineUsers]);

  // Check if a user is typing in a specific conversation
  const isUserTyping = useCallback((conversationId: string, userId: string): boolean => {
    const typingSet = typingUsers.get(conversationId);
    return typingSet ? typingSet.has(userId) : false;
  }, [typingUsers]);

  // Get all users typing in a conversation
  const getTypingUsers = useCallback((conversationId: string): Set<string> => {
    return typingUsers.get(conversationId) || new Set();
  }, [typingUsers]);

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    joinChatRoom,
    leaveChatRoom,
    sendSocketMessage,
    sendRoomMessage,
    updateTypingStatus,
    isUserOnline,
    isUserTyping,
    getTypingUsers,
    onlineUsers
  };
};