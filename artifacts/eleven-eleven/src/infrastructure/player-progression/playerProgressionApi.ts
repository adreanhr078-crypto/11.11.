import { getCurrentAuthToken } from '../../features/auth/authService';
import { playerApiRoot } from '../player-api/apiRoot';
import type {
  LeaderboardPlayer,
} from '../../domain/player-progression/playerProgression';
import type {
  PlayerAvatarId,
  PlayerProfile,
} from '../../domain/player-profile/playerProfile';
import type {
  AuthoritativeStoryState,
} from '../../domain/story/storyState';
import type {
  CollectionSnapshot,
} from '../../domain/collection/collectionContracts';
import type {
  StoryPuzzleDraft,
  StoryPuzzleRewardReceipt,
  StoryPuzzleSnapshot,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import type {
  LiveChallengesSnapshot,
  LiveCompletionReceipt,
} from '../../domain/live-challenges/liveChallengeContracts';

export interface LeaderboardApiSnapshot {
  entries: LeaderboardPlayer[];
  currentPlayer: LeaderboardPlayer;
  totalPlayers: number;
  generatedAt: string;
}

interface LeaderboardApiResponse {
  leaderboard: LeaderboardApiSnapshot;
  rankingMetric: 'total_xp';
}

export interface XpClaimApiResponse {
  reward: {
    sourceType: 'manhwa';
    sourceId: string;
    rewardKey: string;
    awarded: boolean;
    xpGranted: number;
  };
  progression: LeaderboardPlayer;
}

export function claimManhwaChapterXpReward(
  chapterId: string,
  finalPageNumber: number,
): Promise<XpClaimApiResponse> {
  return authorizedRequest<XpClaimApiResponse>('/xp/claim', {
    method: 'POST',
    body: JSON.stringify({
      sourceType: 'manhwa',
      sourceId: chapterId,
      proof: { finalPageNumber },
    }),
  });
}

interface PlayerProfileApiResponse {
  profile: PlayerProfile;
}

interface StoryStateApiResponse {
  storyState: AuthoritativeStoryState;
}

interface StoryCheckpointApiResponse extends StoryStateApiResponse {
  claimedEventIds: string[];
}

interface ApiErrorBody {
  error?: unknown;
  code?: unknown;
}

export class PlayerProgressionApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function apiRoot(): string {
  const runtimeEnv = (import.meta as ImportMeta & {
    env?: ImportMetaEnv;
  }).env;
  const configured = runtimeEnv?.VITE_PLAYER_API_URL?.trim();
  return playerApiRoot(configured);
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: ApiErrorBody & Partial<T> = {};
  try {
    payload = await response.json() as ApiErrorBody & Partial<T>;
  } catch {
    // A stable API error is produced below.
  }
  if (!response.ok) {
    throw new PlayerProgressionApiError(
      response.status,
      typeof payload.code === 'string' ? payload.code : 'request_failed',
      typeof payload.error === 'string'
        ? payload.error
        : 'Player progression request failed.',
    );
  }
  return payload as T;
}

async function authorizedRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getCurrentAuthToken();
  if (!token) {
    throw new PlayerProgressionApiError(
      401,
      'unauthorized',
      'Authentication is required.',
    );
  }
  const response = await fetch(`${apiRoot()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  return parseResponse<T>(response);
}

export async function fetchGlobalLeaderboard(
  limit = 25,
): Promise<LeaderboardApiSnapshot> {
  const response = await authorizedRequest<LeaderboardApiResponse>(
    `/leaderboard?limit=${encodeURIComponent(limit)}`,
  );
  return response.leaderboard;
}

export function fetchPlayerProfile(): Promise<PlayerProfile> {
  return authorizedRequest<PlayerProfileApiResponse>('/profile')
    .then((response) => response.profile);
}

export function updatePlayerProfile(input: {
  username: string;
  bio: string;
  avatarId: PlayerAvatarId;
  featuredAchievementIds?: string[];
}): Promise<PlayerProfile> {
  return authorizedRequest<PlayerProfileApiResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  }).then((response) => response.profile);
}

export function fetchAuthoritativeStoryState(): Promise<AuthoritativeStoryState> {
  return authorizedRequest<StoryStateApiResponse>('/story-state')
    .then((response) => response.storyState);
}

/**
 * The client reports only a Manhwa reader coordinate. The server owns Canon
 * event lookup, prerequisite checks, receipts, and every resulting state.
 */
export function claimManhwaStoryCheckpoint(input: {
  chapterId: string;
  pageId: string;
  globalPageNumber: number;
}): Promise<StoryCheckpointApiResponse> {
  return authorizedRequest<StoryCheckpointApiResponse>(
    '/story-state/checkpoint',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

interface StoryPuzzleStateResponse {
  puzzleState: StoryPuzzleSnapshot;
}

interface StoryPuzzleRewardResponse {
  reward: StoryPuzzleRewardReceipt;
}

export function fetchStoryPuzzleState(): Promise<StoryPuzzleSnapshot> {
  return authorizedRequest<StoryPuzzleStateResponse>('/puzzles')
    .then((response) => response.puzzleState);
}

export function saveStoryPuzzleProgress(
  puzzleId: string,
  draft: StoryPuzzleDraft,
): Promise<StoryPuzzleSnapshot> {
  return authorizedRequest<StoryPuzzleStateResponse>('/puzzles/progress', {
    method: 'POST',
    body: JSON.stringify({ puzzleId, draft }),
  }).then((response) => response.puzzleState);
}

export function completeStoryPuzzle(
  puzzleId: string,
  draft: StoryPuzzleDraft,
): Promise<StoryPuzzleRewardReceipt> {
  return authorizedRequest<StoryPuzzleRewardResponse>('/puzzles/complete', {
    method: 'POST',
    body: JSON.stringify({ puzzleId, draft }),
  }).then((response) => response.reward);
}

export function discoverStoryPuzzle(puzzleId: string): Promise<StoryPuzzleSnapshot> {
  return authorizedRequest<StoryPuzzleStateResponse>('/puzzles/discover', {
    method: 'POST',
    body: JSON.stringify({ puzzleId }),
  }).then((response) => response.puzzleState);
}

export function unlockStoryPuzzleHint(
  puzzleId: string,
  hintIndex: number,
): Promise<{ alreadyUnlocked: boolean; puzzleState: StoryPuzzleSnapshot }> {
  return authorizedRequest<{ alreadyUnlocked: boolean; puzzleState: StoryPuzzleSnapshot }>('/puzzles/hints', {
    method: 'POST',
    body: JSON.stringify({ puzzleId, hintIndex }),
  });
}

interface CollectionApiResponse {
  collection: CollectionSnapshot;
}

export function fetchPlayerCollection(): Promise<CollectionSnapshot> {
  return authorizedRequest<CollectionApiResponse>('/collection')
    .then((response) => response.collection);
}

export function reconstructPlayerMemory(
  chapterId: string,
): Promise<CollectionSnapshot> {
  return authorizedRequest<CollectionApiResponse>('/collection/reconstruct', {
    method: 'POST',
    body: JSON.stringify({ chapterId }),
  }).then((response) => response.collection);
}

export function equipPlayerCosmetic(
  cosmeticId: string,
): Promise<CollectionSnapshot> {
  return authorizedRequest<CollectionApiResponse>('/collection/equip', {
    method: 'POST',
    body: JSON.stringify({ cosmeticId }),
  }).then((response) => response.collection);
}

interface LiveApiResponse {
  live: LiveChallengesSnapshot;
}

interface LiveReceiptResponse {
  receipt: LiveCompletionReceipt;
}

export function fetchLiveChallenges(): Promise<LiveChallengesSnapshot> {
  return authorizedRequest<LiveApiResponse>('/live')
    .then((response) => response.live);
}

function liveAction<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  return authorizedRequest<T>('/live/action', {
    method: 'POST',
    body: JSON.stringify({ action, ...body }),
  });
}

export function startDailySignal(): Promise<LiveChallengesSnapshot> {
  return liveAction<LiveApiResponse>('start-daily').then((response) => response.live);
}

export function saveDailySignalDraft(draft: { answer?: string }): Promise<LiveChallengesSnapshot> {
  return liveAction<LiveApiResponse>('save-daily', { draft }).then((response) => response.live);
}

export function useDailySignalHint(hintIndex: number): Promise<{
  alreadyUnlocked: boolean;
  hint: string;
  live: LiveChallengesSnapshot;
}> {
  return liveAction('use-daily-hint', { hintIndex });
}

export function completeDailySignal(answer: string): Promise<LiveCompletionReceipt> {
  return liveAction<LiveReceiptResponse>('complete-daily', { answer })
    .then((response) => response.receipt);
}

export function startWeeklySystemTrial(): Promise<LiveChallengesSnapshot> {
  return liveAction<LiveApiResponse>('start-weekly').then((response) => response.live);
}

export function saveWeeklySystemTrialDraft(draft: { answer?: string }): Promise<LiveChallengesSnapshot> {
  return liveAction<LiveApiResponse>('save-weekly', { draft }).then((response) => response.live);
}

export function completeWeeklySystemTrialStage(
  stageIndex: number,
  answer: string,
): Promise<LiveCompletionReceipt> {
  return liveAction<LiveReceiptResponse>('complete-weekly-stage', { stageIndex, answer })
    .then((response) => response.receipt);
}

export function useWeeklySystemTrialHint(hintIndex: number): Promise<{
  alreadyUnlocked: boolean;
  hint: string;
  live: LiveChallengesSnapshot;
}> {
  return liveAction('use-weekly-hint', { hintIndex });
}
