import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(...segments: string[]): string {
  return readFileSync(resolve(process.cwd(), 'src', ...segments), 'utf8');
}

describe('Stage 3 Play Together disclosure', () => {
  it('keeps Network focused on the entitled Chess and Co-op journey', () => {
    const screen = source('features', 'echo-network', 'EchoNetworkScreen.tsx');

    assert.match(screen, /experienceEntitlements\.networkModes/);
    assert.match(screen, /visibleTabs/);
    assert.match(screen, /PLAY TOGETHER/);
    assert.doesNotMatch(screen, /ActivityDirectorPanel/);
    assert.doesNotMatch(screen, /SeasonPanel/);
    assert.doesNotMatch(screen, /SignalBoardPanel/);
    assert.doesNotMatch(screen, /setRequestedPuzzleMode/);
  });

  it('does not publish ranked or anomaly queues before the entitled gate', () => {
    const chess = source('features', 'echo-network', 'ContractChessPanel.tsx');

    assert.match(chess, /allowRanked = false/);
    assert.match(chess, /\{allowRanked && <>/);
    assert.doesNotMatch(chess, /queue\('chess_anomaly'\)/);
  });

  it('keeps the verified chess prerequisite separate from the local Echo duel', () => {
    const chess = source('features', 'echo-network', 'ContractChessPanel.tsx');

    assert.match(chess, /function VerifiedChessTraining/);
    assert.match(chess, /startOrResumeVerifiedChessTraining/);
    assert.match(chess, /submitVerifiedChessTrainingMove/);
    assert.match(chess, /onTrainingCertified/);
    assert.doesNotMatch(chess, /completeNetworkTraining\('chess'\)/);
  });
});
