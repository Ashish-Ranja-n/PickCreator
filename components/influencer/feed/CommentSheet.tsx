"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ExternalLink, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hook/useCurrentUser";

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

interface CommentSheetProps {
  postId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded: () => void;
}

export default function CommentSheet({ postId, isOpen, onOpenChange, onCommentAdded }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  // Comment form state
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Load initial comments when sheet opens
  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  // Handle comment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const newComment = await response.json();
      setComments(prev => [newComment, ...prev]);
      onCommentAdded();
      setContent("");

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 rounded-t-xl p-0 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-gray-200/50 dark:border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-gray-900 dark:text-white text-lg">Comments</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {/* Comments list */}
          <div className="space-y-2">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg border border-gray-200/70 dark:border-zinc-800/70"
              >
                <div className="flex items-start space-x-2">
                  {/* Avatar with Instagram link */}
                  <div className="relative">
                    <Avatar className="h-7 w-7 ring-1 ring-fuchsia-300/50 dark:ring-fuchsia-500/30">
                      <AvatarImage src={comment.author.profilePictureUrl} alt={comment.author.name} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white text-xs">
                        {comment.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {comment.author.instagramUsername && (
                      <Link
                        href={getInstagramProfileUrl(comment.author.instagramUsername) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        aria-label={`Visit ${comment.author.name}'s Instagram profile`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {comment.author.name}
                        </span>
                        {comment.author.instagramUsername && (
                          <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            @{comment.author.instagramUsername}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0 ml-1">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-800 dark:text-white leading-snug break-words">
                      {comment.content}
                    </p>

                    <div className="flex items-center mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-gray-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <Heart size={12} className="mr-1" />
                        <span className="text-xs">{comment.likes.length}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-fuchsia-500" />
            </div>
          )}

          {/* Load more button */}
          {hasMore && !loading && comments.length > 0 && (
            <div className="flex justify-center pt-1 pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreComments}
                className="text-xs h-7 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Load more
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-center text-xs text-red-500 dark:text-red-400 py-1 bg-red-100/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-lg p-1">
              {error}
            </div>
          )}

          {/* No comments message */}
          {!loading && comments.length === 0 && !error && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-zinc-400 text-xs">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment form - fixed at the bottom */}
        <div className="border-t border-gray-200/50 dark:border-zinc-800/50 p-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[40px] max-h-[80px] py-2 px-3 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus-visible:ring-fuchsia-400 dark:focus-visible:ring-fuchsia-500 focus-visible:border-fuchsia-300/50 dark:focus-visible:border-fuchsia-500/50 resize-none"
              disabled={isSubmitting || !currentUser}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || !currentUser}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white h-9 w-9 p-0 rounded-full flex-shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 rotate-[-45deg]" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
