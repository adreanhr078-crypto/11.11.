import type { OnlineMode } from '../../../src/domain/echo-network/contracts';
import { RealtimeError } from './common';

/**
 * Matches already grant a two-hour, server-owned reconnect membership. Keep
 * the active-match lease on the same bounded horizon: expiry is a crash
 * recovery escape hatch, never browser-owned session state.
 */
export const ACTIVE_MATCH_LEASE_MS = 2 * 60 * 60_000;
const ACTIVE_MATCH_LEASE_CONFLICT = 'network_active_match_in_progress';

interface LeasePlayer {
  uid: string;
}

export interface ActiveMatchLease {
  roomId: string;
  mode: OnlineMode;
  expiresAt: string;
}

function activeMatchConflict(): RealtimeError {
  return new RealtimeError(
    409,
    'active_match_in_progress',
    'This player is already assigned to an active match.',
  );
}

function errorContainsLeaseConflict(error: unknown): boolean {
  return error instanceof Error && error.message.includes(ACTIVE_MATCH_LEASE_CONFLICT);
}

function uniquePlayerUids(players: readonly LeasePlayer[]): string[] {
  const uids = players.map((player) => player.uid);
  if (uids.length === 0 || new Set(uids).size !== uids.length) {
    throw new Error('A match lease requires a non-empty set of unique players.');
  }
  return uids;
}

/**
 * Read the server-owned lease at an admission boundary. A ticket may recover
 * its own room, but it can never be used to enter a second live room.
 */
export async function assertMatchLeaseAdmission(
  database: D1Database,
  input: {
    uid: string;
    roomId?: string;
    now: string;
  },
): Promise<void> {
  const active = await database.prepare(`
    SELECT room_id, mode, expires_at
    FROM network_active_match_leases
    WHERE user_id = ? AND expires_at > ?
  `).bind(input.uid, input.now).first<{
    room_id: string;
    mode: OnlineMode;
    expires_at: string;
  }>();
  if (active && active.room_id !== input.roomId) throw activeMatchConflict();
}

/**
 * Claim each player's one active room and write the reconnect memberships in
 * one D1 batch. The migration trigger aborts the entire batch when any player
 * still holds another unexpired lease, so a partial party can never become a
 * match. Reclaiming the exact same room is deliberately idempotent.
 */
export async function reserveMatchLeasesAndMemberships(
  database: D1Database,
  input: {
    roomId: string;
    mode: OnlineMode;
    players: readonly LeasePlayer[];
    createdAt: string;
    expiresAt: string;
  },
): Promise<void> {
  const uids = uniquePlayerUids(input.players);
  const statements: D1PreparedStatement[] = [];
  for (const uid of uids) {
    statements.push(database.prepare(`
      INSERT INTO network_active_match_leases (
        user_id, room_id, mode, acquired_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        room_id = excluded.room_id,
        mode = excluded.mode,
        acquired_at = excluded.acquired_at,
        expires_at = excluded.expires_at
    `).bind(uid, input.roomId, input.mode, input.createdAt, input.expiresAt));
    statements.push(database.prepare(`
      INSERT OR IGNORE INTO network_room_memberships (
        room_id, user_id, mode, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(input.roomId, uid, input.mode, input.createdAt, input.expiresAt));
  }
  try {
    await database.batch(statements);
  } catch (error) {
    if (errorContainsLeaseConflict(error)) throw activeMatchConflict();
    throw error;
  }
}

/**
 * Terminal receipt persistence is the only normal release path. The exact
 * room guard prevents a late duplicate result from releasing a newer lease.
 */
export function releaseMatchLeasesStatement(
  database: D1Database,
  roomId: string,
): D1PreparedStatement {
  return database.prepare(`
    DELETE FROM network_active_match_leases
    WHERE room_id = ?
  `).bind(roomId);
}
