import { env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import {
  assertMatchLeaseAdmission,
  reserveMatchLeasesAndMemberships,
} from '../src/activeMatchLease';

const SECRET = 'test-realtime-secret-that-is-longer-than-thirty-two-characters';

async function installLeaseSchema(): Promise<void> {
  await env.PLAYER_DB.batch([
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_room_memberships (
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        PRIMARY KEY (room_id, user_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_active_match_leases (
        user_id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        acquired_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TRIGGER IF NOT EXISTS prevent_network_active_match_lease_takeover
      BEFORE UPDATE OF room_id ON network_active_match_leases
      WHEN OLD.room_id <> NEW.room_id
        AND OLD.expires_at > NEW.acquired_at
      BEGIN
        SELECT RAISE(ABORT, 'network_active_match_in_progress');
      END
    `),
  ]);
}

function iso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function queueTicket(uid: string): RealtimeTicketPayload {
  const now = Math.floor(Date.now() / 1_000);
  return {
    v: 1,
    iss: 'eleven-eleven-pages',
    aud: 'eleven-eleven-realtime',
    purpose: 'queue',
    target: 'matchmaking',
    uid,
    displayName: 'Lease Test',
    mode: 'chess_casual',
    region: 'me',
    iat: now,
    exp: now + 60,
    jti: crypto.randomUUID(),
  };
}

beforeEach(async () => {
  await installLeaseSchema();
});

describe('server-owned active match leases', () => {
  it('rejects a cross-mode reservation atomically without creating a partial second match', async () => {
    const oldRoom = 'match_existing_lease';
    const newRoom = 'match_attempted_coop';
    await env.PLAYER_DB.prepare(`
      INSERT INTO network_active_match_leases (
        user_id, room_id, mode, acquired_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind('lease-alpha', oldRoom, 'chess_casual', iso(-1_000), iso(60_000)).run();

    await expect(reserveMatchLeasesAndMemberships(env.PLAYER_DB, {
      roomId: newRoom,
      mode: 'coop_breach',
      players: [{ uid: 'lease-alpha' }, { uid: 'lease-beta' }],
      createdAt: iso(),
      expiresAt: iso(60_000),
    })).rejects.toMatchObject({ code: 'active_match_in_progress', status: 409 });

    await expect(env.PLAYER_DB.prepare(`
      SELECT room_id, mode FROM network_active_match_leases
      WHERE user_id = ?
    `).bind('lease-alpha').first()).resolves.toEqual({ room_id: oldRoom, mode: 'chess_casual' });
    await expect(env.PLAYER_DB.prepare(`
      SELECT room_id FROM network_active_match_leases WHERE user_id = ?
    `).bind('lease-beta').first()).resolves.toBeNull();
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_room_memberships WHERE room_id = ?
    `).bind(newRoom).first<{ total: number }>()).resolves.toEqual({ total: 0 });
  });

  it('permits server-verified recovery of the same room but rejects another room', async () => {
    const roomId = 'match_recoverable_lease';
    const now = iso();
    await env.PLAYER_DB.prepare(`
      INSERT INTO network_active_match_leases (
        user_id, room_id, mode, acquired_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind('lease-recover', roomId, 'coop_breach', now, iso(60_000)).run();

    await expect(assertMatchLeaseAdmission(env.PLAYER_DB, {
      uid: 'lease-recover', roomId, now,
    })).resolves.toBeUndefined();
    await expect(assertMatchLeaseAdmission(env.PLAYER_DB, {
      uid: 'lease-recover', roomId: 'match_somewhere_else', now,
    })).rejects.toMatchObject({ code: 'active_match_in_progress', status: 409 });
    await expect(assertMatchLeaseAdmission(env.PLAYER_DB, {
      uid: 'lease-recover', now,
    })).rejects.toMatchObject({ code: 'active_match_in_progress', status: 409 });
  });

  it('refuses public matchmaking before a leased account enters the queue', async () => {
    const uid = 'lease-queued-player';
    await env.PLAYER_DB.prepare(`
      INSERT INTO network_active_match_leases (
        user_id, room_id, mode, acquired_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(uid, 'match_already_active', 'coop_breach', iso(-1_000), iso(60_000)).run();
    const token = await signRealtimeTicket(SECRET, queueTicket(uid));

    const response = await SELF.fetch('https://realtime.test/v1/queue', {
      headers: {
        Origin: 'http://localhost:3000',
        Upgrade: 'websocket',
        'Sec-WebSocket-Protocol': `echo-network-v1, ${token}`,
      },
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: 'active_match_in_progress' });
  });
});
