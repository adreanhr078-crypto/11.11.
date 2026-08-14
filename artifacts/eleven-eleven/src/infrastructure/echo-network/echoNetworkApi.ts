import { getCurrentAuthSession } from '../../features/auth/authService';
import type {
  ChessVariant,
  MatchReceipt,
  OnlineMode,
  RealtimeTicketRequest,
} from '../../domain/echo-network/contracts';
import { playerApiRoot } from '../player-api/apiRoot';
import { fetchPlayerRequest } from '../player-api/playerRequest';

export interface NetworkEligibilitySnapshot {
  chessTrainingCompleted: boolean;
  casualChessCompleted: number;
  rankedChessUnlocked: boolean;
  coopTrainingCompleted: boolean;
  communityRulesAccepted: boolean;
  ageGateConfirmed: boolean;
}

export interface NetworkRatingSnapshot {
  speed: 'blitz' | 'rapid';
  rating: number;
  deviation: number;
  volatility: number;
  games_played: number;
}

export interface NetworkMatchSummary {
  match_id: string;
  mode: OnlineMode;
  target?: RealtimeTicketRequest['target'];
  status: MatchReceipt['status'];
  winner_uid: string | null;
  completed_at: string;
  outcome: MatchReceipt['participants'][number]['outcome'];
  xp_amount: number;
}

export interface NetworkSeasonProgress {
  season_id: string;
  activity_id: string;
  status: 'available' | 'in_progress' | 'completed';
  mastery_score: number;
  completed_at: string | null;
}

export interface NetworkSnapshot {
  eligibility: NetworkEligibilitySnapshot;
  ratings: NetworkRatingSnapshot[];
  recentMatches: NetworkMatchSummary[];
  cosmetics: string[];
  seasonProgress: NetworkSeasonProgress[];
  characterBonds: Array<{ character_id: string; bond_points: number }>;
}

export interface NetworkTicketResponse {
  ticket: string;
  webSocketUrl: string;
  protocol: 'echo-network-v1';
  expiresAt: string;
}

export interface NetworkMatchReplay {
  version: 1;
  receiptId: string;
  matchId: string;
  [key: string]: unknown;
}

export interface NetworkMatchReplayResponse {
  receipt: MatchReceipt;
  replay: NetworkMatchReplay;
}

export class EchoNetworkApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'EchoNetworkApiError';
  }
}

function apiRoot(): string {
  const runtimeEnv = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
  return playerApiRoot(runtimeEnv?.VITE_PLAYER_API_URL?.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function networkRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getCurrentAuthSession();
  const response = await fetchPlayerRequest(`${apiRoot()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    value = null;
  }
  if (!response.ok) {
    const record = isRecord(value) ? value : {};
    throw new EchoNetworkApiError(
      response.status,
      typeof record.code === 'string' ? record.code : 'network_request_failed',
      typeof record.error === 'string' ? record.error : 'Echo Network request failed.',
    );
  }
  if (!isRecord(value)) {
    throw new EchoNetworkApiError(502, 'invalid_response', 'Echo Network returned an invalid response.');
  }
  return value as T;
}

export function fetchEchoNetwork(): Promise<NetworkSnapshot> {
  return networkRequest<NetworkSnapshot>('/network');
}

export function issueNetworkTicket(input: {
  purpose: RealtimeTicketRequest['purpose'];
  target?: RealtimeTicketRequest['target'];
  mode: OnlineMode;
  roomId?: string;
  caseId?: string;
  variant?: ChessVariant;
  region?: RealtimeTicketRequest['region'];
}): Promise<NetworkTicketResponse> {
  return networkRequest<NetworkTicketResponse>('/network/ticket', {
    method: 'POST',
    body: JSON.stringify({ region: 'me', ...input }),
  });
}

export function fetchNetworkMatchReplay(matchId: string): Promise<NetworkMatchReplayResponse> {
  return networkRequest<NetworkMatchReplayResponse>(
    `/network/replay?matchId=${encodeURIComponent(matchId)}`,
  );
}

export async function completeNetworkTraining(
  training: 'chess' | 'coop',
): Promise<NetworkEligibilitySnapshot> {
  const response = await networkRequest<{ eligibility: NetworkEligibilitySnapshot }>(
    '/network/training',
    {
      method: 'POST',
      body: JSON.stringify({ training, version: 1 }),
    },
  );
  return response.eligibility;
}

export interface CommunityPostSnapshot {
  post_id: string;
  author_name: string;
  locale: 'ar' | 'en';
  channel: string;
  body: string;
  card_id: string | null;
  status: 'official' | 'approved';
  created_at: string;
}

export interface SocialPlayerSnapshot {
  friend_uid: string;
  username: string;
  status: 'pending' | 'accepted';
  direction: 'friend' | 'incoming' | 'outgoing';
  updated_at: string;
  muted: number;
}

export interface SocialSafetySnapshot {
  user_id: string;
  username: string;
  created_at: string;
}

export interface SocialSnapshot {
  signalCode: string;
  friends: SocialPlayerSnapshot[];
  incoming: SocialPlayerSnapshot[];
  outgoing: SocialPlayerSnapshot[];
  blocked: SocialSafetySnapshot[];
  muted: SocialSafetySnapshot[];
  freeTextEnabled: false;
}

export type SocialActionInput =
  | { action: 'request'; signalCode: string }
  | { action: 'accept' | 'decline' | 'remove' | 'block' | 'unblock' | 'mute' | 'unmute'; targetUid: string }
  | {
    action: 'report';
    targetType: 'message' | 'post' | 'profile' | 'puzzle' | 'match';
    targetId: string;
    reason: 'abuse' | 'spam' | 'privacy' | 'cheating' | 'unsafe-content' | 'other';
    detail?: string;
  };

export async function fetchCommunityPosts(
  locale: 'ar' | 'en',
  channel = 'official',
): Promise<CommunityPostSnapshot[]> {
  const response = await networkRequest<{ posts: CommunityPostSnapshot[] }>(
    `/network/community?locale=${encodeURIComponent(locale)}&channel=${encodeURIComponent(channel)}`,
  );
  return response.posts;
}

export function fetchSocialGraph(): Promise<SocialSnapshot> {
  return networkRequest<SocialSnapshot>('/network/social');
}

export async function performSocialAction(input: SocialActionInput): Promise<SocialSnapshot> {
  const response = await networkRequest<{ social: SocialSnapshot }>('/network/social', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.social;
}

export async function acceptCommunityRules(): Promise<NetworkEligibilitySnapshot> {
  const response = await networkRequest<{ eligibility: NetworkEligibilitySnapshot }>(
    '/network/rules',
    {
      method: 'POST',
      body: JSON.stringify({ rulesVersion: 1, confirmsAge16Plus: true }),
    },
  );
  return response.eligibility;
}

export interface ForgeSubmissionInput {
  locale: 'ar' | 'en';
  title: string;
  mechanic: 'sequence' | 'cipher' | 'wiring' | 'evidence' | 'pattern';
  prompt: string;
  options: string[];
  answerIndex: number;
  canonAssetId: string | null;
}

export function submitForgePuzzle(input: ForgeSubmissionInput): Promise<{
  submission: { id: string; status: 'pending'; createdAt: string };
  published: false;
  rewardGranted: false;
}> {
  return networkRequest('/network/forge', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
