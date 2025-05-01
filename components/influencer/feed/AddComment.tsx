"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

interface AddCommentProps {
  postId: string;
  onCommentAdded: (comment: any) => void;
}

export default function AddComment({ postId, onCommentAdded }: AddCommentProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

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
      onCommentAdded(newComment);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] bg-zinc-900/80 border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus-visible:ring-fuchsia-500 focus-visible:border-fuchsia-500/50 resize-none transition-all duration-200"
        disabled={isSubmitting || !currentUser}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim() || !currentUser}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
