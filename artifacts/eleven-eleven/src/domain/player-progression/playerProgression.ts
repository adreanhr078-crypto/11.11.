export const PLAYER_XP_SOURCE_TYPES = [
  'puzzle',
  'story',
  'secret',
  'achievement',
  'daily_trial',
  'online_chess',
] as const;

export type PlayerXpSourceType =
  typeof PLAYER_XP_SOURCE_TYPES[number];

export const MAX_PLAYER_LEVEL = 100;
export const MAX_TOTAL_XP = 2_147_483_647;
const LEVEL_CURVE_BASE_XP = 100;

export interface PlayerLevelProgress {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
  isCurrentPlayer: boolean;
}

export function normalizeTotalXp(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(MAX_TOTAL_XP, Math.max(0, Math.floor(numeric)));
}

export function totalXpRequiredForLevel(level: number): number {
  const normalizedLevel = Math.min(
    MAX_PLAYER_LEVEL,
    Math.max(1, Math.floor(level)),
  );
  return LEVEL_CURVE_BASE_XP * (normalizedLevel - 1) ** 2;
}

export function getPlayerLevelProgress(totalXp: unknown): PlayerLevelProgress {
  const normalizedXp = normalizeTotalXp(totalXp);
  const uncappedLevel = Math.floor(
    Math.sqrt(normalizedXp / LEVEL_CURVE_BASE_XP),
  ) + 1;
  const level = Math.min(MAX_PLAYER_LEVEL, Math.max(1, uncappedLevel));
  const currentLevelXp = totalXpRequiredForLevel(level);
  const nextLevelXp = level >= MAX_PLAYER_LEVEL
    ? null
    : totalXpRequiredForLevel(level + 1);
  const xpIntoLevel = Math.max(0, normalizedXp - currentLevelXp);
  const xpForNextLevel = nextLevelXp === null
    ? null
    : nextLevelXp - currentLevelXp;
  const progressPercent = xpForNextLevel === null
    ? 100
    : Math.min(100, Math.floor((xpIntoLevel / xpForNextLevel) * 100));

  return {
    level,
    totalXp: normalizedXp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    progressPercent,
  };
}

export function createXpRewardKey(
  sourceType: PlayerXpSourceType,
  sourceId: string,
): string {
  return `${sourceType}:${sourceId.trim()}:v1`;
}
