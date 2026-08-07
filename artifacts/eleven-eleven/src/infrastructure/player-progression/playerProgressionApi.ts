import { getCurrentAuthToken } from '../../features/auth/authService';
import type { CampaignPuzzleProgress } from '../../domain/puzzles/campaignContracts';
import type {
  LeaderboardPlayer,
} from '../../domain/player-progression/playerProgression';

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
    sourceType: 'puzzle';
    sourceId: string;
    rewardKey: string;
    awarded: boolean;
    xpGranted: number;
  };
  progression: LeaderboardPlayer;
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
  return (configured || '/api/player').replace(/\/$/, '');
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

export function claimPuzzleXpReward(
  sourceId: string,
  proof: readonly CampaignPuzzleProgress[],
): Promise<XpClaimApiResponse> {
  return authorizedRequest<XpClaimApiResponse>('/xp/claim', {
    method: 'POST',
    body: JSON.stringify({
      sourceType: 'puzzle',
      sourceId,
      proof,
    }),
  });
}
