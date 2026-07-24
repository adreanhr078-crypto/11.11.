import type { EchoPersonality } from '../echo/echoPersonality';

export type EmotionDimension =
  | 'humanity'
  | 'trust'
  | 'fear'
  | 'anger'
  | 'sadness'
  | 'corruption';

export interface EmotionPalette {
  primary: string;
  secondary: string;
  ambient: string;
}

export interface AtmosphereProfile {
  darkness: number;
  warmth: number;
  haze: number;
  particleEnergy: number;
  pulse: number;
}

export interface ColorGradingProfile {
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
  bloom: number;
}

export interface GlitchProfile {
  intensity: number;
  frequency: number;
  chromaticShiftPx: number;
  displacementPx: number;
  scanlines: number;
  noise: number;
}

export interface CinematicEmotionProfile {
  cameraDrift: number;
  cameraShake: number;
  focusBreathing: number;
  transitionDistortion: number;
  memoryBloom: number;
  framePulse: number;
}

export interface SoundMoodProfile {
  tension: number;
  warmth: number;
  isolation: number;
  distortion: number;
  heartbeat: number;
  reverb: number;
  lowPassHz: number;
}

export interface EmotionPresentationTarget {
  palette: EmotionPalette;
  atmosphere: AtmosphereProfile;
  grading: ColorGradingProfile;
  glitch: GlitchProfile;
  cinematic: CinematicEmotionProfile;
  sound: SoundMoodProfile;
}

export interface EmotionChannelDefinition
  extends EmotionPresentationTarget {
  activationThreshold: number;
  influence: number;
}

export interface EmotionVisualSystemConfig {
  schemaVersion: number;
  response: {
    curveExponent: number;
    neutralBias: number;
    transitionMs: number;
    significantDelta: number;
  };
  base: EmotionPresentationTarget;
  channels: Record<EmotionDimension, EmotionChannelDefinition>;
}

export type EmotionSignature =
  | 'balanced'
  | 'hopeful'
  | 'connected'
  | 'afraid'
  | 'volatile'
  | 'melancholic'
  | 'corrupted';

export interface EmotionVisualProfile
  extends EmotionPresentationTarget {
  dominantEmotion: EmotionDimension | null;
  signature: EmotionSignature;
  intensity: number;
  weights: Record<EmotionDimension, number>;
  transitionMs: number;
  significantDelta: number;
}

const DIMENSIONS: readonly EmotionDimension[] = [
  'humanity',
  'trust',
  'fear',
  'anger',
  'sadness',
  'corruption',
];

function clamp(value: number, minimum = 0, maximum = 1): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return [255, 255, 255];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex(value: number): string {
  return Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0');
}

function blendColor(
  baseColor: string,
  weightedColors: Array<{ color: string; weight: number }>,
  baseWeight: number,
): string {
  const base = parseHex(baseColor);
  let totalWeight = baseWeight;
  let red = base[0] * baseWeight;
  let green = base[1] * baseWeight;
  let blue = base[2] * baseWeight;

  for (const item of weightedColors) {
    const color = parseHex(item.color);
    red += color[0] * item.weight;
    green += color[1] * item.weight;
    blue += color[2] * item.weight;
    totalWeight += item.weight;
  }

  const safeWeight = Math.max(0.0001, totalWeight);
  return `#${toHex(red / safeWeight)}${toHex(green / safeWeight)}${toHex(blue / safeWeight)}`;
}

function blendNumber(
  baseValue: number,
  values: Array<{ value: number; weight: number }>,
  baseWeight: number,
): number {
  const weighted = values.reduce(
    (sum, item) => sum + item.value * item.weight,
    baseValue * baseWeight,
  );
  const totalWeight = values.reduce(
    (sum, item) => sum + item.weight,
    baseWeight,
  );
  return weighted / Math.max(0.0001, totalWeight);
}

function activationWeight(
  value: number,
  channel: EmotionChannelDefinition,
  exponent: number,
): number {
  const normalized = clamp(value / 100);
  const threshold = clamp(channel.activationThreshold, 0, 0.95);
  const activeRange = clamp(
    (normalized - threshold) / (1 - threshold),
  );
  return (activeRange ** exponent) * channel.influence;
}

function signatureFor(
  dimension: EmotionDimension | null,
): EmotionSignature {
  switch (dimension) {
    case 'humanity': return 'hopeful';
    case 'trust': return 'connected';
    case 'fear': return 'afraid';
    case 'anger': return 'volatile';
    case 'sadness': return 'melancholic';
    case 'corruption': return 'corrupted';
    default: return 'balanced';
  }
}

