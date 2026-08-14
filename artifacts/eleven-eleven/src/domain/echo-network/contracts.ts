import { z } from 'zod';

export const NETWORK_LOCALES = ['ar', 'en'] as const;
export type NetworkLocale = typeof NETWORK_LOCALES[number];

export const ONLINE_MODES = [
  'chess_ranked_blitz',
  'chess_ranked_rapid',
  'chess_casual',
  'chess_anomaly',
  'coop_breach',
] as const;
export type OnlineMode = typeof ONLINE_MODES[number];
export const onlineModeSchema = z.enum(ONLINE_MODES);

export const CHESS_VARIANTS = [
  'standard',
  'three-signal',
  'core-control',
  'fog-memory',
] as const;
export type ChessVariant = typeof CHESS_VARIANTS[number];

export const COOP_ROLES = ['memory', 'cipher', 'route', 'anchor'] as const;
export type CoopRole = typeof COOP_ROLES[number];

export interface LocalizedCopy {
  ar: string;
  en: string;
}

export const realtimeTicketRequestSchema = z.object({
  purpose: z.enum(['queue', 'connect']),
  target: z.enum(['match', 'party', 'community']).default('match'),
  mode: onlineModeSchema,
  roomId: z.string().trim().min(3).max(96).optional(),
  caseId: z.string().trim().min(3).max(96).optional(),
  variant: z.enum(CHESS_VARIANTS).optional(),
  region: z.enum(['me', 'afr', 'eeur', 'weur', 'enam', 'wnam', 'sam', 'apac', 'oc'])
    .default('me'),
});
export type RealtimeTicketRequest = z.infer<typeof realtimeTicketRequestSchema>;

export const realtimeTicketPayloadSchema = z.object({
  v: z.literal(1),
  iss: z.enum(['eleven-eleven-pages', 'eleven-eleven-realtime']),
  aud: z.literal('eleven-eleven-realtime'),
  purpose: z.enum(['queue', 'connect']),
  target: z.enum(['matchmaking', 'match', 'party', 'community']),
  uid: z.string().min(1).max(128),
  displayName: z.string().min(1).max(80),
  mode: onlineModeSchema,
  roomId: z.string().min(3).max(96).optional(),
  partySize: z.number().int().min(2).max(4).optional(),
  caseId: z.string().min(3).max(96).optional(),
  variant: z.enum(CHESS_VARIANTS).optional(),
  region: z.string().min(2).max(8),
  // Ranked placement and rating bands are issued by the authenticated Pages
  // boundary. Clients never select the pool that they enter.
  ratingBand: z.string().regex(/^(provisional|glicko-[0-9]{4})$/).optional(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
  jti: z.string().uuid(),
});
export type RealtimeTicketPayload = z.infer<typeof realtimeTicketPayloadSchema>;

export const realtimeEnvelopeSchema = z.object({
  version: z.literal(1),
  eventId: z.string().uuid(),
  roomId: z.string().min(3).max(96),
  sequence: z.number().int().nonnegative(),
  type: z.string().min(1).max(64),
  sentAt: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
});
export type RealtimeEnvelope = z.infer<typeof realtimeEnvelopeSchema>;

export const roomCommandSchema = z.object({
  version: z.literal(1),
  eventId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(128),
  expectedVersion: z.number().int().nonnegative(),
  type: z.enum([
    'ready',
    'move',
    'resign',
    'coop-submit',
    'hint-vote',
    'restart-vote',
    'preset-chat',
    'party-launch',
    'resume',
    'ping',
  ]),
  sentAt: z.number().int().nonnegative(),
  payload: z.record(z.unknown()).default({}),
});
export type RoomCommand = z.infer<typeof roomCommandSchema>;

export const matchReceiptSchema = z.object({
  version: z.literal(1),
  receiptId: z.string().uuid(),
  matchId: z.string().min(3).max(96),
  mode: onlineModeSchema,
  context: z.object({
    caseId: z.string().min(3).max(96).nullable(),
    variant: z.enum(CHESS_VARIANTS).nullable(),
  }),
  status: z.enum(['completed', 'resigned', 'timeout', 'abandoned']),
  participants: z.array(z.object({
    uid: z.string().min(1).max(128),
    outcome: z.enum(['win', 'loss', 'draw', 'completed']),
    participationMs: z.number().int().nonnegative(),
  })).min(1).max(4),
  winnerUid: z.string().min(1).max(128).nullable(),
  durationMs: z.number().int().nonnegative(),
  rewards: z.array(z.object({
    uid: z.string().min(1).max(128),
    rewardKey: z.string().min(8).max(160),
    xpAmount: z.number().int().nonnegative(),
    cosmeticIds: z.array(z.string().min(1).max(96)).max(8).default([]),
  })).min(1).max(4),
  completedAt: z.string().datetime(),
  integrityHash: z.string().min(16).max(128),
});
export type MatchReceipt = z.infer<typeof matchReceiptSchema>;

export const communityPostSchema = z.object({
  id: z.string().min(3).max(96),
  authorUid: z.string().min(1).max(128).nullable(),
  authorName: z.string().min(1).max(80),
  locale: z.enum(NETWORK_LOCALES),
  channel: z.enum(['official', 'story', 'puzzles', 'chess', 'coop', 'creator']),
  body: z.string().min(1).max(600),
  cardId: z.string().max(96).nullable(),
  status: z.enum(['official', 'pending', 'approved', 'rejected']),
  createdAt: z.string().datetime(),
});
export type CommunityPost = z.infer<typeof communityPostSchema>;

export const moderationCaseSchema = z.object({
  id: z.string().uuid(),
  reporterUid: z.string().min(1).max(128),
  targetType: z.enum(['message', 'post', 'profile', 'puzzle', 'match']),
  targetId: z.string().min(1).max(128),
  reason: z.enum(['abuse', 'spam', 'privacy', 'cheating', 'unsafe-content', 'other']),
  detail: z.string().max(500),
  status: z.enum(['open', 'automated-hold', 'reviewed', 'appealed', 'closed']),
  createdAt: z.string().datetime(),
});
export type ModerationCase = z.infer<typeof moderationCaseSchema>;

export const puzzleForgeSubmissionSchema = z.object({
  id: z.string().uuid(),
  authorUid: z.string().min(1).max(128),
  locale: z.enum(NETWORK_LOCALES),
  title: z.string().trim().min(3).max(80),
  mechanic: z.enum(['sequence', 'cipher', 'wiring', 'evidence', 'pattern']),
  prompt: z.string().trim().min(12).max(500),
  options: z.array(z.string().trim().min(1).max(80)).min(2).max(8),
  answerIndex: z.number().int().nonnegative(),
  canonAssetId: z.string().trim().max(96).nullable(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']),
  createdAt: z.string().datetime(),
});
export type PuzzleForgeSubmission = z.infer<typeof puzzleForgeSubmissionSchema>;

export interface SeasonActivityDefinition {
  id: string;
  week: number;
  kind: 'investigation' | 'community-finale' | 'recovery';
  title: LocalizedCopy;
  description: LocalizedCopy;
  focusCharacter: 'yuki' | 'nara' | 'kenja' | 'lina' | 'zero' | 'echo';
}

export interface SeasonDefinition {
  id: string;
  version: number;
  title: LocalizedCopy;
  startsAt: string;
  endsAt: string;
  archiveAt: string;
  activities: readonly SeasonActivityDefinition[];
}
