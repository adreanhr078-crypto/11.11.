import type { FirebaseAccount } from './_shared';
import { PlayerApiError } from './_shared';
import type { PlayerDatabase } from './_database';
import type { OnlineMode } from '../../../src/domain/echo-network/contracts';
import {
  DEFAULT_GLICKO2_RATING,
  rankedMatchmakingBand,
} from '../../../src/domain/echo-network/glicko2';
import {
  getFinalManhwaChapterRewardSourceId,
} from '../../../src/content/manhwa/finalManhwa';
import { createXpRewardKey } from '../../../src/domain/player-progression/playerProgression';

interface MilestoneRow {
  chess_training_completed_at: string | null;
  casual_chess_completed: number | string;
  coop_training_completed_at: string | null;
  community_rules_version: number | string;
  age_gate_confirmed_at: string | null;
}

export interface NetworkEligibility {
  chessTrainingCompleted: boolean;
  casualChessCompleted: number;
  rankedChessUnlocked: boolean;
  coopTrainingCompleted: boolean;
  communityRulesAccepted: boolean;
  ageGateConfirmed: boolean;
}

function safeUsername(account: FirebaseAccount): string {
  return account.displayName?.trim().slice(0, 80)
    || `Signal-${account.uid.slice(0, 8)}`;
}

export async function ensureNetworkPlayer(
  db: PlayerDatabase,
  account: FirebaseAccount,
  now = new Date().toISOString(),
): Promise<void> {
  await db.batch([
    db.prepare(`
    INSERT INTO player_progression (user_id, username, total_xp, created_at, updated_at)
    VALUES (?, ?, 0, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET updated_at = excluded.updated_at
    `).bind(account.uid, safeUsername(account), now, now),
    db.prepare(`
      INSERT OR IGNORE INTO network_player_milestones (
        user_id, casual_chess_completed, community_rules_version, updated_at
      ) VALUES (?, 0, 0, ?)
    `).bind(account.uid, now),
  ]);
}

export async function readNetworkEligibility(
  db: PlayerDatabase,
  uid: string,
): Promise<NetworkEligibility> {
  const row = await db.prepare(`
    SELECT chess_training_completed_at, casual_chess_completed,
      coop_training_completed_at, community_rules_version, age_gate_confirmed_at
    FROM network_player_milestones
    WHERE user_id = ?
  `).bind(uid).first<MilestoneRow>();
  const rawCasualChessCompleted = Number(row?.casual_chess_completed ?? 0);
  const casualChessCompleted = Number.isSafeInteger(rawCasualChessCompleted)
    && rawCasualChessCompleted >= 0
    ? rawCasualChessCompleted
    : 0;
  const chessTrainingCompleted = Boolean(row?.chess_training_completed_at);
  return {
    chessTrainingCompleted,
    casualChessCompleted,
    rankedChessUnlocked: chessTrainingCompleted && casualChessCompleted >= 3,
    coopTrainingCompleted: Boolean(row?.coop_training_completed_at),
    communityRulesAccepted: Number(row?.community_rules_version ?? 0) >= 1,
    ageGateConfirmed: Boolean(row?.age_gate_confirmed_at),
  };
}

export async function assertModeEligibility(
  db: PlayerDatabase,
  uid: string,
  mode: OnlineMode,
): Promise<void> {
  if (mode !== 'chess_ranked_blitz' && mode !== 'chess_ranked_rapid') return;
  const eligibility = await readNetworkEligibility(db, uid);
  if (!eligibility.rankedChessUnlocked) {
    throw new PlayerApiError(
      409,
      'ranked_locked',
      'Complete chess training and three Casual matches before entering Ranked.',
    );
  }
}

/**
 * Ranked admission is a story disclosure as well as a skill gate.  The
 * browser's chapter view is never enough: the ticket boundary checks the
 * immutable Chapter 3 reward receipt before it signs a matchmaking ticket.
 */
export async function assertRankedStoryEligibility(
  db: PlayerDatabase,
  uid: string,
  mode: OnlineMode,
): Promise<void> {
  if (mode !== 'chess_ranked_blitz' && mode !== 'chess_ranked_rapid') return;
  const rewardSourceId = getFinalManhwaChapterRewardSourceId('chapter_3');
  if (!rewardSourceId) {
    throw new Error('Corrected Manhwa Chapter 3 reward source is missing.');
  }
  const receipt = await db.prepare(`
    SELECT reward_key
    FROM xp_reward_events
    WHERE user_id = ? AND reward_key = ?
    LIMIT 1
  `).bind(uid, createXpRewardKey('manhwa', rewardSourceId)).first<{ reward_key: string }>();
  if (!receipt?.reward_key) {
    throw new PlayerApiError(
      409,
      'ranked_story_locked',
      'Complete Chapter 3 before entering Ranked.',
    );
  }
}

interface ChessRatingMatchmakingRow {
  rating: number | string;
  games_played: number | string;
}

/**
 * Rank pool assignment happens at the authenticated API boundary. The signed
 * ticket makes the choice immutable by the time it reaches a Durable Object.
 */
export async function readRankedMatchmakingBand(
  db: PlayerDatabase,
  uid: string,
  mode: OnlineMode,
): Promise<'provisional' | `glicko-${number}` | undefined> {
  const speed = mode === 'chess_ranked_blitz'
    ? 'blitz'
    : mode === 'chess_ranked_rapid'
      ? 'rapid'
      : null;
  if (!speed) return undefined;
  const row = await db.prepare(`
    SELECT rating, games_played
    FROM chess_ratings
    WHERE user_id = ? AND speed = ?
  `).bind(uid, speed).first<ChessRatingMatchmakingRow>();
  return rankedMatchmakingBand({
    rating: Number(row?.rating ?? DEFAULT_GLICKO2_RATING.rating),
    gamesPlayed: Number(row?.games_played ?? DEFAULT_GLICKO2_RATING.gamesPlayed),
  });
}

export async function recordNetworkTicket(
  db: PlayerDatabase,
  input: {
    jti: string;
    uid: string;
    purpose: 'queue' | 'connect';
    mode: OnlineMode;
    issuedAt: string;
    expiresAt: string;
  },
): Promise<void> {
  const rateWindow = new Date(Date.parse(input.issuedAt) - 60_000).toISOString();
  const recent = await db.prepare(`
    SELECT COUNT(*) AS total FROM network_ticket_events
    WHERE user_id = ? AND issued_at >= ?
  `).bind(input.uid, rateWindow).first<{ total: number | string }>();
  if (Number(recent?.total ?? 0) >= 12) {
    throw new PlayerApiError(
      429,
      'ticket_rate_limited',
      'Too many connection attempts. Wait a moment and try again.',
    );
  }
  await db.prepare(`
    INSERT INTO network_ticket_events (
      ticket_id, user_id, purpose, mode, issued_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    input.jti,
    input.uid,
    input.purpose,
    input.mode,
    input.issuedAt,
    input.expiresAt,
  ).run();
}

export function networkDisplayName(account: FirebaseAccount): string {
  return safeUsername(account);
}
