import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { onRequestGet as bootstrapPlayer } from '../../functions/api/player/bootstrap';
import {
  onRequestGet as getSave,
  onRequestPut as putSave,
} from '../../functions/api/player/save';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;
const bootstrapProfiles = new Map<string, Record<string, unknown>>();

/** Bootstrap now intentionally crosses the D1 profile authority boundary.
 * Keep this narrow fake honest about that contract instead of omitting D1 from
 * the test environment and accidentally accepting a fallback to Firestore. */
class BootstrapAuthorityStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(readonly query: string) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    if (!this.query.includes('FROM player_profile_authority')) return null;
    return (bootstrapProfiles.get(String(this.values[0])) ?? null) as T | null;
  }

  async all<T>(): Promise<PlayerDatabaseResult<T>> {
    return { results: [], success: true };
  }

  async run<T>(): Promise<PlayerDatabaseResult<T>> {
    if (this.query.includes('INSERT INTO player_profile_authority')) {
      const [userId, subjectId, username, bio, avatarId, featured, createdAt, updatedAt] = this.values.map(String);
      bootstrapProfiles.set(userId, {
        user_id: userId,
        subject_id: subjectId,
        username,
        bio,
        avatar_id: avatarId,
        featured_achievement_ids_json: featured,
        created_at: createdAt,
        updated_at: updatedAt,
      });
    }
    return { success: true, meta: { changes: 1 } };
  }
}

const bootstrapAuthorityDatabase: PlayerDatabase = {
  prepare: (query) => new BootstrapAuthorityStatement(query),
  async batch<T>(statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
    return Promise.all(statements.map((statement) => statement.run<T>()));
  },
};

const env: PlayerApiEnv = {
  FIREBASE_PROJECT_ID: 'eleven-test',
  FIREBASE_WEB_API_KEY: 'web-api-key',
  PLAYER_DB: bootstrapAuthorityDatabase,
};

function authenticatedRequest(
  path: string,
  init?: RequestInit,
): Request {
  return new Request(`https://game.example${path}`, {
    ...init,
    headers: {
      Authorization: 'Bearer valid-id-token',
      'Content-Type': 'application/json',
      Origin: 'https://game.example',
      ...init?.headers,
    },
  });
}

function lookupResponse(): Response {
  return Response.json({
    users: [{
      localId: 'player-123',
      displayName: 'Echo Runner',
      email: 'player@example.com',
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'password' }],
    }],
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  bootstrapProfiles.clear();
});

describe('cloud player gateway', () => {
  it('rejects save access without a Firebase bearer token', async () => {
    const response = await getSave({
      request: new Request('https://game.example/api/player/save'),
      env,
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json() as { code: string }).code, 'unauthorized');
  });

  it('bootstraps the D1 identity and only reads the dedicated cloud-save path', async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('accounts:lookup')) return lookupResponse();
      assert.match(url, /documents\/players\/player-123\/saves\/main$/);
      return Response.json({}, { status: 404 });
    };

    const response = await bootstrapPlayer({
      request: authenticatedRequest('/api/player/bootstrap'),
      env,
    });
    const payload = await response.json() as {
      profile: { uid: string };
      save: unknown;
    };

    assert.equal(response.status, 200);
    assert.equal(payload.profile.uid, 'player-123');
    assert.equal(payload.save, null);
    assert.equal(requestedUrls.length, 2);
    assert.equal(requestedUrls.some((url) => /documents\/players\/player-123(?:\?|$)/.test(url)), false);
  });

  it('creates the first cloud save at revision one', async () => {
    let writeUrl = '';
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('accounts:lookup')) return lookupResponse();
      if (!init?.method) return Response.json({}, { status: 404 });

      writeUrl = url;
      const body = JSON.parse(String(init.body)) as {
        fields: Record<string, { integerValue?: string }>;
      };
      assert.equal(body.fields.revision.integerValue, '1');
      return Response.json({
        fields: {
          revision: { integerValue: '1' },
          updatedAt: { timestampValue: '2026-08-06T12:00:00.000Z' },
        },
      });
    };

    const response = await putSave({
      request: authenticatedRequest('/api/player/save', {
        method: 'PUT',
        body: JSON.stringify({
          saveVersion: 18,
          baseRevision: 0,
          payload: { currency: 20 },
        }),
      }),
      env,
    });
    const payload = await response.json() as {
      save: { revision: number };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.save.revision, 1);
    assert.match(writeUrl, /currentDocument\.exists=false/);
    assert.match(writeUrl, /documents\/players\/player-123\/saves\/main/);
  });

  it('returns a conflict before writing over a newer revision', async () => {
    let writes = 0;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('accounts:lookup')) return lookupResponse();
      if (init?.method === 'PATCH') writes += 1;
      return Response.json({
        fields: {
          revision: { integerValue: '4' },
          updatedAt: { timestampValue: '2026-08-06T12:00:00.000Z' },
          payloadJson: { stringValue: '{}' },
          saveVersion: { integerValue: '18' },
        },
        updateTime: '2026-08-06T12:00:00.000Z',
      });
    };

    const response = await putSave({
      request: authenticatedRequest('/api/player/save', {
        method: 'PUT',
        body: JSON.stringify({
          saveVersion: 18,
          baseRevision: 3,
          payload: { currency: 20 },
        }),
      }),
      env,
    });
    const payload = await response.json() as {
      code: string;
      currentRevision: number;
    };

    assert.equal(response.status, 409);
    assert.equal(payload.code, 'save_conflict');
    assert.equal(payload.currentRevision, 4);
    assert.equal(writes, 0);
  });
});
