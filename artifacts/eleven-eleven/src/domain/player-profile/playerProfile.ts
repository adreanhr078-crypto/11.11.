import type { PlayerLevelProgress } from '../player-progression/playerProgression';

export const STARTER_PLAYER_AVATAR_IDS = [
  'echo',
  'silver_signal',
  'red_rift',
] as const;

export const RARE_PLAYER_AVATAR_IDS = [
  'rare_yuki',
  'rare_nara',
  'rare_kenja',
  'rare_lina',
  'rare_zero',
] as const;

export const PLAYER_AVATAR_IDS = [
  ...STARTER_PLAYER_AVATAR_IDS,
  ...RARE_PLAYER_AVATAR_IDS,
] as const;

export type PlayerAvatarId = typeof PLAYER_AVATAR_IDS[number];
export type RarePlayerAvatarId = typeof RARE_PLAYER_AVATAR_IDS[number];

export const PROFILE_USERNAME_MIN_LENGTH = 3;
export const PROFILE_USERNAME_MAX_LENGTH = 28;
export const PROFILE_BIO_MAX_LENGTH = 160;
export const PROFILE_FEATURED_ACHIEVEMENT_LIMIT = 3;

export interface PlayerProfileStats {
  chaptersCompleted: number;
  puzzlesSolved: number;
  secretsFound: number;
}

export interface PlayerProfileProgression extends PlayerLevelProgress {
  rank: number;
}

export interface PlayerProfile {
  uid: string;
  subjectId: string;
  username: string;
  bio: string;
  avatarId: PlayerAvatarId;
  email: string | null;
  providerId: string;
  isAnonymous: boolean;
  joinDate: string;
  progression: PlayerProfileProgression;
  stats: PlayerProfileStats;
  featuredAchievementIds: string[];
  /** Starter avatars plus rare avatars verified by the reward ledger. */
  unlockedAvatarIds: PlayerAvatarId[];
}

export interface PlayerProfileUpdateInput {
  username: string;
  bio: string;
  avatarId: PlayerAvatarId;
  featuredAchievementIds?: string[];
}

export function isPlayerAvatarId(value: unknown): value is PlayerAvatarId {
  return typeof value === 'string'
    && PLAYER_AVATAR_IDS.includes(value as PlayerAvatarId);
}

export function isStarterPlayerAvatarId(value: unknown): value is typeof STARTER_PLAYER_AVATAR_IDS[number] {
  return typeof value === 'string'
    && STARTER_PLAYER_AVATAR_IDS.includes(value as typeof STARTER_PLAYER_AVATAR_IDS[number]);
}

export function isRarePlayerAvatarId(value: unknown): value is RarePlayerAvatarId {
  return typeof value === 'string'
    && RARE_PLAYER_AVATAR_IDS.includes(value as RarePlayerAvatarId);
}
