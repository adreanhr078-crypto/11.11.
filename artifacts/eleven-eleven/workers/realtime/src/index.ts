import { WorkerEntrypoint } from 'cloudflare:workers';
import { COOP_CASE_BY_ID } from '../../../src/domain/echo-network/coopCaseCatalog';
import {
  DEFAULT_GLICKO2_RATING,
  updateGlicko2,
  type Glicko2Rating,
} from '../../../src/domain/echo-network/glicko2';
import type { MatchReceipt } from '../../../src/domain/echo-network/contracts';
import { normalizePartyRoomId } from '../../../src/domain/echo-network/partyRoomSafety';
import { seasonAt, seasonWeekAt } from '../../../src/domain/echo-network/seasonCatalog';
import {
  RealtimeError,
  errorResponse,
  modeIsChess,
  modeLocationHint,
  requireUpgradeTicket,
  roomIdFromPath,
} from './common';
import { queuedResultSchema, verifyReceiptIntegrity, xpSourceForMode } from './receipt';
import {
  isChessReceiptProgressionEligible,
  isCoopReceiptParticipantProgressionEligible,
} from './resultEligibility';
import { releaseMatchLeasesStatement } from './activeMatchLease';

export { MatchmakerRoom } from './MatchmakerRoom';
export { ChessMatchRoom } from './ChessMatchRoom';
export { CoopSessionRoom } from './CoopSessionRoom';
export { PartyRoom } from './PartyRoom';
export { CommunityChannelRoom } from './CommunityChannelRoom';

class PermanentQueueError extends Error {}

interface RatingRow {
  rating: number;
  deviation: number;
  volatility: number;
  games_played: number;
  rating_revision: number;
}

function ratingFromRow(row: RatingRow | null): Glicko2Rating {
  return row ? {
    rating: Number(row.rating),
    deviation: Number(row.deviation),
    volatility: Number(row.volatility),
    gamesPlayed: Number(row.games_played),
  } : { ...DEFAULT_GLICKO2_RATING };
}

function ratingRevisionFromRow(row: RatingRow | null): number {
  return Math.max(0, Math.trunc(Number(row?.rating_revision ?? 0)));
}

function rankedSpeed(mode: MatchReceipt['mode']): 'blitz' | 'rapid' | null {
  if (mode === 'chess_ranked_blitz') return 'blitz';
  if (mode === 'chess_ranked_rapid') return 'rapid';
  return null;
}

function outcomeScore(outcome: MatchReceipt['participants'][number]['outcome']): 0 | 0.5 | 1 {
  if (outcome === 'win') return 1;
  if (outcome === 'draw') return 0.5;
  return 0;
}

const MAX_REWARDED_CHESS_REMATCHES_PER_DAY = 3;
const MAX_REWARDED_COOP_CASE_COMPLETIONS_PER_DAY = 3;

type RewardQuotaScope = 'chess-pair' | 'coop-case';

interface RewardQuotaClaim {
  scope: RewardQuotaScope;
  subjectKey: string;
  windowStart: string;
  matchId: string;
  limit: number;
  claimedAt: string;
}

function rewardQuotaWindow(completedAt: string): string | null {
  const timestamp = Date.parse(completedAt);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString().slice(0, 10)
    : null;
}

function createRewardQuotaClaim(input: {
  scope: RewardQuotaScope;
  subjectKey: string;
  completedAt: string;
  matchId: string;
  limit: number;
}): RewardQuotaClaim | null {
  const windowStart = rewardQuotaWindow(input.completedAt);
  if (!windowStart) return null;
  return {
    scope: input.scope,
    subjectKey: input.subjectKey,
    windowStart,
    matchId: input.matchId,
    limit: input.limit,
    claimedAt: input.completedAt,
  };
}

