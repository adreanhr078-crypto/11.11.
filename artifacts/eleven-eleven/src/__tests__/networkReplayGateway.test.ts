import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  onRequestGet as getReplay,
} from '../../functions/api/player/network/replay';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerReplayBucket } from '../../functions/api/player/_shared';
import type { MatchReceipt } from '../domain/echo-network/contracts';

const originalFetch = globalThis.fetch;
const MATCH_ID = 'match_replay_1111';
const RECEIPT: MatchReceipt = {
  version: 1,
  receiptId: '73ed42fa-534f-42c6-9655-7e5b5be6efaf',
  matchId: MATCH_ID,
  mode: 'chess_casual',
  context: { caseId: null, variant: 'standard' },
  status: 'completed',
  participants: [
    { uid: 'replay-owner', outcome: 'win', participationMs: 120_000 },
    { uid: 'replay-opponent', outcome: 'loss', participationMs: 120_000 },
  ],
  winnerUid: 'replay-owner',
  durationMs: 120_000,
  rewards: [
    { uid: 'replay-owner', rewardKey: 'network:match_replay_1111:replay-owner:v1', xpAmount: 45, cosmeticIds: [] },
    { uid: 'replay-opponent', rewardKey: 'network:match_replay_1111:replay-opponent:v1', xpAmount: 30, cosmeticIds: [] },
  ],
  completedAt: '2026-08-14T11:11:00.000Z',
  integrityHash: '0123456789abcdef0123456789abcdef',
};

class ReplayStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(readonly database: ReplayDatabase, readonly query: string) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
    return this;
  }

  first<T>(): Promise<T | null> {
    return Promise.resolve(this.database.first(this) as T | null);
  }

  all<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve({ results: [], success: true });
  }

  run<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve({ success: true, meta: { changes: 0 } });
  }
}

class ReplayDatabase implements PlayerDatabase {
  constructor(private readonly ownerUid = 'replay-owner') {}

  prepare(query: string): PlayerDatabaseStatement {
    return new ReplayStatement(this, query);
  }

  async batch<T = unknown>(): Promise<PlayerDatabaseResult<T>[]> {
    return [];
  }

  first(statement: ReplayStatement): Record<string, unknown> | null {
    const normalized = statement.query.replace(/\s+/g, ' ').trim();
    if (!normalized.includes('FROM network_match_receipts')) {
      throw new Error(`Unhandled fake query: ${normalized}`);
    }
    const [matchId, uid] = statement.values;
    if (matchId !== MATCH_ID || uid !== this.ownerUid) return null;
    return { mode: RECEIPT.mode, receipt_json: JSON.stringify(RECEIPT) };
  }
}

function replayBucket(value: unknown, requested: string[]): PlayerReplayBucket {
  const serialized = JSON.stringify(value);
  return {
    async get(key) {
      requested.push(key);
      return {
        size: new TextEncoder().encode(serialized).byteLength,
        text: async () => serialized,
      };
    },
  };
}

function authenticateAs(uid: string): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: uid,
      createdAt: '1700000000000',
      lastLoginAt: '1700000001000',
      providerUserInfo: [{ providerId: 'anonymous' }],
    }],
  });
}

function request(matchId = MATCH_ID): Request {
  return new Request(`https://game.example/api/player/network/replay?matchId=${encodeURIComponent(matchId)}`, {
    headers: { Origin: 'https://game.example', Authorization: 'Bearer valid-token' },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('protected Echo Network replay gateway', () => {
  it('returns only a participant-owned replay whose receipt and R2 object agree', async () => {
    authenticateAs('replay-owner');
    const requested: string[] = [];
    const response = await getReplay({
      request: request(),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_DB: new ReplayDatabase(),
        REPLAYS: replayBucket({
          version: 1,
          receiptId: RECEIPT.receiptId,
          matchId: RECEIPT.matchId,
          moves: [],
        }, requested),
      },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(requested, ['chess/match_replay_1111.json']);
    await assert.doesNotReject(async () => {
      const body = await response.json() as { receipt: MatchReceipt; replay: { matchId: string } };
      assert.equal(body.receipt.receiptId, RECEIPT.receiptId);
      assert.equal(body.replay.matchId, MATCH_ID);
    });
  });

  it('does not reveal a replay to a player without a participant receipt', async () => {
    authenticateAs('outside-player');
    const requested: string[] = [];
    const response = await getReplay({
      request: request(),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_DB: new ReplayDatabase(),
        REPLAYS: replayBucket({}, requested),
      },
    });
    assert.equal(response.status, 404);
    assert.deepEqual(requested, []);
  });

  it('rejects a replay that is not tied to the immutable receipt', async () => {
    authenticateAs('replay-owner');
    const response = await getReplay({
      request: request(),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_DB: new ReplayDatabase(),
        REPLAYS: replayBucket({
          version: 1,
          receiptId: 'f857231d-635b-48a1-8ae9-8e1eb913a857',
          matchId: MATCH_ID,
          moves: [],
        }, []),
      },
    });
    assert.equal(response.status, 502);
    await assert.doesNotReject(async () => {
      assert.equal((await response.json() as { code: string }).code, 'replay_invalid');
    });
  });
});
