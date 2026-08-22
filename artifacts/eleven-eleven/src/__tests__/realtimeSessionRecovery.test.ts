import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { resolve } from 'node:path';
import {
  leaveCommandForState,
  isCurrentRealtimeConnectionIntent,
  isRecoverableMatchState,
  parsePersistedMatchSession,
  realtimeErrorMessage,
  shouldPersistMatchSession,
} from '../features/echo-network/useRealtimeRoom';

describe('Realtime match reload recovery', () => {
  it('never lets a superseded or explicitly cancelled ticket open a room', () => {
    assert.equal(isCurrentRealtimeConnectionIntent(4, 4, false), true);
    assert.equal(isCurrentRealtimeConnectionIntent(4, 5, false), false);
    assert.equal(isCurrentRealtimeConnectionIntent(4, 4, true), false);

    const source = readFileSync(
      resolve(process.cwd(), 'src/features/echo-network/useRealtimeRoom.ts'),
      'utf8',
    );
    assert.match(source, /const connectionIntentRef = useRef\(0\);/);
    assert.match(source, /connectionIntentRef\.current \+= 1;/);
    assert.match(source, /const joinQueue = useCallback[\s\S]*?const intent = connectionIntentRef\.current;/);
    assert.match(source, /const joinDirect = useCallback[\s\S]*?const intent = connectionIntentRef\.current;/);
    assert.match(source, /if \(!isConnectionIntentCurrent\(intent\)[\s\S]*?stateRef\.current\.mode !== input\.mode\) return;/);
  });

  it('keeps only a minimal match locator and rejects tampered browser state', () => {
    assert.deepEqual(
      parsePersistedMatchSession(JSON.stringify({
        version: 1,
        target: 'match',
        mode: 'chess_casual',
        roomId: 'match_12345678-1234-1234-1234-123456789abc',
      })),
      {
        version: 1,
        target: 'match',
        mode: 'chess_casual',
        roomId: 'match_12345678-1234-1234-1234-123456789abc',
      },
    );
    assert.equal(parsePersistedMatchSession(JSON.stringify({
      version: 1,
      target: 'party',
      mode: 'chess_casual',
      roomId: 'match_12345678-1234-1234-1234-123456789abc',
    })), null);
    assert.equal(parsePersistedMatchSession(JSON.stringify({
      version: 1,
      target: 'match',
      mode: 'chess_casual',
      roomId: 'not-a-match',
    })), null);
    assert.equal(parsePersistedMatchSession('{not-json'), null);
  });

  it('re-issues a membership-checked ticket instead of persisting authority state', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/echo-network/useRealtimeRoom.ts'),
      'utf8',
    );

    assert.match(source, /ACTIVE_MATCH_RESUME_KEY/);
    assert.match(source, /purpose: 'connect',[\s\S]*target: 'match'/);
    assert.match(source, /issueNetworkTicket\(/);
    assert.doesNotMatch(source, /sessionStorage\.setItem\([^\n]+ticket/);
    assert.doesNotMatch(source, /sessionStorage\.setItem\([^\n]+snapshot/);
    assert.doesNotMatch(source, /sessionStorage\.setItem\([^\n]+receipt/);
  });

  it('keeps a recoverable locator when a terminal snapshot closes before its receipt, but never retries a stored receipt as a reward action', () => {
    const recoverable = {
      target: 'match' as const,
      mode: 'chess_casual' as const,
      roomId: 'match_12345678-1234-1234-1234-123456789abc',
      phase: 'error' as const,
      receipt: null,
      settlement: 'none' as const,
    };

    assert.equal(shouldPersistMatchSession(recoverable), true);
    assert.equal(isRecoverableMatchState(recoverable), true);
    assert.equal(isRecoverableMatchState({ ...recoverable, receipt: {} as never }), false);
    assert.equal(isRecoverableMatchState({ ...recoverable, phase: 'completed' }), false);
    const waitingForReceipt = {
      ...recoverable,
      phase: 'settling' as const,
      settlement: 'awaiting-receipt' as const,
    };
    assert.equal(shouldPersistMatchSession(waitingForReceipt), true);
    assert.equal(isRecoverableMatchState(waitingForReceipt), true);
    assert.equal(shouldPersistMatchSession({
      ...waitingForReceipt,
      receipt: {} as never,
      settlement: 'pending-server-finalization',
    }), false);
    assert.equal(isRecoverableMatchState({
      ...waitingForReceipt,
      receipt: {} as never,
      settlement: 'pending-server-finalization',
    }), false);
  });

  it('sends explicit leave intent only for Chess or a private party, never a Co-op match', () => {
    assert.equal(leaveCommandForState({
      phase: 'active', target: 'party', mode: 'coop_breach',
    }), 'resign');
    assert.equal(leaveCommandForState({
      phase: 'active', target: 'match', mode: 'chess_casual',
    }), 'resign');
    assert.equal(leaveCommandForState({
      phase: 'active', target: 'match', mode: 'coop_breach',
    }), null);
    assert.equal(leaveCommandForState({
      phase: 'awaiting-snapshot', target: 'party', mode: 'coop_breach',
    }), null);

    const source = readFileSync(
      resolve(process.cwd(), 'src/features/echo-network/useRealtimeRoom.ts'),
      'utf8',
    );

    assert.match(source, /leaveCommandForState\(stateRef\.current\)/);
    assert.match(source, /if \(leaveCommand\) sendCommand\(leaveCommand\);\s+closeSocket\(\);/);
    assert.match(source, /writePersistedMatchSession\(null\)/);
  });

  it('retries the same membership-checked room and localizes Worker error codes', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/echo-network/useRealtimeRoom.ts'),
      'utf8',
    );

    assert.match(source, /const retryExistingMatch = useCallback/);
    assert.match(source, /target: 'match',[\s\S]*roomId: current\.roomId/);
    assert.match(source, /isMembershipDenied\(error\)/);
    assert.match(source, /isRecoverableMatchState\(current\)/);
    assert.match(source, /terminalReceiptStillMissing/);
    assert.match(source, /const terminalSnapshotEnvelope/);
    assert.match(source, /\]\.(?:includes)\(envelope\.type\) && !terminalSnapshotEnvelope/);
    assert.match(source, /'awaiting-receipt'/);
    assert.match(source, /'pending-server-finalization'/);
    assert.match(source, /stateRef\.current\.settlement !== 'pending-server-finalization'/);
    assert.equal(realtimeErrorMessage('not_your_turn', 'en'), 'Wait for the other signal’s turn.');
    assert.equal(realtimeErrorMessage('not_your_turn', 'ar'), 'انتظر دور الإشارة الأخرى.');
    assert.equal(realtimeErrorMessage('active_match_in_progress', 'en'), 'You already have a saved active match. Open or recover it before starting another one.');
    assert.equal(realtimeErrorMessage('unknown_worker_code', 'en'), 'The server rejected that action.');
    assert.doesNotMatch(source, /envelope\.payload\.message/);
  });

  it('bounds a silent authoritative snapshot and preserves only a non-authoritative rejected-attempt signal', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/echo-network/useRealtimeRoom.ts'),
      'utf8',
    );

    assert.match(source, /snapshotTimerRef/);
    assert.match(source, /Authoritative snapshot timed out/);
    assert.match(source, /snapshotTimedOut/);
    assert.match(source, /clearSnapshotTimer\(\)/);
    assert.match(source, /envelope\.type === 'answer-rejected'/);
    assert.match(source, /events: \[\.\.\.previous\.events\.slice\(-19\), envelope\]/);
    assert.match(source, /previous\.events\.filter\(\(event\) => event\.type !== 'answer-rejected'\)/);
    assert.match(source, /locale = 'ar'/);
  });
});
