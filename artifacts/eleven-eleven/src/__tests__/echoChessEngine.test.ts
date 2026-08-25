import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { resolve } from 'node:path';
import { Chess } from 'chess.js';
import {
  canApplyEchoChessMove,
  chooseEchoChessMove,
  localEchoDifficultyPolicy,
  type EchoChessMoveRequest,
} from '../domain/echo-network/echoChessEngine';
import {
  createEchoChessEnginePort,
  workerTimeoutMs,
} from '../features/echo-network/echoChessWorkerClient';

function request(overrides: Partial<EchoChessMoveRequest> = {}): EchoChessMoveRequest {
  return {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    difficulty: 'guided',
    sessionSequence: 1,
    positionVersion: 4,
    sessionSeed: 17,
    timeBudgetMs: 120,
    ...overrides,
  };
}

class SilentWorker {
  static instances: SilentWorker[] = [];
  static throwOnPost = false;
  private listeners = new Map<string, Array<(event: Event) => void>>();
  terminated = false;

  constructor() {
    SilentWorker.instances.push(this);
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  postMessage() {
    if (SilentWorker.throwOnPost) throw new Error('Worker is unavailable');
  }

  terminate() {
    this.terminated = true;
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
  }
}

describe('Echo Duel chess engine', () => {
  it('keeps the local duel separate from rewards, ranked authority, and the live room', () => {
    const panel = readFileSync(resolve(process.cwd(), 'src/features/echo-network/ContractChessPanel.tsx'), 'utf8');
    const worker = readFileSync(resolve(process.cwd(), 'src/features/echo-network/echoChess.worker.ts'), 'utf8');

    assert.match(panel, /function LocalEchoDuel/);
    assert.match(panel, /createEchoChessEnginePort\(\)/);
    assert.match(panel, /canApplyEchoChessMove/);
    assert.match(panel, /localOnly/);
    assert.doesNotMatch(panel, /completeNetworkTraining\(/);
    assert.doesNotMatch(panel, /onTrainingComplete/);
    assert.match(worker, /chooseEchoChessMove/);
  });

  it('keeps the board keyboard-operable and forwards only a chosen promotion to the live room', () => {
    const panel = readFileSync(resolve(process.cwd(), 'src/features/echo-network/ContractChessPanel.tsx'), 'utf8');
    const styles = readFileSync(resolve(process.cwd(), 'src/features/echo-network/echo-network.css'), 'utf8');

    assert.match(panel, /role="grid"/);
    assert.match(panel, /aria-roledescription="chess board"/);
    assert.match(panel, /className="contract-chess-board__row" role="row"/);
    assert.match(panel, /tabIndex=\{focusedSquare === square \? 0 : -1\}/);
    assert.match(panel, /onKeyDown=\{\(event\) => handleKeyDown\(event, square\)\}/);
    assert.match(panel, /className="contract-chess-promotion" role="dialog"/);
    assert.match(panel, /onMove=\{\(from, to, promotion\) => room\.sendCommand\('move', \{ from, to, promotion \}\)\}/);
    assert.doesNotMatch(panel, /room\.sendCommand\('move', \{ from, to, promotion: 'q' \}\)/);
    assert.doesNotMatch(styles, /contract-sanctum-v1\.png/);
  });

  it('uses separate bounded search policies for the three local strengths', () => {
    assert.equal(localEchoDifficultyPolicy('guided').maxDepth, 2);
    assert.equal(localEchoDifficultyPolicy('tactical').maxDepth, 3);
    assert.equal(localEchoDifficultyPolicy('black-echo').maxDepth, 5);
    assert.equal(localEchoDifficultyPolicy('guided').quiescenceDepth, 0);
    assert.equal(localEchoDifficultyPolicy('tactical').quiescenceDepth, 1);
    assert.equal(localEchoDifficultyPolicy('black-echo').quiescenceDepth, 2);
    assert.ok(localEchoDifficultyPolicy('guided').nodeBudget < localEchoDifficultyPolicy('tactical').nodeBudget);
    assert.ok(localEchoDifficultyPolicy('tactical').nodeBudget < localEchoDifficultyPolicy('black-echo').nodeBudget);
  });

  it('returns only a legal black response and varies a reviewed opening by duel seed', () => {
    const moves = new Set<string>();
    for (let seed = 1; seed <= 8; seed += 1) {
      const response = chooseEchoChessMove(request({ sessionSeed: seed }));
      assert.equal(response.ok, true);
      if (!response.ok) continue;
      const chess = new Chess(request({ sessionSeed: seed }).fen);
      const legal = chess.moves({ verbose: true }).some((move) => (
        move.from === response.result.from && move.to === response.result.to
      ));
      assert.equal(legal, true);
      assert.equal(response.result.source, 'opening-book');
      moves.add(`${response.result.from}${response.result.to}`);
    }
    assert.ok(moves.size >= 2, `expected opening variation, got ${[...moves].join(', ')}`);
  });

  it('finds a forced mate when Black Echo has one', () => {
    const response = chooseEchoChessMove(request({
      fen: '7k/7p/8/8/8/6q1/6PP/6K1 b - - 0 1',
      difficulty: 'black-echo',
      timeBudgetMs: 900,
      sessionSeed: 3,
    }));
    assert.equal(response.ok, true);
    if (!response.ok) return;
    assert.equal(response.result.from, 'g3');
    assert.equal(response.result.to, 'e1');
    assert.match(response.result.san, /#$/);
  });

  it('rejects malformed positions, the player turn, and stale worker output', () => {
    assert.deepEqual(chooseEchoChessMove({
      ...request(),
      difficulty: 'impossible' as never,
    }), {
      ok: false,
      code: 'invalid_request',
      message: 'Echo received an invalid duel request.',
    });
    assert.deepEqual(chooseEchoChessMove(request({ sessionSequence: -1 })), {
      ok: false,
      code: 'invalid_request',
      message: 'Echo received an invalid duel request.',
    });
    assert.deepEqual(chooseEchoChessMove(request({ fen: 'not a chess position' })), {
      ok: false,
      code: 'invalid_fen',
      message: 'Echo could not read this board position.',
    });
    assert.deepEqual(chooseEchoChessMove(request({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    })), {
      ok: false,
      code: 'not_echo_turn',
      message: 'Echo can only move the black side.',
    });

    const current = request();
    const response = chooseEchoChessMove(current);
    assert.equal(response.ok, true);
    if (!response.ok) return;
    assert.equal(canApplyEchoChessMove(current, response.result), true);
    assert.equal(canApplyEchoChessMove({ ...current, positionVersion: 5 }, response.result), false);
    assert.equal(canApplyEchoChessMove({ ...current, sessionSequence: 2 }, response.result), false);
    assert.equal(canApplyEchoChessMove({ ...current, sessionSeed: 18 }, response.result), false);
    assert.equal(canApplyEchoChessMove({
      ...current,
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
    }, response.result), false);
  });

  it('settles a failed or silent Worker instead of leaving the board thinking forever', async () => {
    const originalWorker = globalThis.Worker;
    SilentWorker.instances = [];
    SilentWorker.throwOnPost = false;
    Object.assign(globalThis, { Worker: SilentWorker });
    try {
      const immediatePort = createEchoChessEnginePort();
      const immediateResponse = immediatePort.chooseMove(request());
      SilentWorker.instances.at(-1)?.emit('messageerror');
      assert.equal((await immediateResponse).ok, false);
      assert.equal(SilentWorker.instances.at(-1)?.terminated, true);
      immediatePort.dispose();

      SilentWorker.throwOnPost = true;
      const failedPostPort = createEchoChessEnginePort();
      const failedPostResponse = await failedPostPort.chooseMove(request());
      assert.equal(failedPostResponse.ok, false);
      assert.match(failedPostResponse.message, /could not start/i);
      assert.equal(SilentWorker.instances.at(-1)?.terminated, true);
      failedPostPort.dispose();
      SilentWorker.throwOnPost = false;

      const timeoutPort = createEchoChessEnginePort();
      const startedAt = Date.now();
      const timeoutResponse = await timeoutPort.chooseMove(request({ timeBudgetMs: 0 }));
      const elapsed = Date.now() - startedAt;
      assert.equal(timeoutResponse.ok, false);
      assert.match(timeoutResponse.message, /too long/i);
      assert.ok(elapsed >= workerTimeoutMs(request({ timeBudgetMs: 0 })) - 80);
      assert.ok(elapsed < workerTimeoutMs(request({ timeBudgetMs: 0 })) + 1_000);
      assert.equal(SilentWorker.instances.at(-1)?.terminated, true);
      timeoutPort.dispose();
    } finally {
      SilentWorker.throwOnPost = false;
      Object.assign(globalThis, { Worker: originalWorker });
    }
  });
});
