"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hook/useCurrentUser";
import PostCard from "@/components/influencer/feed/PostCard";
import { motion, AnimatePresence } from "framer-motion";

interface PostFeedProps {
  type: "latest" | "trending" | "my-posts";
  adminView?: boolean;
}

const PostFeed = forwardRef<{ refreshPosts: () => void }, PostFeedProps>(
  ({ type, adminView = false }, ref) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const currentUser = useCurrentUser();

    // Expose the refreshPosts method to parent components
    useImperativeHandle(ref, () => ({
      refreshPosts: () => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1);
      }
    }));

    useEffect(() => {
      setLoading(true);
      setPosts([]);
      setPage(1);
      setHasMore(true);
      
      fetchPosts(1);
    }, [type, currentUser]);

    const fetchPosts = async (pageToFetch = page) => {
      if (type === "my-posts" && !currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Construct the API URL based on post type
        let url = `/api/posts?page=${pageToFetch}&limit=10`;
        
        if (type === "trending") {
          url += "&sort=popular";
        } else if (type === "my-posts" && currentUser) {
          url += `&author=me`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch posts");
        
        const data = await response.json();
        
        // Check if data is an array or an object with posts property
        let postsArray = Array.isArray(data) ? data : data.posts || [];
        
        // Filter out any posts without _id
        postsArray = postsArray.filter((post: any) => post && post._id);
        
        // Sort posts by likes count if type is trending
        if (type === "trending") {
          postsArray = postsArray.sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }
        
        if (pageToFetch === 1) {
          setPosts(postsArray);
        } else {
          setPosts(prev => {
            const combined = [...prev, ...postsArray];
            // Re-sort if type is trending
            return type === "trending" 
              ? combined.sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0))
              : combined;
          });
        }
        
        // If we get fewer posts than the limit, there are no more posts
        setHasMore(postsArray.length === 10);
        setPage(pageToFetch + 1);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadMorePosts = () => {
      fetchPosts();
    };

    const handlePostDeleted = (deletedPostId: string) => {
      // Remove the deleted post from the state
      setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
    };

    if (loading && posts.length === 0) {
      return (
        <div className="flex justify-center py-12">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-pink-500 border-l-transparent animate-spin"></div>
            <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-t-transparent border-r-purple-500 border-b-transparent border-l-purple-500 animate-spin animation-delay-150"></div>
          </div>
        </div>
      );
    }

    if (!loading && posts.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-10 border border-gray-200 shadow-sm text-center"
        >
          <div className="mb-4 text-5xl">✍️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">
            {type === "my-posts" 
              ? "You haven't created any posts yet" 
              : "No posts found"}
          </h3>
          <p className="text-gray-500">
            {type === "my-posts" 
              ? "Your creative journey begins with your first post" 
              : "Be the first to start a conversation"}
          </p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-10">
        <AnimatePresence>
          {posts.filter(post => post && post._id).map((post: any, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
            >
              <PostCard 
                post={post} 
                currentUser={currentUser || undefined} 
                onPostDeleted={handlePostDeleted}
                adminView={adminView}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {hasMore && !loading && (
          <motion.div 
            className="flex justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              onClick={loadMorePosts} 
              variant="outline"
              className="py-6 px-8 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm font-medium text-lg text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all duration-300"
            >
              Load More
            </Button>
          </motion.div>
        )}
        
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    );
  }
);

PostFeed.displayName = "PostFeed";

export default PostFeed; 