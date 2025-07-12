'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface VideoUploadProps {
  onUploadSuccess: (video: { url: string; title: string; uploadedAt: Date }) => void;
  isVerified: boolean;
  currentVideoCount: number;
  maxVideos?: number;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadSuccess,
  isVerified,
  currentVideoCount,
  maxVideos = 2
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const canUpload = isVerified && currentVideoCount < maxVideos;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file (MP4, MOV, AVI, MKV, WebM)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Video file must be less than 500MB",
        variant: "destructive",
      });
      return;
    }

    // Store the file and show title input
    setSelectedFile(file);
    setShowTitleInput(true);
  };

  const handleUploadWithTitle = async () => {
    if (!selectedFile || !videoTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a video title",
        variant: "destructive",
      });
      return;
    }

    await handleUpload(selectedFile, videoTitle.trim());
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setVideoTitle('');
    setShowTitleInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (file: File, title: string) => {
    if (!canUpload) {
      console.error('Cannot upload: canUpload is false');
      return;
    }

    console.log('Starting video upload for file:', file.name, 'Size:', file.size, 'Title:', title);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get upload credentials from our server
      console.log('Getting upload credentials...');
      const credentialsResponse = await axios.post('/api/influencer/videos/credentials', {
        filename: file.name,
        filesize: file.size,
        title: title
      });

      if (!credentialsResponse.data.success) {
        throw new Error(credentialsResponse.data.error || 'Failed to get upload credentials');
      }

      const { uploadUrl, publicId, timestamp, signature, apiKey, folder } = credentialsResponse.data;

      // Step 2: Upload directly to Cloudinary using signed upload
      console.log('Uploading directly to Cloudinary...');
      console.log('Upload credentials:', { publicId, timestamp, signature });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
            console.log('Upload progress:', progress + '%');
          }
        },
        timeout: 600000, // 10 minutes timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('Cloudinary upload response:', uploadResponse.data);

      if (!uploadResponse.data.secure_url) {
        throw new Error('Upload to Cloudinary failed');
      }

      // Step 3: Save video metadata to our database
      console.log('Saving video metadata to database...');
      const saveResponse = await axios.post('/api/influencer/videos/save', {
        title: title,
        url: uploadResponse.data.secure_url,
        publicId: uploadResponse.data.public_id,
        duration: uploadResponse.data.duration,
        format: uploadResponse.data.format,
        bytes: uploadResponse.data.bytes
      });

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || 'Failed to save video metadata');
      }

      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded successfully!",
        variant: "default",
      });

      console.log('Calling onUploadSuccess with video:', saveResponse.data.video);
      onUploadSuccess(saveResponse.data.video);

      // Reset everything
      setSelectedFile(null);
      setVideoTitle('');
      setShowTitleInput(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);

      // More specific error handling for the new direct upload approach
      let errorMessage = "Failed to upload video. Please try again.";

      if (error.code === 'ECONNABORTED') {
        errorMessage = "Upload timeout. Please check your connection and try again.";
      } else if (error.response?.status === 413) {
        errorMessage = "File too large. Please try a smaller video.";
      } else if (error.response?.status === 400 && error.response?.data?.error?.message) {
        // Cloudinary error messages
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message?.includes('Failed to get upload credentials')) {
        errorMessage = "Unable to prepare upload. Please try again.";
      } else if (error.message?.includes('Upload to Cloudinary failed')) {
        errorMessage = "Upload failed. Please check your internet connection and try again.";
      } else if (error.message?.includes('Failed to save video metadata')) {
        errorMessage = "Upload completed but failed to save. Please contact support.";
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isVerified) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 text-gray-400 dark:text-zinc-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Instagram verification required to upload reels
        </p>
      </div>
    );
  }

  if (currentVideoCount >= maxVideos) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Maximum {maxVideos} reels reached. Delete one to upload new.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading ? (
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 text-violet-500 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Uploading video... {uploadProgress}%
          </p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : showTitleInput && selectedFile ? (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Selected: {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reel Title *
            </label>
            <Input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter a title for your reel"
              maxLength={100}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {videoTitle.length}/100 characters
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleUploadWithTitle}
              disabled={!videoTitle.trim()}
              className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Reel
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Reel
          </Button>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
            Upload reel-style videos (9:16 ratio recommended)<br />
            MP4, MOV, AVI, MKV, WebM (max 500MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
