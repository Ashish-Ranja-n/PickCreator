import { useUserStore } from '@/lib/store/userStore';
import axios from 'axios';

/**
 * Utility functions for uploading media to Cloudinary
 */

/**
 * Upload a file to Cloudinary via the API
 * @param file - The file to upload
 * @param type - The type of media (profile, chat, instagram)
 * @param messageId - Optional message ID for chat media
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns The upload result with URL and public ID
 */
export const uploadFile = async (
  file: File, 
  type: 'profile' | 'chat' | 'instagram' = 'chat',
  messageId?: string,
  onProgress?: (progress: number) => void
) => {
  try {
    // Get the current user from the store
    const userStore = useUserStore.getState();
    const userId = userStore.user?._id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('userId', userId);
    
    if (messageId) {
      formData.append('messageId', messageId);
    }

    // Set up axios with progress tracking
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minute timeout for large files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          // Calculate the percentage
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentage);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload a URL to Cloudinary via the API
 * @param url - The URL to upload
 * @param type - The type of media (profile, chat, instagram)
 * @param instagramId - Optional Instagram ID for Instagram media
 * @param messageId - Optional message ID for chat media
 * @returns The upload result with URL and public ID
 */
export const uploadUrl = async (
  url: string, 
  type: 'profile' | 'chat' | 'instagram' = 'instagram',
  instagramId?: string,
  messageId?: string
) => {
  try {
    // Get the current user from the store
    const userStore = useUserStore.getState();
    const userId = userStore.user?._id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch('/api/upload', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url, 
        type, 
        userId,
        instagramId,
        messageId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading URL:', error);
    throw error;
  }
};

/**
 * Helper function to check if a file is an image
 * @param file - The file to check
 * @returns Boolean indicating if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Helper function to check if a file is a video
 * @param file - The file to check
 * @returns Boolean indicating if the file is a video
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Helper function to check if a file is an audio
 * @param file - The file to check
 * @returns Boolean indicating if the file is an audio
 */
export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/');
};

/**
 * Helper function to get the file size in a human-readable format
 * @param bytes - The file size in bytes
 * @returns The file size in a human-readable format
 */
export const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file size is within limit
 * @param file The file to check
 * @param maxSizeMB Maximum size in MB (default 1024 MB/1GB)
 * @returns boolean
 */
export const isValidFileSize = (file: File, maxSizeMB = 1024): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSize;
}; 