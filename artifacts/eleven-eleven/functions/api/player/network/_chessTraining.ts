import { Chess, type Move, type Square } from 'chess.js';
import { PlayerApiError } from '../_shared';
import type { PlayerDatabase, PlayerDatabaseResult, PlayerDatabaseStatement } from '../_database';

const TRAINING_PROTOCOL_VERSION = 1;
const TRAINING_SESSION_DURATION_MS = 15 * 60 * 1_000;

export const VERIFIED_CHESS_TRAINING_STEPS = [
  {
    id: 'develop-a-knight',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    goal: 'Develop a knight toward the centre.',
  },
  {
    id: 'escape-check',
    fen: '4k3/8/8/8/8/8/4r3/4K3 w - - 0 1',
    goal: 'Get your king out of check.',
  },
  {
    id: 'capture-hanging-queen',
    fen: '4k3/8/8/8/3q4/8/4N3/4K3 w - - 0 1',
    goal: 'Capture the unprotected queen.',
  },
] as const;

export type VerifiedChessTrainingStepId = typeof VERIFIED_CHESS_TRAINING_STEPS[number]['id'];
export type ChessTrainingSessionStatus = 'active' | 'completed' | 'expired';

interface ChessTrainingSessionRow {
  session_id: string;
  user_id: string;
  status: ChessTrainingSessionStatus;
  step_index: number | string;
  fen: string;
  version: number | string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ChessTrainingEventRow {
  request_fingerprint: string;
  response_json: string;
}

interface StoredChessTrainingSession {
  id: string;
  uid: string;
  status: ChessTrainingSessionStatus;
  stepIndex: number;
  fen: string;
  version: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ChessTrainingSnapshot {
  protocolVersion: typeof TRAINING_PROTOCOL_VERSION;
  training: 'chess';
  session: {
    id: string;
    status: ChessTrainingSessionStatus;
    version: number;
    expiresAt: string;
    stepIndex: number;
    step: VerifiedChessTrainingStepId | null;
    goal: string | null;
    /** The active board is issued by the server; clients never submit a FEN. */
    fen?: string;
    completedAt: string | null;
  };
}

export interface ChessTrainingMoveInput {
  sessionId: string;
  idempotencyKey: string;
  expectedVersion: number;
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

function asSafeInteger(value: number | string): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(numberValue) ? numberValue : null;
}

function asStoredSession(row: ChessTrainingSessionRow | null): StoredChessTrainingSession | null {
  if (!row
    || typeof row.session_id !== 'string'
    || typeof row.user_id !== 'string'
    || typeof row.fen !== 'string'
    || typeof row.expires_at !== 'string'
    || typeof row.created_at !== 'string'
    || typeof row.updated_at !== 'string'
    || (row.status !== 'active' && row.status !== 'completed' && row.status !== 'expired')) {
    return null;
  }
  const stepIndex = asSafeInteger(row.step_index);
  const version = asSafeInteger(row.version);
  if (stepIndex === null || version === null || stepIndex < 0 || stepIndex > VERIFIED_CHESS_TRAINING_STEPS.length || version < 0) {
    return null;
  }
  if ((row.status === 'completed') !== Boolean(row.completed_at)) return null;
  return {
    id: row.session_id,
    uid: row.user_id,
    status: row.status,
    stepIndex,
    fen: row.fen,
    version,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function requireStoredSession(row: ChessTrainingSessionRow | null): StoredChessTrainingSession {
  const parsed = asStoredSession(row);
  if (!parsed) {
    throw new PlayerApiError(503, 'training_state_invalid', 'Verified chess training is temporarily unavailable.');
  }
  return parsed;
}

function toSnapshot(session: StoredChessTrainingSession): ChessTrainingSnapshot {
  const step = session.status === 'active'
    ? VERIFIED_CHESS_TRAINING_STEPS[session.stepIndex] ?? null
    : null;
  return {
    protocolVersion: TRAINING_PROTOCOL_VERSION,
    training: 'chess',
    session: {
      id: session.id,
      status: session.status,
      version: session.version,
      expiresAt: session.expiresAt,
      stepIndex: session.stepIndex,
      step: step?.id ?? null,
      goal: step?.goal ?? null,
      ...(step ? { fen: session.fen } : {}),
      completedAt: session.completedAt,
    },
  };
}

function nowIso(now: Date): string {
  const time = now.getTime();
  if (!Number.isFinite(time)) {
    throw new PlayerApiError(503, 'training_clock_invalid', 'Verified chess training is temporarily unavailable.');
  }
  return new Date(time).toISOString();
}

function expiresAtAfter(now: Date): string {
  return new Date(now.getTime() + TRAINING_SESSION_DURATION_MS).toISOString();
}

function isExpired(session: StoredChessTrainingSession, now: Date): boolean {
  const timestamp = Date.parse(session.expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= now.getTime();
}

function moveFingerprint(input: ChessTrainingMoveInput): string {
  return [
    'v1',
    input.sessionId,
    String(input.expectedVersion),
    input.from,
    input.to,
    input.promotion ?? '',
  ].join(':');
}

function eventStatement(
  database: PlayerDatabase,
  input: {
    session: StoredChessTrainingSession;
    eventType: 'started' | 'step_completed' | 'completed' | 'expired';
    version: number;
    stepIndex: number;
    idempotencyKey: string;
    fingerprint: string;
    response: ChessTrainingSnapshot;
    now: string;
  },
): PlayerDatabaseStatement {
  return database.prepare(`
    INSERT INTO chess_training_session_events (
      event_id, session_id, user_id, event_type, version, step_index,
      idempotency_key, request_fingerprint, response_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    input.session.id,
    input.session.uid,
    input.eventType,
    input.version,
    input.stepIndex,
    input.idempotencyKey,
    input.fingerprint,
    JSON.stringify(input.response),
    input.now,
  );
}

async function readSessionForUser(
  database: PlayerDatabase,
  uid: string,
  sessionId: string,
): Promise<StoredChessTrainingSession | null> {
  const row = await database.prepare(`
    SELECT session_id, user_id, status, step_index, fen, version, expires_at,
      created_at, updated_at, completed_at
    FROM chess_training_sessions
    WHERE session_id = ? AND user_id = ?
  `).bind(sessionId, uid).first<ChessTrainingSessionRow>();
  if (!row) return null;
  return requireStoredSession(row);
}

async function readResumableOrCompletedSession(
  database: PlayerDatabase,
  uid: string,
): Promise<StoredChessTrainingSession | null> {
  const row = await database.prepare(`
    SELECT session_id, user_id, status, step_index, fen, version, expires_at,
      created_at, updated_at, completed_at
    FROM chess_training_sessions
    WHERE user_id = ? AND status IN ('active', 'completed')
    ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, updated_at DESC
    LIMIT 1
  `).bind(uid).first<ChessTrainingSessionRow>();
  if (!row) return null;
  return requireStoredSession(row);
}

async function readIdempotencyEvent(
  database: PlayerDatabase,
  uid: string,
  sessionId: string,
  idempotencyKey: string,
): Promise<ChessTrainingEventRow | null> {
  return database.prepare(`
    SELECT request_fingerprint, response_json
    FROM chess_training_session_events
    WHERE session_id = ? AND user_id = ? AND idempotency_key = ?
  `).bind(sessionId, uid, idempotencyKey).first<ChessTrainingEventRow>();
}

function parseEventSnapshot(event: ChessTrainingEventRow): ChessTrainingSnapshot {
  try {
    const parsed = JSON.parse(event.response_json) as ChessTrainingSnapshot;
    if (parsed?.protocolVersion !== TRAINING_PROTOCOL_VERSION
      || parsed.training !== 'chess'
      || !parsed.session
      || typeof parsed.session.id !== 'string') {
      throw new Error('invalid snapshot');
    }
    return parsed;
  } catch {
    throw new PlayerApiError(503, 'training_state_invalid', 'Verified chess training is temporarily unavailable.');
  }
}

async function expireTrainingSession(
  database: PlayerDatabase,
  session: StoredChessTrainingSession,
  now: Date,
): Promise<void> {
  if (session.status !== 'active' || !isExpired(session, now)) return;
  const nowValue = nowIso(now);
  const expired: StoredChessTrainingSession = {
    ...session,
    status: 'expired',
    updatedAt: nowValue,
  };
  const response = toSnapshot(expired);
  const result = await database.batch([
    database.prepare(`
      UPDATE chess_training_sessions
      SET status = 'expired', updated_at = ?
      WHERE session_id = ? AND user_id = ? AND status = 'active'
        AND version = ? AND expires_at <= ?
    `).bind(nowValue, session.id, session.uid, session.version, nowValue),
    eventStatement(database, {
      session,
      eventType: 'expired',
      version: session.version,
      stepIndex: session.stepIndex,
      idempotencyKey: `expire:${session.id}:${session.version}`,
      fingerprint: `expire:${session.id}:${session.version}`,
      response,
      now: nowValue,
    }),
  ]);
  const updateChanges = result[0]?.meta?.changes ?? 0;
  if (updateChanges !== 1) {
    throw new PlayerApiError(409, 'training_stale_version', 'This training board changed. Resume the latest board.');
  }
}

function newSession(uid: string, now: Date): StoredChessTrainingSession {
  const createdAt = nowIso(now);
  return {
    id: crypto.randomUUID(),
    uid,
    status: 'active',
    stepIndex: 0,
    fen: VERIFIED_CHESS_TRAINING_STEPS[0].fen,
    version: 0,
    expiresAt: expiresAtAfter(now),
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  };
}

/** Starts one server-owned session or resumes the exact active board. */
export async function startOrResumeChessTraining(
  database: PlayerDatabase,
  uid: string,
  now: Date = new Date(),
): Promise<ChessTrainingSnapshot> {
  const existing = await readResumableOrCompletedSession(database, uid);
  if (existing?.status === 'completed') return toSnapshot(existing);
  if (existing?.status === 'active' && !isExpired(existing, now)) return toSnapshot(existing);
  if (existing?.status === 'active') {
    await expireTrainingSession(database, existing, now);
  }

  const session = newSession(uid, now);
  const snapshot = toSnapshot(session);
  try {
    await database.batch([
      database.prepare(`
        INSERT INTO chess_training_sessions (
          session_id, user_id, status, step_index, fen, version, expires_at,
          created_at, updated_at, completed_at
        ) VALUES (?, ?, 'active', 0, ?, 0, ?, ?, ?, NULL)
      `).bind(
        session.id,
        session.uid,
        session.fen,
        session.expiresAt,
        session.createdAt,
        session.updatedAt,
      ),
      eventStatement(database, {
        session,
        eventType: 'started',
        version: 0,
        stepIndex: 0,
        idempotencyKey: `start:${session.id}`,
        fingerprint: `start:${session.id}`,
        response: snapshot,
        now: session.createdAt,
      }),
    ]);
    return snapshot;
  } catch (error) {
    // The partial unique index may have admitted a racing start between the
    // first read and this insert.  Re-read only this player's safe session.
    const raced = await readResumableOrCompletedSession(database, uid);
    if (raced && (raced.status === 'completed' || !isExpired(raced, now))) {
      return toSnapshot(raced);
    }
    throw error;
  }
}

function moveMatchesTrainingGoal(
  chessBeforeMove: Chess,
  move: Move,
  stepIndex: number,
): boolean {
  switch (VERIFIED_CHESS_TRAINING_STEPS[stepIndex]?.id) {
    case 'develop-a-knight':
      return move.piece === 'n'
        && (move.from === 'b1' || move.from === 'g1')
        && (move.to === 'c3' || move.to === 'f3');
    case 'escape-check':
      return chessBeforeMove.isCheck();
    case 'capture-hanging-queen': {
      const target = chessBeforeMove.get(move.to);
      return target?.type === 'q'
        && target.color === 'b'
        && move.captured === 'q'
        && !chessBeforeMove.isAttacked(move.to, 'b');
    }
    default:
      return false;
  }
}

function validateTrainingMove(
  session: StoredChessTrainingSession,
  input: ChessTrainingMoveInput,
): Move {
  let chess: Chess;
  try {
    chess = new Chess(session.fen);
  } catch {
    throw new PlayerApiError(503, 'training_state_invalid', 'Verified chess training is temporarily unavailable.');
  }
  let move: Move;
  try {
    move = chess.move({ from: input.from, to: input.to, promotion: input.promotion });
  } catch {
    throw new PlayerApiError(422, 'invalid_training_move', 'That chess move is not legal on this training board.');
  }
  if (!moveMatchesTrainingGoal(new Chess(session.fen), move, session.stepIndex)) {
    throw new PlayerApiError(422, 'training_goal_not_met', 'That legal move does not satisfy this training objective.');
  }
  return move;
}

function nextSessionAfterMove(
  session: StoredChessTrainingSession,
  move: Move,
  now: Date,
): StoredChessTrainingSession {
  const completed = session.stepIndex + 1 >= VERIFIED_CHESS_TRAINING_STEPS.length;
  const timestamp = nowIso(now);
  return {
    ...session,
    status: completed ? 'completed' : 'active',
    stepIndex: session.stepIndex + 1,
    fen: completed
      ? new Chess(session.fen).move({ from: move.from, to: move.to, promotion: move.promotion }).after
      : VERIFIED_CHESS_TRAINING_STEPS[session.stepIndex + 1]!.fen,
    version: session.version + 1,
    updatedAt: timestamp,
    completedAt: completed ? timestamp : null,
  };
}

function requireSingleChanged(result: PlayerDatabaseResult<unknown>[] | undefined): void {
  if ((result?.[0]?.meta?.changes ?? 0) !== 1) {
    throw new PlayerApiError(409, 'training_stale_version', 'This training board changed. Resume the latest board.');
  }
}

/**
 * Applies exactly one server-validated tutorial move. The write batch contains
 * no reward, currency, XP, achievement, or rating statement; completion only
 * stamps the existing server-owned chess-training milestone.
 */
export async function submitChessTrainingMove(
  database: PlayerDatabase,
  uid: string,
  input: ChessTrainingMoveInput,
  now: Date = new Date(),
): Promise<ChessTrainingSnapshot> {
  const fingerprint = moveFingerprint(input);
  const duplicate = await readIdempotencyEvent(database, uid, input.sessionId, input.idempotencyKey);
  if (duplicate) {
    if (duplicate.request_fingerprint !== fingerprint) {
      throw new PlayerApiError(409, 'training_idempotency_reused', 'This training request key was already used for another move.');
    }
    return parseEventSnapshot(duplicate);
  }

  const session = await readSessionForUser(database, uid, input.sessionId);
  if (!session) {
    throw new PlayerApiError(404, 'training_session_not_found', 'This verified training session was not found.');
  }
  if (session.status === 'completed') {
    throw new PlayerApiError(409, 'training_already_completed', 'Verified chess training is already complete.');
  }
  if (session.status === 'expired' || isExpired(session, now)) {
    if (session.status === 'active') await expireTrainingSession(database, session, now);
    throw new PlayerApiError(410, 'training_session_expired', 'This training board expired. Start or resume a new board.');
  }
  if (input.expectedVersion !== session.version) {
    throw new PlayerApiError(409, 'training_stale_version', 'This training board changed. Resume the latest board.');
  }

  const move = validateTrainingMove(session, input);
  const next = nextSessionAfterMove(session, move, now);
  const response = toSnapshot(next);
  const completed = next.status === 'completed';
  const nowValue = next.updatedAt;

  let result: PlayerDatabaseResult<unknown>[];
  try {
    result = await database.batch([
      database.prepare(`
        UPDATE chess_training_sessions
        SET status = ?, step_index = ?, fen = ?, version = ?, updated_at = ?, completed_at = ?
        WHERE session_id = ? AND user_id = ? AND status = 'active'
          AND version = ? AND expires_at > ?
      `).bind(
        next.status,
        next.stepIndex,
        next.fen,
        next.version,
        next.updatedAt,
        next.completedAt,
        session.id,
        session.uid,
        session.version,
        nowValue,
      ),
      eventStatement(database, {
        session,
        eventType: completed ? 'completed' : 'step_completed',
        version: next.version,
        stepIndex: next.stepIndex,
        idempotencyKey: input.idempotencyKey,
        fingerprint,
        response,
        now: nowValue,
      }),
      ...(completed ? [database.prepare(`
        UPDATE network_player_milestones
        SET chess_training_completed_at = COALESCE(chess_training_completed_at, ?),
          updated_at = ?
        WHERE user_id = ?
      `).bind(next.completedAt, nowValue, session.uid)] : []),
    ]);
  } catch (error) {
    // A concurrent identical submit can win the D1 batch first. Return its
    // immutable response if the exact key/fingerprint is now present.
    const persisted = await readIdempotencyEvent(database, uid, input.sessionId, input.idempotencyKey);
    if (persisted?.request_fingerprint === fingerprint) return parseEventSnapshot(persisted);
    throw error;
  }
  requireSingleChanged(result);
  return response;
}
