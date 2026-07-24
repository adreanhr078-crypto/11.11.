import type {
  SoundMoodProfile,
} from '../../domain/emotion/emotionVisualSystem';

/**
 * Audio implementation boundary. The emotion system produces mix intent only;
 * Android audio focus, stems, clips and DSP stay inside the platform adapter.
 */
export interface EmotionSoundMoodPort {
  applyMood(
    mood: SoundMoodProfile,
    options: {
      signature: string;
      intensity: number;
      transitionMs: number;
    },
  ): void;
  reset(): void;
}

