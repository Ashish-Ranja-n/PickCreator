'use client'

import { Search, Users, Plus, MessageSquarePlus, Loader2, UserIcon, UsersIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import axios from "axios";
import { Card } from "../ui/card";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { useSocket } from "@/lib/useSocket";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from 'next/image';

interface Conversations {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  userId: string;
  unreadCount?: number;
  profilePictureUrl?: string;
  instagram?: {
    profilePicture?: string;
  };
}

interface ChatRoom {
  _id: string;
  name: string;
  accessType: "brand" | "influencer" | "all";
  createdBy: string;
  createdAt: string;
  participants: string[];
}

type TabType = "chats" | "rooms";
type AccessType = "brand" | "influencer" | "all";

// API functions separated for better reusability and testing
const api = {
  fetchConversations: async (userId: string) => {
    if (!userId) throw new Error("User ID is required");

    const response = await axios.get(`/api/conversation/${userId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 8000
    });

    return response.data;
  },

  fetchChatRooms: async (userId: string) => {
    if (!userId) throw new Error("User ID is required");

    const response = await axios.get(`/api/chat-rooms?userId=${userId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 8000
    });

    return response.data;
  },

  searchUsers: async (query: string) => {
    if (!query || query.length < 1) return [];

    const { data } = await axios.get(`/api/search-user?query=${query}`);
    return data;
  },

  startConversation: async (currentUserId: string, otherUserId: string) => {
    if (!currentUserId || !otherUserId) throw new Error("Both user IDs are required");

    const response = await axios.post("/api/conversation", {
      currentUserId,
      otherUserId
    });

    return response.data;
  },

  createChatRoom: async (params: { name: string; accessType: AccessType; createdBy: string }) => {
    const response = await axios.post("/api/chat-rooms", params);
    return response.data;
  }
};

// Separate UI components
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col justify-center items-center h-52 py-6">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-t-2 border-purple-600 animate-spin"></div>
      <div className="absolute inset-1 rounded-full border-r-2 border-cyan-400 animate-spin animate-reverse"></div>
      <div className="absolute inset-2 rounded-full border-b-2 border-pink-500 animate-pulse"></div>
    </div>
    <p className="text-gray-500 text-sm mt-4 animate-pulse">{message}</p>
  </div>
);

const EmptyChats = ({ isAdmin, onRefresh, isLoading }: { isAdmin: boolean; onRefresh: () => void; isLoading: boolean }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full blur-md"></div>
      <div className="relative bg-white rounded-full p-4 shadow-sm">
        <MessageSquarePlus className="h-12 w-12 text-purple-500" />
      </div>
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">No conversations yet</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">
      {isAdmin ? "Search for users to start chatting" : "You don't have any messages yet"}
    </p>
    {!isAdmin ? null : (
      <Button
        variant="outline"
        onClick={() => {
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
        }}
        className="flex items-center gap-2 bg-white border-purple-200 text-purple-700 hover:bg-purple-50 transition-all shadow-sm"
      >
        <Search size={16} /> Find Users
      </Button>
    )}
    {!isLoading && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="mt-4 text-xs text-gray-500 hover:text-purple-600 hover:bg-purple-50"
      >
        <RefreshCw size={14} className="mr-1" /> Refresh
      </Button>
    )}
  </div>
);

const EmptyRooms = ({ isAdmin, onRefresh, isLoading, onCreateRoom }: {
  isAdmin: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  onCreateRoom: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-md"></div>
      <div className="relative bg-white rounded-full p-4 shadow-sm">
        <Users size={32} className="text-blue-500" />
      </div>
    </div>
    <h3 className="font-medium text-gray-800 mb-1">No chat rooms yet</h3>
    <p className="text-sm text-gray-500 mb-4">Group chat functionality coming soon</p>
    <Button
      variant="outline"
      size="sm"
      className="gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
      disabled={!isAdmin}
      onClick={() => isAdmin && onCreateRoom()}
    >
      <Plus size={16} />
      Create Room
    </Button>
    {!isLoading && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="mt-4 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
      >
        <RefreshCw size={14} className="mr-1" /> Refresh
      </Button>
    )}
    {!isAdmin && (
      <p className="text-xs text-gray-500 mt-2">Only administrators can create chat rooms</p>
    )}
  </div>
);