export function deriveEmotionVisualProfile(
  personality: EchoPersonality,
  config: EmotionVisualSystemConfig,
): EmotionVisualProfile {
  const weights = Object.fromEntries(DIMENSIONS.map((dimension) => [
    dimension,
    activationWeight(
      personality[dimension],
      config.channels[dimension],
      config.response.curveExponent,
    ),
  ])) as Record<EmotionDimension, number>;
  const weightedChannels = DIMENSIONS.map((dimension) => ({
    dimension,
    channel: config.channels[dimension],
    weight: weights[dimension],
  }));
  const dominant = weightedChannels.reduce<{
    dimension: EmotionDimension | null;
    weight: number;
  }>((current, item) => (
    item.weight > current.weight
      ? { dimension: item.dimension, weight: item.weight }
      : current
  ), { dimension: null, weight: 0 });
  const dominantEmotion = dominant.weight >= 0.02
    ? dominant.dimension
    : null;
  const baseWeight = config.response.neutralBias;
  const numeric = (
    getValue: (target: EmotionPresentationTarget) => number,
  ) => blendNumber(
    getValue(config.base),
    weightedChannels.map(({ channel, weight }) => ({
      value: getValue(channel),
      weight,
    })),
    baseWeight,
  );
  const color = (
    getValue: (palette: EmotionPalette) => string,
  ) => blendColor(
    getValue(config.base.palette),
    weightedChannels.map(({ channel, weight }) => ({
      color: getValue(channel.palette),
      weight,
    })),
    baseWeight,
  );

  return {
    dominantEmotion,
    signature: signatureFor(dominantEmotion),
    intensity: clamp(dominant.weight),
    weights,
    transitionMs: config.response.transitionMs,
    significantDelta: config.response.significantDelta,
    palette: {
      primary: color((palette) => palette.primary),
      secondary: color((palette) => palette.secondary),
      ambient: color((palette) => palette.ambient),
    },
    atmosphere: {
      darkness: clamp(numeric((target) => target.atmosphere.darkness)),
      warmth: clamp(numeric((target) => target.atmosphere.warmth), -1, 1),
      haze: clamp(numeric((target) => target.atmosphere.haze)),
      particleEnergy: clamp(
        numeric((target) => target.atmosphere.particleEnergy),
      ),
      pulse: clamp(numeric((target) => target.atmosphere.pulse)),
    },
    grading: {
      brightness: clamp(
        numeric((target) => target.grading.brightness),
        0.5,
        1.5,
      ),
      contrast: clamp(
        numeric((target) => target.grading.contrast),
        0.5,
        2,
      ),
      saturation: clamp(
        numeric((target) => target.grading.saturation),
        0,
        2,
      ),
      vignette: clamp(numeric((target) => target.grading.vignette)),
      bloom: clamp(numeric((target) => target.grading.bloom)),
    },
    glitch: {
      intensity: clamp(numeric((target) => target.glitch.intensity)),
      frequency: clamp(numeric((target) => target.glitch.frequency)),
      chromaticShiftPx: clamp(
        numeric((target) => target.glitch.chromaticShiftPx),
        0,
        8,
      ),
      displacementPx: clamp(
        numeric((target) => target.glitch.displacementPx),
        0,
        16,
      ),
      scanlines: clamp(numeric((target) => target.glitch.scanlines)),
      noise: clamp(numeric((target) => target.glitch.noise)),
    },
    cinematic: {
      cameraDrift: clamp(
        numeric((target) => target.cinematic.cameraDrift),
      ),
      cameraShake: clamp(
        numeric((target) => target.cinematic.cameraShake),
      ),
      focusBreathing: clamp(
        numeric((target) => target.cinematic.focusBreathing),
      ),
      transitionDistortion: clamp(
        numeric((target) => target.cinematic.transitionDistortion),
      ),
      memoryBloom: clamp(
        numeric((target) => target.cinematic.memoryBloom),
      ),
      framePulse: clamp(
        numeric((target) => target.cinematic.framePulse),
      ),
    },
    sound: {
      tension: clamp(numeric((target) => target.sound.tension)),
      warmth: clamp(numeric((target) => target.sound.warmth)),
      isolation: clamp(numeric((target) => target.sound.isolation)),
      distortion: clamp(numeric((target) => target.sound.distortion)),
      heartbeat: clamp(numeric((target) => target.sound.heartbeat)),
      reverb: clamp(numeric((target) => target.sound.reverb)),
      lowPassHz: clamp(
        numeric((target) => target.sound.lowPassHz),
        200,
        20_000,
      ),
    },
  };
}

