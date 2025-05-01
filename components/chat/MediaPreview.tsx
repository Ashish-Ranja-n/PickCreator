"use client";

import { useState, useEffect } from 'react';
import { X, FileAudio, File, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isImageFile, isVideoFile, isAudioFile, getFileSize } from "@/utils/uploadMedia";
import Image from 'next/image';

interface MediaPreviewProps {
  file: File | null;
  onRemove: () => void;
  onSend: () => void;
  isSending: boolean;
}

export const MediaPreview = ({ file, onRemove, onSend, isSending }: MediaPreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setVideoPreview(null);
      return;
    }
    
    // Create object URL for video preview
    if (isVideoFile(file)) {
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      
      // Clean up the URL when component unmounts or file changes
      return () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
      };
    }
    
    // Create data URL for image preview
    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);
  
  if (!file) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gray-900">
        <button 
          onClick={onRemove}
          className="text-white p-2 rounded-full hover:bg-gray-800"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {isImageFile(file) ? 'Image' : isVideoFile(file) ? 'Video' : isAudioFile(file) ? 'Audio' : 'File'}
          </span>
        </div>
        <div className="w-8"></div> {/* Spacer for balance */}
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {isImageFile(file) && preview && (
          <Image 
            src={preview} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-md"
            width={100}
            height={100}
          />
        )}
        
        {isVideoFile(file) && videoPreview && (
          <video 
            src={videoPreview} 
            controls
            className="max-w-full max-h-full rounded-md"
          />
        )}
        
        {isAudioFile(file) && (
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <FileAudio size={32} className="text-white" />
              </div>
            </div>
            <p className="text-white text-center font-medium mb-2 truncate">{file.name}</p>
            <p className="text-gray-400 text-center text-sm mb-4">{getFileSize(file.size)}</p>
            <audio 
              controls 
              className="w-full"
              src={URL.createObjectURL(file)}
            />
          </div>
        )}
        
        {!isImageFile(file) && !isVideoFile(file) && !isAudioFile(file) && (
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <File size={32} className="text-white" />
              </div>
            </div>
            <p className="text-white text-center font-medium mb-2 truncate">{file.name}</p>
            <p className="text-gray-400 text-center text-sm">{getFileSize(file.size)}</p>
          </div>
        )}
      </div>
      
      {/* Footer with Send Button */}
      <div className="p-4 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white text-sm truncate">{file.name}</p>
            <p className="text-gray-400 text-xs">{getFileSize(file.size)}</p>
          </div>
          <Button
            onClick={onSend}
            disabled={isSending}
            className="rounded-full bg-green-600 hover:bg-green-700 h-12 w-12 flex items-center justify-center"
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={20} className="text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 