const ConversationItem = ({
  conversation,
  onSelect,
  isUserOnline
}: {
  conversation: Conversations;
  onSelect: () => void;
  isUserOnline: (userId: string) => boolean;
}) => {
  const formatLastMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const now = new Date();

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  };

  // Function to safely get avatar URL or fallback to DiceBear avatar
  const getAvatarUrl = () => {
    // First check for profile pictures (usually for influencers)
    if (conversation.profilePictureUrl &&
        conversation.profilePictureUrl !== "undefined" &&
        conversation.profilePictureUrl !== "null") {
      return conversation.profilePictureUrl;
    }

    // Then check for regular avatar
    if (conversation.avatar &&
        conversation.avatar !== "/default-avatar.png" &&
        conversation.avatar !== "undefined" &&
        conversation.avatar !== "null") {
      return conversation.avatar;
    }

    // For Instagram profile pictures (especially for admin profiles)
    if (conversation.instagram?.profilePicture &&
        conversation.instagram.profilePicture !== "undefined" &&
        conversation.instagram.profilePicture !== "null") {
      return conversation.instagram.profilePicture;
    }

    // Fallback to DiceBear avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.name}`;
  };

  return (
    <div
      className="mx-2 my-1.5 rounded-xl bg-white p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:shadow-md group"
      onClick={onSelect}
    >
      <div className="flex items-center">
        <div className="relative">
          <Avatar className="h-12 w-12 border bg-white shadow-sm">
            <div className="h-full w-full absolute inset-0">
              <Image
                src={getAvatarUrl()}
                alt={conversation.name || "User"}
                width={48}
                height={48}
                className="rounded-full object-cover"
                onError={(e) => {
                  // Fallback on error - just show the first letter
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <AvatarFallback className="bg-gradient-to-br from-purple-50 to-blue-50">
              {conversation.name ? conversation.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>

          <span
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
              isUserOnline(conversation.userId)
                ? 'bg-emerald-500 ring-2 ring-emerald-100'
                : 'bg-slate-400'
            }`}
          />
        </div>

        <div className="ml-4 flex-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{conversation.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                conversation.role === 'Brand'
                  ? 'bg-blue-100 text-blue-700'
                  : conversation.role === 'Admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {conversation.role}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {formatLastMessageTime(conversation.lastMessageTime)}
            </span>
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-2 max-w-[70%]">
              <p className="text-sm text-gray-600 truncate w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {!conversation.lastMessage || conversation.lastMessage.length === 0
                  ? "No messages yet"
                  : conversation.lastMessage.length > 30
                    ? `${conversation.lastMessage.substring(0, 30)}...`
                    : conversation.lastMessage}
              </p>
              {typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs text-white shadow-sm">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isUserOnline(conversation.userId)
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isUserOnline(conversation.userId) ? 'online' : 'offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomItem = ({ room, onSelect }: { room: ChatRoom; onSelect: () => void }) => (
  <div
    className="mx-2 my-1.5 rounded-xl bg-white p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:shadow-md group"
    onClick={onSelect}
  >
    <div className="flex items-center">
      <div className="relative">
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full p-3 shadow-sm">
          <UsersIcon className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="ml-4 flex-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">{room.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full
              ${room.accessType === 'brand'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : room.accessType === 'influencer'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
              {room.accessType === 'brand'
                ? 'Brands Only'
                : room.accessType === 'influencer'
                  ? 'Influencers Only'
                  : 'All Members'}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {new Date(room.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-600 truncate">
            {room.participants.length} participants
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SearchResults = ({
  results,
  loading,
  onSelectUser
}: {
  results: Array<{ _id: string; role: string; name: string }>;
  loading: boolean;
  onSelectUser: (userId: string) => void;
}) => {
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="h-6 w-6 border-2 border-t-purple-600 border-l-purple-600 border-b-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return <p className="p-3 text-gray-500 text-center text-sm">No users found</p>;
  }

  return (
    <>
      {results.map((user) => (
        <Card
          key={user._id}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-none shadow-sm m-1 hover:shadow-md transition-all duration-200"
          onClick={() => onSelectUser(user._id)}
        >
          <Avatar className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
            <div className="h-full w-full absolute inset-0">
              <Image
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name || "User"}
                width={40}
                height={40}
                className="rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <AvatarFallback>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <span className="font-medium text-gray-800">{user.name}</span>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <Button size="sm" variant="ghost" className="rounded-full text-purple-600 hover:bg-purple-50 hover:text-purple-700">
            <MessageSquarePlus size={16} />
          </Button>
        </Card>
      ))}
    </>
  );
};

// Main component
export const ChatList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket, isConnected, isUserOnline, onlineUsers } = useSocket();

  const currentUserId = user?._id;
  const isAdmin = user?.role === 'Admin';

  // State
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomAccessType, setRoomAccessType] = useState<AccessType>("all");

  // React Query hooks for data fetching
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: () => currentUserId ? api.fetchConversations(currentUserId) : [],
    enabled: !!currentUserId,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 2
  });

  const {
    data: chatRooms = [],
    isLoading: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['chatRooms', currentUserId],
    queryFn: () => currentUserId ? api.fetchChatRooms(currentUserId) : [],
    enabled: !!currentUserId && activeTab === 'rooms',
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });

  const {
    data: searchResults = [],
    isLoading: isLoadingSearch,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => api.searchUsers(query),
    enabled: !!query && query.length >= 1 && isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutations
  const startConversationMutation = useMutation({
    mutationFn: (otherUserId: string) => {
      if (!currentUserId) throw new Error("No current user");
      return api.startConversation(currentUserId, otherUserId);
    },
    onSuccess: (data) => {
      const conversationId = data.conversationId;
      const basePath = pathname ? pathname.split("/")[1] : "";
      router.push(`/${basePath}/chat/${conversationId}`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createRoomMutation = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("No current user");
      return api.createChatRoom({
        name: roomName,
        accessType: roomAccessType,
        createdBy: currentUserId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      setCreateRoomDialogOpen(false);
      setRoomName("");
      setRoomAccessType("all");
      toast({
        title: "Room created!",
        description: `${roomName} has been created successfully`,
      });
    },
    onError: (error) => {
      console.error("Error creating room:", error);
      toast({
        title: "Failed to create room",
        description: "There was an error creating the chat room",
        variant: "destructive",
      });
    }
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserStatus = () => {
      // Force re-render when user status changes
      queryClient.invalidateQueries({ queryKey: ['onlineStatus'] });
    };

    const handleNewMessage = async () => {
      // Invalidate conversations cache to refresh with new message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Register event handlers
    socket.on('userStatusChange', handleUserStatus);
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('userStatusChange', handleUserStatus);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, isConnected, queryClient]);

  // Memoized search handler to reduce re-renders
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length < 1) {
      // Reset search results when query is empty
      queryClient.setQueryData(['searchUsers', ''], []);
    }
  }, [queryClient]);

  // Navigation handlers
  const handleConversationClick = useCallback((conversationId: string) => {
    if (!conversationId || loading) return;

    setLoading(true);

    // Cache the selected conversation for faster initial render
    try {
      const selectedConversation = conversations.find((conv: Conversations) => conv._id === conversationId);
      if (selectedConversation) {
        localStorage.setItem('selectedConversationData', JSON.stringify({
          ...selectedConversation,
          cachedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Error caching conversation data:", error);
    }

    const basePath = pathname ? pathname.split("/")[1] : "";
    router.push(`/${basePath}/chat/${conversationId}`);

    // Safety timeout to reset loading if navigation fails
    setTimeout(() => setLoading(false), 2000);
  }, [router, pathname, conversations, loading]);

  const handleRoomClick = useCallback((roomId: string) => {
    if (!roomId || loading) return;

    setLoading(true);

    // Cache selected room data
    try {
      const selectedRoom = chatRooms.find((room: ChatRoom) => room._id === roomId);
      if (selectedRoom) {
        localStorage.setItem('selectedRoomData', JSON.stringify({
          ...selectedRoom,
          cachedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Error caching room data:", error);
    }

    const basePath = pathname ? pathname.split("/")[1] : "";
    router.push(`/${basePath}/chat/room/${roomId}`);

    // Safety timeout
    setTimeout(() => setLoading(false), 2000);
  }, [router, pathname, chatRooms, loading]);

  // Handle tab change with data prefetching
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setQuery("");

    if (tab === "rooms" && chatRooms.length === 0 && !isLoadingRooms) {
      refetchRooms();
    }
  }, [chatRooms.length, isLoadingRooms, refetchRooms]);

  // Create chat room handler
  const createChatRoom = useCallback(() => {
    if (!roomName.trim()) {
      toast({
        title: "Room name is required",
        description: "Please enter a name for the chat room",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate();
  }, [roomName, createRoomMutation, toast]);

  // Animation variants
  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  // Optimized rendering with memoization
  const renderConversationsList = useMemo(() => {
    if (isLoadingConversations) {
      return (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[160px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <EmptyChats
          isAdmin={isAdmin}
          onRefresh={refetchConversations}
          isLoading={isLoadingConversations}
        />
      );
    }

    return (
      <div className="space-y-1 p-0">
        {conversations.map((conversation: Conversations) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            onSelect={() => handleConversationClick(conversation._id)}
            isUserOnline={isUserOnline}
          />
        ))}
      </div>
    );
  }, [conversations, isLoadingConversations, isAdmin, refetchConversations, handleConversationClick, isUserOnline]);

  const renderRoomsList = useMemo(() => {
    if (isLoadingRooms) {
      return (
        <div className="space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (chatRooms.length === 0) {
      return (
        <EmptyRooms
          isAdmin={isAdmin}
          onRefresh={refetchRooms}
          isLoading={isLoadingRooms}
          onCreateRoom={() => setCreateRoomDialogOpen(true)}
        />
      );
    }

    return (
      <div className="space-y-1 p-0">
        {chatRooms.map((room: ChatRoom) => (
          <RoomItem
            key={room._id}
            room={room}
            onSelect={() => handleRoomClick(room._id)}
          />
        ))}
      </div>
    );
  }, [chatRooms, isLoadingRooms, isAdmin, refetchRooms, handleRoomClick]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-zinc-800 relative overflow-hidden">
      {/* Global loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-purple-600 animate-spin"></div>
              <div className="absolute inset-1 rounded-full border-r-2 border-blue-500 animate-spin animate-reverse"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-300 mt-4 animate-pulse">Opening chat...</p>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-b-xl shadow-md mb-2">
        {/* Redesigned tabbed interface */}
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-xl flex w-full sm:w-[260px]">
            <button
              onClick={() => handleTabChange("chats")}
              className={`flex-1 py-2 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "chats"
                  ? "bg-white dark:bg-black text-purple-700 dark:text-purple-400 shadow-sm"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => handleTabChange("rooms")}
              className={`flex-1 py-2 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "rooms"
                  ? "bg-white dark:bg-black text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
              }`}
            >
              Rooms
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (activeTab === "chats") {
                refetchConversations();
              } else if (activeTab === "rooms") {
                refetchRooms();
              }
            }}
            disabled={activeTab === "chats" ? isLoadingConversations : (activeTab === "rooms" ? isLoadingRooms : false)}
            className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw size={16} className={cn(
              "transition-all",
              (activeTab === "chats" && isLoadingConversations) || (activeTab === "rooms" && isLoadingRooms)
                ? "animate-spin text-purple-600"
                : ""
            )} />
          </Button>
        </div>

        {/* Enhanced search bar - only visible for admins */}
        {isAdmin && (
          <div className="relative mt-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-hover:text-purple-500 transition-colors duration-200" size={18} />
              <Input
                type="text"
                placeholder="Search users..."
                value={query}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 bg-gray-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-gray-900 dark:text-white"
              />
            </div>

            {query && isAdmin && (
              <div className="absolute w-full mt-2 bg-white dark:bg-zinc-900 shadow-lg rounded-xl max-h-60 overflow-y-auto border border-gray-200 dark:border-zinc-700 z-50">
                <SearchResults
                  results={searchResults}
                  loading={isLoadingSearch}
                  onSelectUser={(userId) => startConversationMutation.mutate(userId)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chats" && (
            <motion.div
              key="chats"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full overflow-auto"
            >
              {renderConversationsList}
            </motion.div>
          )}

          {activeTab === "rooms" && (
            <motion.div
              key="rooms"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full overflow-auto"
            >
              {renderRoomsList}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Room Dialog with enhanced styling */}
      <Dialog open={createRoomDialogOpen} onOpenChange={setCreateRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-800 dark:text-white">Create a Chat Room</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              Create a chat room for users to join and communicate with each other.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName" className="text-gray-700 dark:text-zinc-200">Room Name</Label>
              <Input
                id="roomName"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-500/20 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-700 dark:text-zinc-200">Who can access this room?</Label>
              <RadioGroup value={roomAccessType} onValueChange={(value) => setRoomAccessType(value as AccessType)}>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all">
                  <RadioGroupItem value="all" id="r1" className="text-green-600 dark:text-green-400" />
                  <Label htmlFor="r1" className="flex gap-2 items-center font-normal cursor-pointer text-gray-700 dark:text-zinc-200">
                    <UsersIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>All Members</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all">
                  <RadioGroupItem value="brand" id="r2" className="text-blue-600 dark:text-blue-400" />
                  <Label htmlFor="r2" className="flex gap-2 items-center font-normal cursor-pointer text-gray-700 dark:text-zinc-200">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Brands Only</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all">
                  <RadioGroupItem value="influencer" id="r3" className="text-purple-600 dark:text-purple-400" />
                  <Label htmlFor="r3" className="flex gap-2 items-center font-normal cursor-pointer text-gray-700 dark:text-zinc-200">
                    <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Influencers Only</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoomDialogOpen(false)} className="rounded-lg dark:text-white dark:border-zinc-700">Cancel</Button>
            <Button
              onClick={createChatRoom}
              disabled={createRoomMutation.isPending || !roomName.trim()}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-800 dark:to-purple-800 dark:hover:from-blue-900 dark:hover:to-purple-900 text-white"
            >
              {createRoomMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button with enhanced styling */}
      {isAdmin && activeTab === "rooms" && (
        <Button
          className="fixed bottom-16 right-6 rounded-full w-14 h-14 shadow-lg flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-800 dark:to-purple-800 dark:hover:from-blue-900 dark:hover:to-purple-900 text-white transition-all duration-200 hover:scale-105 z-10"
          onClick={() => setCreateRoomDialogOpen(true)}
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
};
