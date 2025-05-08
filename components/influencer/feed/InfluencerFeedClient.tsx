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
  const { toast } = useToast();

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
  }, [feedType, showMyPosts, currentUser]);

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
    <div className="relative w-full mx-auto min-h-screen bg-white dark:bg-zinc-950">
      {/* Fixed header with buttons - using fixed positioning */}
      <div className="fixed top-[46px] dark:top-[50px] md:top-[68px] left-0 right-0 z-30 py-3 px-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-gray-200/50 dark:border-zinc-800/50 flex justify-between items-center shadow-md">
        <div className="w-full mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 rounded-full transition-all duration-300 ${showMyPosts
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white shadow-md ring-1 ring-fuchsia-500/30 scale-105'
                      : 'bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 hover:shadow-[0_0_10px_rgba(192,38,211,0.3)]'}`}
                    onClick={() => setShowMyPosts(!showMyPosts)}
                  >
                    <User size={16} className={`${showMyPosts ? 'scale-110' : ''} transition-transform duration-300`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-200 dark:border-zinc-800 shadow-lg">
                  <p>{showMyPosts ? 'Viewing your posts' : 'View your posts'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <h2 className="text-base font-medium text-gray-900 dark:text-white block">
              {showMyPosts ? 'My Posts' : 'Influencer Community'}
            </h2>
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-zinc-900 p-0.5 rounded-full shadow-md border border-gray-200/50 dark:border-zinc-800/50">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 rounded-full px-3 text-xs font-medium transition-all duration-300 ${feedType === 'live'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white shadow-md'
                : 'text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
              onClick={() => setFeedType("live")}
            >
              <Zap size={14} className={`mr-1.5 ${feedType === 'live' ? 'text-white animate-pulse' : 'text-fuchsia-500 dark:text-fuchsia-400'}`} />
              Live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 rounded-full px-3 text-xs font-medium transition-all duration-300 ${feedType === 'top'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-white shadow-md'
                : 'text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
              onClick={() => setFeedType("top")}
            >
              <TrendingUp size={14} className={`mr-1.5 ${feedType === 'top' ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
              Top
            </Button>
          </div>
        </div>
      </div>

      {/* Add padding to account for the fixed header */}
      <div className="pt-[75px]"></div>

      {/* Content container */}
      <div
        ref={scrollContainerRef}
        className="max-w-xl mx-auto divide-y divide-gray-100 dark:divide-zinc-800/50"
      >
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Loading posts...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="py-6 px-4 text-center border-b border-gray-100 dark:border-zinc-800/50">
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
              className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800/50 pb-3 mb-1"
            >
              <div className="pt-4 px-3">
                <div className="flex">
                  {/* Avatar column */}
                  <div className="mr-3 flex-shrink-0">
                    <div className="relative group">
                      <Avatar className="h-10 w-10 ring-1 ring-gray-200 dark:ring-zinc-700">
                        <AvatarImage src={getProfilePicture(post.author)} alt={post.author?.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white">
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
                    <div className="flex items-start justify-between mb-0.5">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">{post.author?.name || "User"}</span>
                          {post.author?.instagramUsername ? (
                            <Link
                              href={getInstagramProfileUrl(post.author.instagramUsername) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-500 dark:text-zinc-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors flex items-center group"
                            >
                              @{post.author.instagramUsername}
                              <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-zinc-400">@{post.author?.username || "user"}</span>
                          )}
                          <span className="text-gray-400 dark:text-zinc-500 text-sm">·</span>
                          <span className="text-sm text-gray-400 dark:text-zinc-500">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-white transition-colors">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
                          {currentUser && post.author && post.author._id === currentUser._id && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(post._id)}
                              className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:bg-gray-100 dark:focus:bg-zinc-800 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Post
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Post content */}
                    <div className="mt-1">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    </div>

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.hashtags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-800/30 border-none text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Post media if available */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3">
                        <div className={`${post.media.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
                          {post.media.map((mediaUrl, idx) => {
                            const isSingleImage = post.media && post.media.length === 1;
                            return (
                              <div
                                key={idx}
                                className={`relative overflow-hidden rounded-md ${isSingleImage ? 'w-full' : ''}`}
                              >
                                <div
                                  className="cursor-pointer"
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
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex space-x-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-400 p-0 h-auto bg-transparent ${likedPosts[post._id] ? 'text-pink-500 dark:text-pink-400' : ''}`}
                          onClick={() => handleLike(post._id)}
                        >
                          <Heart size={18} className={`mr-1.5 transition-transform hover:scale-110 ${likedPosts[post._id] ? 'fill-current animate-heartBeat' : ''}`} />
                          <span className="text-xs">{post.likes.length > 0 ? post.likes.length : ''}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-500 dark:text-zinc-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 p-0 h-auto bg-transparent ${activeCommentPostId === post._id && commentSheetOpen ? 'text-fuchsia-500 dark:text-fuchsia-400' : ''}`}
                          onClick={() => toggleComments(post._id)}
                        >
                          <MessageCircle size={18} className="mr-1.5 transition-transform hover:scale-110" />
                          <span className="text-xs">{post.commentCount > 0 ? post.commentCount : ''}</span>
                        </Button>
                        <div className="flex items-center text-gray-500 dark:text-zinc-400 text-xs">
                          <Eye size={16} className="mr-1.5" />
                          <span>{post.views > 0 ? post.views : ''}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 p-0 h-auto bg-transparent"
                      >
                        <Bookmark size={16} className="transition-transform hover:scale-110" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && posts.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-zinc-950 p-8 mt-4 border-t border-b border-gray-100 dark:border-zinc-800/50">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 rounded-full flex items-center justify-center mb-4">
              <PlusCircle size={22} className="text-white animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showMyPosts ? "You haven't created any posts yet" : "No posts found"}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 max-w-md">
              {showMyPosts
                ? "Start your journey by creating your first post"
                : "Be the first to start a conversation in this community"}
            </p>
          </div>
        )}

        {/* Load more button */}
        {!loading && hasMore && posts.length > 0 && (
          <div className="flex justify-center py-4 border-b border-gray-100 dark:border-zinc-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPosts(page + 1, true)}
              className="text-sm text-fuchsia-500 dark:text-fuchsia-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
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
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white shadow-md hover:scale-105 transition-all duration-300"
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
        <DialogContent className="max-w-full w-full h-[100dvh] p-0 m-0 border-none bg-gray-50/98 dark:bg-zinc-950/98 rounded-none">
          <div className="relative w-full h-full flex flex-col">
            {/* Header with close button */}
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImageViewerOpen(false)}
                className="rounded-full bg-white/70 dark:bg-zinc-900/70 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm dark:hover:shadow-[0_0_10px_rgba(192,38,211,0.3)]"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Image container */}
            <div className="flex-1 flex items-center justify-center p-4">
              {currentImage && (
                <div className="relative max-h-full max-w-full group">
                  <div className="absolute inset-0 bg-fuchsia-300/5 dark:bg-fuchsia-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src={currentImage}
                    alt="Full-screen image"
                    width={1200}
                    height={1200}
                    className="max-h-[90vh] w-auto object-contain rounded-lg shadow-md dark:shadow-[0_0_30px_rgba(192,38,211,0.15)]"
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
        <DialogContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Post</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
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
