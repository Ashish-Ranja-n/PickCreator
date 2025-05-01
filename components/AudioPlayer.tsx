'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Play, Pause, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import audioManager from '@/lib/audioManager';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = '' }: AudioPlayerProps) {
  const playerId = useId(); // Generate a unique ID for this player instance
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoaded(false);
    setLoadError(false);
    setRetryCount(0);
  }, [src]);

  // Register with audio manager
  useEffect(() => {
    if (!audioRef.current) return;

    // Register this player with the audio manager
    audioManager.registerPlayer(
      playerId,
      audioRef.current,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );

    // Cleanup on unmount
    return () => {
      audioManager.unregisterPlayer(playerId);
    };
  }, [playerId, src]);

  // Force CORS mode to avoid cross-origin issues
  const getProxiedUrl = (originalUrl: string) => {
    // If it's already a blob URL, return as is
    if (originalUrl.startsWith('blob:')) {
      return originalUrl;
    }

    // If it's a relative URL, return as is
    if (originalUrl.startsWith('/')) {
      return originalUrl;
    }

    // Otherwise, try to use the original URL
    return originalUrl;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setIsLoaded(true);
        setLoadError(false);
        console.log("Audio loaded successfully, duration:", audio.duration);
      }
    };

    const setAudioTime = () => {
      if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      setLoadError(true);
      setIsLoaded(false);

      // Try to reload with a different approach if we haven't tried too many times
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);

        // Small delay before retry
        setTimeout(() => {
          if (audio) {
            audio.load();
          }
        }, 1000);
      }
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      setLoadError(false);
      console.log("Audio can play now");
    };

    // Events
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', handleError);

    // Try to load the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('error', handleError);
    };
  }, [src, retryCount]);

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || loadError) return;

    if (isPlaying) {
      // Use audio manager to pause
      audioManager.pause(playerId);
    } else {
      // Force load if needed
      if (!isLoaded) {
        audioRef.current.load();
      }

      // Use audio manager to play (it will pause other players)
      audioManager.play(playerId);
    }
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '00:00';

    // For voice messages, we typically don't need hours
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    // Format as MM:SS
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || !isLoaded || duration <= 0) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    audioRef.current.currentTime = percent * duration;
  };

  // Calculate progress percentage safely
  const getProgressPercentage = () => {
    if (!isLoaded || duration <= 0 || isNaN(currentTime) || !isFinite(currentTime)) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  };

  // Handle retry
  const handleRetry = () => {
    if (!audioRef.current) return;

    setLoadError(false);
    setIsLoaded(false);

    // Force reload
    audioRef.current.load();

    // Try to play
    setTimeout(() => {
      if (audioRef.current) {
        audioManager.play(playerId);
      }
    }, 500);
  };

  return (
    <div className={`flex items-center space-x-2 p-1 rounded-lg ${className}`} style={{ maxWidth: '250px' }}>
      <audio
        ref={audioRef}
        src={getProxiedUrl(src)}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {loadError ? (
        <div className="flex items-center w-full gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs text-slate-700 flex-grow">Audio unavailable</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="text-indigo-600 hover:text-indigo-700 text-xs"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            disabled={loadError}
            className="h-10 w-10 rounded-full bg-indigo-600 shadow-sm hover:bg-indigo-700 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white" />
            )}
          </Button>

          <div className="flex flex-col flex-grow min-w-0">
            <div className="flex items-center mb-1">
              <span className="text-xs text-slate-500 opacity-75">Voice Message</span>
            </div>
            <div
              ref={progressBarRef}
              className={`relative h-2 w-full rounded-full cursor-pointer ${isLoaded ? 'bg-slate-200' : 'bg-slate-100'}`}
              onClick={handleProgressClick}
            >
              <div
                className="absolute h-full rounded-full bg-indigo-600 transition-all duration-100"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-medium text-slate-600 mt-1">
              <span className="tabular-nums tracking-tight">{formatTime(currentTime)}</span>
              <span className="tabular-nums tracking-tight">{isLoaded ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>

          <a
            href={src}
            download
            className={`text-slate-400 hover:text-indigo-600 ${!isLoaded ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
          </a>
        </>
      )}
    </div>
  );
}