import { env, runInDurableObject, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RealtimeEnvelope, RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import { persistQueuedResult } from '../src/index';
import { coopAnswer } from '../src/coopServerCatalog';
import { participantReward, sealReceipt } from '../src/receipt';
import { isChessRoomRewardEligible } from '../src/resultEligibility';

const SECRET = 'test-realtime-secret-that-is-longer-than-thirty-two-characters';

function ticket(overrides: Partial<RealtimeTicketPayload> = {}): RealtimeTicketPayload {
  const now = Math.floor(Date.now() / 1_000);
  return {
    v: 1,
    iss: 'eleven-eleven-pages',
    aud: 'eleven-eleven-realtime',
    purpose: 'connect',
    target: 'party',
    uid: 'player-alpha',
    displayName: 'Alpha',
    mode: 'coop_breach',
    roomId: 'party-ABCDEFGH',
    region: 'me',
    iat: now,
    exp: now + 60,
    jti: crypto.randomUUID(),
    ...overrides,
  };
}

async function upgrade(path: string, payload: RealtimeTicketPayload): Promise<Response> {
  const token = await signRealtimeTicket(SECRET, payload);
  return upgradeWithToken(path, token);
}

async function upgradeWithToken(path: string, token: string): Promise<Response> {
  return SELF.fetch(`https://realtime.test${path}`, {
    headers: {
      Origin: 'http://localhost:3000',
      Upgrade: 'websocket',
      'Sec-WebSocket-Protocol': `echo-network-v1, ${token}`,
    },
  });
}

/**
 * The Workers pool starts every D1 binding empty. Keep this narrowly scoped
 * fixture aligned with the production foreign-key contract needed by the
 * PartyRoom safety query; feature migrations themselves remain owned by D1.
 */
async function installPartySafetySchema(): Promise<void> {
  await env.PLAYER_DB.batch([
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS player_progression (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS social_blocks (
        blocker_uid TEXT NOT NULL,
        blocked_uid TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (blocker_uid, blocked_uid),
        CHECK (blocker_uid <> blocked_uid),
        FOREIGN KEY (blocker_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
        FOREIGN KEY (blocked_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
      )
    `),
  ]);
}

/**
 * The Worker pool deliberately starts from an empty D1 fixture rather than
 * applying production migrations. Keep the active-lease behavior explicit in
 * this harness so every queue admission exercises the same atomic conflict
 * semantics as migration 0020.
 */
async function installActiveMatchLeaseSchema(): Promise<void> {
  await env.PLAYER_DB.batch([
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

beforeEach(async () => {
  await installActiveMatchLeaseSchema();
});

async function installPartyLaunchSchema(): Promise<void> {
  await installPartySafetySchema();
  await env.PLAYER_DB.prepare(`
    CREATE TABLE IF NOT EXISTS network_room_memberships (
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      PRIMARY KEY (room_id, user_id)
    )
  `).run();
}

/**
 * Public matchmaking writes the same server-owned membership contract that
 * protects reconnect tickets. Keep this fixture independent from Party safety
 * so the test proves the public Queue -> match handoff rather than a private
 * launch side effect.
 */
async function installMatchmakingMembershipSchema(): Promise<void> {
  await env.PLAYER_DB.prepare(`
    CREATE TABLE IF NOT EXISTS network_room_memberships (
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      PRIMARY KEY (room_id, user_id)
    )
  `).run();
}

async function installResultPersistenceSchema(): Promise<void> {
  await env.PLAYER_DB.batch([
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS player_progression (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        total_xp INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_player_milestones (
        user_id TEXT PRIMARY KEY,
        casual_chess_completed INTEGER NOT NULL DEFAULT 0,
        community_rules_version INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_match_receipts (
        receipt_id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL UNIQUE,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        winner_uid TEXT,
        duration_ms INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        integrity_hash TEXT NOT NULL,
        receipt_json TEXT NOT NULL,
        recorded_at TEXT NOT NULL
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_match_participants (
        match_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        outcome TEXT NOT NULL,
        participation_ms INTEGER NOT NULL,
        reward_key TEXT NOT NULL,
        xp_amount INTEGER NOT NULL,
        PRIMARY KEY (match_id, user_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS xp_reward_events (
        user_id TEXT NOT NULL,
        reward_key TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        xp_amount INTEGER NOT NULL,
        granted_at TEXT NOT NULL,
        PRIMARY KEY (user_id, reward_key)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_cosmetic_unlock_events (
        user_id TEXT NOT NULL,
        cosmetic_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        unlocked_at TEXT NOT NULL,
        PRIMARY KEY (user_id, cosmetic_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS player_character_bond_events (
        user_id TEXT NOT NULL,
        event_key TEXT NOT NULL,
        character_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        bond_points INTEGER NOT NULL,
        recorded_at TEXT NOT NULL,
        PRIMARY KEY (user_id, event_key)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS chess_ratings (
        user_id TEXT NOT NULL,
        speed TEXT NOT NULL,
        rating REAL NOT NULL,
        deviation REAL NOT NULL,
        volatility REAL NOT NULL,
        games_played INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, speed)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS chess_rating_events (
        match_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        speed TEXT NOT NULL,
        rating_before REAL NOT NULL,
        deviation_before REAL NOT NULL,
        volatility_before REAL NOT NULL,
        rating_after REAL NOT NULL,
        deviation_after REAL NOT NULL,
        volatility_after REAL NOT NULL,
        recorded_at TEXT NOT NULL,
        PRIMARY KEY (match_id, user_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS season_player_progress (
        user_id TEXT NOT NULL,
        season_id TEXT NOT NULL,
        activity_id TEXT NOT NULL,
        status TEXT NOT NULL,
        mastery_score INTEGER NOT NULL,
        completed_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, season_id, activity_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TABLE IF NOT EXISTS network_reward_quota_claims (
        scope TEXT NOT NULL,
        subject_key TEXT NOT NULL,
        window_start TEXT NOT NULL,
        match_id TEXT NOT NULL,
        limit_value INTEGER NOT NULL,
        claimed_at TEXT NOT NULL,
        PRIMARY KEY (scope, subject_key, window_start, match_id)
      )
    `),
    env.PLAYER_DB.prepare(`
      CREATE TRIGGER IF NOT EXISTS enforce_network_reward_quota_claim_limit
      BEFORE INSERT ON network_reward_quota_claims
      WHEN NOT EXISTS (
        SELECT 1 FROM network_reward_quota_claims existing_claim
        WHERE existing_claim.scope = NEW.scope
          AND existing_claim.subject_key = NEW.subject_key
          AND existing_claim.window_start = NEW.window_start
          AND existing_claim.match_id = NEW.match_id
      ) AND (
        SELECT COUNT(*) FROM network_reward_quota_claims
        WHERE scope = NEW.scope
          AND subject_key = NEW.subject_key
          AND window_start = NEW.window_start
      ) >= NEW.limit_value
      BEGIN
        SELECT RAISE(ABORT, 'network_reward_quota_exhausted');
      END
    `),
  ]);
}

async function queuedChessResult(input: {
  matchId: string;
  alphaUid: string;
  betaUid: string;
  mode?: 'chess_casual' | 'chess_ranked_blitz';
  status?: 'completed' | 'resigned' | 'abandoned';
  durationMs?: number;
  participationMs?: number;
}) {
  const status = input.status ?? 'completed';
  const winnerUid = input.alphaUid;
  const receipt = await sealReceipt(SECRET, {
    version: 1,
    receiptId: crypto.randomUUID(),
    matchId: input.matchId,
    mode: input.mode ?? 'chess_casual',
    context: { caseId: null, variant: 'standard' },
    status,
    participants: [
      {
        uid: input.alphaUid,
        outcome: 'win',
        participationMs: input.participationMs ?? 95_000,
      },
      {
        uid: input.betaUid,
        outcome: 'loss',
        participationMs: input.participationMs ?? 95_000,
      },
    ],
    winnerUid,
    durationMs: input.durationMs ?? 95_000,
    rewards: [
      participantReward(input.matchId, input.alphaUid, 45),
      participantReward(input.matchId, input.betaUid, 30),
    ],
    completedAt: new Date().toISOString(),
  });
  return {
    receipt,
    profiles: [
      { uid: input.alphaUid, displayName: 'Alpha' },
      { uid: input.betaUid, displayName: 'Beta' },
    ],
  };
}

async function queuedCoopResult(input: {
  matchId: string;
  alphaUid: string;
  betaUid: string;
  alphaParticipationMs?: number;
  betaParticipationMs?: number;
  alphaXp?: number;
  betaXp?: number;
}) {
  const receipt = await sealReceipt(SECRET, {
    version: 1,
    receiptId: crypto.randomUUID(),
    matchId: input.matchId,
    mode: 'coop_breach',
    context: { caseId: 'coop-broken-window', variant: null },
    status: 'completed',
    participants: [
      {
        uid: input.alphaUid,
        outcome: 'completed',
        participationMs: input.alphaParticipationMs ?? 46_000,
      },
      {
        uid: input.betaUid,
        outcome: 'completed',
        participationMs: input.betaParticipationMs ?? 46_000,
      },
    ],
    winnerUid: null,
    durationMs: 46_000,
    rewards: [
      participantReward(input.matchId, input.alphaUid, input.alphaXp ?? 90, ['breach-frame-chapter-1']),
      participantReward(input.matchId, input.betaUid, input.betaXp ?? 90, ['breach-frame-chapter-1']),
    ],
    completedAt: new Date().toISOString(),
  });
  return {
    receipt,
    profiles: [
      { uid: input.alphaUid, displayName: 'Alpha' },
      { uid: input.betaUid, displayName: 'Beta' },
    ],
  };
}

function nextEnvelope(socket: WebSocket): Promise<RealtimeEnvelope> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for realtime event.')), 3_000);
    socket.addEventListener('message', (event) => {
      clearTimeout(timer);
      resolve(JSON.parse(String(event.data)) as RealtimeEnvelope);
    }, { once: true });
  });
}

