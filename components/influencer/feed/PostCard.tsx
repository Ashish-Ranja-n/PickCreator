"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Heart, MoreHorizontal, Trash2, Instagram, Calendar, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface PostCardProps {
  post: {
    _id: string;
    content: string;
    author: {
      _id: string;
      name: string;
      profilePictureUrl?: string;
      image?: string;
      username: string;
      instagramUsername?: string;
      role?: string;
      instagram?: {
        username?: string;
        profilePicture?: string;
        followersCount?: number;
        connected?: boolean;
      };
    };
    likes: string[];
    createdAt: string;
  };
  currentUser?: {
    _id: string;
    id?: string;
    role?: string;
    [key: string]: any;
  };
  onPostDeleted?: (postId: string) => void;
  adminView?: boolean;
}

export default function PostCard({ post, currentUser, onPostDeleted, adminView = false }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-10% 0px -10% 0px" });
  const { toast } = useToast();
  
  // Default values for when post is undefined or null
  const hasValidPost = post && post._id;
  const initialLikedState = currentUser?._id && post?.likes && Array.isArray(post.likes) &&
    post.likes.some(id => id && id.toString() === (currentUser._id || currentUser.id)?.toString());
  
  const [isLiked, setIsLiked] = useState(initialLikedState || false);
  const [likesCount, setLikesCount] = useState((post?.likes?.length || 0));
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showDoubleTapHint, setShowDoubleTapHint] = useState(true);
  const [isLikeInProgress, setIsLikeInProgress] = useState(false);

  // Check localStorage for hint display preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hintShown = localStorage.getItem('doubleTapHintShown') === 'true';
      setShowDoubleTapHint(!hintShown);
    }
  }, []);
  
  // Show hint briefly when card comes into view
  useEffect(() => {
    if (isInView && showDoubleTapHint) {
      // Hide the hint after 3 seconds
      const timer = setTimeout(() => {
        setShowDoubleTapHint(false);
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('doubleTapHintShown', 'true');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, showDoubleTapHint]);

  // If post is undefined or null, return early but after all hook calls
  if (!hasValidPost) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center">
        <p className="text-gray-500">Post data is unavailable</p>
      </div>
    );
  }

  // Content processing, moved after hook calls but before component return
  const isLongContent = post.content && post.content.length > 300;
  // const truncatedContent = isLongContent && !isExpanded
  //   ? post.content.substring(0, 300) + '...'
  //   : post.content || '';

  // Extract quotes for pull quotes (text in single or double quotes)
  const quotes = post.content ? post.content.match(/["']([^"']+)["']/g) || [] : [];
  // Check quotes[0] exists before checking its length
  const hasPullQuote = quotes.length > 0 && typeof quotes[0] === 'string' && quotes[0].length > 20;
  const pullQuote = hasPullQuote && quotes[0] ? quotes[0].replace(/["']/g, '') : '';

  // Handle double tap on post content
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      handleLike();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    
    setLastTap(now);
  };

  // Handle double click (for desktop)
  const handleDoubleClick = () => {
    handleLike();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to like posts",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple simultaneous like requests
    if (isLikeInProgress) {
      return;
    }

    try {
      setIsLikeInProgress(true);
      
      // Optimistically update UI to make the interaction feel faster
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to like post");
      }

      // Update state based on server response
      const data = await response.json();
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      
      console.log("Like status updated:", data);
    } catch (error: any) {
      console.error("Like error:", error);
      // Revert to original state in case of error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    } finally {
      // Add a small delay before allowing the next like operation
      setTimeout(() => {
        setIsLikeInProgress(false);
      }, 500);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete post");

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/post/${post._id}`
      );
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Get profile picture from either profilePictureUrl, image field, or instagram.profilePicture for admins
  const getProfilePicture = (user: any) => {
    if (!user) return "/default-avatar.png";
    
    // First check for influencer structure (profilePictureUrl)
    if (user.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    
    // Then check for admin structure (instagram.profilePicture)
    if (user.instagram && user.instagram.profilePicture) {
      return user.instagram.profilePicture;
    }
    
    // Then check for standard fields
    return user.image || "/default-avatar.png";
  };

  // Get Instagram username or fallback to platform username
  const getInstagramUsername = () => {
    if (!post.author) return "user";
    
    // First check for influencer structure (instagramUsername)
    if (post.author.instagramUsername) {
      return post.author.instagramUsername;
    }
    
    // Then check for admin structure (instagram.username)
    if (post.author.instagram && post.author.instagram.username) {
      return post.author.instagram.username;
    }
    
    // Then fall back to standard username
    return post.author.username || "user";
  };

  // Create Instagram profile URL
  const getInstagramProfileUrl = () => {
    const username = getInstagramUsername();
    return `https://instagram.com/${username}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      ref={cardRef}
      className={`w-full bg-white rounded-2xl p-6 shadow-md border border-gray-100 transition-all duration-300 
        hover:shadow-lg ${isLiked ? "liked" : ""}`}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {/* Post Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
            <Image 
              src={getProfilePicture(post.author)} 
              alt={post.author?.name || "User"} 
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{post.author?.name || "Unknown User"}</h3>
              {(post.author?.role === 'admin' || post.author?.role === 'Admin') && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Admin
                </span>
              )}
            </div>
            <a 
              href={getInstagramProfileUrl()} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Instagram className="h-3 w-3 mr-1" />
              @{getInstagramUsername()}
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 mr-2 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(post.createdAt)}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Admin can delete any post */}
              {(adminView || currentUser?._id === post.author?._id) && (
                <DropdownMenuItem onClick={handleDelete}>
                  Delete
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleShare}>
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Post Content - Tappable for double-tap like */}
      <div 
        className="relative mb-4 select-none"
        onTouchStart={handleTap}
        onDoubleClick={handleDoubleClick}
      >
        {/* Double tap heart animation */}
        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="h-20 w-20 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Double tap hint */}
        <AnimatePresence>
          {showDoubleTapHint && isInView && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg pointer-events-none"
            >
              <div className="text-white text-center">
                <div className="flex justify-center mb-1">
                  <Heart className="h-8 w-8" />
                </div>
                <p className="text-sm">Double tap to like</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pull quote styling if we have a nicely quotable section */}
        {hasPullQuote && (
          <div className="text-lg italic text-gray-600 border-l-4 border-blue-500 pl-4 my-4">
            "{pullQuote}"
          </div>
        )}
        
        {/* Main post content */}
        <div className="prose prose-sm max-w-none">
          <p className={`whitespace-pre-wrap ${isExpanded ? "" : ""}`}>
            {post.content}
          </p>
        </div>
        
        {/* Show "Read more" button for long content */}
        {isLongContent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-blue-600 text-sm font-medium hover:underline"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`group ${isLiked ? "text-red-500" : "text-gray-500"}`}
          >
            <Heart className={`h-5 w-5 mr-1 transition-colors duration-200 ${isLiked ? "fill-red-500" : "fill-transparent group-hover:text-red-400"}`} />
            {likesCount > 0 && likesCount}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-gray-500 hover:text-blue-500"
          >
            <Share2 className="h-5 w-5 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 