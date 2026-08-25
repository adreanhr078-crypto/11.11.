import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

/**
 * Local-only opponent contract for Echo Duel.  It deliberately has no link to
 * matchmaking, ratings, rewards, or the authoritative realtime chess rooms.
 */
export type EchoChessDifficulty = 'guided' | 'tactical' | 'black-echo';

export interface EchoChessMoveRequest {
  fen: string;
  difficulty: EchoChessDifficulty;
  /** Monotonically increasing request sequence within one local duel. */
  sessionSequence: number;
  /** Local board version the response must still match. */
  positionVersion: number;
  /** Stable for one duel; lets the opening book vary between fresh duels. */
  sessionSeed: number;
  /** Upper bound supplied by the caller; the engine also enforces node caps. */
  timeBudgetMs: number;
}

export interface EchoChessMoveResult {
  difficulty: EchoChessDifficulty;
  sessionSequence: number;
  sessionSeed: number;
  positionVersion: number;
  positionKey: string;
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
  source: 'opening-book' | 'search';
  thinkMs: number;
  nodes: number;
}

export type EchoChessMoveResponse =
  | { ok: true; result: EchoChessMoveResult }
  | {
    ok: false;
    code: 'invalid_request' | 'invalid_fen' | 'not_echo_turn' | 'game_over' | 'no_legal_move';
    message: string;
  };

export interface EchoChessEnginePort {
  chooseMove(request: EchoChessMoveRequest): Promise<EchoChessMoveResponse>;
  dispose(): void;
}

interface SearchPolicy {
  maxDepth: number;
  /**
   * Capture-only extension at the horizon. It prevents the stronger Echo
   * levels from valuing a position just before an obvious recapture.
   */
  quiescenceDepth: number;
  rootWidth: number;
  branchWidth: number;
  nodeBudget: number;
  defaultBudgetMs: number;
}

interface SearchContext {
  deadline: number;
  nodeBudget: number;
  branchWidth: number;
  nodes: number;
  aborted: boolean;
  seed: number;
  transposition: Map<string, { depth: number; score: number }>;
}

const POLICIES: Record<EchoChessDifficulty, SearchPolicy> = {
  guided: {
    maxDepth: 2,
    quiescenceDepth: 0,
    rootWidth: 10,
    branchWidth: 9,
    nodeBudget: 650,
    defaultBudgetMs: 120,
  },
  tactical: {
    maxDepth: 3,
    quiescenceDepth: 1,
    rootWidth: 16,
    branchWidth: 14,
    nodeBudget: 3_800,
    defaultBudgetMs: 350,
  },
  'black-echo': {
    maxDepth: 5,
    quiescenceDepth: 2,
    rootWidth: 24,
    branchWidth: 18,
    nodeBudget: 18_000,
    defaultBudgetMs: 900,
  },
};

const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20_000,
};

const CENTER_SQUARES = new Set<Square>(['c3', 'd3', 'e3', 'f3', 'c4', 'd4', 'e4', 'f4', 'c5', 'd5', 'e5', 'f5', 'c6', 'd6', 'e6', 'f6']);
const CORE_SQUARES = new Set<Square>(['d4', 'e4', 'd5', 'e5']);

type OpeningCandidate = { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' };

function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function hash(value: string): number {
  let state = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16_777_619);
  }
  return state >>> 0;
}

function seededTieBreak(seed: number, move: Move): number {
  return hash(`${seed}:${move.from}:${move.to}:${move.promotion ?? ''}`) % 97;
}

function openingBook(key: string): readonly OpeningCandidate[] {
  // Board positions, rather than SAN history, keep the book valid after a
  // refresh.  Every candidate is revalidated by chess.js before use.
  const entries: Record<string, readonly OpeningCandidate[]> = {
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -': [
      { from: 'e7', to: 'e5' }, { from: 'c7', to: 'c5' }, { from: 'c7', to: 'c6' },
    ],
    'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq -': [
      { from: 'd7', to: 'd5' }, { from: 'g8', to: 'f6' }, { from: 'e7', to: 'e6' },
    ],
    'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq -': [
      { from: 'g8', to: 'f6' }, { from: 'd7', to: 'd5' }, { from: 'c7', to: 'c5' },
    ],
    'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq -': [
      { from: 'e7', to: 'e5' }, { from: 'g8', to: 'f6' }, { from: 'c7', to: 'c5' },
    ],
  };
  return entries[key] ?? [];
}

function legalBookMove(chess: Chess, candidate: OpeningCandidate): Move | null {
  return chess.moves({ verbose: true }).find((move) => (
    move.from === candidate.from
    && move.to === candidate.to
    && (candidate.promotion === undefined || move.promotion === candidate.promotion)
  )) ?? null;
}

function capBudget(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(40, Math.min(1_000, Math.floor(value)));
}

