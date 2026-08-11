import { Chess, type Color, type Square } from 'chess.js';
import type { ChessVariant } from './contracts';

export interface ContractChessClock {
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  turnStartedAt: number;
}

export interface ContractChessState {
  fen: string;
  variant: ChessVariant;
  version: number;
  checkCounts: { white: number; black: number };
  status: 'active' | 'white-won' | 'black-won' | 'draw';
  reason: 'playing' | 'checkmate' | 'three-check' | 'core-control' | 'draw'
    | 'resigned' | 'timeout' | 'abandoned';
  clock: ContractChessClock;
  lastMove: { from: Square; to: Square; san: string } | null;
}

export interface ContractChessMoveInput {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  now?: number;
}

function winnerStatus(color: Color): ContractChessState['status'] {
  return color === 'w' ? 'white-won' : 'black-won';
}

function kingControlsCore(chess: Chess, color: Color): boolean {
  const core = new Set(['d4', 'e4', 'd5', 'e5']);
  return chess.board().flat().some((piece) => (
    piece?.type === 'k' && piece.color === color && core.has(piece.square)
  ));
}

export function createContractChessState(
  variant: ChessVariant = 'standard',
  timeControl: 'blitz' | 'rapid' = 'rapid',
  now = Date.now(),
): ContractChessState {
  const baseMs = timeControl === 'blitz' ? 3 * 60_000 : 10 * 60_000;
  return {
    fen: new Chess().fen(),
    variant,
    version: 0,
    checkCounts: { white: 0, black: 0 },
    status: 'active',
    reason: 'playing',
    clock: {
      whiteMs: baseMs,
      blackMs: baseMs,
      incrementMs: timeControl === 'blitz' ? 2_000 : 0,
      turnStartedAt: now,
    },
    lastMove: null,
  };
}

export function legalDestinations(
  state: ContractChessState,
  from: Square,
): readonly Square[] {
  if (state.status !== 'active') return [];
  const chess = new Chess(state.fen);
  return chess.moves({ square: from, verbose: true }).map((move) => move.to);
}

export function applyContractChessMove(
  state: ContractChessState,
  input: ContractChessMoveInput,
): ContractChessState {
  if (state.status !== 'active') throw new Error('The chess match is not active.');
  const chess = new Chess(state.fen);
  const movingColor = chess.turn();
  const now = input.now ?? Date.now();
  const elapsed = Math.max(0, now - state.clock.turnStartedAt);
  const remaining = movingColor === 'w'
    ? state.clock.whiteMs - elapsed
    : state.clock.blackMs - elapsed;
  if (remaining <= 0) throw new Error('The active chess clock has expired.');

  const move = chess.move({
    from: input.from,
    to: input.to,
    promotion: input.promotion ?? 'q',
  });
  if (!move) throw new Error('Illegal chess move.');

  const checkCounts = { ...state.checkCounts };
  if (chess.inCheck()) {
    if (movingColor === 'w') checkCounts.white += 1;
    else checkCounts.black += 1;
  }
  let status: ContractChessState['status'] = 'active';
  let reason: ContractChessState['reason'] = 'playing';
  if (chess.isCheckmate()) {
    status = winnerStatus(movingColor);
    reason = 'checkmate';
  } else if (
    state.variant === 'three-signal'
    && (movingColor === 'w' ? checkCounts.white : checkCounts.black) >= 3
  ) {
    status = winnerStatus(movingColor);
    reason = 'three-check';
  } else if (state.variant === 'core-control' && kingControlsCore(chess, movingColor)) {
    status = winnerStatus(movingColor);
    reason = 'core-control';
  } else if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) {
    status = 'draw';
    reason = 'draw';
  }

  return {
    ...state,
    fen: chess.fen(),
    version: state.version + 1,
    checkCounts,
    status,
    reason,
    clock: {
      ...state.clock,
      whiteMs: movingColor === 'w'
        ? remaining + state.clock.incrementMs
        : state.clock.whiteMs,
      blackMs: movingColor === 'b'
        ? remaining + state.clock.incrementMs
        : state.clock.blackMs,
      turnStartedAt: now,
    },
    lastMove: { from: move.from, to: move.to, san: move.san },
  };
}

export function effectiveClock(state: ContractChessState, now = Date.now()): {
  whiteMs: number;
  blackMs: number;
} {
  if (state.status !== 'active') {
    return { whiteMs: state.clock.whiteMs, blackMs: state.clock.blackMs };
  }
  const chess = new Chess(state.fen);
  const elapsed = Math.max(0, now - state.clock.turnStartedAt);
  return {
    whiteMs: chess.turn() === 'w'
      ? Math.max(0, state.clock.whiteMs - elapsed)
      : state.clock.whiteMs,
    blackMs: chess.turn() === 'b'
      ? Math.max(0, state.clock.blackMs - elapsed)
      : state.clock.blackMs,
  };
}
