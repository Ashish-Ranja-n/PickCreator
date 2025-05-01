"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import CreatePostDialog from "@/components/influencer/feed/CreatePostDialog";
import { useCurrentUser } from "@/hook/useCurrentUser";
import PostFeed from "@/components/influencer/feed/PostFeed";
import { motion } from "framer-motion";

// Define the type for the ref
type PostFeedRefType = {
  refreshPosts: () => void;
};

export default function AdminFeedClient() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState("latest");
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Create properly typed refs
  const latestPostsRef = useRef<PostFeedRefType>(null);
  const trendingPostsRef = useRef<PostFeedRefType>(null);
  const myPostsRef = useRef<PostFeedRefType>(null);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const progress = (scrollTop / (documentHeight - windowHeight)) || 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePostCreated = () => {
    // Close the dialog
    setIsCreatePostOpen(false);
    
    // If we're on the "latest" tab, we should refresh that list
    if (activeTab === "latest" && latestPostsRef.current) {
      latestPostsRef.current.refreshPosts();
    }
    
    // If it's the user's post, also refresh "my-posts" tab
    if (myPostsRef.current) {
      myPostsRef.current.refreshPosts();
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 z-50"
        style={{ scaleX: scrollProgress, transformOrigin: "left" }}
      />

      {/* Hero Section */}
      <motion.div 
        className="relative mb-12 overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-gradient-xy"></div>
        <div className="relative p-8 md:p-12 text-white">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <TypewriterEffect text="Admin Dashboard" />
          </motion.h1>
          <motion.p 
            className="text-xl opacity-90 mb-6 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Monitor platform activity and engage with the community
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Button 
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              size="lg"
            >
              Create Post
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - Posts */}
      <div className="w-full space-y-6">
        <Tabs 
          defaultValue="latest" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid grid-cols-3 mb-8 bg-gray-100/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="latest" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
            >
              Latest
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
            >
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="my-posts" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
            >
              My Posts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="latest" className="space-y-8">
            <PostFeed type="latest" ref={latestPostsRef} adminView={true} />
          </TabsContent>
          
          <TabsContent value="trending" className="space-y-8">
            <PostFeed type="trending" ref={trendingPostsRef} adminView={true} />
          </TabsContent>
          
          <TabsContent value="my-posts" className="space-y-8">
            <PostFeed type="my-posts" ref={myPostsRef} adminView={true} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-20 right-6 md:bottom-10 md:right-10 z-10 group">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300 scale-110"></div>
        
        {/* Glass button container */}
        <div className="relative bg-white/20 backdrop-blur-lg rounded-full p-[2px] shadow-lg overflow-hidden">
          {/* Gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full opacity-70"></div>
          
          {/* Button */}
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            className="relative w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 text-transparent flex items-center justify-center transition-all duration-300 hover:scale-105 z-10"
            aria-label="Create Post"
          >
            <PlusCircle size={24} className="text-blue-500" />
          </Button>
        </div>
      </div>

      <CreatePostDialog 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
        currentUser={currentUser}
      />
    </div>
  );
}

// Typewriter Effect Component
function TypewriterEffect({ text = "" }: { text?: string }) {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    if (!text) return;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [text]);
  
  return <span>{displayText}<span className="animate-pulse">|</span></span>;
} 