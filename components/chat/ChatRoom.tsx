'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Send, MessageSquare, Info, MoreVertical, Edit, Trash, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/lib/useSocket';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

interface RoomParticipant {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface RoomMessage {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  chatRoom: string;
  createdAt: string;
  seenBy?: string[];
  date?: Date; // For grouping messages by date
}

interface ChatRoomDetails {
  _id: string;
  name: string;
  accessType: "brand" | "influencer" | "all";
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  participants: RoomParticipant[];
  createdAt: string;
  updatedAt: string;
  isUserInRoom: boolean;
}

interface ChatRoomProps {
  redirectPath: string;
}

const getProfilePicture = (user: any) => {
  if (!user) return null;
  if (user.instagram && typeof user.instagram === 'object' && user.instagram.profilePicture) {
    return user.instagram.profilePicture;
  }
  if (user.profilePictureUrl) {
    return user.profilePictureUrl;
  }
  if (user.profilePicture) {
    return user.profilePicture;
  }
  if (user.avatar) {
    return user.avatar;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
};

// Define pagination interface
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

const ChatRoom: React.FC<ChatRoomProps> = ({ redirectPath }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const user = useCurrentUser();
  const roomId = params?.roomId as string;
  const [roomDetails, setRoomDetails] = useState<ChatRoomDetails | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useSocket();
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [editAccessType, setEditAccessType] = useState<"brand" | "influencer" | "all">('all');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("40px");

  // Add pagination states
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({ hasMore: false });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  const [virtualKeyboardHeight, setVirtualKeyboardHeight] = useState(0);
  const [visualHeight, setVisualHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
  }, []);

  useEffect(() => {
    const setupHeights = () => {
      const height = Math.trunc(window.visualViewport?.height || window.innerHeight);
      const keyboardHeight = Math.trunc(window.innerHeight - height);
      setVisualHeight(height);
      setVirtualKeyboardHeight(keyboardHeight);
      setIsKeyboardOpen(keyboardHeight > 150);
    };

    const resizeHandler = () => {
      if (!window.visualViewport) return;

      const height = Math.trunc(window.visualViewport.height);
      const keyboardHeight = Math.trunc(window.innerHeight - height);

      if (isIOS) {
        setTimeout(() => {
          setVisualHeight(height);
          setVirtualKeyboardHeight(keyboardHeight);
          setIsKeyboardOpen(keyboardHeight > 150);

          // Scroll to bottom when keyboard appears
          if (keyboardHeight > 150) {
            setTimeout(() => scrollToBottom(true), 100);
          }
        }, 50);
      } else {
        setVisualHeight(height);
        setVirtualKeyboardHeight(keyboardHeight);
        setIsKeyboardOpen(keyboardHeight > 150);

        // Scroll to bottom when keyboard appears
        if (keyboardHeight > 150) {
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    };

    setupHeights();
    window.visualViewport?.addEventListener("resize", resizeHandler);
    window.addEventListener('orientationchange', setupHeights);

    if (isIOS) {
      window.addEventListener('focusin', () => {
        if (document.activeElement?.tagName === 'TEXTAREA') {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
          }, 500);
        }
      });
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", resizeHandler);
      window.removeEventListener('orientationchange', setupHeights);
    };
  }, [isIOS]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId || !user?._id) return;
      try {
        setLoading(true);
        const response = await axios.get(`/api/chat-rooms/${roomId}?userId=${user._id}`);
        setRoomDetails(response.data);
      } catch (error: any) {
        console.error('Error fetching room details:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load chat room details',
          variant: 'destructive'
        });
        if (error.response?.status === 403 || error.response?.status === 404) {
          router.back();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetails();
  }, [roomId, user, toast, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId || !user?._id || !roomDetails?.isUserInRoom) return;
      try {
        setMessagesLoading(true);
        // Request first batch of messages with limit
        const response = await axios.get(`/api/chat-rooms/${roomId}/messages?userId=${user._id}&limit=20`);

        // Process messages to add date objects for grouping
        const processedMessages = response.data.map((msg: RoomMessage) => ({
          ...msg,
          date: new Date(msg.createdAt)
        }));

        setMessages(processedMessages);

        // Store pagination info for loading more later
        setPaginationInfo({
          nextCursor: response.data.nextCursor,
          hasMore: response.data.hasMore || false
        });
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive'
        });
      } finally {
        setMessagesLoading(false);
      }
    };
    if (roomDetails?.isUserInRoom) {
      fetchMessages();
    }
  }, [roomId, user, roomDetails, toast]);

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (!paginationInfo.hasMore || isLoadingMore || !roomId || !user?._id) return;

    setIsLoadingMore(true);

    try {
      // Capture current scroll height before adding new messages
      const container = messageContainerRef.current;
      const scrollHeight = container?.scrollHeight || 0;

      // Request next batch of messages using cursor-based pagination
      const response = await axios.get(`/api/chat-rooms/${roomId}/messages`, {
        params: {
          userId: user._id,
          cursor: paginationInfo.nextCursor,
          limit: 20
        }
      });

      // Process messages to add date objects for grouping
      const processedMessages = response.data.messages.map((msg: RoomMessage) => ({
        ...msg,
        date: new Date(msg.createdAt)
      }));

      // Prepend older messages to existing messages
      setMessages(prevMessages => [...processedMessages, ...prevMessages]);

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
    if (!messagesLoading && messages.length > 0 && !initialScrollDone) {
      // Use setTimeout to ensure all messages are rendered before scrolling
      setTimeout(() => scrollToBottom(true), 0);
    }
  }, [messagesLoading, initialScrollDone, messages.length]);

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

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleNewRoomMessage = (data: any) => {
      if (data.chatRoom === roomId || data.chatRoomId === roomId) {
        const isDuplicate = messages.some(m =>
          (m._id === data._id) ||
          (m._id.startsWith('temp-') && m.content === data.content &&
            m.sender._id === (data.sender?._id || data.sender) &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(data.createdAt || data.timestamp || Date.now()).getTime()) < 5000)
        );
        if (!isDuplicate) {
          const messageDate = new Date(data.createdAt || data.timestamp || Date.now());
          const newMessage: RoomMessage = {
            _id: data._id || `temp-${Date.now()}`,
            content: data.content,
            sender: {
              _id: data.sender?._id || user?._id || data.sender,
              name: data.sender?.name || user?.name || 'User',
              role: data.sender?.role || user?.role || 'user',
              avatar: getProfilePicture({
                _id: data.sender?._id || user?._id || data.sender,
                name: data.sender?.name || user?.name || 'User',
                role: data.sender?.role || user?.role || 'user',
                avatar: data.sender?.avatar,
                instagram: data.sender?.instagram,
                profilePictureUrl: data.sender?.profilePictureUrl,
                profilePicture: data.sender?.profilePicture
              })
            },
            chatRoom: data.chatRoom || roomId,
            createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
            seenBy: data.seenBy,
            date: messageDate // Add date for grouping
          };
          setMessages(prev => [...prev, newMessage]);

          // Force scroll to bottom for new messages if we're already near the bottom
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    };

    const handleParticipantJoined = (data: any) => {
      if (data.roomId === roomId && roomDetails) {
        const isParticipantAlreadyInRoom = roomDetails.participants.some(p => p._id === data.participant._id);
        if (!isParticipantAlreadyInRoom) {
          setRoomDetails(prev => prev ? {
            ...prev,
            participants: [...prev.participants, data.participant]
          } : null);
          toast({
            title: 'New participant',
            description: `${data.participant.name} joined the room`,
          });
        }
      }
    };

    const handleParticipantLeft = (data: any) => {
      if (data.roomId === roomId && roomDetails) {
        setRoomDetails(prev => prev ? {
          ...prev,
          participants: prev.participants.filter(p => p._id !== data.participantId)
        } : null);
        if (data.participantName) {
          toast({
            title: 'Participant left',
            description: `${data.participantName} left the room`,
          });
        }
      }
    };

    socket.on('newRoomMessage', handleNewRoomMessage);
    socket.on('roomParticipantJoined', handleParticipantJoined);
    socket.on('roomParticipantLeft', handleParticipantLeft);
    socket.emit('joinChatRoom', roomId);

    return () => {
      socket.off('newRoomMessage', handleNewRoomMessage);
      socket.off('roomParticipantJoined', handleParticipantJoined);
      socket.off('roomParticipantLeft', handleParticipantLeft);
      socket.emit('leaveChatRoom', roomId);
    };
  }, [socket, roomId, user, messages, roomDetails, toast]);

  const handleJoinRoom = async () => {
    if (!user?._id || !roomId) return;
    setJoining(true);
    try {
      await axios.post(`/api/chat-rooms/${roomId}`, { userId: user._id });
      if (roomDetails) {
        const userAsParticipant = {
          _id: user._id,
          name: user.name || 'Unknown User',
          email: user.email,
          role: user.role,
          profilePicture: getProfilePicture(user)
        };
        setRoomDetails(prev => prev ? {
          ...prev,
          participants: [...prev.participants, userAsParticipant],
          isUserInRoom: true
        } : null);
        socket?.emit('participantJoined', { roomId, participant: userAsParticipant });
      }
      toast({ title: 'Success', description: 'You have joined the chat room' });
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to join the chat room',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user?._id || !roomId) return;
    setLeaving(true);
    try {
      socket?.emit('participantLeft', {
        roomId,
        participantId: user._id,
        participantName: user.name || 'Unknown User'
      });
      socket?.emit('leaveChatRoom', roomId);
      await axios.delete(`/api/chat-rooms/${roomId}?userId=${user._id}`);
      toast({ title: 'Success', description: 'You have left the chat room' });
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Error leaving room:', error);
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to leave the chat room',
      });
      if (confirm('There was an error leaving the room. Would you like to go back to the chat list?')) {
        router.push(redirectPath);
      }
    } finally {
      setLeaving(false);
    }
  };

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    e.target.style.height = "40px";
    const scrollHeight = e.target.scrollHeight;
    const newHeight = scrollHeight > 120 ? "120px" : `${scrollHeight}px`;
    setTextareaHeight(newHeight);
    e.target.style.height = newHeight;
  };

  // Create a ref to track if we need to refocus
  const needsRefocus = useRef(false);

  // Add an effect to handle refocusing
  useEffect(() => {
    if (needsRefocus.current && textareaRef.current) {
      // Use multiple timeouts with different delays to ensure focus is maintained
      const timeouts = [10, 50, 100, 300, 500].map(delay =>
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, delay)
      );

      needsRefocus.current = false;

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [message, sendingMessage]); // Run this effect when message or sendingMessage changes

  const handleSendMessage = async () => {
    if (!roomId || !user?._id || !message.trim()) return;

    // Set flag to indicate we need to refocus after state updates
    needsRefocus.current = true;

    try {
      setSendingMessage(true);
      const messageContent = message.trim();

      const tempMessage: RoomMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        sender: {
          _id: user._id,
          name: user.name,
          role: user.role,
          avatar: getProfilePicture(user)
        },
        chatRoom: roomId,
        createdAt: new Date().toISOString(),
        date: new Date() // Add date for grouping
      };

      // Update state in a single batch if possible to reduce re-renders
      setMessages(prev => [...prev, tempMessage]);
      setMessage('');
      setTextareaHeight("40px");

      // Force scroll to bottom after sending a message
      setTimeout(() => scrollToBottom(true), 100);

      // Immediately try to refocus
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
        textareaRef.current.focus();
      }

      // Send the message in the background
      await axios.post(`/api/chat-rooms/${roomId}/messages`, {
        content: messageContent,
        senderId: user._id
      });

      socket?.emit('sendRoomMessage', {
        chatRoomId: roomId,
        chatRoom: roomId,
        sender: {
          _id: user._id,
          name: user.name,
          role: user.role,
          avatar: getProfilePicture(user),
          instagram: user.instagram,
          profilePictureUrl: user.profilePictureUrl,
          profilePicture: user.profilePicture
        },
        content: messageContent,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);

      // Try to refocus again after the async operation completes
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleUpdateRoom = async () => {
    if (!roomId || !user?._id) return;
    try {
      setUpdateLoading(true);
      await axios.put(`/api/chat-rooms/${roomId}?userId=${user._id}`, {
        name: editRoomName,
        accessType: editAccessType
      });
      const response = await axios.get(`/api/chat-rooms/${roomId}?userId=${user._id}`);
      setRoomDetails(response.data);
      toast({ title: 'Success', description: 'Room updated successfully' });
      setEditRoomOpen(false);
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update room',
        variant: 'destructive'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId || !user?._id) return;
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/chat-rooms/${roomId}?userId=${user._id}`);
      toast({ title: 'Success', description: 'Room deleted successfully' });
      router.back();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete room',
        variant: 'destructive'
      });
      setDeleteLoading(false);
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    // Define a type for the grouped messages
    type GroupedMessage = RoomMessage & { date: Date };

    const groups: Record<string, GroupedMessage[]> = {};

    // Filter out messages without date and add date if missing
    const messagesWithDates = messages.map(msg => ({
      ...msg,
      date: msg.date || new Date(msg.createdAt)
    }));

    messagesWithDates.forEach(message => {
      if (!message.date) return; // Skip messages without date

      const dateKey = formatMessageDate(message.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message as GroupedMessage);
    });

    return groups;
  };

  // Get grouped messages
  const messageGroups = groupMessagesByDate();

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 h-screen flex flex-col">
        <div className="flex items-center gap-2 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Card className="h-full">
              <CardContent className="p-4 h-full">
                <Skeleton className="h-full w-full min-h-[400px]" />
              </CardContent>
            </Card>
          </div>
          <div className="w-full md:w-80 hidden md:block">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Room not found</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chat Room Not Available</h2>
            <p className="text-muted-foreground mb-4">
              This chat room could not be found or you don't have permission to access it.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { name, accessType, createdBy, participants, isUserInRoom } = roomDetails;
  const latestParticipant = participants.length > 1 ? participants.filter(p => p._id !== createdBy._id)[0] : null;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden z-20">
      <header
        className="z-30 h-[60px] bg-white border-b shadow-sm flex items-center justify-between px-4"
        style={{
          position: 'fixed',
          top: `${virtualKeyboardHeight - 5}px`,
          left: 0,
          right: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:block" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold truncate max-w-[120px] md:max-w-full">{name}</h1>
            <Badge variant="outline" className={`text-xs ${
              accessType === 'brand' ? 'bg-blue-100 text-blue-800' :
              accessType === 'influencer' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'}`}>
              {accessType === 'brand' ? 'Brands Only' :
               accessType === 'influencer' ? 'Influencers Only' :
               'All Members'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'Admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setEditRoomName(name);
                  setEditAccessType(accessType);
                  setEditRoomOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Room
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-red-600 focus:text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden flex items-center gap-1">
                <div className="relative">
                  <Users className="h-5 w-5" />
                  {participants.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {participants.length}
                    </span>
                  )}
                </div>
                {latestParticipant && (
                  <div className="flex items-center -ml-1">
                    <Avatar className="h-6 w-6 ring-2 ring-background relative overflow-hidden">
                      {getProfilePicture(latestParticipant) ? (
                        <div className="h-full w-full relative">
                          <Image src={getProfilePicture(latestParticipant) || ""} alt={latestParticipant.name || "Participant"} fill sizes="24px" className="object-cover" />
                        </div>
                      ) : (
                        <AvatarFallback>{latestParticipant.name?.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({participants.length})
                  </h2>
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto p-1">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 relative overflow-hidden">
                      {getProfilePicture(createdBy) ? (
                        <div className="h-full w-full relative">
                          <Image src={getProfilePicture(createdBy) || ""} alt={createdBy.name || "Creator"} fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <AvatarFallback>{createdBy.name?.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{createdBy.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Creator</Badge>
                        <Badge variant="outline" className="text-xs">{createdBy.role}</Badge>
                      </div>
                    </div>
                  </div>
                  {participants.filter(p => p._id !== createdBy._id).map(participant => (
                    <div key={participant._id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 relative overflow-hidden">
                        {getProfilePicture(participant) ? (
                          <div className="h-full w-full relative">
                            <Image src={getProfilePicture(participant) || ""} alt={participant.name || "Participant"} fill sizes="40px" className="object-cover" />
                          </div>
                        ) : (
                          <AvatarFallback>{participant.name?.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <Badge variant="outline" className="text-xs">{participant.role}</Badge>
                      </div>
                    </div>
                  ))}
                  {participants.length <= 1 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No other participants yet
                    </p>
                  )}
                </div>
                <div className="border-t mt-4 pt-4">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    About this Room
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Created by {createdBy.name} on {new Date(roomDetails.createdAt).toLocaleDateString()}
                  </p>
                  <div className="text-sm">
                    <p className="font-medium">Access:</p>
                    <p className="text-muted-foreground mb-2">
                      {accessType === 'brand' ? 'Only Brand accounts can access this room' :
                       accessType === 'influencer' ? 'Only Influencer accounts can access this room' :
                       'All users can access this room'}
                    </p>
                  </div>
                  {isUserInRoom ? (
                    <Button variant="outline" className="w-full mt-4" onClick={handleLeaveRoom} disabled={leaving}>
                      {leaving ? 'Leaving...' : 'Leave Room'}
                    </Button>
                  ) : (
                    <Button className="w-full mt-4" onClick={handleJoinRoom} disabled={joining}>
                      {joining ? 'Joining...' : 'Join Room'}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden md:block">
            {isUserInRoom ? (
              <Button variant="outline" onClick={handleLeaveRoom} disabled={leaving} size="sm">
                {leaving ? 'Leaving...' : 'Leave Room'}
              </Button>
            ) : (
              <Button onClick={handleJoinRoom} disabled={joining} size="sm">
                {joining ? 'Joining...' : 'Join Room'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-hide bg-gradient-to-b from-slate-50 to-white"
        style={{
          overscrollBehavior: 'contain',
          paddingTop: `${virtualKeyboardHeight + 60}px`,
          paddingBottom: '90px',
        }}
      >
        {isUserInRoom ? (
          <>
            {messagesLoading ? (
              <div className="flex justify-center my-8">
                <div className="flex flex-col items-center">
                  <Loader2 size={24} className="text-slate-600 animate-spin mb-2" />
                  <p className="text-slate-500 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center my-8">
                <Badge variant="outline" className="px-3 py-1 text-center">
                  No messages yet. Start the conversation!
                </Badge>
              </div>
            ) : (
              <>
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

                <div className="flex justify-center my-4">
                  <Badge variant="outline" className="px-3 py-1 text-center">
                    You joined the room
                  </Badge>
                </div>

                {/* Render messages grouped by date */}
                {Object.entries(messageGroups).map(([date, msgs]) => (
                  <div key={date} className="space-y-3 mb-6">
                    <div className="flex justify-center">
                      <div className="bg-white text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-slate-200">
                        {date}
                      </div>
                    </div>

                    {msgs.map((msg) => {
                      const isCurrentUser = msg.sender._id === user?._id;
                      const profilePicture = getProfilePicture(msg.sender);
                      return (
                        <div
                          key={msg._id}
                          className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                            messages.length > 20 ? '' : 'animate-in slide-in-from-bottom-2 duration-200'
                          }`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 relative overflow-hidden">
                              {profilePicture ? (
                                <div className="h-full w-full relative">
                                  <Image src={profilePicture} alt={msg.sender.name || "User"} fill sizes="32px" className="object-cover" />
                                </div>
                              ) : (
                                <AvatarFallback>{msg.sender.name?.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                          )}
                          <div className={`max-w-[75%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
                            {!isCurrentUser && (
                              <p className="text-xs text-muted-foreground mb-1">{msg.sender.name}</p>
                            )}
                            <div className={`px-4 py-2 rounded-lg break-words ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <p className="inline">{msg.content}</p>
                              <span className="text-xs ml-2 opacity-70 whitespace-nowrap">
                                {new Date(msg.createdAt).toString() !== "Invalid Date"
                                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : "Just now"}
                              </span>
                            </div>
                          </div>
                          {isCurrentUser && (
                            <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0 relative overflow-hidden">
                              {profilePicture ? (
                                <div className="h-full w-full relative">
                                  <Image src={profilePicture} alt={user.name || "User"} fill sizes="32px" className="object-cover" />
                                </div>
                              ) : (
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Join to Start Chatting</h2>
            <p className="text-muted-foreground mb-4">
              You need to join this room to send and receive messages.
            </p>
            <Button onClick={handleJoinRoom} disabled={joining}>
              {joining ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        )}
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white border-t shadow-lg"
        style={{
          paddingBottom: isIOS && !isKeyboardOpen ? `max(env(safe-area-inset-bottom), 12px)` : '12px',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
            // Prevent form submission from stealing focus
            if (textareaRef.current) {
              setTimeout(() => textareaRef.current?.focus(), 0);
            }
            return false;
          }}
          className="flex items-end gap-2 bg-slate-50 rounded-xl p-2 shadow-sm transition-shadow focus-within:shadow-md"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onChange={handleTextareaChange}
              onBlur={() => {
                // If this is a legitimate blur (not from sending a message), don't refocus
                if (!needsRefocus.current) return;

                // Otherwise, refocus the textarea
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }, 10);
              }}
              placeholder={isUserInRoom ? "Type your message..." : "Join the room to chat"}
              className="w-full px-3 py-2 resize-none border-none rounded-lg focus:outline-none focus:ring-0 bg-white scrollbar-hide placeholder:text-slate-400"
              style={{
                height: textareaHeight,
                maxHeight: "120px",
                minHeight: "40px"
              }}
              disabled={!isUserInRoom || sendingMessage}
              autoComplete="off"
              autoCapitalize="sentences"
              spellCheck="true"
            />
          </div>
          <Button
            type="submit"
            disabled={!isUserInRoom || !message.trim() || sendingMessage}
            className={`rounded-full h-10 w-10 p-0 flex items-center justify-center transition-all transform hover:scale-105 ${
              (message.trim()) && !sendingMessage && isUserInRoom
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                : 'bg-slate-300'
            }`}
            title="Send message"
            onClick={(e) => {
              // Prevent default button behavior
              e.preventDefault();

              // Set flag to indicate we need to refocus
              needsRefocus.current = true;

              // Send the message
              handleSendMessage();

              // Try to refocus immediately
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
          >
            {sendingMessage ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Send size={18} className="text-white" />
            )}
          </Button>
        </form>
      </footer>

      {user?.role === 'Admin' && (
        <>
          <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Room</DialogTitle>
                <DialogDescription>Change the room name or access settings.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-roomName">Room Name</Label>
                  <Input id="edit-roomName" placeholder="Enter room name" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Who can access this room?</Label>
                  <RadioGroup value={editAccessType} onValueChange={(value) => setEditAccessType(value as "brand" | "influencer" | "all")}>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="all" id="e-r1" />
                      <Label htmlFor="e-r1" className="flex gap-2 items-center font-normal cursor-pointer">
                        <Users className="h-4 w-4" />
                        <span>All Members</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="brand" id="e-r2" />
                      <Label htmlFor="e-r2" className="flex gap-2 items-center font-normal cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Brands Only</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="influencer" id="e-r3" />
                      <Label htmlFor="e-r3" className="flex gap-2 items-center font-normal cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Influencers Only</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRoomOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateRoom} disabled={updateLoading}>
                  {updateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Room</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the room "{name}" and all its messages. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoom} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                  {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