function attackedValuePenalty(chess: Chess, color: Color): number {
  let penalty = 0;
  for (const piece of chess.board().flat()) {
    if (!piece || piece.color !== color || piece.type === 'k') continue;
    const enemy = piece.color === 'b' ? 'w' : 'b';
    const attacked = chess.isAttacked(piece.square, enemy);
    const defended = chess.isAttacked(piece.square, piece.color);
    if (attacked && !defended) penalty += Math.round(PIECE_VALUE[piece.type] * 0.18);
  }
  return penalty;
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'b' ? -100_000 : 100_000;
  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) return 0;

  let score = 0;
  for (const piece of chess.board().flat()) {
    if (!piece) continue;
    const sign = piece.color === 'b' ? 1 : -1;
    score += sign * PIECE_VALUE[piece.type];
    if (CENTER_SQUARES.has(piece.square)) score += sign * (piece.type === 'p' ? 13 : 8);
    if (CORE_SQUARES.has(piece.square)) score += sign * 5;
    if (piece.type === 'p') {
      const rank = Number(piece.square[1]);
      const progress = piece.color === 'b' ? 7 - rank : rank - 2;
      score += sign * Math.max(0, progress) * 4;
    }
  }

  const mobility = chess.moves().length;
  score += chess.turn() === 'b' ? mobility * 1.5 : -mobility * 1.5;
  score -= attackedValuePenalty(chess, 'b');
  score += attackedValuePenalty(chess, 'w');
  if (chess.isCheck()) score += chess.turn() === 'w' ? 32 : -32;
  return score;
}

function moveOrderScore(move: Move, seed: number): number {
  const capture = move.captured
    ? PIECE_VALUE[move.captured] * 12 - PIECE_VALUE[move.piece]
    : 0;
  return capture
    + (move.promotion ? PIECE_VALUE[move.promotion] * 4 : 0)
    + (move.san.includes('+') ? 140 : 0)
    + (CORE_SQUARES.has(move.to) ? 30 : 0)
    + (CENTER_SQUARES.has(move.to) ? 10 : 0)
    + seededTieBreak(seed, move) / 100;
}

function orderedMoves(chess: Chess, seed: number, width: number): Move[] {
  return chess.moves({ verbose: true })
    .sort((first, second) => (
      moveOrderScore(second, seed) - moveOrderScore(first, seed)
      || first.san.localeCompare(second.san)
    ))
    .slice(0, width);
}

function shouldStop(context: SearchContext): boolean {
  if (context.aborted) return true;
  if (context.nodes >= context.nodeBudget || Date.now() >= context.deadline) {
    context.aborted = true;
    return true;
  }
  return false;
}

/**
 * A deliberately small capture search at the leaf node. This is not a full
 * engine quiescence implementation: it is bounded by the same worker time
 * and node budgets, and only exists on the two stronger difficulty levels to
 * avoid obvious "take a defended queen" horizon mistakes.
 */
