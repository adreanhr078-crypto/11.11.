import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { onRequestGet as getLive } from '../../functions/api/player/live';
import { onRequestPost as postLiveAction } from '../../functions/api/player/live/action';
import { onRequestGet as getNetwork } from '../../functions/api/player/network';
import { onRequestGet as getCommunity } from '../../functions/api/player/network/community';
import {
  onRequestGet as getForge,
  onRequestPost as postForge,
} from '../../functions/api/player/network/forge';
import { onRequestGet as getReplay } from '../../functions/api/player/network/replay';
import { onRequestPost as postRules } from '../../functions/api/player/network/rules';
import { onRequestPost as postSocial } from '../../functions/api/player/network/social';
import { onRequestPost as postTicket } from '../../functions/api/player/network/ticket';
import { onRequestPost as postTraining } from '../../functions/api/player/network/training';
import type { PlayerApiContext, PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authenticatedRequest(path: string, init: RequestInit = {}): Request {
  return new Request(`https://game.example/api/player/${path}`, {
    ...init,
    headers: {
      Authorization: 'Bearer valid-id-token',
      Origin: 'https://game.example',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

function gatedEnvironment(policy?: string): { env: PlayerApiEnv; databaseReads: () => number } {
  let databaseReads = 0;
  const env: PlayerApiEnv = {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    ...(policy === undefined ? {} : { PLAYER_ROLLOUT_POLICY: policy }),
  };
  Object.defineProperty(env, 'PLAYER_DB', {
    enumerable: true,
    get() {
      databaseReads += 1;
      throw new Error('A disabled rollout must not reach D1.');
    },
  });
  return { env, databaseReads: () => databaseReads };
}

function authenticatePlayerFetch(): void {
  globalThis.fetch = async (input) => {
    assert.match(String(input), /accounts:lookup/);
    return Response.json({
      users: [{
        localId: 'rollout-gated-player',
        createdAt: '1700000000000',
        lastLoginAt: '1700000100000',
        providerUserInfo: [{ providerId: 'password' }],
      }],
    });
  };
}

async function assertRolloutDisabled(
  handler: (context: PlayerApiContext) => Promise<Response>,
  request: Request,
  policy?: string,
): Promise<void> {
  authenticatePlayerFetch();
  const { env, databaseReads } = gatedEnvironment(policy);
  const response = await handler({ request, env });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: 'This experience is not available yet.',
    code: 'rollout_disabled',
  });
  assert.equal(databaseReads(), 0, 'a disabled rollout must not create, read, or mutate player state');
}

describe('authoritative rollout action gates', () => {
  it('fails closed before D1 for every Network entry point', async () => {
    await assertRolloutDisabled(getNetwork, authenticatedRequest('network'));
    await assertRolloutDisabled(postTicket, authenticatedRequest('network/ticket', {
      method: 'POST',
      body: JSON.stringify({
        purpose: 'queue', target: 'match', mode: 'chess_casual', region: 'me',
      }),
    }));
    await assertRolloutDisabled(postTraining, authenticatedRequest('network/training', {
      method: 'POST',
      body: JSON.stringify({ training: 'chess', version: 1 }),
    }));
    await assertRolloutDisabled(getReplay, authenticatedRequest('network/replay?matchId=match_rollout_111'));
  });

  it('does not treat the Community flag as permission for Play Together', async () => {
    await assertRolloutDisabled(postTicket, authenticatedRequest('network/ticket', {
      method: 'POST',
      body: JSON.stringify({
        purpose: 'queue', target: 'match', mode: 'chess_casual', region: 'me',
      }),
    }), JSON.stringify({
      version: 1,
      expiresAt: '2099-01-01T00:00:00.000Z',
      communityEnabled: true,
    }));
  });

  it('gates Community, social state, and Forge before they can create a profile or submission', async () => {
    await assertRolloutDisabled(getCommunity, authenticatedRequest('network/community'));
    await assertRolloutDisabled(postRules, authenticatedRequest('network/rules', {
      method: 'POST',
      body: JSON.stringify({ rulesVersion: 1, confirmsAge16Plus: true }),
    }));
    await assertRolloutDisabled(postSocial, authenticatedRequest('network/social', {
      method: 'POST',
      body: JSON.stringify({
        action: 'report', targetType: 'post', targetId: 'post_rollout_111', reason: 'spam', detail: '',
      }),
    }));
    await assertRolloutDisabled(getForge, authenticatedRequest('network/forge'));
    await assertRolloutDisabled(postForge, authenticatedRequest('network/forge', {
      method: 'POST',
      body: JSON.stringify({
        locale: 'en',
        title: 'Closed system trace',
        mechanic: 'pattern',
        prompt: 'Find the isolated signal without publishing any player content.',
        options: ['A', 'B'],
        answerIndex: 0,
        canonAssetId: null,
      }),
    }), JSON.stringify({
      version: 1,
      expiresAt: '2099-01-01T00:00:00.000Z',
      communityEnabled: true,
    }));
  });

  it('requires the specific Daily or Weekly flag before a live action can write a draft, hint, or reward', async () => {
    await assertRolloutDisabled(postLiveAction, authenticatedRequest('live/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete-daily', answer: 'not-evaluated' }),
    }));
    await assertRolloutDisabled(postLiveAction, authenticatedRequest('live/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete-weekly-stage', stageIndex: 0, answer: 'not-evaluated' }),
    }));
    await assertRolloutDisabled(postLiveAction, authenticatedRequest('live/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'save-daily', draft: { answer: 'not-evaluated' } }),
    }), JSON.stringify({
      version: 1,
      expiresAt: '2099-01-01T00:00:00.000Z',
      weeklyEnabled: true,
    }));
    await assertRolloutDisabled(postLiveAction, authenticatedRequest('live/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'save-weekly', draft: { answer: 'not-evaluated' } }),
    }), JSON.stringify({
      version: 1,
      expiresAt: '2099-01-01T00:00:00.000Z',
      dailyEnabled: true,
    }));
  });

  it('does not materialize a Daily or Weekly snapshot while every live mode is closed', async () => {
    await assertRolloutDisabled(getLive, authenticatedRequest('live'));
  });
});
