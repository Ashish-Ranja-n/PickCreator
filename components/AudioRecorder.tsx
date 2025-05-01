'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Send, Trash2, Play, Pause, Loader2, X, AlertCircle } from 'lucide-react';
import { uploadFile } from '@/utils/uploadMedia';
import audioManager from '@/lib/audioManager';

interface AudioRecorderProps {
  onSend: (audioUrl: string, publicId: string) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const playerId = useId(); // Generate a unique ID for this player instance
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Unregister from audio manager
      audioManager.unregisterPlayer(playerId);
    };
  }, [audioUrl, playerId]);

  // Register with audio manager when audio is available
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    // Register this player with the audio manager
    audioManager.registerPlayer(
      playerId,
      audioRef.current,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  }, [audioUrl, playerId]);

  // Set up audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
        setLoadError(false);
        console.log("Recorded audio loaded, duration:", audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
        setAudioCurrentTime(audio.currentTime);
      }
    };

    const handleError = () => {
      console.error('Error loading recorded audio');
      setLoadError(true);
    };

    const handleCanPlay = () => {
      console.log("Recorded audio can play now");
      setLoadError(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Reset playback state
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setLoadError(false);

    // Force load
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setRecordingError(null);
      
      // Check if browser supports MediaRecorder
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setRecordingError("Your browser doesn't support audio recording");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a widely supported audio format
      let options = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      console.log("Using audio format:", options.mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setRecordingError("No audio data recorded");
          return;
        }

        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        if (blob.size === 0) {
          setRecordingError("Empty audio recording");
          return;
        }

        console.log("Recording completed, blob size:", blob.size, "type:", blob.type);
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      // Start recording with small chunks to ensure data is captured
      mediaRecorder.start(100); // Capture in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setRecordingError("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
        setRecordingError("Error stopping recording");
      }
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl || loadError) return;
    
    if (isPlaying) {
      // Use audio manager to pause
      audioManager.pause(playerId);
    } else {
      // Force load if needed
      if (audioRef.current.readyState === 0) {
        audioRef.current.load();
      }
      
      // Use audio manager to play (it will pause other players)
      audioManager.play(playerId);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || audioDuration <= 0 || loadError) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    audioRef.current.currentTime = percent * audioDuration;
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    
    try {
      // Create a File object from the Blob with a proper extension based on the MIME type
      let filename = `audio-message-${Date.now()}`;
      const fileType = audioBlob.type;
      
      // Add appropriate extension based on MIME type
      if (fileType.includes('webm')) {
        filename += '.webm';
      } else if (fileType.includes('mp4')) {
        filename += '.mp4';
      } else if (fileType.includes('ogg')) {
        filename += '.ogg';
      } else {
        filename += '.webm'; // Default fallback
      }
      
      const file = new File([audioBlob], filename, { type: fileType });
      console.log("Uploading audio file:", filename, "type:", fileType, "size:", file.size);
      
      // Upload the file
      const result = await uploadFile(file, 'chat');
      
      if (!result || !result.url || !result.publicId) {
        throw new Error('Upload failed: Invalid response from server');
      }
      
      console.log("Audio upload successful:", result.url);
      
      // Send the audio URL to the parent component
      onSend(result.url, result.publicId);
      
      // Clean up
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Calculate progress percentage safely
  const getProgressPercentage = () => {
    if (audioDuration <= 0 || isNaN(audioCurrentTime) || !isFinite(audioCurrentTime)) {
      return 0;
    }
    return Math.min(100, Math.max(0, (audioCurrentTime / audioDuration) * 100));
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {audioUrl ? (
        <>
          <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
          
          <div className="flex items-center gap-2 w-full bg-gray-100 p-2 rounded-lg">
            {loadError ? (
              <div className="flex items-center w-full gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-700 flex-grow">Audio preview unavailable</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSend}
                  disabled={isUploading}
                  className="text-purple-600"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Send Anyway
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayback}
                  className="h-8 w-8 rounded-full bg-white"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex-grow">
                  <div 
                    ref={progressBarRef}
                    className="relative h-2 w-full bg-gray-200 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="absolute h-full bg-purple-500 rounded-full transition-all duration-100" 
                      style={{ width: `${getProgressPercentage()}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleSend}
                  disabled={isUploading}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 w-full">
          {recordingError ? (
            <>
              <div className="flex items-center gap-2 w-full text-red-500 text-sm">
                <AlertCircle className="h-5 w-5" />
                <span className="flex-grow">{recordingError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordingError(null)}
                  className="text-gray-500"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8 text-gray-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-10 w-10 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <div className="text-sm font-medium text-gray-700 flex-grow">
                {isRecording ? (
                  <span className="text-red-500">{formatTime(recordingTime)}</span>
                ) : (
                  "Tap to record audio"
                )}
              </div>
              
              {/* Always show cancel button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="h-8 w-8 text-gray-500"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
} 