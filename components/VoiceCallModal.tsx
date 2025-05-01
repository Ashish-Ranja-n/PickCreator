'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { CallStatus } from '@/lib/useWebRTC';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callStatus: CallStatus;
  otherUser: {
    _id: string;
    name: string;
    avatar?: string;
    profilePictureUrl?: string;
  } | null;
  isMuted: boolean;
  callDuration: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onReconnectAudio?: () => void; // Optional function to reconnect audio
}

export const VoiceCallModal = ({
  isOpen,
  onClose,
  callStatus,
  otherUser,
  isMuted,
  callDuration,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onReconnectAudio,
}: VoiceCallModalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper function to safely get profile picture
  const getProfilePicture = (user: any) => {
    if (!user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;

    // For admin users with Instagram profile
    if (user.instagram?.profilePicture &&
        user.instagram.profilePicture !== "undefined" &&
        user.instagram.profilePicture !== "null") {
      return user.instagram.profilePicture;
    }

    // For influencers, check profilePictureUrl first
    if (user.profilePictureUrl &&
        user.profilePictureUrl !== "undefined" &&
        user.profilePictureUrl !== "null") {
      return user.profilePictureUrl;
    }

    // For influencers, check profilePicture next
    if (user.profilePicture &&
        user.profilePicture !== "undefined" &&
        user.profilePicture !== "null") {
      return user.profilePicture;
    }

    // Check for admin/brand avatar
    if (user.avatar &&
        user.avatar !== "undefined" &&
        user.avatar !== "null" &&
        user.avatar !== "/default-avatar.png") {
      return user.avatar;
    }

    // Return default avatar with user's name for consistent fallback
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;
  };

  // Close modal when call ends
  useEffect(() => {
    if (callStatus === 'idle' && isOpen) {
      onClose();
    }
  }, [callStatus, isOpen, onClose]);

  // Handle call status text
  const getCallStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Incoming call...';
      case 'connected':
        return callDuration;
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  // Handle call status color
  const getCallStatusColor = () => {
    switch (callStatus) {
      case 'calling':
      case 'ringing':
        return 'text-amber-500';
      case 'connected':
        return 'text-emerald-500';
      case 'ended':
        return 'text-rose-500';
      default:
        return 'text-slate-500';
    }
  };

  // Play ringtone for incoming calls
  useEffect(() => {
    if (callStatus === 'ringing' && audioRef.current) {
      // Try to play the audio file
      audioRef.current.play().catch(err => {
        console.error('Error playing ringtone:', err);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [callStatus]);

  // Create a ref for the remote audio element
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Ensure audio element is properly connected when call is connected
  useEffect(() => {
    if (callStatus === 'connected') {
      // This helps ensure the audio element is properly connected to the remote stream
      const ensureAudioConnection = () => {
        // Try to get the audio element from our ref first, then fall back to getElementById
        const audioElement = remoteAudioRef.current || document.getElementById('remoteAudio') as HTMLAudioElement;

        if (audioElement) {
          console.log('[VoiceCallModal] Call connected, ensuring audio element is playing');

          // Make sure volume is up and not muted
          audioElement.volume = 1.0;
          audioElement.muted = false;

          // Try to play the audio
          audioElement.play().catch(err => {
            console.error('[VoiceCallModal] Error playing audio after connection:', err);
          });
        } else {
          console.error('[VoiceCallModal] Could not find remoteAudio element');
        }
      };

      // Try multiple times with increasing delays
      ensureAudioConnection();
      setTimeout(ensureAudioConnection, 500);
      setTimeout(ensureAudioConnection, 1000);
      setTimeout(ensureAudioConnection, 2000);
    }
  }, [callStatus]);

  return isOpen ? (
    <div
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-indigo-100 via-indigo-50 to-white flex flex-col items-center justify-center p-6 pt-10 pb-8 w-screen h-screen overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    >
          {/* Hidden audio element for ringtone */}
          <audio
            ref={audioRef}
            src="/sounds/ringtone.mp3"
            loop
            id="ringtone"
          />

          {/* Hidden audio element for remote stream */}
          <audio
            id="remoteAudio"
            autoPlay
            playsInline
            controls={false}
            style={{ display: 'none' }}
            ref={(el) => {
              // Store in our ref
              remoteAudioRef.current = el;

              if (el) {
                // Set up audio element properties
                el.volume = 1.0; // Ensure volume is at maximum
                el.muted = false;

                // Add event listeners for debugging
                el.onplay = () => console.log('[Audio Element] Started playing');
                el.onpause = () => console.log('[Audio Element] Paused');
                el.onvolumechange = () => console.log('[Audio Element] Volume changed to', el.volume);
                el.onloadedmetadata = () => console.log('[Audio Element] Metadata loaded');
                el.onerror = (e) => console.error('[Audio Element] Error:', e);

                // Log that the audio element is ready
                console.log('[Audio Element] Audio element initialized and ready with ID:', el.id);
              }
            }}
          />

          {/* Avatar */}
          <div className="relative mb-10 mt-10">
            <Avatar className="h-40 w-40 border-4 border-white shadow-lg">
              <AvatarImage
                src={otherUser ? getProfilePicture(otherUser) : ''}
                alt={otherUser?.name || 'User'}
              />
              <AvatarFallback className="text-4xl">
                {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Pulsing animation for calling/ringing */}
            {(callStatus === 'calling' || callStatus === 'ringing') && (
              <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></span>
            )}
          </div>

          {/* User name */}
          <h2 className="text-3xl font-semibold text-slate-800 mb-3">
            {otherUser?.name || 'Unknown User'}
          </h2>

          {/* Call status */}
          <p className={`text-xl font-medium ${getCallStatusColor()} mb-6`}>
            {getCallStatusText()}
          </p>



          {/* Call controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Incoming call controls */}
            {callStatus === 'ringing' && (
              <>
                <Button
                  onClick={onReject}
                  size="icon"
                  variant="destructive"
                  className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <X className="h-9 w-9" />
                </Button>

                <Button
                  onClick={onAccept}
                  size="icon"
                  className="h-20 w-20 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all"
                >
                  <Phone className="h-9 w-9" />
                </Button>
              </>
            )}

            {/* Ongoing call controls */}
            {callStatus === 'connected' && (
              <>
                <Button
                  onClick={onToggleMute}
                  size="icon"
                  variant={isMuted ? 'destructive' : 'outline'}
                  className="h-18 w-18 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>

                <Button
                  onClick={onEnd}
                  size="icon"
                  variant="destructive"
                  className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <PhoneOff className="h-9 w-9" />
                </Button>

                {/* Hidden reconnect audio button - only shown if onReconnectAudio is provided */}
                {onReconnectAudio && (
                  <Button
                    onClick={onReconnectAudio}
                    size="sm"
                    variant="outline"
                    className="absolute bottom-4 text-xs"
                    title="Try to reconnect audio if you can't hear the other person"
                  >
                    Reconnect Audio
                  </Button>
                )}
              </>
            )}

            {/* Outgoing call controls */}
            {callStatus === 'calling' && (
              <Button
                onClick={onEnd}
                size="icon"
                variant="destructive"
                className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <PhoneOff className="h-9 w-9" />
              </Button>
            )}
          </div>
    </div>
  ) : null;
};
