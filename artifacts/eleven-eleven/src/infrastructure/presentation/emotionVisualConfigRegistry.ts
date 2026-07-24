import { z } from 'zod';
import emotionVisualJson from '../../../data/presentation/emotion-visual.json';
import type {
  EmotionVisualSystemConfig,
} from '../../domain/emotion/emotionVisualSystem';

const paletteSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  ambient: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const atmosphereSchema = z.object({
  darkness: z.number().min(0).max(1),
  warmth: z.number().min(-1).max(1),
  haze: z.number().min(0).max(1),
  particleEnergy: z.number().min(0).max(1),
  pulse: z.number().min(0).max(1),
});

const gradingSchema = z.object({
  brightness: z.number().min(0.5).max(1.5),
  contrast: z.number().min(0.5).max(2),
  saturation: z.number().min(0).max(2),
  vignette: z.number().min(0).max(1),
  bloom: z.number().min(0).max(1),
});

const glitchSchema = z.object({
  intensity: z.number().min(0).max(1),
  frequency: z.number().min(0).max(1),
  chromaticShiftPx: z.number().min(0).max(8),
  displacementPx: z.number().min(0).max(16),
  scanlines: z.number().min(0).max(1),
  noise: z.number().min(0).max(1),
});

const cinematicSchema = z.object({
  cameraDrift: z.number().min(0).max(1),
  cameraShake: z.number().min(0).max(1),
  focusBreathing: z.number().min(0).max(1),
  transitionDistortion: z.number().min(0).max(1),
  memoryBloom: z.number().min(0).max(1),
  framePulse: z.number().min(0).max(1),
});

const soundSchema = z.object({
  tension: z.number().min(0).max(1),
  warmth: z.number().min(0).max(1),
  isolation: z.number().min(0).max(1),
  distortion: z.number().min(0).max(1),
  heartbeat: z.number().min(0).max(1),
  reverb: z.number().min(0).max(1),
  lowPassHz: z.number().min(200).max(20_000),
});

const presentationTargetSchema = z.object({
  palette: paletteSchema,
  atmosphere: atmosphereSchema,
  grading: gradingSchema,
  glitch: glitchSchema,
  cinematic: cinematicSchema,
  sound: soundSchema,
});

const channelSchema = presentationTargetSchema.extend({
  activationThreshold: z.number().min(0).max(0.95),
  influence: z.number().positive().max(4),
});

export const emotionVisualConfigSchema = z.object({
  schemaVersion: z.number().int().positive(),
  response: z.object({
    curveExponent: z.number().positive().max(4),
    neutralBias: z.number().positive().max(4),
    transitionMs: z.number().int().min(0).max(10_000),
    significantDelta: z.number().min(0).max(1),
  }),
  base: presentationTargetSchema,
  channels: z.object({
    humanity: channelSchema,
    trust: channelSchema,
    fear: channelSchema,
    anger: channelSchema,
    sadness: channelSchema,
    corruption: channelSchema,
  }),
});

export const EMOTION_VISUAL_CONFIG = emotionVisualConfigSchema.parse(
  emotionVisualJson,
) as EmotionVisualSystemConfig;

export function validateEmotionVisualConfig(): void {
  emotionVisualConfigSchema.parse(emotionVisualJson);
}

validateEmotionVisualConfig();

