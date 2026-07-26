import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

export type GameplayAudioCue =
  | 'ambient'
  | 'footstep'
  | 'clock'
  | 'door'
  | 'memoryGlitch';

/**
 * Central asset slots for the opening-room audio pass.
 * Keep these null until licensed local files are added under public/assets.
 */
export const GAMEPLAY_AUDIO_ASSETS: Readonly<
  Record<GameplayAudioCue, string | null>
> = Object.freeze({
  ambient: null,
  footstep: null,
  clock: null,
  door: null,
  memoryGlitch: null,
});

interface PlayCueOptions {
  loop?: boolean;
  volume?: number;
}

export function useGameplayAudio() {
  const activeAudioRef = useRef(new Set<HTMLAudioElement>());

  const playCue = useCallback((
    cue: GameplayAudioCue,
    options: PlayCueOptions = {},
  ) => {
    const source = GAMEPLAY_AUDIO_ASSETS[cue];
    if (!source) return;

    const audio = new Audio(source);
    audio.loop = options.loop ?? false;
    audio.volume = Math.min(1, Math.max(0, options.volume ?? 0.55));
    activeAudioRef.current.add(audio);

    const release = () => activeAudioRef.current.delete(audio);
    audio.addEventListener('ended', release, { once: true });
    void audio.play().catch(() => {
      release();
    });
  }, []);

  useEffect(() => () => {
    for (const audio of activeAudioRef.current) {
      audio.pause();
      audio.src = '';
    }
    activeAudioRef.current.clear();
  }, []);

  return { playCue };
}
