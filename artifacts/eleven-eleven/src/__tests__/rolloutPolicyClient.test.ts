import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { parseRolloutPolicy } from '../infrastructure/player-experience/rolloutPolicyApi';

const validPolicy = {
  version: 4,
  expiresAt: '2099-01-01T00:00:00.000Z',
  dailyEnabled: true,
  weeklyEnabled: false,
  networkEnabled: true,
  communityEnabled: false,
  forgeSubmissionEnabled: false,
  echoAgentEnabled: true,
  part2WorldEnabled: false,
};

describe('client rollout-policy boundary', () => {
  it('accepts only a complete policy shape from the authenticated endpoint', () => {
    assert.deepEqual(parseRolloutPolicy(validPolicy), validPolicy);
    assert.equal(parseRolloutPolicy({ ...validPolicy, networkEnabled: 'true' }), null);
    assert.equal(parseRolloutPolicy({ ...validPolicy, expiresAt: 123 }), null);
    assert.equal(parseRolloutPolicy({ ...validPolicy, expiresAt: '2099-02-30T00:00:00.000Z' }), null);
    assert.equal(parseRolloutPolicy({ ...validPolicy, expiresAt: '2099-01-01T00:00:00+00:00' }), null);
    assert.equal(parseRolloutPolicy({ ...validPolicy, version: 0 }), null);
    assert.equal(parseRolloutPolicy({ ...validPolicy, forgeSubmissionEnabled: undefined }), null);
  });

  it('loads the policy with an expected UID and keeps optional UI closed while it is absent', () => {
    const api = readFileSync(resolve(process.cwd(), 'src/infrastructure/player-experience/rolloutPolicyApi.ts'), 'utf8');
    const shell = readFileSync(resolve(process.cwd(), 'src/app/shell/ApplicationShell.tsx'), 'utf8');
    const entitlements = readFileSync(resolve(process.cwd(), 'src/application/player-journey/playerExperienceEntitlements.ts'), 'utf8');

    assert.match(api, /getCurrentAuthSession\(expectedUid\)/);
    assert.match(api, /fetchPlayerRequest\([^,]+, \{[\s\S]*Authorization/);
    assert.match(shell, /fetchPlayerRolloutPolicy\(authUser\.uid\)/);
    assert.match(shell, /setRolloutPolicy\(null\)/);
    assert.match(entitlements, /dailyEnabled: false/);
    assert.match(entitlements, /networkEnabled: false/);
  });
});
