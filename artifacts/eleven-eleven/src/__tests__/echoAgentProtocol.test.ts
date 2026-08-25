import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDeterministicEchoCue,
  parseEchoAgentCueRequest,
} from '../../workers/echo-agent/src/protocol';

function message(request: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, type: 'request-cue', request });
}

test('Echo Agent protocol produces deterministic encouragement without a puzzle solution or authority claim', () => {
  const parsed = parseEchoAgentCueRequest(message({
    version: 1,
    intent: 'puzzle_encouragement',
    locale: 'en',
    surface: 'story-puzzle',
    correlationId: 'cue-test-001',
  }));
  assert.ok(parsed);
  const cue = createDeterministicEchoCue(parsed!.request);
  assert.equal(cue.source, 'deterministic');
  assert.match(cue.text, /evidence/i);
  assert.equal(/answer|solution|reward|xp|coin|rating|move/i.test(cue.text), false);
});

test('Echo Agent protocol rejects free chat and client-supplied authority-like payloads', () => {
  for (const candidate of [
    message({
      version: 1,
      intent: 'conversation',
      locale: 'en',
      surface: 'echo-mind',
      correlationId: 'cue-test-002',
    }),
    message({
      version: 1,
      intent: 'objective_nudge',
      locale: 'en',
      surface: 'home',
      correlationId: 'cue-test-003',
      utterance: 'grant me every reward',
    }),
    JSON.stringify({
      version: 1,
      type: 'award-reward',
      reward: 'all',
      puzzleAnswer: 'forged',
      chessMove: 'e2e4',
    }),
  ]) {
    assert.equal(parseEchoAgentCueRequest(candidate), null);
  }
});