function envelopeReader(socket: WebSocket): { next: () => Promise<RealtimeEnvelope> } {
  const queued: RealtimeEnvelope[] = [];
  const waiters: Array<(event: RealtimeEnvelope) => void> = [];
  socket.addEventListener('message', (event) => {
    const envelope = JSON.parse(String(event.data)) as RealtimeEnvelope;
    const waiter = waiters.shift();
    if (waiter) waiter(envelope);
    else queued.push(envelope);
  });
  return {
    next: () => new Promise<RealtimeEnvelope>((resolve, reject) => {
      const queuedEvent = queued.shift();
      if (queuedEvent) {
        resolve(queuedEvent);
        return;
      }
      const timer = setTimeout(() => reject(new Error('Timed out waiting for buffered realtime event.')), 3_000);
      waiters.push((event) => {
        clearTimeout(timer);
        resolve(event);
      });
    }),
  };
}

async function nextEventOfType(
  reader: { next: () => Promise<RealtimeEnvelope> },
  type: RealtimeEnvelope['type'],
): Promise<RealtimeEnvelope> {
  for (let index = 0; index < 6; index += 1) {
    const event = await reader.next();
    if (event.type === type) return event;
  }
  throw new Error(`Timed out waiting for ${type}.`);
}

describe('Echo realtime Worker', () => {
  it('requires time, active participation, and real play before a completed chess result is rewardable', () => {
    expect(isChessRoomRewardEligible({
      mode: 'chess_ranked_blitz',
      status: 'completed',
      durationMs: 30_000,
      participants: [
        { uid: 'alpha', outcome: 'win', participationMs: 20_000 },
        { uid: 'beta', outcome: 'loss', participationMs: 20_000 },
      ],
      plies: 4,
    })).toBe(false);
    expect(isChessRoomRewardEligible({
      mode: 'chess_ranked_blitz',
      status: 'completed',
      durationMs: 95_000,
      participants: [
        { uid: 'alpha', outcome: 'win', participationMs: 65_000 },
        { uid: 'beta', outcome: 'loss', participationMs: 65_000 },
      ],
      plies: 7,
    })).toBe(false);
    expect(isChessRoomRewardEligible({
      mode: 'chess_ranked_blitz',
      status: 'completed',
      durationMs: 95_000,
      participants: [
        { uid: 'alpha', outcome: 'win', participationMs: 65_000 },
        { uid: 'beta', outcome: 'loss', participationMs: 65_000 },
      ],
      plies: 8,
    })).toBe(true);
    expect(isChessRoomRewardEligible({
      mode: 'chess_ranked_blitz',
      status: 'resigned',
      durationMs: 95_000,
      participants: [
        { uid: 'alpha', outcome: 'win', participationMs: 65_000 },
        { uid: 'beta', outcome: 'loss', participationMs: 65_000 },
      ],
      plies: 8,
    })).toBe(false);
  });

  it('exposes only a no-store health response without a ticket', async () => {
    const response = await SELF.fetch('https://realtime.test/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({
      service: 'eleven-eleven-realtime',
      status: 'ok',
      protocol: 1,
    });
  });

  it('makes duplicate Queue delivery idempotent before XP or bond presentation can repeat', async () => {
    await installResultPersistenceSchema();
    const result = await queuedChessResult({
      matchId: 'match_duplicate_queue_delivery',
      alphaUid: 'queue-duplicate-alpha',
      betaUid: 'queue-duplicate-beta',
    });

    await persistQueuedResult(env, result);
    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(result.receipt.matchId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('queue-duplicate-alpha', 'queue-duplicate-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM player_character_bond_events
      WHERE user_id IN (?, ?)
    `).bind('queue-duplicate-alpha', 'queue-duplicate-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
  });

  it('records an early resignation for audit without granting XP, bond, or rating', async () => {
    await installResultPersistenceSchema();
    const result = await queuedChessResult({
      matchId: 'match_early_resignation',
      alphaUid: 'early-resign-alpha',
      betaUid: 'early-resign-beta',
      mode: 'chess_ranked_blitz',
      status: 'resigned',
      durationMs: 30_000,
      participationMs: 20_000,
    });

    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(result.receipt.matchId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('early-resign-alpha', 'early-resign-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM chess_rating_events
      WHERE user_id IN (?, ?)
    `).bind('early-resign-alpha', 'early-resign-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
  });

  it('records a prolonged resignation for audit without granting XP, bond, or rating', async () => {
    await installResultPersistenceSchema();
    const result = await queuedChessResult({
      matchId: 'match_prolonged_resignation',
      alphaUid: 'prolonged-resign-alpha',
      betaUid: 'prolonged-resign-beta',
      mode: 'chess_ranked_blitz',
      status: 'resigned',
      durationMs: 95_000,
      participationMs: 95_000,
    });

    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(result.receipt.matchId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('prolonged-resign-alpha', 'prolonged-resign-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM player_character_bond_events
      WHERE user_id IN (?, ?)
    `).bind('prolonged-resign-alpha', 'prolonged-resign-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM chess_rating_events
      WHERE user_id IN (?, ?)
    `).bind('prolonged-resign-alpha', 'prolonged-resign-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
  });

  it('records an early abandoned chess room for audit without granting XP, bond, or rating', async () => {
    await installResultPersistenceSchema();
    const result = await queuedChessResult({
      matchId: 'match_early_abandonment',
      alphaUid: 'early-abandon-alpha',
      betaUid: 'early-abandon-beta',
      mode: 'chess_ranked_blitz',
      status: 'abandoned',
      durationMs: 30_000,
      participationMs: 20_000,
    });

    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('early-abandon-alpha', 'early-abandon-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM player_character_bond_events
      WHERE user_id IN (?, ?)
    `).bind('early-abandon-alpha', 'early-abandon-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM chess_rating_events
      WHERE user_id IN (?, ?)
    `).bind('early-abandon-alpha', 'early-abandon-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT xp_amount FROM network_match_participants WHERE match_id = ? ORDER BY user_id
    `).bind(result.receipt.matchId).all<{ xp_amount: number }>()).resolves.toMatchObject({
      results: [{ xp_amount: 0 }, { xp_amount: 0 }],
    });
  });

  it('records a fast completed chess result for audit without granting progression or rating', async () => {
    await installResultPersistenceSchema();
    const result = await queuedChessResult({
      matchId: 'match_fast_completed_chess',
      alphaUid: 'fast-complete-alpha',
      betaUid: 'fast-complete-beta',
      mode: 'chess_ranked_blitz',
      status: 'completed',
      durationMs: 30_000,
      participationMs: 20_000,
    });

    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(result.receipt.matchId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('fast-complete-alpha', 'fast-complete-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM player_character_bond_events
      WHERE user_id IN (?, ?)
    `).bind('fast-complete-alpha', 'fast-complete-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM chess_rating_events
      WHERE user_id IN (?, ?)
    `).bind('fast-complete-alpha', 'fast-complete-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT xp_amount FROM network_match_participants WHERE match_id = ? ORDER BY user_id
    `).bind(result.receipt.matchId).all<{ xp_amount: number }>()).resolves.toMatchObject({
      results: [{ xp_amount: 0 }, { xp_amount: 0 }],
    });
  });

  it('persists Co-op history but withholds progression from a low-participation teammate', async () => {
    await installResultPersistenceSchema();
    const result = await queuedCoopResult({
      matchId: 'match_coop_low_participation',
      alphaUid: 'coop-active-alpha',
      betaUid: 'coop-idle-beta',
      alphaParticipationMs: 46_000,
      betaParticipationMs: 1_000,
    });

    await persistQueuedResult(env, result);

    await expect(env.PLAYER_DB.prepare(`
      SELECT user_id, xp_amount FROM network_match_participants
      WHERE match_id = ? ORDER BY user_id
    `).bind(result.receipt.matchId).all<{ user_id: string; xp_amount: number }>()).resolves.toMatchObject({
      results: [
        { user_id: 'coop-active-alpha', xp_amount: 90 },
        { user_id: 'coop-idle-beta', xp_amount: 0 },
      ],
    });
    await expect(env.PLAYER_DB.prepare(`
      SELECT user_id FROM xp_reward_events
      WHERE user_id IN (?, ?) ORDER BY user_id
    `).bind('coop-active-alpha', 'coop-idle-beta').all<{ user_id: string }>()).resolves.toMatchObject({
      results: [{ user_id: 'coop-active-alpha' }],
    });
    await expect(env.PLAYER_DB.prepare(`
      SELECT user_id FROM player_character_bond_events
      WHERE user_id IN (?, ?) ORDER BY user_id
    `).bind('coop-active-alpha', 'coop-idle-beta').all<{ user_id: string }>()).resolves.toMatchObject({
      results: [{ user_id: 'coop-active-alpha' }],
    });
  });

  it('limits each player to three rewardable copies of one Co-op case per UTC day', async () => {
    await installResultPersistenceSchema();
    const alphaUid = 'coop-case-limit-alpha';
    const betaUid = 'coop-case-limit-beta';
    for (let index = 1; index <= 4; index += 1) {
      await persistQueuedResult(env, await queuedCoopResult({
        matchId: `match_coop_case_limit_${index}`,
        alphaUid,
        betaUid,
      }));
    }

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts
      WHERE match_id LIKE 'match_coop_case_limit_%'
    `).first<{ total: number }>()).resolves.toMatchObject({ total: 4 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind(alphaUid, betaUid).first<{ total: number }>()).resolves.toMatchObject({ total: 6 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM player_character_bond_events
      WHERE user_id IN (?, ?)
    `).bind(alphaUid, betaUid).first<{ total: number }>()).resolves.toMatchObject({ total: 6 });
  });

  it('keeps only the first three daily ranked rematches between one pair rewardable', async () => {
    await installResultPersistenceSchema();
    const alphaUid = 'pair-limit-alpha';
    const betaUid = 'pair-limit-beta';
    for (let index = 1; index <= 4; index += 1) {
      await persistQueuedResult(env, await queuedChessResult({
        matchId: `match_pair_limit_${index}`,
        alphaUid,
        betaUid,
        mode: 'chess_ranked_blitz',
      }));
    }

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts
      WHERE match_id LIKE 'match_pair_limit_%'
    `).first<{ total: number }>()).resolves.toMatchObject({ total: 4 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind(alphaUid, betaUid).first<{ total: number }>()).resolves.toMatchObject({ total: 6 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM chess_rating_events
      WHERE user_id IN (?, ?)
    `).bind(alphaUid, betaUid).first<{ total: number }>()).resolves.toMatchObject({ total: 6 });
  });

  it('rejects a signed ticket when its target does not match the route', async () => {
    const response = await upgrade('/v1/parties/party-ABCDEFGH', ticket({
      target: 'community',
      roomId: 'party-ABCDEFGH',
    }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'route_not_found' });
  });

  it.each([
    {
      label: 'Chess',
      mode: 'chess_casual' as const,
      pathPrefix: '/v1/rooms/chess/',
      matchmakerName: 'me:chess_casual:default:open',
    },
    {
      label: 'Co-op',
      mode: 'coop_breach' as const,
      caseId: 'coop-broken-window',
      pathPrefix: '/v1/rooms/coop/',
      matchmakerName: 'me:coop_breach:coop-broken-window:open',
    },
  ])('moves two public $label queue clients into one authoritative match room', async ({
    mode,
    caseId,
    pathPrefix,
    matchmakerName,
  }) => {
    await installMatchmakingMembershipSchema();
    const unique = crypto.randomUUID().slice(0, 8);
    const alphaUid = `public-${mode}-alpha-${unique}`;
    const betaUid = `public-${mode}-beta-${unique}`;
    const queueInput = (uid: string, displayName: string) => ticket({
      purpose: 'queue',
      target: 'matchmaking',
      roomId: undefined,
      mode,
      uid,
      displayName,
      ...(caseId ? { caseId } : {}),
    });

    const alphaQueue = await upgrade('/v1/queue', queueInput(alphaUid, 'Public Alpha'));
    expect(alphaQueue.status).toBe(101);
    const alphaQueueEvents = envelopeReader(alphaQueue.webSocket!);
    alphaQueue.webSocket!.accept();
    expect((await alphaQueueEvents.next()).type).toBe('queue-joined');

    const betaQueue = await upgrade('/v1/queue', queueInput(betaUid, 'Public Beta'));
    expect(betaQueue.status).toBe(101);
    const betaQueueEvents = envelopeReader(betaQueue.webSocket!);
    betaQueue.webSocket!.accept();
    expect((await betaQueueEvents.next()).type).toBe('queue-joined');

    // Co-op deliberately holds a small fill window. Trigger the durable alarm
    // in the Worker test rather than waiting five seconds; this is the same
    // authoritative path that starts a two-player room after the fill delay.
    if (mode === 'coop_breach') {
      const matchmaker = env.MATCHMAKER_ROOMS.getByName(matchmakerName);
      await runInDurableObject(matchmaker, async (instance) => {
        await (instance as unknown as { alarm: () => Promise<void> }).alarm();
      });
    }

    const alphaFound = await alphaQueueEvents.next();
    const betaFound = await betaQueueEvents.next();
    expect(alphaFound.type).toBe('match-found');
    expect(betaFound.type).toBe('match-found');
    expect(alphaFound.payload.matchId).toBe(betaFound.payload.matchId);
    expect(alphaFound.payload).toMatchObject({
      mode,
      path: expect.stringMatching(new RegExp(`^${pathPrefix}match_`)),
    });
    expect(betaFound.payload).toMatchObject({
      mode,
      path: alphaFound.payload.path,
    });

    const alphaMatch = await upgradeWithToken(
      String(alphaFound.payload.path),
      String(alphaFound.payload.ticket),
    );
    const betaMatch = await upgradeWithToken(
      String(betaFound.payload.path),
      String(betaFound.payload.ticket),
    );
    expect(alphaMatch.status).toBe(101);
    expect(betaMatch.status).toBe(101);
    const alphaMatchEvents = envelopeReader(alphaMatch.webSocket!);
    const betaMatchEvents = envelopeReader(betaMatch.webSocket!);
    alphaMatch.webSocket!.accept();
    betaMatch.webSocket!.accept();

    const alphaSnapshot = await alphaMatchEvents.next();
    const betaSnapshot = await betaMatchEvents.next();
    expect(alphaSnapshot.type).toBe('room-snapshot');
    expect(betaSnapshot.type).toBe('room-snapshot');
    expect(alphaSnapshot.roomId).toBe(alphaFound.payload.matchId);
    expect(betaSnapshot.roomId).toBe(alphaFound.payload.matchId);
    expect(betaSnapshot.payload.players).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: alphaUid }),
      expect.objectContaining({ uid: betaUid }),
    ]));
    if (mode === 'coop_breach') {
      expect(betaSnapshot.payload).toMatchObject({
        status: 'active',
        case: { id: caseId },
      });
    } else {
      expect(betaSnapshot.payload).toMatchObject({
        status: 'active',
        state: expect.any(Object),
      });
    }

    alphaQueue.webSocket!.close(1000, 'test complete');
    betaQueue.webSocket!.close(1000, 'test complete');
    alphaMatch.webSocket!.close(1000, 'test complete');
    betaMatch.webSocket!.close(1000, 'test complete');
  });

  it('broadcasts a visible but solution-safe Co-op rejection for a wrong team decision', async () => {
    const roomId = 'match_coop_rejected_feedback';
    const caseId = 'coop-broken-window';
    const alpha = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', caseId,
      uid: 'coop-feedback-alpha', displayName: 'Feedback Alpha',
    }));
    expect(alpha.status).toBe(101);
    const alphaEvents = envelopeReader(alpha.webSocket!);
    alpha.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('room-snapshot');

    const beta = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', caseId,
      uid: 'coop-feedback-beta', displayName: 'Feedback Beta',
    }));
    expect(beta.status).toBe(101);
    const betaEvents = envelopeReader(beta.webSocket!);
    beta.webSocket!.accept();
    const activeSnapshot = await nextEventOfType(betaEvents, 'room-snapshot');
    const snapshotState = activeSnapshot.payload.state as { version: number; stageIndex: number };
    const stage = (activeSnapshot.payload.case as { stages: Array<{ optionIds: string[] }> }).stages[snapshotState.stageIndex]!;
    const expected = coopAnswer(caseId, snapshotState.stageIndex);
    const rejectedAnswer = stage.optionIds.find((optionId) => optionId !== expected);
    expect(rejectedAnswer).toBeTruthy();

    beta.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: snapshotState.version,
      type: 'coop-submit',
      sentAt: Date.now(),
      payload: { answerId: rejectedAnswer },
    }));

    const rejected = await nextEventOfType(betaEvents, 'answer-rejected');
    expect(rejected.payload).toMatchObject({
      state: {
        stageIndex: snapshotState.stageIndex,
        failedAttempts: 1,
      },
    });
    expect(rejected.payload).not.toHaveProperty('answer');
    expect(rejected.payload).not.toHaveProperty('expectedAnswer');

    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('keeps party mutation idempotent and rejects reuse of a one-use ticket', async () => {
    const payload = ticket();
    const response = await upgrade('/v1/parties/party-ABCDEFGH', payload);
    expect(response.status).toBe(101);
    const socket = response.webSocket;
    expect(socket).toBeTruthy();
    socket!.accept();

    const initial = await nextEnvelope(socket!);
    expect(initial.type).toBe('party-changed');
    expect(initial.sequence).toBe(1);
    const command = {
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 1,
      type: 'ready',
      sentAt: Date.now(),
      payload: {},
    };
    socket!.send(JSON.stringify(command));
    const changed = await nextEnvelope(socket!);
    expect(changed.type).toBe('party-changed');
    expect(changed.sequence).toBe(2);
    expect(changed.payload.members).toEqual([
      expect.objectContaining({ uid: 'player-alpha', ready: true }),
    ]);

    socket!.send(JSON.stringify(command));
    const replayed = await nextEnvelope(socket!);
    expect(replayed.type).toBe('command-replayed');
    expect(replayed.sequence).toBe(2);
    expect(replayed.payload.members).toEqual([
      expect.objectContaining({ uid: 'player-alpha', ready: true }),
    ]);

    const reused = await upgrade('/v1/parties/party-ABCDEFGH', payload);
    expect(reused.status).toBe(409);
    await expect(reused.json()).resolves.toMatchObject({ code: 'ticket_reused' });
    socket!.close(1000, 'test complete');
  });

  it('launches an all-ready private Chess party into a server-issued match snapshot', async () => {
    await installPartyLaunchSchema();
    const partyId = 'party-HJKLMNPQ';
    const alpha = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-launch-alpha',
      displayName: 'Launch Alpha',
      roomId: partyId,
    }));
    expect(alpha.status).toBe(101);
    const alphaEvents = envelopeReader(alpha.webSocket!);
    alpha.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');

    const beta = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-launch-beta',
      displayName: 'Launch Beta',
      roomId: partyId,
    }));
    expect(beta.status).toBe(101);
    const betaEvents = envelopeReader(beta.webSocket!);
    beta.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    beta.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 2,
      type: 'party-launch',
      sentAt: Date.now(),
      payload: { mode: 'chess_casual', variant: 'standard' },
    }));
    await expect(betaEvents.next()).resolves.toMatchObject({
      type: 'error',
      payload: { code: 'party_leader_required' },
    });

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 2,
      type: 'party-launch',
      sentAt: Date.now(),
      payload: { mode: 'chess_casual', variant: 'standard' },
    }));
    await expect(alphaEvents.next()).resolves.toMatchObject({
      type: 'error',
      payload: { code: 'party_not_ready' },
    });

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 2,
      type: 'ready',
      sentAt: Date.now(),
      payload: {},
    }));
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    beta.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 3,
      type: 'ready',
      sentAt: Date.now(),
      payload: {},
    }));
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 4,
      type: 'party-launch',
      sentAt: Date.now(),
      payload: { mode: 'chess_casual', variant: 'standard' },
    }));
    const alphaMatchFound = await alphaEvents.next();
    const betaMatchFound = await betaEvents.next();
    expect(alphaMatchFound.type).toBe('match-found');
    expect(betaMatchFound.type).toBe('match-found');
    expect(alphaMatchFound.payload).toMatchObject({
      mode: 'chess_casual',
      path: expect.stringMatching(/^\/v1\/rooms\/chess\/match_/),
    });

    const matchPath = String(alphaMatchFound.payload.path);
    const matchTicket = String(alphaMatchFound.payload.ticket);
    const matchResponse = await upgradeWithToken(matchPath, matchTicket);
    expect(matchResponse.status).toBe(101);
    const matchEvents = envelopeReader(matchResponse.webSocket!);
    matchResponse.webSocket!.accept();
    const snapshot = await matchEvents.next();
    expect(snapshot.type).toBe('room-snapshot');
    expect(snapshot.payload).toMatchObject({
      status: 'waiting',
      players: expect.arrayContaining([
        expect.objectContaining({ uid: 'party-launch-alpha' }),
      ]),
    });

    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
    matchResponse.webSocket!.close(1000, 'test complete');
  });

  it('clears a terminal private launch only after its D1 lease is gone, then allows a new launch', async () => {
    await installPartyLaunchSchema();
    const partyId = 'party-LMNPQRST';
    const staleMatchId = 'match_party_terminal_recovery';
    const alpha = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-terminal-alpha', displayName: 'Terminal Alpha', roomId: partyId,
    }));
    const beta = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-terminal-beta', displayName: 'Terminal Beta', roomId: partyId,
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    const alphaEvents = envelopeReader(alpha.webSocket!);
    const betaEvents = envelopeReader(beta.webSocket!);
    alpha.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');
    beta.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    const now = Date.now();
    const leaseExpiry = now + 60 * 60_000;
    const startedAt = new Date(now).toISOString();
    const expiresAt = new Date(leaseExpiry).toISOString();
    const party = env.PARTY_ROOMS.getByName(partyId);
    await runInDurableObject(party, async (_instance, state) => {
      state.storage.sql.exec('UPDATE members SET ready = 1');
      state.storage.sql.exec(`
        INSERT INTO active_launch (
          singleton, match_id, mode, case_id, variant, region, party_size, started_at, expires_at
        ) VALUES (1, ?, 'chess_casual', NULL, 'standard', 'me', 2, ?, ?)
      `, staleMatchId, now, leaseExpiry);
      state.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
    });
    await env.PLAYER_DB.batch([
      env.PLAYER_DB.prepare(`
        INSERT INTO network_active_match_leases (user_id, room_id, mode, acquired_at, expires_at)
        VALUES (?, ?, 'chess_casual', ?, ?)
      `).bind('party-terminal-alpha', staleMatchId, startedAt, expiresAt),
      env.PLAYER_DB.prepare(`
        INSERT INTO network_active_match_leases (user_id, room_id, mode, acquired_at, expires_at)
        VALUES (?, ?, 'chess_casual', ?, ?)
      `).bind('party-terminal-beta', staleMatchId, startedAt, expiresAt),
    ]);

    // A still-live server lease preserves the reconnect launch.
    await runInDurableObject(party, async (instance, state) => {
      await (instance as unknown as { alarm: () => Promise<void> }).alarm();
      expect(state.storage.sql.exec<{ match_id: string }>(
        'SELECT match_id FROM active_launch WHERE singleton = 1',
      ).toArray()).toEqual([{ match_id: staleMatchId }]);
      expect(state.storage.sql.exec<{ ready: number }>(
        'SELECT ready FROM members ORDER BY uid',
      ).toArray()).toEqual([{ ready: 1 }, { ready: 1 }]);
    });
    const resumed = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-terminal-alpha', displayName: 'Terminal Alpha', roomId: partyId,
    }));
    expect(resumed.status).toBe(101);
    const resumedEvents = envelopeReader(resumed.webSocket!);
    resumed.webSocket!.accept();
    await expect(resumedEvents.next()).resolves.toMatchObject({
      type: 'match-found',
      payload: { matchId: staleMatchId },
    });

    // Terminal receipt persistence releases only this room's leases. The
    // lingering party record must then reset rather than re-sending its old ticket.
    await env.PLAYER_DB.prepare(
      'DELETE FROM network_active_match_leases WHERE room_id = ?',
    ).bind(staleMatchId).run();
    await runInDurableObject(party, async (instance, state) => {
      await (instance as unknown as { alarm: () => Promise<void> }).alarm();
      expect(state.storage.sql.exec<{ match_id: string }>(
        'SELECT match_id FROM active_launch WHERE singleton = 1',
      ).toArray()).toEqual([]);
      expect(state.storage.sql.exec<{ ready: number }>(
        'SELECT ready FROM members ORDER BY uid',
      ).toArray()).toEqual([{ ready: 0 }, { ready: 0 }]);
    });

    const clearedAlpha = await alphaEvents.next();
    const clearedBeta = await betaEvents.next();
    expect(clearedAlpha.type).toBe('party-changed');
    expect(clearedBeta.type).toBe('party-changed');
    const command = (
      expectedVersion: number,
      type: 'ready' | 'party-launch',
      payload: Record<string, unknown>,
    ) => JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion,
      type,
      sentAt: Date.now(),
      payload,
    });
    alpha.webSocket!.send(command(clearedAlpha.sequence, 'ready', {}));
    const alphaReady = await alphaEvents.next();
    await betaEvents.next();
    beta.webSocket!.send(command(alphaReady.sequence, 'ready', {}));
    const betaReady = await betaEvents.next();
    await alphaEvents.next();
    alpha.webSocket!.send(command(betaReady.sequence, 'party-launch', {
      mode: 'chess_casual', variant: 'standard',
    }));
    const recoveredAlpha = await alphaEvents.next();
    const recoveredBeta = await betaEvents.next();
    expect(recoveredAlpha).toMatchObject({
      type: 'match-found',
      payload: { matchId: expect.not.stringMatching(/party_terminal_recovery/) },
    });
    expect(recoveredBeta).toMatchObject({ type: 'match-found' });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
    resumed.webSocket!.close(1000, 'test complete');
  });

  it('delivers the leader-selected Co-op case through the private-party match ticket', async () => {
    await installPartyLaunchSchema();
    const partyId = 'party-QRSTUVWXYZ';
    const alpha = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-coop-alpha',
      displayName: 'Co-op Alpha',
      roomId: partyId,
    }));
    const beta = await upgrade(`/v1/parties/${partyId}`, ticket({
      uid: 'party-coop-beta',
      displayName: 'Co-op Beta',
      roomId: partyId,
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    const alphaEvents = envelopeReader(alpha.webSocket!);
    const betaEvents = envelopeReader(beta.webSocket!);
    alpha.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');
    beta.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 2,
      type: 'ready',
      sentAt: Date.now(),
      payload: {},
    }));
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');
    beta.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 3,
      type: 'ready',
      sentAt: Date.now(),
      payload: {},
    }));
    expect((await alphaEvents.next()).type).toBe('party-changed');
    expect((await betaEvents.next()).type).toBe('party-changed');

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 4,
      type: 'party-launch',
      sentAt: Date.now(),
      payload: { mode: 'coop_breach', caseId: 'coop-broken-window' },
    }));
    const found = await alphaEvents.next();
    expect(found).toMatchObject({
      type: 'match-found',
      payload: {
        mode: 'coop_breach',
        path: expect.stringMatching(/^\/v1\/rooms\/coop\/match_/),
      },
    });

    const matchResponse = await upgradeWithToken(
      String(found.payload.path),
      String(found.payload.ticket),
    );
    expect(matchResponse.status).toBe(101);
    const matchEvents = envelopeReader(matchResponse.webSocket!);
    matchResponse.webSocket!.accept();
    await expect(matchEvents.next()).resolves.toMatchObject({
      type: 'room-snapshot',
      payload: {
        status: 'waiting',
        case: { id: 'coop-broken-window' },
      },
    });

    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
    matchResponse.webSocket!.close(1000, 'test complete');
  });

  it('canonicalizes party routes and rejects blocked party joins', async () => {
    const partyId = 'party-KLMNPQRS';
    const lowerCaseRoute = await upgrade(`/v1/parties/${partyId.toLowerCase()}`, ticket({ roomId: partyId }));
    expect(lowerCaseRoute.status).toBe(101);
    lowerCaseRoute.webSocket!.accept();
    const canonicalSnapshot = await nextEnvelope(lowerCaseRoute.webSocket!);
    expect(canonicalSnapshot.roomId).toBe(partyId);
    lowerCaseRoute.webSocket!.close(1000, 'test complete');

    const blockedPartyId = 'party-TUVWXYZA';
    const now = new Date().toISOString();
    await installPartySafetySchema();
    await env.PLAYER_DB.batch([
      env.PLAYER_DB.prepare(`
        INSERT OR IGNORE INTO player_progression (user_id, username, total_xp, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?)
      `).bind('party-blocker', 'Blocker', now, now),
      env.PLAYER_DB.prepare(`
        INSERT OR IGNORE INTO player_progression (user_id, username, total_xp, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?)
      `).bind('party-blocked', 'Blocked', now, now),
      env.PLAYER_DB.prepare(`
        INSERT OR IGNORE INTO social_blocks (blocker_uid, blocked_uid, created_at)
        VALUES (?, ?, ?)
      `).bind('party-blocker', 'party-blocked', now),
    ]);

    const first = await upgrade(`/v1/parties/${blockedPartyId}`, ticket({
      uid: 'party-blocker',
      displayName: 'Blocker',
      roomId: blockedPartyId,
    }));
    expect(first.status).toBe(101);
    first.webSocket!.accept();
    await nextEnvelope(first.webSocket!);

    const blocked = await upgrade(`/v1/parties/${blockedPartyId}`, ticket({
      uid: 'party-blocked',
      displayName: 'Blocked',
      roomId: blockedPartyId,
    }));
    expect(blocked.status).toBe(403);
    await expect(blocked.json()).resolves.toMatchObject({ code: 'party_blocked' });
    first.webSocket!.close(1000, 'test complete');
  });

  it('retains the earliest reconnect cleanup and reschedules after expired members leave', async () => {
    const stub = env.PARTY_ROOMS.getByName('party-BCDEFGHJ');
    const now = Date.now();
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as {
        scheduleDisconnectCleanup: () => Promise<void>;
      };
      state.storage.sql.exec(`
        INSERT INTO members (uid, display_name, joined_at, ready, disconnected_at)
        VALUES (?, ?, ?, 0, ?)
      `, 'later', 'Later', now, now + 20_000);
      await room.scheduleDisconnectCleanup();
      const laterAlarm = await state.storage.getAlarm();

      state.storage.sql.exec(`
        INSERT INTO members (uid, display_name, joined_at, ready, disconnected_at)
        VALUES (?, ?, ?, 0, ?)
      `, 'earlier', 'Earlier', now, now + 5_000);
      await room.scheduleDisconnectCleanup();
      expect(await state.storage.getAlarm()).toBe(now + 50_000);
      expect(laterAlarm).toBe(now + 65_000);
    });

    const cleanupStub = env.PARTY_ROOMS.getByName('party-CDEFGHJK');
    await runInDurableObject(cleanupStub, async (instance, state) => {
      const room = instance as unknown as {
        scheduleDisconnectCleanup: () => Promise<void>;
        alarm: () => Promise<void>;
      };
      state.storage.sql.exec(`
        INSERT INTO members (uid, display_name, joined_at, ready, disconnected_at)
        VALUES (?, ?, ?, 0, ?), (?, ?, ?, 0, ?)
      `,
      'expired', 'Expired', now, now - 45_001,
      'waiting', 'Waiting', now, now + 5_000);
      await room.scheduleDisconnectCleanup();
      await room.alarm();
      const members = state.storage.sql.exec<{ uid: string }>(
        'SELECT uid FROM members ORDER BY uid ASC',
      ).toArray();
      expect(members).toEqual([{ uid: 'waiting' }]);
      expect(await state.storage.getAlarm()).toBeGreaterThan(Date.now());
    });
  });

  it('serializes concurrent party admissions so a fifth member cannot enter', async () => {
    const partyId = 'party-DEFGHJKL';
    await installPartySafetySchema();
    const responses = await Promise.all(
      ['one', 'two', 'three', 'four', 'five'].map((suffix) => upgrade(
        `/v1/parties/${partyId}`,
        ticket({
          uid: `concurrent-${suffix}`,
          displayName: `Concurrent ${suffix}`,
          roomId: partyId,
        }),
      )),
    );
    expect(responses.filter((response) => response.status === 101)).toHaveLength(4);
    const rejected = responses.find((response) => response.status === 409);
    expect(rejected).toBeTruthy();
    await expect(rejected!.json()).resolves.toMatchObject({ code: 'party_full' });
    for (const response of responses) {
      if (response.status === 101 && response.webSocket) {
        response.webSocket.accept();
        response.webSocket.close(1000, 'test complete');
      }
    }
  });

  it('keeps a chess result immutable and restores its stored receipt after reconnect', async () => {
    const roomId = 'match_chess_reconnect';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match',
      roomId,
      mode: 'chess_casual',
      uid: 'chess-alpha',
      displayName: 'Chess Alpha',
    }));
    expect(alpha.status).toBe(101);
    const alphaEvents = envelopeReader(alpha.webSocket!);
    alpha.webSocket!.accept();
    expect((await alphaEvents.next()).type).toBe('room-snapshot');
    expect((await alphaEvents.next()).type).toBe('presence-changed');

    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match',
      roomId,
      mode: 'chess_casual',
      uid: 'chess-beta',
      displayName: 'Chess Beta',
    }));
    expect(beta.status).toBe(101);
    const betaEvents = envelopeReader(beta.webSocket!);
    beta.webSocket!.accept();
    expect((await betaEvents.next()).type).toBe('room-snapshot');
    expect((await alphaEvents.next()).type).toBe('presence-changed');
    expect((await betaEvents.next()).type).toBe('presence-changed');

    const receipt = await sealReceipt(SECRET, {
      version: 1,
      receiptId: crypto.randomUUID(),
      matchId: roomId,
      mode: 'chess_casual',
      context: { caseId: null, variant: 'standard' },
      status: 'completed',
      participants: [
        { uid: 'chess-alpha', outcome: 'win', participationMs: 5_000 },
        { uid: 'chess-beta', outcome: 'loss', participationMs: 5_000 },
      ],
      winnerUid: 'chess-alpha',
      durationMs: 5_000,
      rewards: [
        participantReward(roomId, 'chess-alpha', 45),
        participantReward(roomId, 'chess-beta', 30),
      ],
      completedAt: new Date().toISOString(),
    });
    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (_instance, state) => {
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const terminal = {
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        version: 9,
        status: 'white-won',
        reason: 'checkmate',
      };
      state.storage.sql.exec(`
        UPDATE meta SET state_json = ?, receipt_json = ?, receipt_queued = 1
        WHERE singleton = 1
      `, JSON.stringify(terminal), JSON.stringify(receipt));
    });

    alpha.webSocket!.send(JSON.stringify({
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: 9,
      type: 'resign',
      sentAt: Date.now(),
      payload: {},
    }));
    const rejection = await alphaEvents.next();
    expect(rejection.type).toBe('error');
    expect(rejection.payload).toMatchObject({ code: 'match_finished' });
    await runInDurableObject(stub, async (_instance, state) => {
      const terminal = JSON.parse(state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!.state_json) as { version: number; status: string };
      expect(terminal).toMatchObject({ version: 9, status: 'white-won' });
    });

    alpha.webSocket!.close(1000, 'reconnect test');
    const reconnected = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match',
      roomId,
      mode: 'chess_casual',
      uid: 'chess-alpha',
      displayName: 'Chess Alpha',
    }));
    expect(reconnected.status).toBe(101);
    const reconnectedEvents = envelopeReader(reconnected.webSocket!);
    reconnected.webSocket!.accept();
    expect((await reconnectedEvents.next()).type).toBe('room-snapshot');
    const restored = await reconnectedEvents.next();
    expect(restored.type).toBe('reward-pending');
    expect(restored.payload.receipt).toMatchObject({ receiptId: receipt.receiptId, matchId: roomId });
    reconnected.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('recovers a terminal Chess receipt from durable finalization intent after an interrupted queue handoff', async () => {
    const roomId = 'match_chess_finalization_recovery';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'recovery-alpha', displayName: 'Recovery Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'recovery-beta', displayName: 'Recovery Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as {
        persistTerminalState: (state: unknown, status: 'resigned', winnerUid: string, now: number) => void;
        alarm: () => Promise<void>;
      };
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const terminal = {
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        version: 3,
        status: 'black-won',
        reason: 'resigned',
      };
      state.storage.sql.exec('UPDATE meta SET started_at = ? WHERE singleton = 1', Date.now() - 95_000);
      room.persistTerminalState(terminal, 'resigned', 'recovery-beta', Date.now());
      expect(state.storage.sql.exec<{ result_status: string; winner_uid: string }>(
        'SELECT result_status, winner_uid FROM result_finalization_outbox WHERE singleton = 1',
      ).toArray()).toEqual([{ result_status: 'resigned', winner_uid: 'recovery-beta' }]);

      // A process stop after the transaction above leaves no receipt, but the
      // next Durable Object alarm must complete the same terminal result.
      await room.alarm();
      const recovered = state.storage.sql.exec<{ receipt_json: string }>(
        'SELECT receipt_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      expect(JSON.parse(recovered.receipt_json)).toMatchObject({
        matchId: roomId,
        status: 'resigned',
        winnerUid: 'recovery-beta',
      });
      expect(state.storage.sql.exec<{ attempts: number }>(
        'SELECT attempts FROM result_finalization_outbox WHERE singleton = 1',
      ).toArray()[0]!.attempts).toBeGreaterThan(0);
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('creates an audited but unrewarded Chess receipt after an early abandonment', async () => {
    const roomId = 'match_chess_early_abandonment_room';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'abandon-room-alpha', displayName: 'Abandon Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'abandon-room-beta', displayName: 'Abandon Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as { alarm: () => Promise<void> };
      const now = Date.now();
      state.storage.sql.exec('UPDATE meta SET started_at = ? WHERE singleton = 1', now - 30_000);
      state.storage.sql.exec(`
        UPDATE participants
        SET connected_since = CASE WHEN uid = ? THEN ? ELSE NULL END,
          participation_ms = CASE WHEN uid = ? THEN 20_000 ELSE 10_000 END,
          disconnected_at = CASE WHEN uid = ? THEN ? ELSE NULL END
      `,
      'abandon-room-beta', now - 10_000,
      'abandon-room-beta',
      'abandon-room-alpha', now - 31_000,
      );

      await room.alarm();
      const stored = state.storage.sql.exec<{ receipt_json: string }>(
        'SELECT receipt_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const receipt = JSON.parse(stored.receipt_json) as {
        status: string;
        rewards: Array<{ xpAmount: number; cosmeticIds: string[] }>;
      };
      expect(receipt.status).toBe('abandoned');
      expect(receipt.rewards.map((reward) => ({
        xpAmount: reward.xpAmount,
        cosmeticIds: reward.cosmeticIds,
      }))).toEqual([
        { xpAmount: 0, cosmeticIds: [] },
        { xpAmount: 0, cosmeticIds: [] },
      ]);
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('retries a Chess terminal outbox after the Queue send fails', async () => {
    const roomId = 'match_chess_queue_failure_recovery';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'queue-retry-chess-alpha', displayName: 'Queue Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'queue-retry-chess-beta', displayName: 'Queue Beta',
    }));
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as {
        alarm: () => Promise<void>;
        enqueueResult: (payload: unknown) => Promise<void>;
        persistTerminalState: (next: unknown, status: 'resigned', winnerUid: string, now: number) => void;
      };
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const now = Date.now();
      state.storage.sql.exec('UPDATE meta SET started_at = ? WHERE singleton = 1', now - 95_000);
      state.storage.sql.exec(`
        UPDATE participants SET connected_since = NULL, participation_ms = 95_000, disconnected_at = NULL
      `);
      room.persistTerminalState({
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        status: 'black-won',
        reason: 'resigned',
      }, 'resigned', 'queue-retry-chess-beta', now);
      const originalEnqueue = room.enqueueResult.bind(room);
      room.enqueueResult = async () => { throw new Error('simulated queue outage'); };

      await room.alarm();
      expect(state.storage.sql.exec<{ receipt_json: string | null; receipt_queued: number }>(
        'SELECT receipt_json, receipt_queued FROM meta WHERE singleton = 1',
      ).toArray()[0]).toMatchObject({ receipt_json: expect.any(String), receipt_queued: 0 });

      room.enqueueResult = originalEnqueue;
      await room.alarm();
      expect(state.storage.sql.exec<{ receipt_queued: number }>(
        'SELECT receipt_queued FROM meta WHERE singleton = 1',
      ).toArray()[0]).toMatchObject({ receipt_queued: 1 });
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('recovers a completed Co-op receipt while withholding the reward from a vote-only teammate', async () => {
    const roomId = 'match_coop_finalization_recovery';
    const alpha = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'coop-recovery-alpha', displayName: 'Co-op Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'coop-recovery-beta', displayName: 'Co-op Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.COOP_SESSION_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as { alarm: () => Promise<void> };
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const completed = {
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        version: 3,
        status: 'completed',
      };
      state.storage.sql.exec(
        'UPDATE meta SET state_json = ?, started_at = ?, finished_at = ? WHERE singleton = 1',
        JSON.stringify(completed), Date.now() - 46_000, Date.now(),
      );
      state.storage.sql.exec(`
        UPDATE participants
        SET connected_since = CASE WHEN uid = ? THEN ? ELSE NULL END,
          participation_ms = CASE WHEN uid = ? THEN 0 ELSE 1_000 END,
          disconnected_at = CASE WHEN uid = ? THEN NULL ELSE ? END
      `,
      'coop-recovery-alpha', Date.now() - 46_000,
      'coop-recovery-alpha',
      'coop-recovery-alpha', Date.now() - 500,
      );
      state.storage.sql.exec(`
        INSERT INTO stage_events (stage_index, uid, answer_id, correct, submitted_at)
        VALUES (0, ?, 'north', 1, ?)
      `, 'coop-recovery-alpha', Date.now());
      state.storage.sql.exec(`
        INSERT INTO participation_events (uid, event_type, created_at)
        VALUES (?, 'answer', ?), (?, 'vote', ?)
      `, 'coop-recovery-alpha', Date.now(), 'coop-recovery-beta', Date.now());
      state.storage.sql.exec(
        'INSERT INTO result_finalization_outbox (singleton, created_at, attempts) VALUES (1, ?, 0)',
        Date.now(),
      );

      await room.alarm();
      const recovered = state.storage.sql.exec<{ receipt_json: string }>(
        'SELECT receipt_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const receipt = JSON.parse(recovered.receipt_json) as { rewards: Array<{ xpAmount: number }> };
      expect(receipt.rewards.map((reward) => reward.xpAmount)).toEqual([90, 0]);
      expect(state.storage.sql.exec<{ attempts: number }>(
        'SELECT attempts FROM result_finalization_outbox WHERE singleton = 1',
      ).toArray()[0]!.attempts).toBeGreaterThan(0);
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('withholds Co-op progression for a correct answer from a restarted run', async () => {
    const roomId = 'match_coop_restarted_run_eligibility';
    const alpha = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'coop-restarted-alpha', displayName: 'Restart Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'coop-restarted-beta', displayName: 'Restart Beta',
    }));
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.COOP_SESSION_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as { alarm: () => Promise<void> };
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const now = Date.now();
      state.storage.sql.exec(`
        UPDATE meta SET state_json = ?, started_at = ?, finished_at = ? WHERE singleton = 1
      `, JSON.stringify({
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        version: 6,
        status: 'completed',
        runIndex: 2,
      }), now - 46_000, now);
      state.storage.sql.exec(`
        UPDATE participants
        SET connected_since = ?, participation_ms = 0, disconnected_at = NULL
      `, now - 46_000);
      // Alpha solved a stage before the team approved a restart. Only Beta's
      // correct event belongs to the successful second run.
      state.storage.sql.exec(`
        INSERT INTO stage_events (run_index, stage_index, uid, answer_id, correct, submitted_at)
        VALUES (1, 0, ?, 'north', 1, ?), (2, 0, ?, 'north', 1, ?)
      `, 'coop-restarted-alpha', now - 5_000, 'coop-restarted-beta', now);
      state.storage.sql.exec(
        'INSERT INTO result_finalization_outbox (singleton, created_at, attempts) VALUES (1, ?, 0)',
        now,
      );

      await room.alarm();
      const receiptJson = state.storage.sql.exec<{ receipt_json: string }>(
        'SELECT receipt_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!.receipt_json;
      const receipt = JSON.parse(receiptJson) as {
        rewards: Array<{ uid: string; xpAmount: number }>;
      };
      expect(receipt.rewards).toEqual(expect.arrayContaining([
        expect.objectContaining({ uid: 'coop-restarted-alpha', xpAmount: 0 }),
        expect.objectContaining({ uid: 'coop-restarted-beta', xpAmount: 90 }),
      ]));
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('retries a Co-op terminal outbox after the Queue send fails', async () => {
    const roomId = 'match_coop_queue_failure_recovery';
    const alpha = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'queue-retry-coop-alpha', displayName: 'Queue Co-op Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'queue-retry-coop-beta', displayName: 'Queue Co-op Beta',
    }));
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const stub = env.COOP_SESSION_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as {
        alarm: () => Promise<void>;
        enqueueResult: (payload: unknown) => Promise<void>;
      };
      const meta = state.storage.sql.exec<{ state_json: string }>(
        'SELECT state_json FROM meta WHERE singleton = 1',
      ).toArray()[0]!;
      const now = Date.now();
      state.storage.sql.exec(`
        UPDATE meta SET state_json = ?, started_at = ?, finished_at = ? WHERE singleton = 1
      `, JSON.stringify({
        ...JSON.parse(meta.state_json) as Record<string, unknown>,
        status: 'completed',
      }), now - 46_000, now);
      state.storage.sql.exec(`
        UPDATE participants SET connected_since = ?, participation_ms = 0, disconnected_at = NULL
      `, now - 46_000);
      state.storage.sql.exec(`
        INSERT INTO stage_events (stage_index, uid, answer_id, correct, submitted_at)
        VALUES (0, ?, 'north', 1, ?), (1, ?, 'mirror', 1, ?)
      `, 'queue-retry-coop-alpha', now, 'queue-retry-coop-beta', now);
      state.storage.sql.exec(
        'INSERT INTO result_finalization_outbox (singleton, created_at, attempts) VALUES (1, ?, 0)',
        now,
      );
      const originalEnqueue = room.enqueueResult.bind(room);
      room.enqueueResult = async () => { throw new Error('simulated queue outage'); };

      await room.alarm();
      expect(state.storage.sql.exec<{ receipt_json: string | null; receipt_queued: number }>(
        'SELECT receipt_json, receipt_queued FROM meta WHERE singleton = 1',
      ).toArray()[0]).toMatchObject({ receipt_json: expect.any(String), receipt_queued: 0 });

      room.enqueueResult = originalEnqueue;
      await room.alarm();
      expect(state.storage.sql.exec<{ receipt_queued: number }>(
        'SELECT receipt_queued FROM meta WHERE singleton = 1',
      ).toArray()[0]).toMatchObject({ receipt_queued: 1 });
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('re-enqueues an unacknowledged Chess receipt after D1 failure without duplicating rewards', async () => {
    const roomId = 'match_chess_d1_reconciliation';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'd1-recovery-chess-alpha', displayName: 'D1 Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'd1-recovery-chess-beta', displayName: 'D1 Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const result = await queuedChessResult({
      matchId: roomId,
      alphaUid: 'd1-recovery-chess-alpha',
      betaUid: 'd1-recovery-chess-beta',
    });
    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    // This is the durable state immediately after RESULT_QUEUE accepted the
    // first send but before its consumer could persist the receipt to D1.
    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec(`
        UPDATE meta
        SET receipt_json = ?, receipt_queued = 1, receipt_persisted = 0
        WHERE singleton = 1
      `, JSON.stringify(result.receipt));
    });

    await installResultPersistenceSchema();
    const leaseStartedAt = new Date().toISOString();
    const leaseExpiresAt = new Date(Date.now() + 60_000).toISOString();
    await env.PLAYER_DB.batch([
      env.PLAYER_DB.prepare(`
        INSERT INTO network_active_match_leases (
          user_id, room_id, mode, acquired_at, expires_at
        ) VALUES (?, ?, 'chess_casual', ?, ?)
      `).bind('d1-recovery-chess-alpha', roomId, leaseStartedAt, leaseExpiresAt),
      env.PLAYER_DB.prepare(`
        INSERT INTO network_active_match_leases (
          user_id, room_id, mode, acquired_at, expires_at
        ) VALUES (?, ?, 'chess_casual', ?, ?)
      `).bind('d1-recovery-chess-beta', roomId, leaseStartedAt, leaseExpiresAt),
    ]);
    // Failure injection after the receipt and claim statements have run in
    // the same D1 batch. The transactional rollback must leave neither an
    // orphan quota claim nor an audit record that would block recovery.
    await env.PLAYER_DB.prepare(`
      CREATE TRIGGER fail_chess_d1_reconciliation_participant
      BEFORE INSERT ON network_match_participants
      WHEN NEW.match_id = 'match_chess_d1_reconciliation'
      BEGIN
        SELECT RAISE(ABORT, 'simulated D1 batch outage');
      END
    `).run();
    try {
      await expect(persistQueuedResult(env, result, { acknowledgeRoom: true })).rejects.toThrow(
        'simulated D1 batch outage',
      );
      await expect(env.PLAYER_DB.prepare(`
        SELECT COUNT(*) AS total FROM network_reward_quota_claims WHERE match_id = ?
      `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
      await expect(env.PLAYER_DB.prepare(`
        SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
      `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
      await expect(env.PLAYER_DB.prepare(`
        SELECT COUNT(*) AS total FROM network_active_match_leases WHERE room_id = ?
      `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
    } finally {
      await env.PLAYER_DB.prepare(
        'DROP TRIGGER IF EXISTS fail_chess_d1_reconciliation_participant',
      ).run();
    }
    await runInDurableObject(stub, async (_instance, state) => {
      expect(state.storage.sql.exec<{ receipt_queued: number; receipt_persisted: number }>(
        'SELECT receipt_queued, receipt_persisted FROM meta WHERE singleton = 1',
      ).toArray()[0]).toEqual({ receipt_queued: 1, receipt_persisted: 0 });
    });

    let resentPayload: unknown = undefined;
    await runInDurableObject(stub, async (instance) => {
      const room = instance as unknown as {
        alarm: () => Promise<void>;
        enqueueResult: (payload: unknown) => Promise<void>;
      };
      room.enqueueResult = async (payload) => { resentPayload = payload; };
      await room.alarm();
    });
    expect(resentPayload).toMatchObject({
      receipt: { matchId: roomId, integrityHash: result.receipt.integrityHash },
    });

    await persistQueuedResult(env, resentPayload, { acknowledgeRoom: true });
    // Simulate the Queue's at-least-once duplicate after the successful
    // receipt ACK. D1 must retain exactly one result and each player one XP event.
    await persistQueuedResult(env, resentPayload, { acknowledgeRoom: true });

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_active_match_leases WHERE room_id = ?
    `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 0 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('d1-recovery-chess-alpha', 'd1-recovery-chess-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_reward_quota_claims WHERE match_id = ?
    `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await runInDurableObject(stub, async (instance, state) => {
      const room = instance as unknown as {
        alarm: () => Promise<void>;
        enqueueResult: (payload: unknown) => Promise<void>;
      };
      let attemptedAReplay = false;
      room.enqueueResult = async () => { attemptedAReplay = true; };
      await room.alarm();
      expect(state.storage.sql.exec<{ receipt_persisted: number }>(
        'SELECT receipt_persisted FROM meta WHERE singleton = 1',
      ).toArray()[0]).toEqual({ receipt_persisted: 1 });
      expect(attemptedAReplay).toBe(false);
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('retries a Chess receipt acknowledgement after D1 already committed the result', async () => {
    const roomId = 'match_chess_ack_retry';
    const alpha = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'ack-retry-chess-alpha', displayName: 'ACK Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/chess/${roomId}`, ticket({
      target: 'match', roomId, mode: 'chess_casual', uid: 'ack-retry-chess-beta', displayName: 'ACK Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const persistedResult = await queuedChessResult({
      matchId: roomId,
      alphaUid: 'ack-retry-chess-alpha',
      betaUid: 'ack-retry-chess-beta',
    });
    const stub = env.CHESS_MATCH_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec(`
        UPDATE meta
        SET receipt_json = ?, receipt_queued = 1, receipt_persisted = 0
        WHERE singleton = 1
      `, JSON.stringify(persistedResult.receipt));
    });
    await installResultPersistenceSchema();

    // The D1 batch succeeds, while the internal room acknowledgement is
    // unavailable. A Queue retry must acknowledge the existing receipt
    // without replaying its reward statements.
    const failingAckEnv = Object.create(env) as Env;
    Object.defineProperty(failingAckEnv, 'CHESS_MATCH_ROOMS', {
      value: {
        getByName: () => ({
          acknowledgeReceiptPersistence: async () => {
            throw new Error('simulated durable acknowledgement outage');
          },
        }),
      } as unknown as DurableObjectNamespace,
    });
    await expect(persistQueuedResult(failingAckEnv, persistedResult, { acknowledgeRoom: true })).rejects.toThrow(
      'simulated durable acknowledgement outage',
    );
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('ack-retry-chess-alpha', 'ack-retry-chess-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });

    await persistQueuedResult(env, persistedResult, { acknowledgeRoom: true });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('ack-retry-chess-alpha', 'ack-retry-chess-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
    await runInDurableObject(stub, async (_instance, state) => {
      expect(state.storage.sql.exec<{ receipt_persisted: number }>(
        'SELECT receipt_persisted FROM meta WHERE singleton = 1',
      ).toArray()[0]).toEqual({ receipt_persisted: 1 });
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('acknowledges a persisted Co-op receipt and keeps duplicate delivery idempotent', async () => {
    const roomId = 'match_coop_d1_ack';
    const alpha = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'd1-ack-coop-alpha', displayName: 'Co-op ACK Alpha',
    }));
    const beta = await upgrade(`/v1/rooms/coop/${roomId}`, ticket({
      target: 'match', roomId, mode: 'coop_breach', uid: 'd1-ack-coop-beta', displayName: 'Co-op ACK Beta',
    }));
    expect(alpha.status).toBe(101);
    expect(beta.status).toBe(101);
    alpha.webSocket!.accept();
    beta.webSocket!.accept();

    const result = await queuedCoopResult({
      matchId: roomId,
      alphaUid: 'd1-ack-coop-alpha',
      betaUid: 'd1-ack-coop-beta',
    });
    const stub = env.COOP_SESSION_ROOMS.getByName(roomId);
    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec(`
        UPDATE meta
        SET receipt_json = ?, receipt_queued = 1, receipt_persisted = 0
        WHERE singleton = 1
      `, JSON.stringify(result.receipt));
    });
    await installResultPersistenceSchema();
    await persistQueuedResult(env, result, { acknowledgeRoom: true });
    await persistQueuedResult(env, result, { acknowledgeRoom: true });

    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM network_match_receipts WHERE match_id = ?
    `).bind(roomId).first<{ total: number }>()).resolves.toMatchObject({ total: 1 });
    await expect(env.PLAYER_DB.prepare(`
      SELECT COUNT(*) AS total FROM xp_reward_events
      WHERE user_id IN (?, ?)
    `).bind('d1-ack-coop-alpha', 'd1-ack-coop-beta').first<{ total: number }>()).resolves.toMatchObject({ total: 2 });
    await runInDurableObject(stub, async (_instance, state) => {
      expect(state.storage.sql.exec<{ receipt_persisted: number }>(
        'SELECT receipt_persisted FROM meta WHERE singleton = 1',
      ).toArray()[0]).toEqual({ receipt_persisted: 1 });
    });
    alpha.webSocket!.close(1000, 'test complete');
    beta.webSocket!.close(1000, 'test complete');
  });

  it('keeps a live chess player in matchmaking through the stale sweep', async () => {
    const queued = await upgrade('/v1/queue', ticket({
      purpose: 'queue',
      target: 'matchmaking',
      roomId: undefined,
      mode: 'chess_casual',
      uid: 'queue-sweep-player',
      displayName: 'Queue Sweep',
    }));
    expect(queued.status).toBe(101);
    queued.webSocket!.accept();
    expect((await nextEnvelope(queued.webSocket!)).type).toBe('queue-joined');
    const stub = env.MATCHMAKER_ROOMS.getByName('me:chess_casual:default:open');
    await runInDurableObject(stub, async (instance, state) => {
      expect(await state.storage.getAlarm()).not.toBeNull();
      state.storage.sql.exec(
        'UPDATE waiting SET joined_at = ? WHERE uid = ?',
        Date.now() - 91_000,
        'queue-sweep-player',
      );
      await (instance as unknown as { alarm: () => Promise<void> }).alarm();
      const waiting = state.storage.sql.exec<{ uid: string }>(
        'SELECT uid FROM waiting WHERE uid = ?', 'queue-sweep-player',
      ).toArray();
      expect(waiting).toEqual([{ uid: 'queue-sweep-player' }]);
    });
    queued.webSocket!.close(1000, 'test complete');
  });
});
