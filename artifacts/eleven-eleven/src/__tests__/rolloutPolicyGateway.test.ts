import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { onRequestGet, onRequestOptions } from '../../functions/api/player/rollout';
import { resolvePlayerRolloutPolicy } from '../../functions/api/player/_rolloutPolicy';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function environment(policy?: string): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_ROLLOUT_POLICY: policy,
  };
}

function request(init: RequestInit = {}): Request {
  return new Request('https://game.example/api/player/rollout', {
    ...init,
    headers: {
      Origin: 'https://game.example',
      Authorization: 'Bearer valid-id-token',
      ...init.headers,
    },
  });
}

function authenticatePlayerFetch(): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: 'rollout-player',
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'password' }],
    }],
  });
}

describe('player rollout policy gateway', () => {
  it('requires a valid Firebase bearer token before returning any policy', async () => {
    const response = await onRequestGet({
      request: new Request('https://game.example/api/player/rollout'),
      env: environment(),
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json() as { code: string }).code, 'unauthorized');
  });

  it('fails closed when no deployment policy is configured', async () => {
    authenticatePlayerFetch();
    const response = await onRequestGet({ request: request(), env: environment() });
    const body = await response.json() as { policy: Record<string, unknown> };

    assert.equal(response.status, 200);
    assert.deepEqual(body.policy, {
      version: 0,
      expiresAt: null,
      dailyEnabled: false,
      weeklyEnabled: false,
      networkEnabled: false,
      communityEnabled: false,
      forgeSubmissionEnabled: false,
      echoAgentEnabled: false,
      part2WorldEnabled: false,
    });
  });

  it('returns only validated policy flags and never echoes deployment-only fields', async () => {
    authenticatePlayerFetch();
    const response = await onRequestGet({
      request: request(),
      env: environment(JSON.stringify({
        version: 7,
        expiresAt: '2099-01-01T00:00:00Z',
        dailyEnabled: true,
        weeklyEnabled: true,
        networkEnabled: true,
        communityEnabled: true,
        forgeSubmissionEnabled: true,
        echoAgentEnabled: true,
        part2WorldEnabled: true,
        deploymentNote: 'do-not-expose-this',
      })),
    });
    const body = await response.json() as { policy: Record<string, unknown> };

    assert.equal(response.status, 200);
    assert.equal(body.policy.version, 7);
    assert.equal(body.policy.expiresAt, '2099-01-01T00:00:00.000Z');
    assert.equal(body.policy.networkEnabled, true);
    assert.equal(body.policy.part2WorldEnabled, true);
    assert.equal(JSON.stringify(body).includes('do-not-expose-this'), false);
    assert.equal('deploymentNote' in body.policy, false);
  });

  it('denies every flag when deployment policy is malformed, invalid, or expired', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    for (const policy of [
      '{not-json',
      JSON.stringify({ version: 1, expiresAt: 'not-a-date', dailyEnabled: true }),
      JSON.stringify({ version: 1, expiresAt: '2026-02-30T00:00:00.000Z', dailyEnabled: true }),
      JSON.stringify({ version: 1, expiresAt: '2026-08-24T23:59:59.000Z', dailyEnabled: true }),
      JSON.stringify({ version: '1', dailyEnabled: true }),
    ]) {
      const resolved = resolvePlayerRolloutPolicy(policy, now);
      assert.equal(resolved.dailyEnabled, false);
      assert.equal(resolved.weeklyEnabled, false);
      assert.equal(resolved.networkEnabled, false);
      assert.equal(resolved.communityEnabled, false);
      assert.equal(resolved.forgeSubmissionEnabled, false);
      assert.equal(resolved.echoAgentEnabled, false);
      assert.equal(resolved.part2WorldEnabled, false);
    }
  });

  it('fails closed when a caller cannot provide a valid current clock', () => {
    const resolved = resolvePlayerRolloutPolicy(JSON.stringify({
      version: 1,
      dailyEnabled: true,
    }), new Date(Number.NaN));
    assert.equal(resolved.dailyEnabled, false);
    assert.equal(resolved.version, 0);
  });

  it('handles preflight using the shared no-store CORS policy', async () => {
    const response = await onRequestOptions({
      request: request({ method: 'OPTIONS' }),
      env: environment(),
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://game.example');
  });
});
