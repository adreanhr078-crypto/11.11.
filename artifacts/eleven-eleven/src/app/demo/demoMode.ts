import { STORY_PUZZLES } from '../../content/puzzles/storyPuzzleCatalog';

export const DEMO_CAMPAIGN_SIZE = STORY_PUZZLES.length;

const DEMO_PUZZLE_IDS = new Set(
  STORY_PUZZLES.map((puzzle) => puzzle.id),
);

export interface DemoModeConfig {
  enabled: boolean;
  fullGameUrl: string | null;
}

export interface DemoProgressReadModel {
  completed: number;
  total: number;
  remaining: number;
  percentage: number;
  boundaryReached: boolean;
}

type DemoEnvironment = Pick<
  ImportMetaEnv,
  'VITE_DEMO_MODE' | 'VITE_FULL_GAME_URL'
>;

function parseExternalUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function readDemoModeConfig(
  environment: Partial<DemoEnvironment> = import.meta.env,
): DemoModeConfig {
  return {
    enabled: environment.VITE_DEMO_MODE?.trim().toLowerCase() === 'true',
    fullGameUrl: parseExternalUrl(environment.VITE_FULL_GAME_URL),
  };
}

export function createDemoProgressReadModel(
  completedPuzzleIds: readonly string[],
): DemoProgressReadModel {
  const completed = new Set(
    completedPuzzleIds.filter((id) => DEMO_PUZZLE_IDS.has(id)),
  ).size;
  const total = DEMO_CAMPAIGN_SIZE;

  return {
    completed,
    total,
    remaining: Math.max(0, total - completed),
    percentage: total === 0
      ? 0
      : Math.min(100, Math.round((completed / total) * 100)),
    boundaryReached: total > 0 && completed >= total,
  };
}