function quiescence(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  context: SearchContext,
): number {
  context.nodes += 1;
  const standPat = evaluatePosition(chess);
  if (shouldStop(context) || depth <= 0 || chess.isGameOver()) return standPat;

  const maximizingBlack = chess.turn() === 'b';
  if (maximizingBlack) {
    if (standPat >= beta) return standPat;
    alpha = Math.max(alpha, standPat);
  } else {
    if (standPat <= alpha) return standPat;
    beta = Math.min(beta, standPat);
  }

  const forcingMoves = orderedMoves(chess, context.seed + depth, context.branchWidth)
    .filter((move) => Boolean(move.captured) || Boolean(move.promotion) || move.san.includes('+'));
  let best = standPat;
  for (const move of forcingMoves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = quiescence(chess, depth - 1, alpha, beta, context);
    chess.undo();
    if (context.aborted) return standPat;
    if (maximizingBlack) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  context: SearchContext,
  quiescenceDepth: number,
): number {
  context.nodes += 1;
  if (shouldStop(context) || chess.isGameOver()) return evaluatePosition(chess);
  if (depth <= 0) return quiescence(chess, quiescenceDepth, alpha, beta, context);

  const key = `${chess.fen()}|${depth}`;
  const known = context.transposition.get(key);
  if (known?.depth === depth) return known.score;

  const maximizingBlack = chess.turn() === 'b';
  let best = maximizingBlack ? -Infinity : Infinity;
  const moves = orderedMoves(chess, context.seed + depth, context.branchWidth);
  if (moves.length === 0) return evaluatePosition(chess);

  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = minimax(chess, depth - 1, alpha, beta, context, quiescenceDepth);
    chess.undo();
    if (context.aborted) return evaluatePosition(chess);
    if (maximizingBlack) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  context.transposition.set(key, { depth, score: best });
  return best;
}

function selectSearchMove(chess: Chess, request: EchoChessMoveRequest, policy: SearchPolicy): { move: Move; nodes: number } | null {
  const startedAt = Date.now();
  const context: SearchContext = {
    deadline: startedAt + capBudget(request.timeBudgetMs, policy.defaultBudgetMs),
    nodeBudget: policy.nodeBudget,
    branchWidth: policy.branchWidth,
    nodes: 0,
    aborted: false,
    seed: hash(`${request.sessionSeed}:${request.sessionSequence}:${request.difficulty}`),
    transposition: new Map(),
  };
  const rootMoves = orderedMoves(chess, context.seed, policy.rootWidth);
  if (rootMoves.length === 0) return null;
  let bestMove = rootMoves[0]!;
  let bestScore = -Infinity;

  // Iterative deepening makes a useful legal move available even if a slow
  // phone reaches the time budget before Black Echo's deepest search.
  for (let depth = 1; depth <= policy.maxDepth; depth += 1) {
    let completedDepthBest = rootMoves[0]!;
    let completedDepthScore = -Infinity;
    context.aborted = false;
    for (const move of rootMoves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const score = minimax(
        chess,
        depth - 1,
        -Infinity,
        Infinity,
        context,
        policy.quiescenceDepth,
      );
      chess.undo();
      if (context.aborted) break;
      if (score > completedDepthScore || (
        score === completedDepthScore
        && seededTieBreak(context.seed, move) > seededTieBreak(context.seed, completedDepthBest)
      )) {
        completedDepthScore = score;
        completedDepthBest = move;
      }
    }
    if (context.aborted) break;
    bestMove = completedDepthBest;
    bestScore = completedDepthScore;
    if (Math.abs(bestScore) >= 99_000) break;
  }
  return { move: bestMove, nodes: context.nodes };
}

function toResult(
  request: EchoChessMoveRequest,
  move: Move,
  source: EchoChessMoveResult['source'],
  startedAt: number,
  nodes: number,
): EchoChessMoveResult {
  return {
    difficulty: request.difficulty,
    sessionSequence: request.sessionSequence,
    sessionSeed: request.sessionSeed,
    positionVersion: request.positionVersion,
    positionKey: positionKey(request.fen),
    from: move.from,
    to: move.to,
    promotion: move.promotion === 'q' || move.promotion === 'r' || move.promotion === 'b' || move.promotion === 'n'
      ? move.promotion
      : undefined,
    san: move.san,
    source,
    thinkMs: Math.max(0, Date.now() - startedAt),
    nodes,
  };
}

/** Returns only a move chess.js already judged legal for the requested FEN. */
export function chooseEchoChessMove(request: EchoChessMoveRequest): EchoChessMoveResponse {
  const startedAt = Date.now();
  if (
    !POLICIES[request.difficulty]
    || !Number.isSafeInteger(request.sessionSequence)
    || request.sessionSequence < 0
    || !Number.isSafeInteger(request.positionVersion)
    || request.positionVersion < 0
    || !Number.isSafeInteger(request.sessionSeed)
    || !Number.isFinite(request.timeBudgetMs)
    || typeof request.fen !== 'string'
  ) {
    return { ok: false, code: 'invalid_request', message: 'Echo received an invalid duel request.' };
  }
  let chess: Chess;
  try {
    chess = new Chess(request.fen);
  } catch {
    return { ok: false, code: 'invalid_fen', message: 'Echo could not read this board position.' };
  }
  if (chess.isGameOver()) {
    return { ok: false, code: 'game_over', message: 'This Echo Duel is already complete.' };
  }
  if (chess.turn() !== 'b') {
    return { ok: false, code: 'not_echo_turn', message: 'Echo can only move the black side.' };
  }
  const policy = POLICIES[request.difficulty];
  const bookCandidates = openingBook(positionKey(request.fen));
  if (bookCandidates.length > 0) {
    const index = hash(`${request.sessionSeed}:${request.sessionSequence}:${positionKey(request.fen)}`) % bookCandidates.length;
    for (let offset = 0; offset < bookCandidates.length; offset += 1) {
      const candidate = bookCandidates[(index + offset) % bookCandidates.length]!;
      const move = legalBookMove(chess, candidate);
      if (move) return { ok: true, result: toResult(request, move, 'opening-book', startedAt, 1) };
    }
  }
  const selected = selectSearchMove(chess, request, policy);
  if (!selected) {
    return { ok: false, code: 'no_legal_move', message: 'Echo found no legal response.' };
  }
  return {
    ok: true,
    result: toResult(request, selected.move, 'search', startedAt, selected.nodes),
  };
}

/**
 * Validates a worker response again at the UI boundary.  A late response is
 * harmless: it cannot mutate a newer position or a reset duel.
 */
export function canApplyEchoChessMove(
  current: EchoChessMoveRequest,
  result: EchoChessMoveResult,
): boolean {
  if (
    result.positionVersion !== current.positionVersion
    || result.sessionSequence !== current.sessionSequence
    || result.sessionSeed !== current.sessionSeed
    || result.positionKey !== positionKey(current.fen)
    || result.difficulty !== current.difficulty
  ) return false;
  let chess: Chess;
  try {
    chess = new Chess(current.fen);
  } catch {
    return false;
  }
  if (chess.turn() !== 'b' || chess.isGameOver()) return false;
  return chess.moves({ verbose: true }).some((move) => (
    move.from === result.from
    && move.to === result.to
    && (move.promotion ?? undefined) === result.promotion
  ));
}

export function localEchoDifficultyPolicy(difficulty: EchoChessDifficulty): Readonly<SearchPolicy> {
  return POLICIES[difficulty];
}
