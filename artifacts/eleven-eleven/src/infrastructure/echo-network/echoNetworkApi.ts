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

export type VerifiedChessTrainingStepId =
  | 'develop-a-knight'
  | 'escape-check'
  | 'capture-hanging-queen';

export interface VerifiedChessTrainingSnapshot {
  protocolVersion: 1;
  training: 'chess';
  session: {
    id: string;
    status: 'active' | 'completed' | 'expired';
    version: number;
    expiresAt: string;
    stepIndex: number;
    step: VerifiedChessTrainingStepId | null;
    goal: string | null;
    /** Server-issued board only. It is intentionally never a submit field. */
    fen?: string;
    completedAt: string | null;
  };
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

function asNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0
    ? value
    : null;
}

/**
 * The Network overview participates in route entitlement decisions, so its
 * eligibility projection is parsed rather than trusted through a TypeScript
 * assertion.  A malformed response fails closed at the caller.
 */
function parseNetworkEligibility(value: unknown): NetworkEligibilitySnapshot | null {
  if (!isRecord(value)) return null;
  const casualChessCompleted = asNonNegativeInteger(value.casualChessCompleted);
  if (casualChessCompleted === null
    || typeof value.chessTrainingCompleted !== 'boolean'
    || typeof value.rankedChessUnlocked !== 'boolean'
    || typeof value.coopTrainingCompleted !== 'boolean'
    || typeof value.communityRulesAccepted !== 'boolean'
    || typeof value.ageGateConfirmed !== 'boolean') {
    return null;
  }
  // Do not let an inconsistent display response publish a Ranked CTA.
  if (value.rankedChessUnlocked
    && (!value.chessTrainingCompleted || casualChessCompleted < 3)) return null;
  return {
    chessTrainingCompleted: value.chessTrainingCompleted,
    casualChessCompleted,
    rankedChessUnlocked: value.rankedChessUnlocked,
    coopTrainingCompleted: value.coopTrainingCompleted,
    communityRulesAccepted: value.communityRulesAccepted,
    ageGateConfirmed: value.ageGateConfirmed,
  };
}

function parseNetworkSnapshot(value: unknown): NetworkSnapshot | null {
  if (!isRecord(value)) return null;
  const eligibility = parseNetworkEligibility(value.eligibility);
  if (!eligibility
    || !Array.isArray(value.ratings)
    || !Array.isArray(value.recentMatches)
    || !Array.isArray(value.cosmetics)
    || !Array.isArray(value.seasonProgress)
    || !Array.isArray(value.characterBonds)) return null;
  // Detailed read models are non-authoritative presentation data; keep their
  // existing typed contract while the admission-bearing eligibility above is
  // fully validated.  If the response changes shape, no optional route opens.
  return {
    eligibility,
    ratings: value.ratings as NetworkRatingSnapshot[],
    recentMatches: value.recentMatches as NetworkMatchSummary[],
    cosmetics: value.cosmetics.filter((item): item is string => typeof item === 'string'),
    seasonProgress: value.seasonProgress as NetworkSeasonProgress[],
    characterBonds: value.characterBonds as Array<{ character_id: string; bond_points: number }>,
  };
}

function isChessSquare(value: unknown): value is string {
  return typeof value === 'string' && /^[a-h][1-8]$/.test(value);
}

function isExactUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function parseVerifiedChessTraining(value: unknown): VerifiedChessTrainingSnapshot | null {
  if (!isRecord(value)
    || value.protocolVersion !== 1
    || value.training !== 'chess'
    || !isRecord(value.session)) return null;
  const session = value.session;
  const id = session.id;
  const status = session.status;
  const version = typeof session.version === 'number' && Number.isSafeInteger(session.version)
    ? session.version
    : null;
  const expiresAt = session.expiresAt;
  const stepIndex = typeof session.stepIndex === 'number' && Number.isSafeInteger(session.stepIndex)
    ? session.stepIndex
    : null;
  const completedAt = session.completedAt;
  const step = session.step;
  const validStep = step === 'develop-a-knight'
    || step === 'escape-check'
    || step === 'capture-hanging-queen';
  const expectedStep = ['develop-a-knight', 'escape-check', 'capture-hanging-queen'] as const;
  if (typeof id !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    || (status !== 'active' && status !== 'completed' && status !== 'expired')
    || version === null
    || version < 0
    || stepIndex === null
    || stepIndex < 0
    || stepIndex > 3
    || !isExactUtcTimestamp(expiresAt)
    || (completedAt !== null && !isExactUtcTimestamp(completedAt))) return null;

  const active = status === 'active';
  const completed = status === 'completed';
  if ((active && (!validStep
      || expectedStep[stepIndex] !== step
      || typeof session.fen !== 'string'
      || session.fen.length < 1
      || session.fen.length > 160))
    || (!active && (step !== null || 'fen' in session))
    || (completed && completedAt === null)
    || (!completed && completedAt !== null)) return null;
  return {
    protocolVersion: 1,
    training: 'chess',
    session: {
      id,
      status,
      version,
      expiresAt,
      stepIndex,
      step: validStep ? step : null,
      goal: typeof session.goal === 'string' ? session.goal.slice(0, 240) : null,
      ...(active ? { fen: session.fen as string } : {}),
      completedAt,
    },
  };
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

export async function fetchEchoNetwork(): Promise<NetworkSnapshot> {
  const value = await networkRequest<unknown>('/network');
  const snapshot = parseNetworkSnapshot(value);
  if (!snapshot) {
    throw new EchoNetworkApiError(502, 'invalid_response', 'Echo Network returned an invalid response.');
  }
  return snapshot;
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

export async function startOrResumeVerifiedChessTraining(): Promise<VerifiedChessTrainingSnapshot> {
  const value = await networkRequest<unknown>('/network/chess-training');
  const snapshot = parseVerifiedChessTraining(value);
  if (!snapshot) {
    throw new EchoNetworkApiError(502, 'invalid_response', 'Verified chess training returned an invalid response.');
  }
  return snapshot;
}

export async function submitVerifiedChessTrainingMove(input: {
  sessionId: string;
  idempotencyKey: string;
  expectedVersion: number;
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}): Promise<VerifiedChessTrainingSnapshot> {
  if (!isChessSquare(input.from) || !isChessSquare(input.to)) {
    throw new EchoNetworkApiError(400, 'invalid_training_move', 'Chess training move is invalid.');
  }
  const value = await networkRequest<unknown>('/network/chess-training', {
    method: 'POST',
    body: JSON.stringify({ version: 1, ...input }),
  });
  const snapshot = parseVerifiedChessTraining(value);
  if (!snapshot) {
    throw new EchoNetworkApiError(502, 'invalid_response', 'Verified chess training returned an invalid response.');
  }
  return snapshot;
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

export { parseNetworkEligibility, parseNetworkSnapshot, parseVerifiedChessTraining };
