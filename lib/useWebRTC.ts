'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UseWebRTCProps {
  socket: Socket | null;
  isConnected: boolean;
  currentUserId: string | undefined;
  conversationId: string;
}

export const useWebRTC = ({ socket, isConnected, currentUserId, conversationId }: UseWebRTCProps) => {
  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Start call timer
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    setCallDuration(0);

    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    // Close any existing connections
    if (peerConnectionRef.current) {
      try {
        // Remove all event listeners first
        const oldPC = peerConnectionRef.current;
        oldPC.onicecandidate = null;
        oldPC.oniceconnectionstatechange = null;
        oldPC.onicegatheringstatechange = null;
        oldPC.onsignalingstatechange = null;
        oldPC.ontrack = null;
        oldPC.onconnectionstatechange = null;

        // Close the connection
        oldPC.close();
        console.log('[WebRTC] Closed existing peer connection');
      } catch (error) {
        console.error('[WebRTC] Error closing existing peer connection:', error);
      }
    }

    // Create a new RTCPeerConnection with STUN/TURN servers
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Add free TURN servers for better connectivity
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443'
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10,
      // Add these options for better compatibility
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      // sdpSemantics is not in the TypeScript definition but is supported in browsers
      // @ts-expect-error - Property 'sdpSemantics' does not exist on type 'RTCConfiguration'
      sdpSemantics: 'unified-plan'
    };

    console.log('[WebRTC] Creating new peer connection');
    const peerConnection = new RTCPeerConnection(configuration);

    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket && isConnected) {
        console.log('[WebRTC] New ICE candidate:', event.candidate);
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          conversationId,
          targetUserId: remoteUserId,
        });
      } else if (!event.candidate) {
        console.log('[WebRTC] ICE candidate gathering complete');
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state changed: ${peerConnection.iceConnectionState}`);
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state changed: ${peerConnection.signalingState}`);
    };

    peerConnection.ontrack = (event) => {
      // When remote stream is received
      console.log('[WebRTC] Remote track received:', event.track.kind, 'enabled:', event.track.enabled);

      // Log track details
      console.log(`[WebRTC] Remote track details: id=${event.track.id}, label=${event.track.label}, readyState=${event.track.readyState}`);

      // Store the remote stream
      remoteStreamRef.current = event.streams[0];

      // Log the stream ID
      console.log(`[WebRTC] Remote stream set with ID: ${remoteStreamRef.current.id}`);

      // Add event listeners to the track
      event.track.onmute = () => console.log('[WebRTC] Remote track muted');
      event.track.onunmute = () => console.log('[WebRTC] Remote track unmuted');
      event.track.onended = () => console.log('[WebRTC] Remote track ended');

      // Ensure we have a valid stream with audio tracks
      if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
        console.log('[WebRTC] Remote stream has audio tracks:', remoteStreamRef.current.getAudioTracks().length);

        // Log all tracks in the remote stream
        remoteStreamRef.current.getTracks().forEach(track => {
          console.log(`[WebRTC] Remote stream track: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`);
        });
      } else {
        console.warn('[WebRTC] Remote stream has no audio tracks!');
      }

      // Function to set up the audio element with the remote stream
      const setupAudioElement = () => {
        // Try to find the audio element multiple times with increasing delays
        // This helps if the component is still rendering when we get the track
        const maxRetries = 10; // Increase max retries
        let retryCount = 0;

        const trySetupAudio = () => {
          // Trigger a UI update with the remote stream
          const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;

          if (audioElement && remoteStreamRef.current) {
            console.log('[WebRTC] Setting remote stream to audio element');

            try {
              // Make sure the audio element is properly configured
              audioElement.srcObject = remoteStreamRef.current;
              audioElement.volume = 1.0;
              audioElement.muted = false;

              // Log the audio element's state
              console.log(`[WebRTC] Audio element state: id=${audioElement.id}, srcObject=${!!audioElement.srcObject}, volume=${audioElement.volume}, muted=${audioElement.muted}`);

              // Try to play the audio
              const playPromise = audioElement.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  console.log('[WebRTC] Remote audio playing successfully');

                  // Double-check after a short delay that audio is still playing
                  setTimeout(() => {
                    if (audioElement && !audioElement.paused) {
                      console.log('[WebRTC] Audio still playing after delay check');
                    } else if (audioElement) {
                      console.warn('[WebRTC] Audio stopped playing after initial success');
                      // Try to restart it
                      audioElement.play().catch(e => console.error('[WebRTC] Failed to restart audio:', e));
                    }
                  }, 1000);

                }).catch(err => {
                  console.error('[WebRTC] Error playing remote audio:', err);

                  // Try again with user interaction
                  console.log('[WebRTC] Will try to play audio again on next user interaction');

                  // Add a one-time click handler to the document to try playing again
                  const playAudioOnInteraction = () => {
                    audioElement.play().then(() => {
                      console.log('[WebRTC] Remote audio playing after user interaction');
                    }).catch(e => {
                      console.error('[WebRTC] Still failed to play audio after user interaction:', e);
                    });
                    document.removeEventListener('click', playAudioOnInteraction);
                  };

                  document.addEventListener('click', playAudioOnInteraction, { once: true });
                });
              }
            } catch (error) {
              console.error('[WebRTC] Error setting up audio element:', error);
            }
          } else {
            // Log more details about what's missing
            if (!audioElement) {
              console.warn(`[WebRTC] Could not find remote audio element (attempt ${retryCount + 1}/${maxRetries})`);
            } else if (!remoteStreamRef.current) {
              console.warn(`[WebRTC] Remote stream not available (attempt ${retryCount + 1}/${maxRetries})`);
            }

            // Retry with exponential backoff if we haven't reached max retries
            if (retryCount < maxRetries) {
              retryCount++;
              // Use shorter initial delays but more retries
              const delay = Math.min(Math.pow(1.5, retryCount) * 100, 2000); // Cap at 2 seconds max
              console.log(`[WebRTC] Retrying audio setup in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);

              setTimeout(trySetupAudio, delay);
            } else {
              console.error('[WebRTC] Failed to set up audio after maximum retries');
            }
          }
        };

        // Start the first attempt immediately
        trySetupAudio();
      };

      // Set up the audio element immediately
      setupAudioElement();

      // Also set it up again after a short delay to ensure it works
      setTimeout(setupAudioElement, 1000);

      // And set it up one more time after a longer delay as a fallback
      setTimeout(setupAudioElement, 3000);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state changed: ${peerConnection.connectionState}`);

      if (peerConnection.connectionState === 'connected') {
        setCallStatus('connected');
        startCallTimer();
      } else if (
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'closed'
      ) {
        console.log('[WebRTC] Connection lost or closed, ending call');
        endCall();
      }
    };

    // Add an ice connection state change handler for more reliable disconnection detection
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state changed: ${peerConnection.iceConnectionState}`);

      if (
        peerConnection.iceConnectionState === 'disconnected' ||
        peerConnection.iceConnectionState === 'failed' ||
        peerConnection.iceConnectionState === 'closed'
      ) {
        console.log('[WebRTC] ICE connection lost or failed, ending call');
        endCall();
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [conversationId, remoteUserId, socket, isConnected]);

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      console.log('[WebRTC] Requesting microphone access...');

      // Check if we already have a stream
      if (localStreamRef.current) {
        console.log('[WebRTC] Using existing local stream');

        // Make sure tracks are enabled
        localStreamRef.current.getAudioTracks().forEach(track => {
          if (!track.enabled && !isMuted) {
            track.enabled = true;
            console.log(`[WebRTC] Re-enabled audio track: ${track.label}`);
          }
        });

        return localStreamRef.current;
      }

      // Request audio-only stream with basic constraints
      // Using simpler constraints for better compatibility
      const constraints = {
        audio: true,
        video: false
      };

      // First try with simple constraints
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[WebRTC] Microphone access granted with basic constraints');
      } catch (basicError) {
        console.warn('[WebRTC] Failed with basic constraints, trying fallback:', basicError);

        // If that fails, try with detailed constraints
        try {
          const detailedConstraints = {
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            },
            video: false
          };
          stream = await navigator.mediaDevices.getUserMedia(detailedConstraints);
          console.log('[WebRTC] Microphone access granted with fallback constraints');
        } catch (detailedError) {
          console.error('[WebRTC] Both constraint sets failed:', detailedError);
          throw detailedError;
        }
      }

      // Stream should be defined by now from one of the above attempts
      console.log('[WebRTC] Successfully obtained microphone access');

      // Log all tracks for debugging
      stream.getTracks().forEach(track => {
        console.log(`[WebRTC] Track obtained: ${track.kind}, label: ${track.label}, enabled: ${track.enabled}`);
      });

      // Store the stream
      localStreamRef.current = stream;

      // Set initial mute state based on user preference
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
        console.log(`[WebRTC] Audio track enabled: ${track.enabled}, label: ${track.label}`);
      });

      return stream;
    } catch (error) {
      console.error('[WebRTC] Error getting local stream:', error);

      // Provide more specific error messages
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Could not access microphone. It may be in use by another application.');
        } else if (error.name === 'OverconstrainedError') {
          throw new Error('Microphone constraints cannot be satisfied. Please try a different microphone.');
        } else if (error.name === 'TypeError') {
          throw new Error('Invalid constraints specified for microphone.');
        }
      }

      // Generic error
      throw new Error('Could not access microphone. Please check your permissions and try again.');
    }
  }, [isMuted]);

  // Add local stream to peer connection
  const addLocalStreamToPeerConnection = useCallback(async (peerConnection: RTCPeerConnection) => {
    try {
      if (!localStreamRef.current) {
        localStreamRef.current = await getLocalStream();
      }

      // Check if we already have senders for these tracks
      const senders = peerConnection.getSenders();
      const existingTrackIds = senders.map(sender => sender.track?.id).filter(Boolean);

      console.log('[WebRTC] Existing track IDs:', existingTrackIds);

      // Add each track if it's not already added
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          if (!existingTrackIds.includes(track.id)) {
            console.log(`[WebRTC] Adding track to peer connection: ${track.kind}, id=${track.id}`);
            peerConnection.addTrack(track, localStreamRef.current);
          } else {
            console.log(`[WebRTC] Track already exists in peer connection: ${track.kind}, id=${track.id}`);
          }
        }
      });

      // Log all senders after adding tracks
      console.log('[WebRTC] Current senders after adding tracks:',
        peerConnection.getSenders().map(sender => {
          return {
            trackId: sender.track?.id,
            trackKind: sender.track?.kind,
            trackEnabled: sender.track?.enabled
          };
        })
      );
    } catch (error) {
      console.error('[WebRTC] Error adding local stream to peer connection:', error);
      throw error;
    }
  }, [getLocalStream]);

  // Create and send offer
  const createOffer = useCallback(async (targetUserId: string) => {
    if (!socket || !isConnected || !currentUserId) return;

    try {
      setRemoteUserId(targetUserId);
      setCallStatus('calling');

      // Initialize peer connection
      const peerConnection = initializePeerConnection();

      // Get user media and add to peer connection
      try {
        await addLocalStreamToPeerConnection(peerConnection);
      } catch (mediaError) {
        console.error('[WebRTC] Error getting local media:', mediaError);
        alert('Could not access microphone. Please check your permissions.');
        setCallStatus('idle');
        setRemoteUserId(null);
        return;
      }

      // Create offer with audio codec preferences
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: true
      };

      // Create and set local description
      const offer = await peerConnection.createOffer(offerOptions);

      // Log the SDP for debugging
      console.log('[WebRTC] Created offer SDP:', offer.sdp);

      // Modify SDP to prioritize audio quality if needed
      let modifiedSdp = offer.sdp;

      // Ensure audio is given priority
      modifiedSdp = modifiedSdp?.replace('a=group:BUNDLE 0', 'a=group:BUNDLE audio');
      modifiedSdp = modifiedSdp?.replace('a=mid:0', 'a=mid:audio');

      // Create a modified offer with our changes
      const modifiedOffer = new RTCSessionDescription({
        type: 'offer',
        sdp: modifiedSdp
      });

      // Set local description with modified SDP
      await peerConnection.setLocalDescription(modifiedOffer);

      console.log('[WebRTC] Set local description with modified SDP');

      // Wait a moment to ensure ICE gathering has started
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send the offer to the remote peer
      socket.emit('call-offer', {
        offer,
        conversationId,
        callerId: currentUserId,
        targetUserId,
      });

      console.log(`[WebRTC] Sent call offer to ${targetUserId}`);
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
      setCallStatus('idle');
      setRemoteUserId(null);
    }
  }, [socket, isConnected, currentUserId, conversationId, initializePeerConnection, addLocalStreamToPeerConnection]);

  // Process any pending ICE candidates
  const processPendingIceCandidates = useCallback(() => {
    if (!peerConnectionRef.current || !pendingIceCandidatesRef.current.length) return;

    console.log(`[WebRTC] Processing ${pendingIceCandidatesRef.current.length} pending ICE candidates`);

    // Add all pending ICE candidates
    pendingIceCandidatesRef.current.forEach(async (candidate) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(candidate);
        console.log('[WebRTC] Added pending ICE candidate');
      } catch (error) {
        console.error('[WebRTC] Error adding pending ICE candidate:', error);
      }
    });

    // Clear the pending candidates
    pendingIceCandidatesRef.current = [];
  }, []);

  // Handle incoming offer
  const handleOffer = useCallback(async (data: { offer: RTCSessionDescriptionInit, callerId: string }) => {
    if (!socket || !isConnected || !currentUserId) return;

    try {
      setRemoteUserId(data.callerId);
      setCallStatus('ringing');

      const peerConnection = initializePeerConnection();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

      // Process any pending ICE candidates now that we have the remote description
      processPendingIceCandidates();

      // Don't automatically get local stream or create answer here
      // We'll do that when the user accepts the call

      console.log(`[WebRTC] Received call offer from ${data.callerId}`);
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      setCallStatus('idle');
      setRemoteUserId(null);
    }
  }, [socket, isConnected, currentUserId, initializePeerConnection, processPendingIceCandidates]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !isConnected || !currentUserId || !remoteUserId) {
      console.error('[WebRTC] Cannot accept call - missing required data');
      return;
    }

    if (!peerConnectionRef.current) {
      console.error('[WebRTC] No peer connection when accepting call');
      // Try to reinitialize the peer connection
      initializePeerConnection();
      if (!peerConnectionRef.current) {
        console.error('[WebRTC] Failed to initialize peer connection');
        return;
      }
    }

    try {
      console.log('[WebRTC] Accepting call from', remoteUserId);

      // First get the local stream and add it to the peer connection
      await addLocalStreamToPeerConnection(peerConnectionRef.current);

      // Create a simple answer without modifications
      const answer = await peerConnectionRef.current.createAnswer();

      // Set the local description
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('[WebRTC] Set local description with answer');

      // Process any pending ICE candidates
      processPendingIceCandidates();

      // Send the answer to the caller
      socket.emit('call-answer', {
        answer,
        conversationId,
        calleeId: currentUserId,
        callerId: remoteUserId,
      });

      // Update UI state
      setCallStatus('connected');
      startCallTimer();

      console.log(`[WebRTC] Sent call answer to ${remoteUserId}`);

      // Make sure audio tracks are enabled
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
          console.log(`[WebRTC] Set local audio track enabled=${!isMuted}: ${track.label}`);
        });
      }
    } catch (error) {
      console.error('[WebRTC] Error accepting call:', error);
      setCallStatus('idle');
      setRemoteUserId(null);
    }
  }, [socket, isConnected, currentUserId, remoteUserId, conversationId, addLocalStreamToPeerConnection, initializePeerConnection, isMuted, processPendingIceCandidates]);



  // ICE candidates that arrive before remote description is set
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidate }) => {
    if (!peerConnectionRef.current) return;

    try {
      // Create the ICE candidate object
      const iceCandidate = new RTCIceCandidate(data.candidate);

      // Check if the connection is in a state where we can add ICE candidates
      const connectionState = peerConnectionRef.current.connectionState;
      const signalingState = peerConnectionRef.current.signalingState;
      const hasRemoteDescription = peerConnectionRef.current.remoteDescription !== null;

      console.log(`[WebRTC] Received ICE candidate. Connection state: ${connectionState}, Signaling state: ${signalingState}, Has remote description: ${hasRemoteDescription}`);

      // If we don't have a remote description yet, store the candidate for later
      if (!hasRemoteDescription) {
        console.log('[WebRTC] Remote description not set yet, storing ICE candidate for later');
        pendingIceCandidatesRef.current.push(iceCandidate);
        return;
      }

      // Only add ICE candidates if we're not closed or failed and we have a remote description
      if (connectionState !== 'closed' && connectionState !== 'failed' && signalingState !== 'closed') {
        await peerConnectionRef.current.addIceCandidate(iceCandidate);
        console.log('[WebRTC] Added ICE candidate');
      } else {
        console.warn(`[WebRTC] Cannot add ICE candidate in state: ${connectionState}/${signalingState}`);
      }
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }, []);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !isConnected || !currentUserId || !remoteUserId) return;

    socket.emit('call-rejected', {
      conversationId,
      calleeId: currentUserId,
      callerId: remoteUserId,
    });

    cleanupCall();

    console.log(`[WebRTC] Rejected call from ${remoteUserId}`);
  }, [socket, isConnected, currentUserId, remoteUserId, conversationId]);

  // Handle call rejection
  const handleCallRejected = useCallback(() => {
    console.log('[WebRTC] Call was rejected');
    cleanupCall();
  }, []);

  // End ongoing call
  const endCall = useCallback(() => {
    if (!socket || !isConnected || !currentUserId || !remoteUserId) {
      cleanupCall();
      return;
    }

    socket.emit('call-ended', {
      conversationId,
      userId: currentUserId,
      targetUserId: remoteUserId,
    });

    cleanupCall();

    console.log(`[WebRTC] Ended call with ${remoteUserId}`);
  }, [socket, isConnected, currentUserId, remoteUserId, conversationId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMuteState = !isMuted;

      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuteState;
      });

      setIsMuted(newMuteState);
    }
  }, [isMuted]);

  // Clean up call resources
  const cleanupCall = useCallback(() => {
    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Stop and release local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset state
    setCallStatus('idle');
    setRemoteUserId(null);
    setCallDuration(0);
    setIsMuted(false);
  }, []);

  // Handle remote call end
  const handleCallEnded = useCallback(() => {
    console.log('[WebRTC] Remote user ended the call');

    // Check if we're in a call state that should be ended
    if (callStatus === 'idle') {
      console.log('[WebRTC] Ignoring call-ended event because we are already in idle state');
      return;
    }

    // If we're in the middle of setting up audio, give it a moment to complete
    if (callStatus === 'connected') {
      const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      if (!audioElement) {
        console.log('[WebRTC] Audio element not found when ending call, delaying cleanup');
        // Give a short delay to allow audio setup to complete
        setTimeout(() => {
          console.log('[WebRTC] Proceeding with delayed call cleanup');
          cleanupCall();
        }, 1000);
        return;
      }
    }

    // Normal cleanup
    cleanupCall();
  }, [callStatus, cleanupCall]);

  // Handle call ping (keep-alive)
  const handleCallPing = useCallback(() => {
    console.log('[WebRTC] Received ping from remote user');
    // If we're not in a connected state but we receive a ping, it means the other side thinks we're still in a call
    // This can happen if our UI state gets out of sync with the remote state
    if (callStatus !== 'connected' && remoteUserId) {
      console.log('[WebRTC] Received ping while not in connected state, restoring call state');
      // Don't try to re-establish the WebRTC connection, just update the UI state
      // This prevents the call from disappearing on one side while still active on the other
      setCallStatus('connected');
      startCallTimer();
    }
  }, [callStatus, remoteUserId]);





  // Handle incoming answer
  const handleAnswer = useCallback(async (data: { answer: RTCSessionDescriptionInit, calleeId: string }) => {
    if (!peerConnectionRef.current) {
      console.error('[WebRTC] No peer connection when handling answer');
      return;
    }

    try {
      // Check the current signaling state to avoid errors
      const signalingState = peerConnectionRef.current.signalingState;
      console.log(`[WebRTC] Current signaling state before setting remote answer: ${signalingState}`);

      // Simple direct approach first
      try {
        // Create a proper RTCSessionDescription
        const answerDesc = new RTCSessionDescription(data.answer);

        // Set the remote description
        await peerConnectionRef.current.setRemoteDescription(answerDesc);
        console.log(`[WebRTC] Successfully set remote answer directly`);

        // Process any pending ICE candidates now that we have the remote description
        processPendingIceCandidates();

        // Make sure audio tracks are enabled
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            // Always set the track enabled state based on mute status
            track.enabled = !isMuted;
            console.log(`[WebRTC] Set local audio track enabled=${!isMuted}: ${track.label}`);
          });
        }

        // Update UI state
        setCallStatus('connected');
        startCallTimer();
        console.log(`[WebRTC] Call connected with ${data.calleeId}`);
        return;
      } catch (directError) {
        // If direct approach fails, try state-specific approaches
        console.error('[WebRTC] Direct approach failed:', directError);
      }

      // State-specific approaches
      if (signalingState === 'stable') {
        console.log('[WebRTC] Trying stable state approach...');
        // Create a new offer
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });

        // Set local description
        await peerConnectionRef.current.setLocalDescription(offer);

        // Now set the remote description
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Process any pending ICE candidates
        processPendingIceCandidates();

        setCallStatus('connected');
        startCallTimer();
      } else if (signalingState === 'have-local-offer') {
        console.log('[WebRTC] Trying have-local-offer approach...');
        // Try rollback approach
        await peerConnectionRef.current.setLocalDescription({ type: 'rollback' });
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Process any pending ICE candidates
        processPendingIceCandidates();

        // Create a new offer
        const newOffer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(newOffer);

        setCallStatus('connected');
        startCallTimer();
      } else {
        // Last resort - just try to set it
        console.warn(`[WebRTC] Trying last resort for state: ${signalingState}`);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Process any pending ICE candidates
        processPendingIceCandidates();

        setCallStatus('connected');
        startCallTimer();
      }

      console.log(`[WebRTC] Call connected with ${data.calleeId} using fallback approach`);
    } catch (error) {
      console.error('[WebRTC] All approaches failed when handling answer:', error);
      // Reset call state
      endCall();
    }
  }, [endCall, isMuted, processPendingIceCandidates]);

  // Format call duration as MM:SS
  const formatCallDuration = useCallback(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle socket connection state
    const handleConnect = () => {
      console.log('[WebRTC] Socket connected');

      // If we're in a call but the socket reconnected, we might need to re-establish the call
      if (callStatus === 'connected' && remoteUserId) {
        console.log('[WebRTC] Socket reconnected during active call, sending ping to maintain call');
        // Send a ping to let the other side know we're still in the call
        socket.emit('call-ping', {
          conversationId,
          userId: currentUserId,
          targetUserId: remoteUserId
        });
      }
    };

    const handleDisconnect = () => {
      console.log('[WebRTC] Socket disconnected');
      // Don't end the call immediately, as the socket might reconnect
    };

    const handleConnectError = (error: any) => {
      console.error('[WebRTC] Socket connection error:', error);
    };

    // Set up socket connection event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set up event handlers for WebRTC signaling
    socket.on('call-offer', handleOffer);
    socket.on('call-answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-ping', handleCallPing);

    // Track last ping time to detect connection issues
    let lastPingTime = Date.now();

    // Update last ping time when we receive a ping
    const updateLastPingTime = () => {
      lastPingTime = Date.now();
    };

    // Also update ping time on any WebRTC event
    socket.on('call-ping', updateLastPingTime);
    socket.on('ice-candidate', updateLastPingTime);

    // Set up a ping interval to keep the connection alive
    const pingInterval = setInterval(() => {
      if (callStatus === 'connected' && remoteUserId) {
        console.log('[WebRTC] Sending connection ping');
        socket.emit('call-ping', {
          conversationId,
          userId: currentUserId,
          targetUserId: remoteUserId,
        });

        // Check if we haven't received a ping in 15 seconds
        const now = Date.now();
        if (now - lastPingTime > 15000) {
          console.log('[WebRTC] No ping received for 15 seconds, ending call');
          endCall();
        }
      }
    }, 5000); // Send a ping every 5 seconds during active calls

    // Clean up event listeners and intervals
    return () => {
      // Remove socket connection event handlers
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      // Remove WebRTC signaling event handlers
      socket.off('call-offer', handleOffer);
      socket.off('call-answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-ping', handleCallPing);
      socket.off('call-ping', updateLastPingTime);
      socket.off('ice-candidate', updateLastPingTime);

      // Clear intervals
      clearInterval(pingInterval);
    };
  }, [
    socket,
    isConnected,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleCallRejected,
    handleCallEnded,
    handleCallPing,
    callStatus,
    remoteUserId,
    conversationId,
    currentUserId,
    endCall
  ]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // Function to manually reconnect audio if needed
  const reconnectAudio = useCallback(() => {
    console.log('[WebRTC] Manually reconnecting audio...');

    // Check call status
    if (callStatus !== 'connected') {
      console.log('[WebRTC] Cannot reconnect audio - not in a connected call');
      return;
    }

    // Check remote stream
    if (!remoteStreamRef.current) {
      console.log('[WebRTC] Cannot reconnect audio - no remote stream available');
      return;
    }

    // Log remote stream details
    console.log(`[WebRTC] Remote stream details: id=${remoteStreamRef.current.id}, active=${remoteStreamRef.current.active}`);
    console.log(`[WebRTC] Remote stream has ${remoteStreamRef.current.getAudioTracks().length} audio tracks`);

    // Find the audio element
    const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
    if (!audioElement) {
      console.error('[WebRTC] Cannot reconnect audio - audio element not found');
      return;
    }

    // Log current audio element state
    console.log(`[WebRTC] Audio element before reset: srcObject=${!!audioElement.srcObject}, paused=${audioElement.paused}`);

    // Reset the srcObject
    audioElement.pause();
    audioElement.srcObject = null;

    // Set it again after a short delay
    setTimeout(() => {
      if (remoteStreamRef.current) {
        console.log('[WebRTC] Resetting audio element srcObject');
        audioElement.srcObject = remoteStreamRef.current;
        audioElement.volume = 1.0;
        audioElement.muted = false;

        // Try to play
        audioElement.play().then(() => {
          console.log('[WebRTC] Audio reconnected successfully');

          // Double-check after a short delay
          setTimeout(() => {
            if (audioElement && !audioElement.paused) {
              console.log('[WebRTC] Audio still playing after reconnection check');
            } else if (audioElement) {
              console.warn('[WebRTC] Audio stopped playing after reconnection');
              // Try one more time
              audioElement.play().catch(e => console.error('[WebRTC] Failed to restart audio after reconnection check:', e));
            }
          }, 1000);

        }).catch(err => {
          console.error('[WebRTC] Failed to play audio after reconnection:', err);

          // Try with user interaction
          alert('Please tap/click to enable audio');
        });
      }
    }, 300); // Slightly longer delay
  }, [callStatus]);

  // Auto-reconnect audio when call status changes to connected
  useEffect(() => {
    if (callStatus === 'connected') {
      console.log('[WebRTC] Call connected, scheduling audio reconnection checks');

      // Try to reconnect audio after short delays to ensure it's working
      const reconnectTimers = [
        setTimeout(() => {
          console.log('[WebRTC] Running first scheduled audio check');
          // Just check if audio is playing, don't reset unless needed
          const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
          if (audioElement && audioElement.paused) {
            console.warn('[WebRTC] Audio not playing in first check, attempting reconnect');
            reconnectAudio();
          } else if (audioElement) {
            console.log('[WebRTC] Audio playing correctly in first check');
          }
        }, 2000),

        setTimeout(() => {
          console.log('[WebRTC] Running second scheduled audio check');
          const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
          if (audioElement && audioElement.paused) {
            console.warn('[WebRTC] Audio not playing in second check, attempting reconnect');
            reconnectAudio();
          } else if (audioElement) {
            console.log('[WebRTC] Audio playing correctly in second check');
          }
        }, 5000)
      ];

      // Clean up timers when call status changes
      return () => {
        reconnectTimers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [callStatus, reconnectAudio]);

  return {
    callStatus,
    remoteUserId,
    isMuted,
    callDuration: formatCallDuration(),
    startCall: createOffer,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    reconnectAudio, // Add the new function to the returned object
  };
};
