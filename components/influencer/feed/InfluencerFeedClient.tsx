"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, User, MessageCircle, Heart, Eye, Bookmark, MoreHorizontal, Zap, TrendingUp, Loader2, X, ExternalLink, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import CreatePostDialog from "./CreatePostDialog";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import CommentSheet from "./CommentSheet";

// Define the type for the ref if needed in the future
// Currently not used but may be needed for future implementations
// type PostFeedRefType = {
//   refreshPosts: () => void;
// };

// Define post type
interface Post {
  _id: string;
  content: string;
  media?: string[];
  author: {
    _id: string;
    name: string;
    profilePictureUrl?: string;
    image?: string;
    username: string;
    instagramUsername?: string;
  };
  likes: string[];
  commentCount: number;
  views: number;
  createdAt: string;
  hashtags?: string[];
}

export default function InfluencerFeedClient() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [feedType, setFeedType] = useState<"live" | "top">("live");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hashtagScrollRef = useRef<HTMLDivElement>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const { toast } = useToast();

  // Hashtag bar visibility state
  const [showHashtagBar, setShowHashtagBar] = useState(false);
  const lastScrollY = useRef(0);
  const lastDirection = useRef<'up' | 'down' | null>(null);
  const hideBarTimeout = useRef<NodeJS.Timeout | null>(null);
  // Hashtag bar show/hide logic (YouTube style)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollTop = 0;
    let pulling = false;

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const deltaY = scrollTop - lastScrollTop;

      // If at the very top and user scrolls up (pulls down)
      if (scrollTop === 0 && deltaY < 0) {
        if (!showHashtagBar) {
          setShowHashtagBar(true);
        }
        pulling = true;
        // Optionally, auto-hide after 3s
        if (hideBarTimeout.current) clearTimeout(hideBarTimeout.current);
        hideBarTimeout.current = setTimeout(() => setShowHashtagBar(false), 3000);
      } else if (deltaY > 0) {
        // User scrolls down, hide bar
        if (showHashtagBar) setShowHashtagBar(false);
        pulling = false;
        if (hideBarTimeout.current) clearTimeout(hideBarTimeout.current);
      }
      lastScrollTop = scrollTop;
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (hideBarTimeout.current) clearTimeout(hideBarTimeout.current);
    };
  }, [showHashtagBar]);

  // Available hashtags (same as in CreatePostDialog)
  const availableHashtags = [
    "influencer", "marketing", "content", "collaboration",
    "branding", "socialmedia", "creator", "partnership",
    "sponsored", "campaign"
  ];

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  // Delete post state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Comment sheet state
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Fetch posts from the API
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", pageNum.toString());
      queryParams.append("limit", "10");

      // Add sort parameter based on feed type
      if (feedType === "top") {
        queryParams.append("sort", "popular");
      }

      // Add author filter if showing only user's posts
      if (showMyPosts && currentUser?._id) {
        queryParams.append("author", currentUser._id);
      }

      // Add hashtag filter if selected
      if (selectedHashtag) {
        queryParams.append("hashtag", selectedHashtag);
      }

      const response = await fetch(`/api/posts?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (append) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }

      // Check if there are more posts to load
      setHasMore(data.length === 10);
      setPage(pageNum);

      // Initialize liked status for each post
      const newLikedPosts: Record<string, boolean> = { ...likedPosts };
      data.forEach((post: Post) => {
        if (currentUser?._id) {
          newLikedPosts[post._id] = post.likes.includes(currentUser._id);
        }
      });
      setLikedPosts(newLikedPosts);

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    fetchPosts();
  }, [feedType, showMyPosts, currentUser, selectedHashtag]);

  // Handle post creation
  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setIsCreatePostOpen(false);
    toast({
      title: "Success",
      description: "Post created successfully!",
    });
  };

  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));

      // Update post likes count
      setPosts(prev =>
        prev.map(post => {
          if (post._id === postId) {
            const newLikes = [...post.likes];
            if (likedPosts[postId]) {
              // Unlike: Remove user from likes
              const index = newLikes.indexOf(currentUser._id);
              if (index > -1) {
                newLikes.splice(index, 1);
              }
            } else {
              // Like: Add user to likes
              newLikes.push(currentUser._id);
            }
            return { ...post, likes: newLikes };
          }
          return post;
        })
      );

      // Send API request
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }

    } catch (err: any) {
      // Revert optimistic update on error
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  // Handle comment section toggle
  const toggleComments = (postId: string) => {
    setActiveCommentPostId(postId);
    setCommentSheetOpen(true);
  };

  // Handle comment added
  const handleCommentAdded = (postId: string) => {
    // Update comment count for the post
    setPosts(prev =>
      prev.map(post => {
        if (post._id === postId) {
          return { ...post, commentCount: post.commentCount + 1 };
        }
        return post;
      })
    );
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/posts/${postToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Remove the deleted post from the state
      setPosts(prev => prev.filter(post => post._id !== postToDelete));

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  // Format date for display
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get Instagram profile URL
  const getInstagramProfileUrl = (username: string) => {
    if (!username) return null;
    return `https://instagram.com/${username}`;
  };

  // Get profile picture with fallback
  const getProfilePicture = (author: any) => {
    // Safety check if author is null or undefined
    if (!author) return "/default-avatar.png";

    // Check for profilePictureUrl
    if (author.profilePictureUrl) {
      return author.profilePictureUrl;
    }

    // Check for image field
    if (author.image) {
      return author.image;
    }

    // Check for Instagram profile picture
    if (author.instagram && author.instagram.profilePicture) {
      return author.instagram.profilePicture;
    }

    // Return default avatar
    return "/default-avatar.png";
  };

  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
      {/* Fixed header with buttons - using fixed positioning */}
      <div className="fixed top-[46px] dark:top-[50px] md:top-[68px] left-0 right-0 z-30 py-3 px-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#C4B5FD]/30 dark:border-gray-700/50 flex justify-between items-center">
        <div className="w-full mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 rounded-full transition-colors duration-200 ${showMyPosts
                      ? 'bg-[#3B82F6] text-white shadow-md ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6] hover:text-white'
                      : 'bg-[#C4B5FD]/20 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-[#C4B5FD]/20 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white'}`}
                    onClick={() => setShowMyPosts(!showMyPosts)}
                  >
                    <User size={16} className={`${showMyPosts ? 'scale-110' : ''} transition-transform duration-300`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-[#C4B5FD]/30 dark:border-gray-700 shadow-lg">
                  <p>{showMyPosts ? 'Viewing your posts' : 'View your posts'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white block">
                {showMyPosts ? 'My Posts' : 'Influencer Community'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-[#C4B5FD]/20 dark:bg-gray-800 p-0.5 rounded-full shadow-md border border-[#C4B5FD]/30 dark:border-gray-700/50">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 rounded-full px-3 text-xs font-medium transition-colors duration-200 ${feedType === 'live'
                ? 'bg-[#3B82F6] text-white shadow-md hover:bg-[#3B82F6] hover:text-white'
                : 'text-gray-700 dark:text-white bg-transparent hover:bg-transparent hover:text-gray-700 dark:hover:text-white'}`}
              onClick={() => setFeedType("live")}
            >
              <Zap size={14} className={`mr-1.5 ${feedType === 'live' ? 'text-white animate-pulse' : 'text-[#C4B5FD] dark:text-[#C4B5FD]'}`} />
              Live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 rounded-full px-3 text-xs font-medium transition-colors duration-200 ${feedType === 'top'
                ? 'bg-[#3B82F6] text-white shadow-md hover:bg-[#3B82F6] hover:text-white'
                : 'text-gray-700 dark:text-white bg-transparent hover:bg-transparent hover:text-gray-700 dark:hover:text-white'}`}
              onClick={() => setFeedType("top")}
            >
              <TrendingUp size={14} className={`mr-1.5 ${feedType === 'top' ? 'text-white' : 'text-[#3B82F6] dark:text-[#3B82F6]'}`} />
              Top
            </Button>
          </div>
        </div>
      </div>


      {/* Horizontally scrollable hashtag selection bar (YouTube style, only shows when pulled) */}
      {showHashtagBar && (
        <div className="sticky top-[105px] dark:top-[110px] md:top-[132px] z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#C4B5FD]/30 dark:border-gray-700/50 shadow-sm transition-all duration-300 animate-fadeIn">
          <div
            ref={hashtagScrollRef}
            className="flex items-center gap-2 py-2 px-4 overflow-x-auto scrollbar-hide"
          >
            <Badge
              variant={selectedHashtag === null ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 touch-manipulation select-none active:scale-95 py-1.5 px-3 text-sm whitespace-nowrap ${
                selectedHashtag === null
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#C4B5FD]/20 dark:bg-gray-800 text-gray-700 dark:text-white border-[#C4B5FD]/30 dark:border-gray-700 hover:bg-[#C4B5FD]/30 dark:hover:bg-gray-700 active:bg-[#C4B5FD]/40 dark:active:bg-gray-600'
              }`}
              onClick={() => setSelectedHashtag(null)}
              onTouchStart={(e) => e.preventDefault()}
            >
              All
            </Badge>

            {availableHashtags.map(hashtag => (
              <Badge
                key={hashtag}
                variant={selectedHashtag === hashtag ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 touch-manipulation select-none active:scale-95 py-1.5 px-3 text-sm whitespace-nowrap ${
                  selectedHashtag === hashtag
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-[#C4B5FD]/20 dark:bg-gray-800 text-gray-700 dark:text-white border-[#C4B5FD]/30 dark:border-gray-700 hover:bg-[#C4B5FD]/30 dark:hover:bg-gray-700 active:bg-[#C4B5FD]/40 dark:active:bg-gray-600'
                }`}
                onClick={() => setSelectedHashtag(hashtag)}
                onTouchStart={(e) => e.preventDefault()}
              >
                #{hashtag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Content container */}
      <div
        ref={scrollContainerRef}
        className="max-w-xl mx-auto divide-y divide-gray-100 dark:divide-zinc-800/50"
      >
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#C4B5FD]" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Loading posts...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="py-6 px-4 text-center border-b border-[#C4B5FD]/20 dark:border-gray-700/50">
            <p className="text-red-500 dark:text-red-400 mb-3">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => fetchPosts()}
            >
              Try Again
            </Button>
          </div>
        )}

        <AnimatePresence>
          {!loading && posts.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-transparent border-b border-gray-200/60 dark:border-gray-700/50 pb-4 transition-colors duration-200"
            >
              <div className="pt-3 px-4">
                <div className="flex">
                  {/* Avatar column */}
                  <div className="mr-3 flex-shrink-0">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-[#C4B5FD]/20 dark:ring-gray-600/50">
                        <AvatarImage src={getProfilePicture(post.author)} alt={post.author?.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-[#C4B5FD] to-[#3B82F6] text-white font-medium">
                          {post.author?.name ? post.author.name.charAt(0) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      {post.author?.instagramUsername && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                            </svg>
                          </div>
                          <Link
                            href={getInstagramProfileUrl(post.author.instagramUsername) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10"
                            aria-label={`Visit ${post.author?.name || 'User'}'s Instagram profile`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content column */}
                  <div className="flex-1 min-w-0">
                    {/* Header with name, username and options */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white text-base">{post.author?.name || "User"}</span>
                          {post.author?.instagramUsername ? (
                            <Link
                              href={getInstagramProfileUrl(post.author.instagramUsername) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-500 dark:text-gray-400 transition-colors flex items-center"
                            >
                              @{post.author.instagramUsername}
                              <ExternalLink size={10} className="ml-1 opacity-60" />
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">@{post.author?.username || "user"}</span>
                          )}
                          <span className="text-gray-400 dark:text-gray-500 text-sm">·</span>
                          <span className="text-sm text-gray-500 dark:text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-[#C4B5FD]/30 dark:border-gray-700 text-gray-900 dark:text-white">
                          {currentUser && post.author && (
                            // Show delete option if user is the post author OR if user is an admin
                            (post.author._id === currentUser._id || currentUser.role === 'Admin') && (
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(post._id)}
                                className="text-red-500 dark:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {currentUser.role === 'Admin' && post.author._id !== currentUser._id ? (
                                  <>Admin: Delete Post</>
                                ) : (
                                  <>Delete Post</>
                                )}
                              </DropdownMenuItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Post content */}
                    <div className="mt-2">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed text-base">{post.content}</p>
                    </div>

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.hashtags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-[#C4B5FD]/20 dark:bg-[#C4B5FD]/10 text-[#3B82F6] dark:text-[#C4B5FD] border-none text-xs px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Post media if available */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3">
                        <div className={`${post.media.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                          {post.media.map((mediaUrl, idx) => {
                            const isSingleImage = post.media && post.media.length === 1;
                            return (
                              <div
                                key={idx}
                                className={`relative overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/50 ${isSingleImage ? 'w-full' : ''}`}
                              >
                                <div
                                  className="cursor-pointer transition-transform duration-200 active:scale-95"
                                  onClick={() => {
                                    setCurrentImage(mediaUrl);
                                    setImageViewerOpen(true);
                                  }}
                                >
                                  <Image
                                    src={mediaUrl}
                                    alt={`Post media ${idx + 1}`}
                                    width={600}
                                    height={600}
                                    sizes={isSingleImage ? "(max-width: 768px) 100%, 600px" : "(max-width: 768px) 49vw, 300px"}
                                    className="w-full h-auto"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Post actions */}
                    <div className="mt-4 flex justify-between items-center pt-2">
                      <div className="flex space-x-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-500 dark:text-gray-400 p-0 h-auto bg-transparent transition-colors duration-200 ${likedPosts[post._id] ? 'text-pink-500 dark:text-pink-400' : ''}`}
                          onClick={() => handleLike(post._id)}
                        >
                          <Heart size={20} className={`mr-2 ${likedPosts[post._id] ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likes.length > 0 ? post.likes.length : ''}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-500 dark:text-gray-400 p-0 h-auto bg-transparent transition-colors duration-200 ${activeCommentPostId === post._id && commentSheetOpen ? 'text-[#3B82F6] dark:text-[#3B82F6]' : ''}`}
                          onClick={() => toggleComments(post._id)}
                        >
                          <MessageCircle size={20} className="mr-2" />
                          <span className="text-sm font-medium">{post.commentCount > 0 ? post.commentCount : ''}</span>
                        </Button>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                          <Eye size={18} className="mr-2" />
                          <span className="font-medium">{post.views > 0 ? post.views : ''}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-gray-400 p-0 h-auto bg-transparent transition-colors duration-200"
                      >
                        <Bookmark size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && posts.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8 mt-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#C4B5FD] to-[#3B82F6] rounded-full flex items-center justify-center mb-6 shadow-lg">
              <PlusCircle size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {showMyPosts ? "No posts yet" : "No posts found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm text-base leading-relaxed">
              {showMyPosts
                ? "Share your first thought with the community"
                : "Be the first to start a conversation"}
            </p>
          </div>
        )}

        {/* Load more button */}
        {!loading && hasMore && posts.length > 0 && (
          <div className="flex justify-center py-6 border-b border-gray-200/60 dark:border-gray-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPosts(page + 1, true)}
              className="text-sm text-[#3B82F6] dark:text-[#3B82F6] bg-transparent px-6 py-2 rounded-full border border-[#C4B5FD]/30 dark:border-gray-700"
            >
              Show more posts
            </Button>
          </div>
        )}

        {/* Add some bottom padding to ensure the floating action button doesn't cover content */}
        <div className="h-32"></div>
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-24 right-6 md:bottom-24 md:right-10 z-40">
        <Button
          onClick={() => setIsCreatePostOpen(true)}
          className="w-14 h-14 rounded-full bg-[#3B82F6] text-white shadow-lg active:scale-95 transition-transform duration-150 touch-manipulation"
          aria-label="Create Post"
        >
          <PlusCircle size={22} />
        </Button>
      </div>

      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
        currentUser={currentUser}
      />

      {/* Full-screen image viewer */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-full w-full h-[100dvh] p-0 m-0 border-none bg-white/98 dark:bg-gray-900/98 rounded-none [&>button]:hidden">
          <div className="relative w-full h-full flex flex-col">
            {/* Header with close button */}
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImageViewerOpen(false)}
                className="rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-white shadow-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Image container */}
            <div className="flex-1 flex items-center justify-center p-4">
              {currentImage && (
                <div className="relative max-h-full max-w-full">
                  <Image
                    src={currentImage}
                    alt="Full-screen image"
                    width={1200}
                    height={1200}
                    className="max-h-[90vh] w-auto object-contain rounded-lg shadow-md dark:shadow-[0_0_30px_rgba(196,181,253,0.15)]"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-[#C4B5FD]/30 dark:border-gray-700 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {currentUser?.role === 'Admin' && postToDelete && posts.find(p => p._id === postToDelete)?.author._id !== currentUser._id
                ? "Admin: Delete Post"
                : "Delete Post"
              }
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              {currentUser?.role === 'Admin' && postToDelete && posts.find(p => p._id === postToDelete)?.author._id !== currentUser._id
                ? "As an admin, you are about to delete another user's post. This action cannot be undone."
                : "Are you sure you want to delete this post? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-white dark:bg-gray-700 border-[#C4B5FD]/30 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-[#C4B5FD]/10 dark:hover:bg-gray-600 hover:border-[#C4B5FD]/50 dark:hover:border-gray-500"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700"
            >
              {currentUser?.role === 'Admin' && postToDelete && posts.find(p => p._id === postToDelete)?.author._id !== currentUser._id
                ? "Delete as Admin"
                : "Delete"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Sheet */}
      <CommentSheet
        postId={activeCommentPostId || ''}
        isOpen={commentSheetOpen}
        onOpenChange={setCommentSheetOpen}
        onCommentAdded={() => activeCommentPostId && handleCommentAdded(activeCommentPostId)}
      />
    </div>
  );
}
