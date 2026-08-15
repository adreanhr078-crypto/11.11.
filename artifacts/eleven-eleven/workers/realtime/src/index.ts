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
}

function ratingFromRow(row: RatingRow | null): Glicko2Rating {
  return row ? {
    rating: Number(row.rating),
    deviation: Number(row.deviation),
    volatility: Number(row.volatility),
    gamesPlayed: Number(row.games_played),
  } : { ...DEFAULT_GLICKO2_RATING };
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

/** A signed receipt can still describe an early resignation.  It is kept in
 * history, but cannot be used to farm ratings, Ranked access, XP or cosmetics. */
function eligibleForCompetitivePersistence(receipt: MatchReceipt): boolean {
  const competitive = receipt.mode === 'chess_casual'
    || receipt.mode === 'chess_ranked_blitz'
    || receipt.mode === 'chess_ranked_rapid';
  if (!competitive || receipt.status !== 'resigned') return true;
  return receipt.durationMs >= 90_000
    && receipt.participants.every((participant) => participant.participationMs >= 60_000);
}

const MAX_REWARDED_CHESS_REMATCHES_PER_DAY = 3;

/**
 * Ratings and network rewards must not become a private two-account faucet.
 * We still retain every signed receipt for support/audit history, but only the
 * first few real matches between the same pair in a rolling day can alter
 * progression. The query runs before the receipt batch, so a duplicate Queue
 * delivery remains harmless and a new room cannot trust client-side counters.
 */
async function isWithinChessPairRewardLimit(
  database: D1Database,
  receipt: MatchReceipt,
): Promise<boolean> {
  if (!modeIsChess(receipt.mode) || receipt.participants.length !== 2) return true;
  const [first, second] = receipt.participants;
  if (!first || !second) return false;
  const completedAt = Date.parse(receipt.completedAt);
  if (!Number.isFinite(completedAt)) return false;
  const since = new Date(completedAt - 24 * 60 * 60 * 1_000).toISOString();
  const result = await database.prepare(`
    SELECT COUNT(*) AS total
    FROM network_match_receipts receipt
    WHERE receipt.mode IN ('chess_casual', 'chess_ranked_blitz', 'chess_ranked_rapid')
      AND receipt.status NOT IN ('abandoned')
      AND receipt.completed_at >= ?
      AND EXISTS (
        SELECT 1 FROM network_match_participants first_player
        WHERE first_player.match_id = receipt.match_id AND first_player.user_id = ?
      )
      AND EXISTS (
        SELECT 1 FROM network_match_participants second_player
        WHERE second_player.match_id = receipt.match_id AND second_player.user_id = ?
      )
  `).bind(since, first.uid, second.uid).first<{ total: number }>();
  return Number(result?.total ?? 0) < MAX_REWARDED_CHESS_REMATCHES_PER_DAY;
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

  private async persistQueuedResult(value: unknown): Promise<void> {
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
    const competitiveEligible = eligibleForCompetitivePersistence(receipt)
      && await isWithinChessPairRewardLimit(this.env.PLAYER_DB, receipt);
    const caseDefinition = receipt.context.caseId
      ? COOP_CASE_BY_ID[receipt.context.caseId]
      : null;
    const bondCharacter = caseDefinition?.focusCharacter ?? 'echo';
    const bondPoints = receipt.mode === 'coop_breach' ? 3 : 1;
    for (const participant of receipt.participants) {
      const reward = receipt.rewards.find((entry) => entry.uid === participant.uid)!;
      statements.push(this.env.PLAYER_DB.prepare(`
        INSERT INTO network_match_participants (
          match_id, user_id, outcome, participation_ms, reward_key, xp_amount
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        receipt.matchId,
        participant.uid,
        participant.outcome,
        participant.participationMs,
        reward.rewardKey,
        reward.xpAmount,
      ));
      if (reward.xpAmount > 0 && competitiveEligible) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO xp_reward_events (
            user_id, reward_key, source_type, source_id, xp_amount, granted_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          participant.uid,
          reward.rewardKey,
          sourceType,
          receipt.matchId,
          reward.xpAmount,
          receipt.completedAt,
        ));
      }
      for (const cosmeticId of competitiveEligible ? reward.cosmeticIds : []) {
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO network_cosmetic_unlock_events (
            user_id, cosmetic_id, source_type, source_id, unlocked_at
          ) VALUES (?, ?, 'match', ?, ?)
        `).bind(participant.uid, cosmeticId, receipt.matchId, receipt.completedAt));
      }
      if (competitiveEligible) statements.push(this.env.PLAYER_DB.prepare(`
        INSERT OR IGNORE INTO player_character_bond_events (
          user_id, event_key, character_id, source_type, source_id,
          bond_points, recorded_at
        ) VALUES (?, ?, ?, 'match', ?, ?, ?)
      `).bind(
        participant.uid,
        `bond:${receipt.matchId}:${participant.uid}:v1`,
        bondCharacter,
        receipt.matchId,
        bondPoints,
        receipt.completedAt,
      ));
    }

    if (receipt.mode === 'coop_breach') {
      const completedAt = Date.parse(receipt.completedAt);
      const season = seasonAt(completedAt);
      const week = seasonWeekAt(completedAt);
      const activity = season.activities.find((candidate) => candidate.week === week);
      if (activity) {
        for (const participant of receipt.participants) {
          statements.push(this.env.PLAYER_DB.prepare(`
            INSERT INTO season_player_progress (
              user_id, season_id, activity_id, status, mastery_score,
              completed_at, updated_at
            ) VALUES (?, ?, ?, 'completed', ?, ?, ?)
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
          ));
        }
      }
    }

    const speed = rankedSpeed(receipt.mode);
    if (competitiveEligible && speed && receipt.participants.length === 2) {
      const [first, second] = receipt.participants;
      const [firstRow, secondRow] = await Promise.all([
        this.env.PLAYER_DB.prepare(`
          SELECT rating, deviation, volatility, games_played
          FROM chess_ratings WHERE user_id = ? AND speed = ?
        `).bind(first!.uid, speed).first<RatingRow>(),
        this.env.PLAYER_DB.prepare(`
          SELECT rating, deviation, volatility, games_played
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
          INSERT INTO chess_ratings (
            user_id, speed, rating, deviation, volatility, games_played, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, speed) DO UPDATE SET
            rating = excluded.rating,
            deviation = excluded.deviation,
            volatility = excluded.volatility,
            games_played = excluded.games_played,
            updated_at = excluded.updated_at
          WHERE NOT EXISTS (
            SELECT 1 FROM chess_rating_events WHERE match_id = ? AND user_id = ?
          )
        `).bind(
          participant.uid,
          speed,
          after[index]!.rating,
          after[index]!.deviation,
          after[index]!.volatility,
          after[index]!.gamesPlayed,
          receipt.completedAt,
          receipt.matchId,
          participant.uid,
        ));
        statements.push(this.env.PLAYER_DB.prepare(`
          INSERT OR IGNORE INTO chess_rating_events (
            match_id, user_id, speed, rating_before, deviation_before,
            volatility_before, rating_after, deviation_after,
            volatility_after, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          receipt.completedAt,
        ));
      }
    }

    for (const participant of receipt.participants) {
      if (competitiveEligible && receipt.mode === 'chess_casual') {
        statements.push(this.env.PLAYER_DB.prepare(`
          UPDATE network_player_milestones
          SET casual_chess_completed = (
            SELECT COUNT(*) FROM network_match_participants p
            JOIN network_match_receipts r ON r.match_id = p.match_id
            WHERE p.user_id = ? AND r.mode = 'chess_casual'
          ), updated_at = ?
          WHERE user_id = ?
        `).bind(participant.uid, now, participant.uid));
      }
      statements.push(this.env.PLAYER_DB.prepare(`
        UPDATE player_progression
        SET total_xp = (
          SELECT COALESCE(SUM(xp_amount), 0) FROM xp_reward_events WHERE user_id = ?
        ), updated_at = ?
        WHERE user_id = ?
      `).bind(participant.uid, now, participant.uid));
    }

    await this.env.PLAYER_DB.batch(statements);
    this.env.NETWORK_ANALYTICS.writeDataPoint({
      blobs: [receipt.mode, receipt.status],
      doubles: [receipt.durationMs, receipt.participants.length],
      indexes: [receipt.matchId],
    });
  }
}
