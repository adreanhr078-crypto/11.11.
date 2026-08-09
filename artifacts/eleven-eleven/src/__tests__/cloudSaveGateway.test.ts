import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { onRequestGet as bootstrapPlayer } from '../../functions/api/player/bootstrap';
import {
  onRequestGet as getSave,
  onRequestPut as putSave,
} from '../../functions/api/player/save';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;
const env: PlayerApiEnv = {
  FIREBASE_PROJECT_ID: 'eleven-test',
  FIREBASE_WEB_API_KEY: 'web-api-key',
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

  it('bootstraps only the player path proven by Firebase', async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('accounts:lookup')) return lookupResponse();
      if (init?.method === 'PATCH') {
        assert.match(url, /documents\/players\/player-123(?:\?|$)/);
        assert.equal(
          new Headers(init.headers).get('Authorization'),
          'Bearer valid-id-token',
        );
        return Response.json({ updateTime: '2026-08-06T12:00:00.000Z' });
      }
      if (url.endsWith('/documents/players/player-123')) {
        return Response.json({}, { status: 404 });
      }
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
    assert.equal(requestedUrls.length, 4);
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