function chessRewardQuotaClaim(receipt: MatchReceipt): RewardQuotaClaim | null {
  if (!modeIsChess(receipt.mode) || receipt.participants.length !== 2) return null;
  const [first, second] = receipt.participants;
  if (!first || !second) return null;
  const subjectKey = [first.uid, second.uid].sort((left, right) => left.localeCompare(right)).join(':');
  return createRewardQuotaClaim({
    scope: 'chess-pair',
    subjectKey,
    completedAt: receipt.completedAt,
    matchId: receipt.matchId,
    limit: MAX_REWARDED_CHESS_REMATCHES_PER_DAY,
  });
}

function coopRewardQuotaClaim(receipt: MatchReceipt, uid: string): RewardQuotaClaim | null {
  const caseId = receipt.context.caseId;
  if (!caseId) return null;
  return createRewardQuotaClaim({
    scope: 'coop-case',
    subjectKey: `${uid}:${caseId}`,
    completedAt: receipt.completedAt,
    matchId: receipt.matchId,
    limit: MAX_REWARDED_COOP_CASE_COMPLETIONS_PER_DAY,
  });
}

/**
 * The statement is deliberately in the same D1 batch as receipt and reward
 * writes. At the cap it inserts nothing (rather than aborting history), while
 * a retry of a historical orphan claim remains eligible for reconciliation.
 */
function quotaClaimStatement(database: D1Database, claim: RewardQuotaClaim): D1PreparedStatement {
  return database.prepare(`
    INSERT OR IGNORE INTO network_reward_quota_claims (
      scope, subject_key, window_start, match_id, limit_value, claimed_at
    )
    SELECT ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM network_reward_quota_claims
      WHERE scope = ? AND subject_key = ? AND window_start = ? AND match_id = ?
    ) OR (
      SELECT COUNT(*) FROM network_reward_quota_claims
      WHERE scope = ? AND subject_key = ? AND window_start = ?
    ) < ?
  `).bind(
    claim.scope,
    claim.subjectKey,
    claim.windowStart,
    claim.matchId,
    claim.limit,
    claim.claimedAt,
    claim.scope,
    claim.subjectKey,
    claim.windowStart,
    claim.matchId,
    claim.scope,
    claim.subjectKey,
    claim.windowStart,
    claim.limit,
  );
}

function quotaGate(claim: RewardQuotaClaim | null): {
  sql: string;
  bindings: string[];
} {
  if (!claim) return { sql: '0', bindings: [] };
  return {
    sql: `EXISTS (
      SELECT 1 FROM network_reward_quota_claims
      WHERE scope = ? AND subject_key = ? AND window_start = ? AND match_id = ?
    )`,
    bindings: [claim.scope, claim.subjectKey, claim.windowStart, claim.matchId],
  };
}

/**
 * Queue delivery is at-least-once. D1 is authoritative for the result, but a
 * Durable Object keeps the source receipt retryable until this internal RPC
 * has confirmed that the exact signed receipt reached D1.
 */
async function acknowledgeReceiptPersistence(env: Env, receipt: MatchReceipt): Promise<void> {
  if (modeIsChess(receipt.mode)) {
    await env.CHESS_MATCH_ROOMS.getByName(receipt.matchId).acknowledgeReceiptPersistence(
      receipt.matchId,
      receipt.integrityHash,
    );
    return;
  }
  if (receipt.mode === 'coop_breach') {
    await env.COOP_SESSION_ROOMS.getByName(receipt.matchId).acknowledgeReceiptPersistence(
      receipt.matchId,
      receipt.integrityHash,
    );
    return;
  }
  throw new PermanentQueueError('Result mode has no persistence acknowledgement room.');
}

