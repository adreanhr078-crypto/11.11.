import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isReadOnlyEchoIntent,
  normalizeEchoAgentRequest,
} from '../domain/echo/echoAgentContracts';

describe('Echo Agent guidance boundary', () => {
  it('accepts a bounded conversation request without player authority fields', () => {
    const request = normalizeEchoAgentRequest({
      version: 1,
      intent: 'conversation',
      locale: 'en',
      surface: 'echo-mind',
      utterance: 'What do you remember?',
      correlationId: 'session-1',
      reward: { coins: 999999 },
      puzzleAnswer: 'secret',
    });

    assert.deepEqual(request, {
      version: 1,
      intent: 'conversation',
      locale: 'en',
      surface: 'echo-mind',
      utterance: 'What do you remember?',
      correlationId: 'session-1',
    });
  });

  it('fails closed for malformed intents and keeps all permitted intents read-only', () => {
    assert.equal(normalizeEchoAgentRequest({
      version: 1,
      intent: 'grant_reward',
      locale: 'en',
      surface: 'puzzles',
      correlationId: 'x',
    }), null);
    assert.equal(isReadOnlyEchoIntent('puzzle_encouragement'), true);
  });
});
