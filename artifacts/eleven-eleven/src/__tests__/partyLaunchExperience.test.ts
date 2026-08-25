import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  roomHasUsableSnapshot,
  type RealtimeRoomState,
} from '../features/echo-network/useRealtimeRoom';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

function roomState(overrides: Partial<RealtimeRoomState>): RealtimeRoomState {
  return {
    phase: 'idle',
    mode: null,
    target: null,
    roomId: null,
    snapshot: null,
    receipt: null,
    settlement: 'none',
    error: null,
    queueStartedAt: null,
    events: [],
    ...overrides,
  };
}

describe('Private party launch experience', () => {
  it('does not expose a live board until an authoritative snapshot arrives', () => {
    assert.equal(roomHasUsableSnapshot(roomState({
      phase: 'awaiting-snapshot',
      snapshot: null,
    })), false);
    assert.equal(roomHasUsableSnapshot(roomState({
      phase: 'active',
      snapshot: { state: { version: 7 } },
    })), true);
    assert.equal(roomHasUsableSnapshot(roomState({
      phase: 'active',
      snapshot: null,
    })), false);
    assert.equal(roomHasUsableSnapshot(roomState({
      phase: 'settling',
      snapshot: { state: { version: 8, status: 'completed' } },
      settlement: 'awaiting-receipt',
    })), true);
  });

  it('keeps private launch selection local while the server remains the authority', () => {
    const party = source('src/features/echo-network/LiveSignalRooms.tsx');
    const realtime = source('src/features/echo-network/useRealtimeRoom.ts');
    const worker = source('workers/realtime/src/PartyRoom.ts');

    assert.match(party, /party\.sendCommand\(type, payload\)/);
    assert.match(party, /sendPartyCommand\('party-launch'/);
    assert.match(party, /caseId: selectedCaseId/);
    assert.match(party, /partyMembers\[0\]\?\.uid === user\.uid/);
    assert.match(realtime, /phase: 'awaiting-snapshot'/);
    assert.match(realtime, /snapshot: null,/);
    assert.match(worker, /party_leader_required/);
    assert.match(worker, /party_not_ready/);
    assert.match(worker, /parseLaunch\(command\.payload, members\.length\)/);
  });

  it('hands the same room controller from the party surface to the selected match surface', () => {
    const screen = source('src/features/echo-network/EchoNetworkScreen.tsx');
    const chess = source('src/features/echo-network/ContractChessPanel.tsx');
    const coop = source('src/features/echo-network/CoopBreachPanel.tsx');

    assert.match(screen, /const partyRoom = useRealtimeRoom\(\{ resumeMatch: authStatus === 'signed-in', locale \}\)/);
    assert.match(screen, /<ContractChessPanel[\s\S]*room=\{partyRoom\}/);
    assert.match(screen, /<CoopBreachPanel[\s\S]*room=\{partyRoom\}/);
    assert.match(chess, /roomHasUsableSnapshot\(room\.state\)/);
    assert.match(chess, /const gameplayReady = roomReady && snapshot\?\.state !== null;/);
    assert.match(coop, /roomHasUsableSnapshot\(room\.state\)/);
    assert.match(coop, /const gameplayReady = roomReady && online !== null;/);
  });

  it('labels the local and opposing chess side from the authoritative player color', () => {
    const chess = source('src/features/echo-network/ContractChessPanel.tsx');

    assert.match(chess, /function liveSideLabels\(locale: NetworkLocale, playerColor: Color\)/);
    assert.match(chess, /playerColor === 'w'/);
    assert.match(chess, /const liveSides = liveSideLabels\(locale, snapshot\?\.color \?\? 'w'\);/);
    assert.match(chess, /\{liveSides\.black\}/);
    assert.match(chess, /\{liveSides\.red\}/);
  });
});