export default class EchoRealtimeWorker extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        service: 'eleven-eleven-realtime',
        status: 'ok',
        protocol: 1,
      }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    try {
      const ticket = await requireUpgradeTicket(request, this.env);
      if (url.pathname === '/v1/queue') {
        if (ticket.purpose !== 'queue' || ticket.target !== 'matchmaking') {
          throw new RealtimeError(403, 'wrong_ticket_purpose', 'This ticket cannot enter matchmaking.');
        }
        const discriminator = ticket.caseId ?? ticket.variant ?? 'default';
        // `ratingBand` exists only on server-issued ranked queue tickets. It
        // deliberately remains absent from match tickets and client commands.
        const matchmakingBand = ticket.ratingBand ?? 'open';
        const stub = this.env.MATCHMAKER_ROOMS.getByName(
          `${ticket.region}:${ticket.mode}:${discriminator}:${matchmakingBand}`,
          { locationHint: modeLocationHint(ticket.region) },
        );
        return stub.fetch(request);
      }
      if (ticket.purpose !== 'connect') {
        throw new RealtimeError(403, 'wrong_ticket_purpose', 'This ticket cannot enter a room.');
      }
      const roomId = roomIdFromPath(request);
      if (url.pathname.startsWith('/v1/parties/')) {
        const canonicalPartyRoomId = normalizePartyRoomId(roomId);
        if (!canonicalPartyRoomId || ticket.roomId !== canonicalPartyRoomId) {
          throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the requested room.');
        }
        const options = { locationHint: modeLocationHint(ticket.region) } as const;
        if (ticket.target === 'party') {
          return this.env.PARTY_ROOMS.getByName(canonicalPartyRoomId, options).fetch(request);
        }
        throw new RealtimeError(404, 'route_not_found', 'The realtime route does not exist.');
      }
      if (ticket.roomId !== roomId) {
        throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the requested room.');
      }
      const options = { locationHint: modeLocationHint(ticket.region) } as const;
      if (url.pathname.startsWith('/v1/rooms/chess/') && ticket.target === 'match' && modeIsChess(ticket.mode)) {
        return this.env.CHESS_MATCH_ROOMS.getByName(roomId, options).fetch(request);
      }
      if (url.pathname.startsWith('/v1/rooms/coop/') && ticket.target === 'match' && ticket.mode === 'coop_breach') {
        return this.env.COOP_SESSION_ROOMS.getByName(roomId, options).fetch(request);
      }
      if (url.pathname.startsWith('/v1/channels/') && ticket.target === 'community') {
        return this.env.COMMUNITY_CHANNEL_ROOMS.getByName(roomId, options).fetch(request);
      }
      throw new RealtimeError(404, 'route_not_found', 'The realtime route does not exist.');
    } catch (error) {
      return errorResponse(error);
    }
  }

  async queue(batch: MessageBatch<unknown>): Promise<void> {
    for (const message of batch.messages) {
      try {
        await this.persistQueuedResult(message.body);
        message.ack();
      } catch (error) {
        if (error instanceof PermanentQueueError) {
          console.warn('Rejected invalid match result', { messageId: message.id, reason: error.message });
          message.ack();
        } else {
          console.error('Retrying match result persistence', {
            messageId: message.id,
            attempt: message.attempts,
          });
          message.retry({ delaySeconds: Math.min(60, 2 ** message.attempts) });
        }
      }
    }
  }

  private async persistQueuedResult(value: unknown, acknowledgeRoom = true): Promise<void> {
    const parsed = queuedResultSchema.safeParse(value);
    if (!parsed.success) throw new PermanentQueueError('Result payload failed schema validation.');
    const { receipt, profiles } = parsed.data;
    if (!await verifyReceiptIntegrity(this.env.REALTIME_TICKET_SECRET, receipt)) {
      throw new PermanentQueueError('Result integrity signature is invalid.');
    }
    const participantUids = new Set(receipt.participants.map((participant) => participant.uid));
    if (participantUids.size !== receipt.participants.length
      || receipt.rewards.length !== receipt.participants.length
      || profiles.length !== receipt.participants.length
      || receipt.rewards.some((reward) => !participantUids.has(reward.uid))
      || profiles.some((profile) => !participantUids.has(profile.uid))) {
      throw new PermanentQueueError('Result participant contract is inconsistent.');
    }
    const existing = await this.env.PLAYER_DB.prepare(`
      SELECT integrity_hash FROM network_match_receipts WHERE match_id = ?
    `).bind(receipt.matchId).first<{ integrity_hash: string }>();
    if (existing) {
      if (existing.integrity_hash !== receipt.integrityHash) {
        throw new PermanentQueueError('A conflicting result already exists for this match.');
      }
      // An earlier Queue delivery already made this terminal receipt durable.
      // Releasing by exact room is idempotent and lets a failed ACK retry heal
      // the lease without trusting any client-side terminal signal.
      await this.env.PLAYER_DB.batch([
        releaseMatchLeasesStatement(this.env.PLAYER_DB, receipt.matchId),
      ]);
      if (acknowledgeRoom) await acknowledgeReceiptPersistence(this.env, receipt);
      return;
    }

    const now = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];
    const profileByUid = new Map(profiles.map((profile) => [profile.uid, profile]));
    for (const participant of receipt.participants) {
      const profile = profileByUid.get(participant.uid)!;
      statements.push(this.env.PLAYER_DB.prepare(`
        INSERT INTO player_progression (user_id, username, total_xp, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          username = excluded.username,
          updated_at = excluded.updated_at
      `).bind(participant.uid, profile.displayName, now, now));
      statements.push(this.env.PLAYER_DB.prepare(`
        INSERT OR IGNORE INTO network_player_milestones (
          user_id, casual_chess_completed, community_rules_version, updated_at
        ) VALUES (?, 0, 0, ?)
      `).bind(participant.uid, now));
    }
    statements.push(this.env.PLAYER_DB.prepare(`
      INSERT INTO network_match_receipts (
        receipt_id, match_id, mode, status, winner_uid, duration_ms,
        completed_at, integrity_hash, receipt_json, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      receipt.receiptId,
      receipt.matchId,
      receipt.mode,
      receipt.status,
      receipt.winnerUid,
      receipt.durationMs,
      receipt.completedAt,
      receipt.integrityHash,
      JSON.stringify(receipt),
      now,
    ));

    const sourceType = xpSourceForMode(receipt.mode);
    const chessReceiptBaseEligible = modeIsChess(receipt.mode)
      && isChessReceiptProgressionEligible(receipt)
      && receipt.rewards.every((reward) => reward.xpAmount > 0);
    const chessQuota = chessReceiptBaseEligible ? chessRewardQuotaClaim(receipt) : null;
    if (chessQuota) statements.push(quotaClaimStatement(this.env.PLAYER_DB, chessQuota));
    const caseDefinition = receipt.context.caseId
      ? COOP_CASE_BY_ID[receipt.context.caseId]
      : null;
    const bondCharacter = caseDefinition?.focusCharacter ?? 'echo';
    const bondPoints = receipt.mode === 'coop_breach' ? 3 : 1;
    const participantQuota = new Map<string, RewardQuotaClaim | null>();
    for (const participant of receipt.participants) {
      const reward = receipt.rewards.find((entry) => entry.uid === participant.uid)!;
      const coopBaseEligible = receipt.mode === 'coop_breach'
        && caseDefinition !== null
        && isCoopReceiptParticipantProgressionEligible({
          receipt,
          participant,
          rewardXpAmount: reward.xpAmount,
        });
      const claim = modeIsChess(receipt.mode)
        ? chessQuota
        : coopBaseEligible ? coopRewardQuotaClaim(receipt, participant.uid) : null;
      if (claim && !modeIsChess(receipt.mode)) {
        statements.push(quotaClaimStatement(this.env.PLAYER_DB, claim));
      }
      participantQuota.set(
        participant.uid,
        claim,
      );
    }
    for (const participant of receipt.participants) {
      const reward = receipt.rewards.find((entry) => entry.uid === participant.uid)!;
      const claim = participantQuota.get(participant.uid) ?? null;
      const gate = quotaGate(claim);
      statements.push(this.env.PLAYER_DB.prepare(`
        INSERT INTO network_match_participants (
          match_id, user_id, outcome, participation_ms, reward_key, xp_amount
        ) VALUES (?, ?, ?, ?, ?, CASE WHEN ${gate.sql} THEN ? ELSE 0 END)
      `).bind(
        receipt.matchId,
        participant.uid,
        participant.outcome,
        participant.participationMs,
        reward.rewardKey,
        ...gate.bindings,
        reward.xpAmount,
      ));
      if (claim && reward.xpAmount > 0) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO xp_reward_events (
            user_id, reward_key, source_type, source_id, xp_amount, granted_at
          ) SELECT ?, ?, ?, ?, ?, ? WHERE ${gate.sql}
        `).bind(
          participant.uid,
          reward.rewardKey,
          sourceType,
          receipt.matchId,
          reward.xpAmount,
          receipt.completedAt,
          ...gate.bindings,
        ));
      }
      for (const cosmeticId of claim ? reward.cosmeticIds : []) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO network_cosmetic_unlock_events (
            user_id, cosmetic_id, source_type, source_id, unlocked_at
          ) SELECT ?, ?, 'match', ?, ? WHERE ${gate.sql}
        `).bind(
          participant.uid,
          cosmeticId,
          receipt.matchId,
          receipt.completedAt,
          ...gate.bindings,
        ));
      }
      if (claim) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO player_character_bond_events (
            user_id, event_key, character_id, source_type, source_id,
            bond_points, recorded_at
          ) SELECT ?, ?, ?, 'match', ?, ?, ? WHERE ${gate.sql}
        `).bind(
          participant.uid,
          `bond:${receipt.matchId}:${participant.uid}:v1`,
          bondCharacter,
          receipt.matchId,
          bondPoints,
          receipt.completedAt,
          ...gate.bindings,
        ));
      }
    }

    if (receipt.mode === 'coop_breach') {
      const completedAt = Date.parse(receipt.completedAt);
      const season = seasonAt(completedAt);
      const week = seasonWeekAt(completedAt);
      const activity = season.activities.find((candidate) => candidate.week === week);
      if (activity) {
        for (const participant of receipt.participants) {
          const claim = participantQuota.get(participant.uid) ?? null;
          if (!claim) continue;
          const gate = quotaGate(claim);
          statements.push(this.env.PLAYER_DB.prepare(`
            INSERT INTO season_player_progress (
              user_id, season_id, activity_id, status, mastery_score,
              completed_at, updated_at
            ) SELECT ?, ?, ?, 'completed', ?, ?, ? WHERE ${gate.sql}
            ON CONFLICT(user_id, season_id, activity_id) DO UPDATE SET
              status = 'completed',
              mastery_score = MAX(season_player_progress.mastery_score, excluded.mastery_score),
              completed_at = COALESCE(season_player_progress.completed_at, excluded.completed_at),
              updated_at = excluded.updated_at
          `).bind(
            participant.uid,
            season.id,
            activity.id,
            100,
            receipt.completedAt,
            now,
            ...gate.bindings,
          ));
        }
      }
    }

    const speed = rankedSpeed(receipt.mode);
    if (chessReceiptBaseEligible && chessQuota && speed && receipt.participants.length === 2) {
      const [first, second] = receipt.participants;
      const gate = quotaGate(chessQuota);
      const [firstRow, secondRow] = await Promise.all([
        this.env.PLAYER_DB.prepare(`
          SELECT rating, deviation, volatility, games_played, rating_revision
          FROM chess_ratings WHERE user_id = ? AND speed = ?
        `).bind(first!.uid, speed).first<RatingRow>(),
        this.env.PLAYER_DB.prepare(`
          SELECT rating, deviation, volatility, games_played, rating_revision
          FROM chess_ratings WHERE user_id = ? AND speed = ?
        `).bind(second!.uid, speed).first<RatingRow>(),
      ]);
      const before = [ratingFromRow(firstRow), ratingFromRow(secondRow)] as const;
      const after = [
        updateGlicko2(before[0], [{
          rating: before[1].rating,
          deviation: before[1].deviation,
          score: outcomeScore(first!.outcome),
        }]),
        updateGlicko2(before[1], [{
          rating: before[0].rating,
          deviation: before[0].deviation,
          score: outcomeScore(second!.outcome),
        }]),
      ] as const;
      for (const [index, participant] of [first!, second!].entries()) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO chess_rating_events (
            match_id, user_id, speed, rating_before, deviation_before,
            volatility_before, rating_after, deviation_after,
            volatility_after, rating_revision_before, recorded_at
          ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${gate.sql}
        `).bind(
          receipt.matchId,
          participant.uid,
          speed,
          before[index]!.rating,
          before[index]!.deviation,
          before[index]!.volatility,
          after[index]!.rating,
          after[index]!.deviation,
          after[index]!.volatility,
          ratingRevisionFromRow(index === 0 ? firstRow : secondRow),
          receipt.completedAt,
          ...gate.bindings,
        ));
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT INTO chess_ratings (
            user_id, speed, rating, deviation, volatility, games_played,
            rating_revision, updated_at
          ) SELECT ?, ?, ?, ?, ?, ?, 1, ? WHERE ${gate.sql}
          ON CONFLICT(user_id, speed) DO UPDATE SET
            rating = excluded.rating,
            deviation = excluded.deviation,
            volatility = excluded.volatility,
            games_played = excluded.games_played,
            rating_revision = chess_ratings.rating_revision + 1,
            updated_at = excluded.updated_at
        `).bind(
          participant.uid,
          speed,
          after[index]!.rating,
          after[index]!.deviation,
          after[index]!.volatility,
          after[index]!.gamesPlayed,
          receipt.completedAt,
          ...gate.bindings,
        ));
      }
    }

    for (const participant of receipt.participants) {
      if (chessQuota && receipt.mode === 'chess_casual') {
        const gate = quotaGate(chessQuota);
        statements.push(this.env.PLAYER_DB.prepare(`
          UPDATE network_player_milestones
          SET casual_chess_completed = (
            SELECT COUNT(*) FROM network_match_participants p
            JOIN network_match_receipts r ON r.match_id = p.match_id
            WHERE p.user_id = ? AND r.mode = 'chess_casual' AND p.xp_amount > 0
          ), updated_at = ?
          WHERE user_id = ? AND ${gate.sql}
        `).bind(participant.uid, now, participant.uid, ...gate.bindings));
      }
      statements.push(this.env.PLAYER_DB.prepare(`
        UPDATE player_progression
        SET total_xp = (
          SELECT COALESCE(SUM(xp_amount), 0) FROM xp_reward_events WHERE user_id = ?
        ), updated_at = ?
        WHERE user_id = ?
      `).bind(participant.uid, now, participant.uid));
    }

    // The lease is released in the same D1 transaction as the immutable
    // receipt and all authoritative progression writes. A failed batch leaves
    // the player in the existing room for recovery rather than admitting a
    // second live Chess or Co-op session.
    statements.push(releaseMatchLeasesStatement(this.env.PLAYER_DB, receipt.matchId));
    await this.env.PLAYER_DB.batch(statements);
    if (acknowledgeRoom) await acknowledgeReceiptPersistence(this.env, receipt);
    this.env.NETWORK_ANALYTICS.writeDataPoint({
      blobs: [receipt.mode, receipt.status],
      doubles: [receipt.durationMs, receipt.participants.length],
      indexes: [receipt.matchId],
    });
  }
}

/**
 * Test seam for the D1 transaction. Production Queue delivery uses the class
 * method above with room acknowledgement enabled. Detached D1 fixture tests
 * intentionally omit that acknowledgement because they do not create a
 * Durable Object source; ACK integration tests opt in explicitly.
 */
export async function persistQueuedResult(
  env: Env,
  value: unknown,
  options: { acknowledgeRoom?: boolean } = {},
): Promise<void> {
  const handler = EchoRealtimeWorker.prototype as unknown as {
    persistQueuedResult(value: unknown, acknowledgeRoom?: boolean): Promise<void>;
  };
  return handler.persistQueuedResult.call({ env }, value, options.acknowledgeRoom ?? false);
}
