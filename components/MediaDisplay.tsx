"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Download, X, Maximize2, Volume2, FileText, ExternalLink, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  publicId: string;
}

interface MediaDisplayProps {
  media: MediaItem;
  allMedia?: MediaItem[];
  initialIndex?: number;
}

export const MediaDisplay = ({ media, allMedia, initialIndex = 0 }: MediaDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Use the provided allMedia array or create a single-item array with the current media
  const mediaItems = allMedia && allMedia.length > 0 ? allMedia : [media];

  // Get the current media item based on the index
  const currentMedia = mediaItems[currentIndex];

  // Reset zoom and rotation when changing media items
  useEffect(() => {
    resetView();
  }, [currentIndex]);

  const getFileName = (mediaItem = currentMedia) => {
    // Extract filename from URL
    const urlParts = mediaItem.url.split('/');
    let fileName = urlParts[urlParts.length - 1];

    // Remove any query parameters
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }

    // Decode URI components
    try {
      fileName = decodeURIComponent(fileName);
    } catch {
      // If decoding fails, use the original
    }

    return fileName;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  }, [mediaItems.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  }, [mediaItems.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaItems.length, goToPrevious, goToNext]);

  const handleOpenMedia = () => {
    // Don't open dialog for audio files
    if (media.type === 'audio') return;

    setCurrentIndex(initialIndex);
    setIsOpen(true);
  };

  // Thumbnail/preview display
  const renderThumbnail = () => {
    if (media.type === 'image') {
      return (
        <div
          className="rounded-xl overflow-hidden max-w-full cursor-pointer hover:scale-[1.02] transition-all duration-300 relative group shadow-md hover:shadow-xl"
          onClick={handleOpenMedia}
        >
          <Image
            src={media.url}
            alt="Image"
            className="max-w-full max-h-[250px] object-contain"
            width={500}
            height={300}
            loading="lazy"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Maximize2 className="h-6 w-6 text-white stroke-2" />
            </div>
          </div>
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <div
          className="rounded-xl overflow-hidden max-w-full cursor-pointer hover:scale-[1.02] transition-all duration-300 relative group shadow-md hover:shadow-xl"
          onClick={handleOpenMedia}
        >
          <video
            src={media.url}
            className="max-w-full max-h-[250px]"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white ml-1">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (media.type === 'audio') {
      return (
        <div className="rounded-lg overflow-hidden max-w-full">
          <AudioPlayer
            src={media.url}
            className="bg-transparent"
          />
        </div>
      );
    }

    return (
      <div
        className="rounded-lg overflow-hidden max-w-full bg-white border border-slate-200 p-3 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleOpenMedia}
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 rounded-full p-2">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-slate-800">Document</span>
            <p className="text-xs text-slate-500 truncate">{getFileName(media)}</p>
          </div>
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700"
            onClick={(e) => {
              // Prevent the click from propagating to parent elements
              e.stopPropagation();
            }}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    );
  };

  // Full-size media display in modal
  const renderFullMedia = () => {
    if (currentMedia.type === 'image') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={currentMedia.url}
            alt="Full size image"
            className="max-w-full max-h-full object-contain transition-all duration-200"
            width={1200}
            height={800}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            unoptimized
          />
        </div>
      );
    }

    if (currentMedia.type === 'video') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (currentMedia.type === 'audio') {
      return (
        <div className="relative w-full flex items-center justify-center p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="w-full max-w-md">
            <div className="mb-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3">
                  <Volume2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-medium">{getFileName()}</h3>
            </div>
            <AudioPlayer src={currentMedia.url} className="bg-white shadow-md" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-center mb-2">{getFileName()}</h3>
          <div className="flex justify-center mt-4">
            <a
              href={currentMedia.url}
              download={getFileName()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Download File
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Render modern navigation arrows if there are multiple media items
  const renderNavigation = () => {
    if (mediaItems.length <= 1) return null;

    return (
      <>
        {/* Modern Left arrow */}
        <button
          onClick={goToPrevious}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 border border-white/20 z-20 shadow-lg"
          aria-label="Previous media"
        >
          <ChevronLeft size={28} className="stroke-2" />
        </button>

        {/* Modern Right arrow */}
        <button
          onClick={goToNext}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 border border-white/20 z-20 shadow-lg"
          aria-label="Next media"
        >
          <ChevronRight size={28} className="stroke-2" />
        </button>

        {/* Modern Media counter */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-xl z-20 border border-white/20 shadow-lg">
          <span className="text-white/80">{currentIndex + 1}</span>
          <span className="text-white/60 mx-2">of</span>
          <span className="text-white/80">{mediaItems.length}</span>
        </div>
      </>
    );
  };

  return (
    <>
      {renderThumbnail()}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
          {/* Modern Header with Glassmorphism */}
          <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md z-30 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="text-white font-medium text-lg truncate max-w-[200px]">{getFileName()}</div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={currentMedia.url}
                download={getFileName()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </a>
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-red-500/20 backdrop-blur-sm p-3 text-white hover:bg-red-500/30 transition-all duration-200 hover:scale-105 border border-red-500/30"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Enhanced Navigation controls */}
          {renderNavigation()}

          {/* Media content - full screen */}
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="relative w-full h-full">
              {renderFullMedia()}
            </div>
          </div>

          {/* Modern Bottom Controls for Images */}
          {currentMedia.type === 'image' && (
            <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-md border-t border-white/10">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white text-sm font-medium min-w-[80px] text-center">
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <div className="w-px h-8 bg-white/20"></div>
                <button
                  onClick={handleRotate}
                  className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
                  title="Rotate"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                <button
                  onClick={resetView}
                  className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20 text-sm font-medium"
                  title="Reset view"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};