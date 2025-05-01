"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Instagram, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AddComment from "./AddComment";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface Author {
  _id: string;
  name: string;
  profilePictureUrl?: string;
  username: string;
  instagramUsername?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: Author;
  likes: string[];
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, currentUserId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Fetch comments
  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/comments?page=${pageNum}&limit=10`);

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();

      if (append) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial comments
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Handle comment added
  const handleCommentAdded = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
    onCommentAdded();
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

  // Load more comments
  const loadMoreComments = () => {
    if (hasMore && !loading) {
      fetchComments(page + 1, true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Add comment form */}
      <AddComment postId={postId} onCommentAdded={handleCommentAdded} />

      {/* Comments list */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">
            {comments.length > 0 ? `Comments (${comments.length})` : "No comments yet"}
          </h3>
          <Separator className="flex-1 bg-zinc-800/50" />
        </div>

        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/70 hover:border-fuchsia-500/30 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Avatar with Instagram link */}
                <div className="relative group">
                  <Avatar className="h-8 w-8 ring-2 ring-fuchsia-500/30 ring-offset-2 ring-offset-zinc-900 transition-all duration-300 group-hover:ring-fuchsia-500/70">
                    <AvatarImage src={comment.author.profilePictureUrl} alt={comment.author.name} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xs">
                      {comment.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {comment.author.instagramUsername && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Instagram size={12} className="text-white" />
                      </div>
                      <Link
                        href={getInstagramProfileUrl(comment.author.instagramUsername) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        aria-label={`Visit ${comment.author.name}'s Instagram profile`}
                      />
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {comment.author.name}
                      </span>
                      {/* Instagram username with link */}
                      {comment.author.instagramUsername ? (
                        <Link
                          href={getInstagramProfileUrl(comment.author.instagramUsername) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-400 hover:text-fuchsia-400 transition-colors flex items-center group"
                        >
                          @{comment.author.instagramUsername}
                          <ExternalLink size={8} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          @{comment.author.username}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>

                  <div className="flex items-center pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      <Heart size={14} className="mr-1 transition-transform hover:scale-110" />
                      <span className="text-xs">{comment.likes.length}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500 drop-shadow-[0_0_8px_rgba(192,38,211,0.5)]" />
          </div>
        )}

        {/* Load more button */}
        {hasMore && !loading && comments.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreComments}
              className="text-xs bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white hover:border-fuchsia-500/50 hover:shadow-[0_0_10px_rgba(192,38,211,0.2)] transition-all duration-300"
            >
              Load more comments
            </Button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-center text-sm text-red-400 py-2 bg-red-900/20 border border-red-800/30 rounded-lg p-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
