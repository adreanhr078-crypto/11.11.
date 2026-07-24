import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  deriveEmotionVisualProfile,
  type EmotionVisualProfile,
} from '../../domain/emotion/emotionVisualSystem';
import {
  EMOTION_VISUAL_CONFIG,
} from '../../infrastructure/presentation/emotionVisualConfigRegistry';
import {
  createEmotionVisualReadModel,
} from '../../application/emotion/createEmotionVisualReadModel';
import type {
  EmotionSoundMoodPort,
} from '../../application/emotion/EmotionPresentationPorts';

// One derived profile is shared by every presentation consumer.
const EmotionVisualContext = createContext<EmotionVisualProfile | null>(null);

export function EmotionVisualProvider({
  children,
}: {
  children: ReactNode;
}) {
  const personality = useGameStore((state) => state.echo.personality);
  const profile = useMemo(
    () => deriveEmotionVisualProfile(personality, EMOTION_VISUAL_CONFIG),
    [personality],
  );
  return (
    <EmotionVisualContext.Provider value={profile}>
      {children}
    </EmotionVisualContext.Provider>
  );
}

export function useEmotionVisualProfile(): EmotionVisualProfile {
  const profile = useContext(EmotionVisualContext);
  if (!profile) {
    throw new Error(
      'useEmotionVisualProfile requires EmotionVisualProvider',
    );
  }
  return profile;
}

export function useEmotionAtmosphere() {
  return useEmotionVisualProfile().atmosphere;
}

export function useEmotionColorGrading() {
  return useEmotionVisualProfile().grading;
}

export function useEmotionGlitchEffects() {
  return useEmotionVisualProfile().glitch;
}

export function useEmotionCinematicEffects() {
  return useEmotionVisualProfile().cinematic;
}

export function useEmotionSoundMood() {
  return useEmotionVisualProfile().sound;
}

export interface ApplyEmotionVisualsOptions {
  targetId?: string;
  enabled?: boolean;
}

export function useApplyEmotionVisuals({
  targetId = 'app',
  enabled = true,
}: ApplyEmotionVisualsOptions = {}) {
  const profile = useEmotionVisualProfile();
  const readModel = useMemo(
    () => createEmotionVisualReadModel(profile),
    [profile],
  );

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const target = document.getElementById(targetId);
    if (!target) return;

    for (const [name, value] of Object.entries(readModel.cssVariables)) {
      target.style.setProperty(name, value);
    }
    target.dataset.evsEmotion = readModel.attributes.emotion;
    target.dataset.evsSignature = readModel.attributes.signature;
    target.dataset.evsIntensity = readModel.attributes.intensity;
  }, [enabled, readModel, targetId]);

  return readModel;
}

function soundDelta(
  previous: EmotionVisualProfile,
  next: EmotionVisualProfile,
): number {
  const keys = [
    'tension',
    'warmth',
    'isolation',
    'distortion',
    'heartbeat',
    'reverb',
  ] as const;
  return Math.max(...keys.map((key) => (
    Math.abs(previous.sound[key] - next.sound[key])
  )));
}

export function useEmotionSoundMoodBridge(
  port: EmotionSoundMoodPort | null,
) {
  const profile = useEmotionVisualProfile();
  const previousRef = useRef<EmotionVisualProfile | null>(null);

  useEffect(() => {
    if (!port) return;
    const previous = previousRef.current;
    if (
      previous
      && previous.signature === profile.signature
      && soundDelta(previous, profile) < profile.significantDelta
    ) {
      return;
    }

    port.applyMood(profile.sound, {
      signature: profile.signature,
      intensity: profile.intensity,
      transitionMs: profile.transitionMs,
    });
    previousRef.current = profile;
  }, [port, profile]);

  useEffect(() => () => port?.reset(), [port]);

  return profile.sound;
}

export function EmotionVisualBridge() {
  useApplyEmotionVisuals();
  return null;
}
