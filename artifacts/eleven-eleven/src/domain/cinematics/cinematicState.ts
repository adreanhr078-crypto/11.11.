import type {
  CinematicEpisodeId,
  JapaneseVoiceLocale,
  SubtitleLocale,
} from './contracts';
import type { SceneId } from '../content/contracts';

export type CinematicPlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'awaitingChoice'
  | 'completed';

export interface CinematicPreferences {
  voiceLocale: JapaneseVoiceLocale;
  subtitleLocale: SubtitleLocale;
  subtitlesEnabled: boolean;
  autoAdvance: boolean;
}

export interface CinematicState {
  activeEpisodeId: CinematicEpisodeId | null;
  activeSceneId: SceneId | null;
  status: CinematicPlaybackStatus;
  currentSceneStartedAt: number | null;
  awaitingDecisionId: string | null;
  visitedSceneIds: SceneId[];
  completedSceneIds: SceneId[];
  completedEpisodeIds: CinematicEpisodeId[];
  preferences: CinematicPreferences;
}

export function createInitialCinematicState(): CinematicState {
  return {
    activeEpisodeId: null,
    activeSceneId: null,
    status: 'idle',
    currentSceneStartedAt: null,
    awaitingDecisionId: null,
    visitedSceneIds: [],
    completedSceneIds: [],
    completedEpisodeIds: [],
    preferences: {
      voiceLocale: 'ja-JP',
      subtitleLocale: 'ar',
      subtitlesEnabled: true,
      autoAdvance: true,
    },
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function normalizeCinematicState(
  value: Partial<CinematicState> | undefined,
): CinematicState {
  const initial = createInitialCinematicState();
  if (!value) return initial;

  const validStatuses: CinematicPlaybackStatus[] = [
    'idle',
    'loading',
    'playing',
    'paused',
    'awaitingChoice',
    'completed',
  ];

  return {
    activeEpisodeId: value.activeEpisodeId ?? null,
    activeSceneId: value.activeSceneId ?? null,
    status: value.status && validStatuses.includes(value.status)
      ? value.status
      : initial.status,
    currentSceneStartedAt: value.currentSceneStartedAt ?? null,
    awaitingDecisionId: value.awaitingDecisionId ?? null,
    visitedSceneIds: unique(value.visitedSceneIds ?? []),
    completedSceneIds: unique(value.completedSceneIds ?? []),
    completedEpisodeIds: unique(value.completedEpisodeIds ?? []),
    preferences: {
      ...initial.preferences,
      ...(value.preferences ?? {}),
      voiceLocale: 'ja-JP',
      subtitleLocale: value.preferences?.subtitleLocale === 'en'
        ? 'en'
        : 'ar',
    },
  };
}

