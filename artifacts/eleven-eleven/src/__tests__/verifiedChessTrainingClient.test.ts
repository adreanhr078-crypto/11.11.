import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseNetworkSnapshot,
  parseVerifiedChessTraining,
} from '../infrastructure/echo-network/echoNetworkApi';

function activeTraining(overrides: Record<string, unknown> = {}) {
  return {
    protocolVersion: 1,
    training: 'chess',
    session: {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'active',
      version: 0,
      expiresAt: '2099-01-01T00:00:00.000Z',
      stepIndex: 0,
      step: 'develop-a-knight',
      goal: 'Develop a knight toward the centre.',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      completedAt: null,
      ...overrides,
    },
  };
}

describe('verified chess training client contract', () => {
  it('accepts a server-issued active board but never a client FEN submit shape', () => {
    const parsed = parseVerifiedChessTraining(activeTraining());
    assert.equal(parsed?.session.step, 'develop-a-knight');
    assert.ok(parsed?.session.fen);
    assert.equal(parseVerifiedChessTraining({
      ...activeTraining(),
      session: { ...activeTraining().session, id: 'not-a-session' },
    }), null);
  });

  it('rejects inconsistent terminal and active snapshots rather than rendering a false unlock', () => {
    assert.equal(parseVerifiedChessTraining(activeTraining({ step: null })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ stepIndex: 1 })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ status: 'completed', step: null, fen: undefined, completedAt: null })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ status: 'expired', step: null, fen: undefined })), null);
  });

  it('fails closed when server version fields are not real safe integers', () => {
    assert.equal(parseVerifiedChessTraining(activeTraining({ version: '0' })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ stepIndex: '0' })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ version: -1 })), null);
    assert.equal(parseVerifiedChessTraining(activeTraining({ stepIndex: 4 })), null);
  });

  it('fails closed when a Network response claims Ranked without its authoritative prerequisites', () => {
    const invalid = parseNetworkSnapshot({
      eligibility: {
        chessTrainingCompleted: false,
        casualChessCompleted: 0,
        rankedChessUnlocked: true,
        coopTrainingCompleted: false,
        communityRulesAccepted: false,
        ageGateConfirmed: false,
      },
      ratings: [], recentMatches: [], cosmetics: [], seasonProgress: [], characterBonds: [],
    });
    assert.equal(invalid, null);
  });
});
