import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { RealtimeEnvelope, RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';

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

function nextEnvelope(socket: WebSocket): Promise<RealtimeEnvelope> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for realtime event.')), 3_000);
    socket.addEventListener('message', (event) => {
      clearTimeout(timer);
      resolve(JSON.parse(String(event.data)) as RealtimeEnvelope);
    }, { once: true });
  });
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
});
