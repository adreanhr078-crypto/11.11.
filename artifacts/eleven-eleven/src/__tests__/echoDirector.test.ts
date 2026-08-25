import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveEchoCue,
  toEchoEventEnvelope,
} from '../domain/echo/echoDirector';

test('Echo Director encourages a rejected puzzle attempt without exposing an answer', () => {
  const cue = resolveEchoCue({
    id: 'rejected:puzzle_003',
    kind: 'puzzle-attempt-rejected',
    occurredAt: 1,
    authority: 'local-ui',
    payloadVersion: 1,
  }, 'en', 'solve');

  assert.equal(cue.gesture, 'encourage');
  assert.equal(cue.suggestedRoute, 'puzzles');
  assert.equal(/piece-\d|correct|solution|answer/i.test(cue.text), false);
});

test('Echo Director reacts to a verified reward but never describes a new grant', () => {
  const cue = resolveEchoCue({
    id: 'main-puzzle-solved:puzzle_001',
    kind: 'main-puzzle-solved',
    occurredAt: 1,
    authority: 'server-receipt',
    payloadVersion: 1,
  }, 'en');

  assert.equal(cue.expression, 'celebrating');
  assert.equal(cue.suggestedRoute, 'memories');
  assert.equal(/coins|xp|grant|award/i.test(cue.text), false);
});

test('Story activity conversion preserves the source but adds no authority payload', () => {
  const event = toEchoEventEnvelope({
    kind: 'hint-used',
    puzzleId: 'puzzle_001',
    sourceId: 'receipt_1',
    occurredAt: 42,
  });

  assert.deepEqual(event, {
    id: 'hint-used:puzzle_001',
    kind: 'hint-used',
    sourceId: 'receipt_1',
    occurredAt: 42,
    authority: 'server-receipt',
    payloadVersion: 1,
  });
});
