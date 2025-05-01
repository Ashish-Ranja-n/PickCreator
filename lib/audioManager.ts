/**
 * Global Audio Manager
 * 
 * This singleton manages all audio playback in the application to ensure
 * only one audio file plays at a time.
 */

type AudioPlayerInstance = {
  audioElement: HTMLAudioElement;
  playCallback: () => void;
  pauseCallback: () => void;
};

class AudioManager {
  private static instance: AudioManager;
  private currentlyPlaying: AudioPlayerInstance | null = null;
  private players: Map<string, AudioPlayerInstance> = new Map();

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Register an audio player with the manager
   */
  public registerPlayer(
    id: string, 
    audioElement: HTMLAudioElement, 
    playCallback: () => void,
    pauseCallback: () => void
  ): void {
    // Unregister first if already exists
    this.unregisterPlayer(id);
    
    // Register new player
    this.players.set(id, {
      audioElement,
      playCallback,
      pauseCallback
    });

    // Add event listener to detect when audio ends
    audioElement.addEventListener('ended', () => {
      if (this.currentlyPlaying?.audioElement === audioElement) {
        this.currentlyPlaying = null;
      }
    });
  }

  /**
   * Unregister an audio player from the manager
   */
  public unregisterPlayer(id: string): void {
    const player = this.players.get(id);
    if (player) {
      // If this is the currently playing audio, stop it
      if (this.currentlyPlaying?.audioElement === player.audioElement) {
        this.currentlyPlaying = null;
      }
      this.players.delete(id);
    }
  }

  /**
   * Play an audio file and pause any currently playing audio
   */
  public play(id: string): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    // If something else is playing, pause it
    if (this.currentlyPlaying && this.currentlyPlaying !== player) {
      this.currentlyPlaying.audioElement.pause();
      this.currentlyPlaying.pauseCallback();
    }

    // Set this as the currently playing audio
    this.currentlyPlaying = player;
    
    // Play the audio
    try {
      player.audioElement.play();
      player.playCallback();
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }

  /**
   * Pause the specified audio player
   */
  public pause(id: string): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    // Pause the audio
    player.audioElement.pause();
    player.pauseCallback();

    // Clear currently playing if this was it
    if (this.currentlyPlaying?.audioElement === player.audioElement) {
      this.currentlyPlaying = null;
    }

    return true;
  }

  /**
   * Pause all audio players
   */
  public pauseAll(): void {
    this.players.forEach((player) => {
      player.audioElement.pause();
      player.pauseCallback();
    });
    this.currentlyPlaying = null;
  }

  /**
   * Check if a specific player is currently playing
   */
  public isPlaying(id: string): boolean {
    const player = this.players.get(id);
    return player ? !player.audioElement.paused : false;
  }
}

export default AudioManager.getInstance(); 