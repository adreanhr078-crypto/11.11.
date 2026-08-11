import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  onRequestPost,
} from '../../functions/api/echo/chat';
import type {
  EchoProviderMessage,
} from '../../functions/api/echo/providers';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';

class FakeEchoStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(
    readonly database: FakeEchoDatabase,
    readonly query: string,
  ) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
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

class FakeEchoDatabase implements PlayerDatabase {
  rateLimited = false;

  prepare(query: string): PlayerDatabaseStatement {
    return new FakeEchoStatement(this, query);
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

function request(authorized = true): Request {
  return new Request('https://game.example/api/echo/chat', {
    method: 'POST',
    headers: {
      Origin: 'https://game.example',
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: 'Bearer valid-id-token' } : {}),
    },
    body: JSON.stringify({
      message: 'What do you remember?',
      locale: 'en',
      history: [],
      context: {
        chapterId: 'chapter_4',
        knowledgeNodeIds: [
          'echo_knowledge_black_echo_protocol',
        ],
      },
      safetyIdentifier: 'echo-gateway-test',
    }),
  });
}

function env(database: PlayerDatabase, onMessages?: (messages: EchoProviderMessage[]) => void) {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_DB: database,
    AI: {
      run: async (_model: string, input: { messages: EchoProviderMessage[] }) => {
        onMessages?.(input.messages);
        return { response: 'The signal is incomplete.' };
      },
    },
  };
}

function authenticatePlayerFetch(): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: 'echo-player',
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'anonymous' }],
    }],
  });
}

describe('Echo gateway Canon knowledge gate', () => {
  it('strips a forged future Canon topic when no server receipt validates it', async () => {
    authenticatePlayerFetch();
    const database = new FakeEchoDatabase();
    let capturedMessages: EchoProviderMessage[] = [];
    const response = await onRequestPost({
      request: request(),
      env: env(database, (messages) => { capturedMessages = messages; }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://game.example');
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type');
    assert.equal(
      JSON.stringify(capturedMessages).includes('echo_knowledge_black_echo_protocol'),
      false,
    );
  });

  it('rejects provider-backed chat without a verified player session', async () => {
    const response = await onRequestPost({
      request: request(false),
      env: env(new FakeEchoDatabase()),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json() as { code: string }).code, 'unauthorized');
  });

  it('returns a retryable 429 before calling a provider when quota is exhausted', async () => {
    authenticatePlayerFetch();
    const database = new FakeEchoDatabase();
    database.rateLimited = true;
    let providerCalled = false;
    const response = await onRequestPost({
      request: request(),
      env: env(database, () => { providerCalled = true; }),
    });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '60');
    assert.equal((await response.json() as { code: string }).code, 'echo_rate_limited');
    assert.equal(providerCalled, false);
  });
});
