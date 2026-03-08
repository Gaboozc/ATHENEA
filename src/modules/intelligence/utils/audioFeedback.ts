/**
 * ATHENEA Audio Feedback System (Earcons)
 * 
 * Provides lightweight audio cues for autonomous actions
 * Uses Web Audio API to generate tones without loading external files
 * 
 * Earcons (Audio Icons):
 * - Success: Soft futuristic "ding" when action executes
 * - Error: Short tone when something fails
 * - Processing: Subtle pulse during execution
 */

class AudioFeedbackSystem {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy initialize audio context on first use
    this.initialize();
  }

  /**
   * Initialize Web Audio API context
   */
  private initialize() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        this.enabled = false;
        return;
      }
      // Don't create context yet, will create on first play
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      this.enabled = false;
    }
  }

  /**
   * Get or create audio context
   */
  private getContext(): AudioContext | null {
    if (!this.enabled) return null;

    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      } catch (error) {
        console.warn('Failed to create audio context:', error);
        this.enabled = false;
        return null;
      }
    }

    // Resume if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Play success sound - Futuristic "ding"
   * Two-tone ascending melody: C5 → E5
   */
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (C5 - 523.25 Hz)
    this.playTone(523.25, now, 0.08, 0.3);

    // Second tone (E5 - 659.25 Hz) - slightly delayed
    this.playTone(659.25, now + 0.06, 0.12, 0.25);
  }

  /**
   * Play error sound - Short warning tone
   * Low frequency buzz
   */
  playError() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Two quick low tones
    this.playTone(220, now, 0.08, 0.4);
    this.playTone(180, now + 0.1, 0.08, 0.4);
  }

  /**
   * Play processing sound - Subtle pulse
   * Soft background pulse while thinking
   */
  playProcessing() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Soft pulse (A4 - 440 Hz)
    this.playTone(440, now, 0.15, 0.15);
  }

  /**
   * Play a single tone with ADSR envelope
   */
  private playTone(
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.3
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Create oscillator (tone generator)
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine'; // Smooth sine wave
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // Create gain node (volume control)
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, startTime);

      // ADSR Envelope:
      // Attack: fade in quickly
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      
      // Decay: slight drop
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.03);
      
      // Sustain: hold
      gainNode.gain.setValueAtTime(volume * 0.8, startTime + duration - 0.02);
      
      // Release: fade out smoothly
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      // Connect nodes: oscillator → gain → speakers
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Schedule playback
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  /**
   * Enable/disable audio feedback
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clean up audio context
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioFeedback = new AudioFeedbackSystem();

// Export utilities
export function playSuccessSound() {
  audioFeedback.playSuccess();
}

export function playErrorSound() {
  audioFeedback.playError();
}

export function playProcessingSound() {
  audioFeedback.playProcessing();
}

export function setAudioEnabled(enabled: boolean) {
  audioFeedback.setEnabled(enabled);
}

export function isAudioEnabled(): boolean {
  return audioFeedback.isEnabled();
}
