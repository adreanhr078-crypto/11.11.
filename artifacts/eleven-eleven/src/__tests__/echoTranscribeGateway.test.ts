import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  onRequestOptions,
  onRequestPost,
} from '../../functions/api/echo/transcribe';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';

class FakeStatement implements PlayerDatabaseStatement {
  constructor(readonly database: FakeDatabase) {}

  bind(): PlayerDatabaseStatement {
    return this;
  }

  first<T>(): Promise<T | null> {
    return Promise.resolve(null);
  }

  all<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve({ results: [], success: true });
  }

  run<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve({ success: true, meta: { changes: 1 } });
  }
}

class FakeDatabase implements PlayerDatabase {
  rateLimited = false;

  prepare(): PlayerDatabaseStatement {
    return new FakeStatement(this);
  }

  async batch<T = unknown>(
    statements: PlayerDatabaseStatement[],
  ): Promise<PlayerDatabaseResult<T>[]> {
    if (this.rateLimited) throw new Error('echo minute rate limit exceeded');
    return Promise.all(statements.map((statement) => statement.run<T>()));
  }
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function env(database: PlayerDatabase) {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_DB: database,
    GEMINI_API_KEY: 'test-key',
  };
}

function request(
  body: BodyInit,
  authorized = true,
  headers: HeadersInit = {},
): Request {
  return new Request('https://game.example/api/echo/transcribe?locale=en', {
    method: 'POST',
    headers: {
      Origin: 'https://game.example',
      'Content-Type': 'audio/wav',
      ...(authorized ? { Authorization: 'Bearer valid-id-token' } : {}),
      ...headers,
    },
    body,
  });
}

function authenticatePlayerFetch(): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: 'voice-player',
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'anonymous' }],
    }],
  });
}

describe('Echo voice gateway security boundary', () => {
  it('advertises the authorization header for cross-origin preflight', async () => {
    const response = await onRequestOptions({
      request: request(new Uint8Array([1])),
      env: env(new FakeDatabase()),
    });
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get('Access-Control-Allow-Headers'),
      'Authorization, Content-Type',
    );
  });

  it('requires a verified player session before reading audio', async () => {
    const response = await onRequestPost({
      request: request(new Uint8Array([1]), false),
      env: env(new FakeDatabase()),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json() as { code: string }).code, 'unauthorized');
  });

  it('stops an undeclared oversized stream at the eight-megabyte boundary', async () => {
    authenticatePlayerFetch();
    const response = await onRequestPost({
      request: request(new Uint8Array(8 * 1024 * 1024 + 1)),
      env: env(new FakeDatabase()),
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json() as { code: string }).code, 'audio_too_large');
  });

  it('returns 429 before any transcription provider call when quota is exhausted', async () => {
    authenticatePlayerFetch();
    const database = new FakeDatabase();
    database.rateLimited = true;
    const response = await onRequestPost({
      request: request(new Uint8Array([1, 2, 3])),
      env: env(database),
    });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '60');
    assert.equal((await response.json() as { code: string }).code, 'echo_rate_limited');
  });
});
