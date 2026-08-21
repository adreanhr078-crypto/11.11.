import { useEffect } from 'react';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import { playEchoMindSignal } from '../../infrastructure/audio/echoMindSignalAudio';
import {
  subscribeExperienceCues,
  type ExperienceCueName,
} from './experienceCues';

/**
 * Keeps the first-player sound layer deliberately small and replaceable.
 *
 * These tones are feedback, not narrative authority. Authored voice files can
 * later replace them without changing the player journey or server contracts.
 */
const SIGNAL_BY_CUE: Partial<Record<ExperienceCueName, 'memory' | 'reply'>> = {
  'onboarding-complete': 'reply',
  'manhwa-open': 'memory',
};

export function ExperienceCueAudioBridge() {
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);

  useEffect(() => subscribeExperienceCues((cue) => {
    if (!audioEnabled) return;
    const signal = SIGNAL_BY_CUE[cue.name];
    if (!signal) return;
    playEchoMindSignal(signal, Math.min(1, Math.max(0, sfxVolume * 0.72)));
  }), [audioEnabled, sfxVolume]);

  return null;
}
