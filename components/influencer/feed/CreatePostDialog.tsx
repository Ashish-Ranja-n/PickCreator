"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Image as ImageIcon, X, Hash } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/utils/uploadMedia";

// Define the Post type to match what's in the influencer page
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

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  currentUser: any;
}

export default function CreatePostDialog({
  isOpen,
  onClose,
  onPostCreated,
  currentUser,
}: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Cloudinary URLs will be used when uploading images to the server
  const [, setCloudinaryUrls] = useState<string[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [hashtagError, setHashtagError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Available hashtags
  const availableHashtags = [
    "influencer", "marketing", "content", "collaboration",
    "branding", "socialmedia", "creator", "partnership",
    "sponsored", "campaign"
  ];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setIsSubmitting(false);
      setCharCount(0);
      setImages([]);
      setImageUrls([]);
      setCloudinaryUrls([]);
      setSelectedHashtags([]);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen]);

  // Toggle hashtag selection
  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      } else {
        if (prev.length >= 4) {
          toast({
            title: "Maximum hashtags reached",
            description: "You can select up to 4 hashtags",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, hashtag];
      }
    });
  };

  // Update character count
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  // Create object URLs for image previews
  useEffect(() => {
    if (images.length > 0) {
      const urls = images.map(file => URL.createObjectURL(file));
      setImageUrls(urls);

      // Cleanup function to revoke object URLs
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [images]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limit to 2 images total
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...images, ...newFiles];

      if (totalFiles.length > 2) {
        toast({
          title: "Too many images",
          description: "You can only upload a maximum of 2 images",
          variant: "destructive",
        });
        return;
      }

      setImages(prev => [...prev, ...newFiles]);
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async () => {
    if (images.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        // Update progress for each image
        setUploadProgress(Math.round((i / images.length) * 50));

        // Upload the image to Cloudinary
        const result = await uploadFile(
          images[i],
          'chat', // Using 'chat' type for now, could create a 'post' type
          undefined, // No message ID for posts
          (progress) => {
            // Calculate overall progress considering multiple images
            const baseProgress = Math.round((i / images.length) * 100);
            const currentFileProgress = Math.round(progress / images.length);
            setUploadProgress(baseProgress + currentFileProgress);
          }
        );

        if (result && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error states
    setContentError(false);
    setHashtagError(false);

    // Validate form
    let hasError = false;

    // Check content (required if no images)
    if (!content.trim() && images.length === 0) {
      setContentError(true);
      hasError = true;
    }

    // Check hashtags
    if (selectedHashtags.length === 0) {
      setHashtagError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to create posts",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Cloudinary if there are any
      let mediaUrls: string[] = [];
      if (images.length > 0) {
        setIsUploading(true);
        mediaUrls = await uploadImagesToCloudinary();
        setIsUploading(false);

        if (mediaUrls.length === 0 && images.length > 0) {
          throw new Error("Failed to upload images");
        }
      }

      // Create the post with the Cloudinary URLs
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          media: mediaUrls,
          hashtags: selectedHashtags,
          mentions: content.match(/@[^\s@]+/g)?.map(mention => mention.substring(1)) || [],
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      const newPost = await response.json();
      onPostCreated(newPost);
      onClose();

      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // No longer needed as we're using inline conditional classes

  // Calculate progress percentage
  const progressPercentage = Math.min((charCount / 500) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-[#C4B5FD]/30 dark:border-gray-700 max-w-full w-full h-[100dvh] p-0 m-0 rounded-none shadow-none flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-4 py-3 border-b border-[#C4B5FD]/30 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-medium bg-gradient-to-r from-[#C4B5FD] to-[#3B82F6] bg-clip-text text-transparent">Create a Post</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-600 dark:text-gray-400 transition-colors duration-200">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 bg-white dark:bg-gray-900" style={{ height: "calc(100dvh - 130px)" }}>
          <form id="post-form" onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
          {/* Character counter and progress bar */}
          <div className="mb-4 mt-1">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  charCount > 450 ? 'bg-red-400' :
                  charCount > 300 ? 'bg-amber-400' :
                  'bg-[#C4B5FD]'
                }`}></span>
                {charCount}/500 characters
              </span>
              <span className={`font-medium ${
                charCount > 450 ? 'text-red-400' :
                charCount > 300 ? 'text-amber-400' :
                'text-[#3B82F6]'
              }`}>
                {500 - charCount} remaining
              </span>
            </div>

            <div className="h-1 w-full bg-[#C4B5FD]/20 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className={`h-full ${
                  charCount > 450 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                  charCount > 300 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-[#C4B5FD] to-[#3B82F6]'
                } shadow-sm`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Main content input area */}
          <div className="relative rounded-xl shadow-md overflow-hidden">
            <Textarea
              placeholder="What would you like to share with the world today?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (e.target.value.trim()) setContentError(false);
              }}
              className={`min-h-[180px] bg-white dark:bg-gray-800
                border-[#C4B5FD]/30 dark:border-gray-700 rounded-xl text-lg text-gray-900 dark:text-white
                placeholder:text-gray-500 dark:placeholder:text-gray-400
                focus-visible:ring-[#3B82F6] leading-relaxed resize-none
                transition-all duration-200 p-4
                ${contentError ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10' : 'border-[#C4B5FD]/30 dark:border-gray-700/50'}`}
              maxLength={500}
            />
            {contentError && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border-t border-red-200 dark:border-red-800/30">
                Please enter some text or add an image
              </div>
            )}
          </div>

          {/* Image upload section */}
          <div className="space-y-3 bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-[#C4B5FD]/30 dark:border-gray-700 shadow-md">
            {/* Image previews */}
            {imageUrls.length > 0 && (
              <div className={`${imageUrls.length > 1 ? 'flex gap-1' : 'flex justify-center'} mb-3`}>
                {imageUrls.map((url, index) => {
                  const isSingleImage = imageUrls.length === 1;
                  return (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-lg
                        ${isSingleImage ? 'w-full max-w-[70%] mx-auto' : 'w-[49.5%]'}`}
                    >
                      <Image
                        src={url}
                        alt={`Image ${index + 1}`}
                        width={600}
                        height={600}
                        sizes={isSingleImage ? "(max-width: 768px) 70vw, 400px" : "(max-width: 768px) 49vw, 350px"}
                        className="w-full h-auto"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full z-10"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image upload button */}
            {images.length < 2 && (
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  ref={fileInputRef}
                  multiple={images.length === 0}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 bg-[#C4B5FD]/20 dark:bg-gray-700 border-[#C4B5FD]/30 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-[#C4B5FD]/30 dark:hover:bg-gray-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={14} className="text-[#3B82F6]" />
                  {images.length === 0 ? "Add images (max 2)" : "Add another image"}
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-3 bg-[#C4B5FD]/20 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {images.length}/2 images
                </span>
              </div>
            )}
          </div>

          {/* Hashtag selection */}
          <div className={`p-4 rounded-xl transition-colors bg-white dark:bg-gray-800/80 border border-[#C4B5FD]/30 dark:border-gray-700 shadow-md
            ${hashtagError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium flex items-center ${hashtagError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                <Hash size={18} className={`mr-2 ${hashtagError ? 'text-red-600 dark:text-red-400' : 'text-[#3B82F6]'}`} />
                Select hashtags (1-4) <span className="text-red-600 dark:text-red-400 ml-1">{hashtagError ? ' - Required' : ''}</span>
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                hashtagError
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium'
                  : selectedHashtags.length > 0
                    ? 'bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 text-[#3B82F6]'
                    : 'bg-[#C4B5FD]/20 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {selectedHashtags.length}/4 selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableHashtags.map(hashtag => {
                const isSelected = selectedHashtags.includes(hashtag);
                return (
                  <Badge
                    key={hashtag}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 py-1.5 px-3 text-sm ${
                      isSelected
                        ? 'bg-[#3B82F6] text-white shadow-sm'
                        : hashtagError
                          ? 'bg-transparent text-red-600 dark:text-red-400 border-red-300 dark:border-red-700/50'
                          : 'bg-[#C4B5FD]/20 dark:bg-gray-700 text-gray-700 dark:text-white border-[#C4B5FD]/30 dark:border-gray-600'
                    }`}
                    onClick={() => {
                      toggleHashtag(hashtag);
                      if (hashtagError) setHashtagError(false);
                    }}
                  >
                    #{hashtag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Upload progress indicator */}
          {isUploading && (
            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-[#C4B5FD]/30 dark:border-gray-700 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#C4B5FD]" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Uploading images...</span>
                </div>
                <span className="text-sm font-bold bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-0.5 rounded-full">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#C4B5FD]/20 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C4B5FD] to-[#3B82F6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
          </form>
        </div>

        {/* Fixed Footer with Publish Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-[#C4B5FD]/30 dark:border-gray-700 p-4 z-20">
          <div className="max-w-3xl mx-auto flex justify-end">
            <Button
              type="submit"
              form="post-form"
              disabled={isSubmitting || isUploading || (!content.trim() && images.length === 0) || selectedHashtags.length === 0}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-base font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:bg-[#C4B5FD]/30 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Publishing..."}
                </>
              ) : (
                "Publish Post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}