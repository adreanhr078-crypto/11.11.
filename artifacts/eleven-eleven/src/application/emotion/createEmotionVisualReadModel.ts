import type {
  EmotionVisualProfile,
} from '../../domain/emotion/emotionVisualSystem';

export type EmotionCssVariableName = `--evs-${string}`;

export interface EmotionVisualReadModel {
  profile: EmotionVisualProfile;
  attributes: {
    emotion: string;
    signature: string;
    intensity: string;
  };
  cssVariables: Record<EmotionCssVariableName, string>;
}

function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '255 255 255';
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ].join(' ');
}

function decimal(value: number, precision = 3): string {
  return Number(value.toFixed(precision)).toString();
}

export function createEmotionVisualReadModel(
  profile: EmotionVisualProfile,
): EmotionVisualReadModel {
  return {
    profile,
    attributes: {
      emotion: profile.dominantEmotion ?? 'balanced',
      signature: profile.signature,
      intensity: decimal(profile.intensity),
    },
    cssVariables: {
      '--evs-primary': profile.palette.primary,
      '--evs-secondary': profile.palette.secondary,
      '--evs-ambient': profile.palette.ambient,
      '--evs-primary-rgb': hexToRgbChannels(profile.palette.primary),
      '--evs-secondary-rgb': hexToRgbChannels(profile.palette.secondary),
      '--evs-ambient-rgb': hexToRgbChannels(profile.palette.ambient),
      '--evs-intensity': decimal(profile.intensity),
      '--evs-transition-ms': `${profile.transitionMs}ms`,
      '--evs-atmosphere-darkness': decimal(profile.atmosphere.darkness),
      '--evs-atmosphere-warmth': decimal(profile.atmosphere.warmth),
      '--evs-atmosphere-haze': decimal(profile.atmosphere.haze),
      '--evs-particle-energy': decimal(profile.atmosphere.particleEnergy),
      '--evs-pulse': decimal(profile.atmosphere.pulse),
      '--evs-grade-brightness': decimal(profile.grading.brightness),
      '--evs-grade-contrast': decimal(profile.grading.contrast),
      '--evs-grade-saturation': decimal(profile.grading.saturation),
      '--evs-grade-vignette': decimal(profile.grading.vignette),
      '--evs-grade-bloom': decimal(profile.grading.bloom),
      '--evs-glitch-intensity': decimal(profile.glitch.intensity),
      '--evs-glitch-frequency': decimal(profile.glitch.frequency),
      '--evs-glitch-chromatic-px': `${decimal(profile.glitch.chromaticShiftPx)}px`,
      '--evs-glitch-displacement-px': `${decimal(profile.glitch.displacementPx)}px`,
      '--evs-glitch-scanlines': decimal(profile.glitch.scanlines),
      '--evs-glitch-noise': decimal(profile.glitch.noise),
      '--evs-camera-drift': decimal(profile.cinematic.cameraDrift),
      '--evs-camera-shake': decimal(profile.cinematic.cameraShake),
      '--evs-focus-breathing': decimal(profile.cinematic.focusBreathing),
      '--evs-transition-distortion': decimal(
        profile.cinematic.transitionDistortion,
      ),
      '--evs-memory-bloom': decimal(profile.cinematic.memoryBloom),
      '--evs-frame-pulse': decimal(profile.cinematic.framePulse),
      '--evs-sound-tension': decimal(profile.sound.tension),
      '--evs-sound-warmth': decimal(profile.sound.warmth),
      '--evs-sound-isolation': decimal(profile.sound.isolation),
      '--evs-sound-distortion': decimal(profile.sound.distortion),
      '--evs-sound-heartbeat': decimal(profile.sound.heartbeat),
      '--evs-sound-reverb': decimal(profile.sound.reverb),
      '--evs-sound-lowpass-hz': decimal(profile.sound.lowPassHz),
    },
  };
}

