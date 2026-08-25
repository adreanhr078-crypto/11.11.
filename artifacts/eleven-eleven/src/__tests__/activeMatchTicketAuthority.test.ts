import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestPost as issueRealtimeTicket } from '../../functions/api/player/network/ticket';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;

class LeaseStatement implements PlayerDatabaseStatement {
  private values: unknown[] = [];

  constructor(readonly query: string) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    if (this.query.includes('FROM network_active_match_leases')) {
      return {
        room_id: 'match_already_active',
        mode: 'coop_breach',
      } as T;
    }
    if (this.query.includes('FROM network_ticket_events')) return { total: 0 } as T;
    throw new Error(`Unexpected D1 first query: ${this.query}`);
  }

  async all<T>(): Promise<PlayerDatabaseResult<T>> {
    return { results: [], success: true };
  }

  async run<T>(): Promise<PlayerDatabaseResult<T>> {
    return { success: true, meta: { changes: 1 } };
  }
}

class LeaseDatabase implements PlayerDatabase {
  prepare(query: string): PlayerDatabaseStatement {
    return new LeaseStatement(query);
  }

  async batch<T = unknown>(statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
    return statements.map(() => ({ success: true, meta: { changes: 1 } }));
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('the authenticated ticket boundary rejects a new queue ticket for a server-leased account', async () => {
  globalThis.fetch = async (input) => {
    assert.match(String(input), /accounts:lookup/);
    return Response.json({
      users: [{
        localId: 'ticket-lease-player',
        displayName: 'Lease Player',
        createdAt: '1700000000000',
        lastLoginAt: '1700000100000',
        providerUserInfo: [{ providerId: 'password' }],
      }],
    });
  };
  const env: PlayerApiEnv = {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_ROLLOUT_POLICY: JSON.stringify({
      version: 1,
      expiresAt: '2099-01-01T00:00:00.000Z',
      networkEnabled: true,
    }),
    PLAYER_REALTIME_URL: 'http://127.0.0.1:8790',
    REALTIME_TICKET_SECRET: 'test-ticket-secret-that-is-longer-than-thirty-two-characters',
    PLAYER_DB: new LeaseDatabase(),
  };
  const response = await issueRealtimeTicket({
    request: new Request('http://localhost:8788/api/player/network/ticket', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-id-token',
        'Content-Type': 'application/json',
        Origin: 'http://localhost:8788',
      },
      body: JSON.stringify({
        purpose: 'queue',
        target: 'match',
        mode: 'chess_casual',
        region: 'me',
      }),
    }),
    env,
  });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: 'Finish or recover the active match first.',
    code: 'active_match_in_progress',
  });
});
