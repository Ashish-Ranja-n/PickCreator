'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Play, Trash2, Loader2, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';

interface VideoShowcaseProps {
  videos: Array<{
    url: string;
    title: string;
    uploadedAt: Date;
  }>;
  onVideoDeleted: (videoUrl: string) => void;
  isVerified: boolean;
}

const VideoShowcase: React.FC<VideoShowcaseProps> = ({
  videos,
  onVideoDeleted,
  isVerified
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Safety check for videos array
  const safeVideos = Array.isArray(videos) ? videos.filter(video =>
    video &&
    typeof video === 'object' &&
    video.url &&
    typeof video.url === 'string' &&
    video.title &&
    typeof video.title === 'string'
  ) : [];

  console.log('VideoShowcase rendered with videos:', safeVideos);

  const handleVideoClick = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
  };

  const handleDeleteClick = (videoUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setVideoToDelete(videoUrl);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete('/api/influencer/videos', {
        data: { videoUrl: videoToDelete }
      });

      if (response.data.success) {
        toast({
          title: "Video Deleted",
          description: "Your showcase video has been deleted successfully.",
          variant: "default",
        });
        
        onVideoDeleted(videoToDelete);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  const getVideoThumbnail = (videoUrl: string) => {
    // Extract Cloudinary public ID and create thumbnail URL
    try {
      const urlParts = videoUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf('/'));
      
      // Create thumbnail URL with Cloudinary transformations
      return `${baseUrl}/${publicId}.jpg`;
    } catch (error) {
      return null;
    }
  };

  if (!isVerified) {
    return null;
  }

  if (safeVideos.length === 0) {
    return (
      <div className="text-center py-6">
        <Video className="h-8 w-8 text-gray-400 dark:text-zinc-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          No showcase reels uploaded yet
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          Upload vertical videos (9:16 ratio) to showcase your work
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-first grid: 2 columns on all screen sizes for reels */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-md mx-auto md:max-w-lg">
        {safeVideos.map((video, index) => {
          return (
            <div
              key={`video-${index}-${video.url}`}
              className="group relative bg-black rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 w-full"
              onClick={() => handleVideoClick(video.url)}
            >
              {/* 9:16 aspect ratio for reel format */}
              <div className="relative aspect-[9/16]">
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video load error:', e);
                    console.error('Video URL:', video.url);
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started:', video.url);
                  }}
                />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 md:h-8 md:w-8 text-white ml-0.5" />
                  </div>
                </div>

                {/* Delete button - smaller for mobile */}
                <Button
                  onClick={(e) => handleDeleteClick(video.url, e)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-1.5 right-1.5 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>

              {/* Title and date - compact for mobile */}
              <div className="p-2 md:p-3 bg-white dark:bg-zinc-900">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                  {video.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {new Date(video.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Video Player Modal - Optimized for reel format */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-sm md:max-w-md w-full bg-black border-0 p-0">
          {/* 9:16 aspect ratio for reel playback */}
          <div className="relative aspect-[9/16] w-full">
            {selectedVideo && (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-full object-contain rounded-lg"
                playsInline // Important for mobile playback
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Delete Showcase Video
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              Are you sure you want to delete this showcase video? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoShowcase;
