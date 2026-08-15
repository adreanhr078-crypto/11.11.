import { env, runInDurableObject, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { RealtimeEnvelope, RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import { participantReward, sealReceipt } from '../src/receipt';

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

describe('Echo realtime Worker', () => {
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

  it('rejects a signed ticket when its target does not match the route', async () => {
    const response = await upgrade('/v1/parties/party-ABCDEFGH', ticket({
      target: 'community',
      roomId: 'party-ABCDEFGH',
    }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'route_not_found' });
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

  it('recovers a completed Co-op receipt only when the durable room has time and participation evidence', async () => {
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
      expect(receipt.rewards.map((reward) => reward.xpAmount)).toEqual([90, 90]);
      expect(state.storage.sql.exec<{ attempts: number }>(
        'SELECT attempts FROM result_finalization_outbox WHERE singleton = 1',
      ).toArray()[0]!.attempts).toBeGreaterThan(0);
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
