import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  onRequestGet as getChessTraining,
  onRequestPost as postChessTraining,
} from '../../functions/api/player/network/chess-training';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const originalFetch = globalThis.fetch;

type SessionStatus = 'active' | 'completed' | 'expired';

interface StoredSession {
  session_id: string;
  user_id: string;
  status: SessionStatus;
  step_index: number;
  fen: string;
  version: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface StoredEvent {
  request_fingerprint: string;
  response_json: string;
  event_type: string;
}

class TrainingStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(
    readonly database: TrainingDatabase,
    readonly query: string,
  ) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.database.first(this) as T | null;
  }

  async all<T>(): Promise<PlayerDatabaseResult<T>> {
    return { results: [], success: true };
  }

  async run<T>(): Promise<PlayerDatabaseResult<T>> {
    return this.database.execute(this) as PlayerDatabaseResult<T>;
  }
}

class TrainingDatabase implements PlayerDatabase {
  readonly sessions = new Map<string, StoredSession>();
  readonly events = new Map<string, StoredEvent>();
  readonly milestones = new Map<string, { chessTrainingCompletedAt: string | null; updatedAt: string }>();
  readonly writes: string[] = [];
  databaseTouches = 0;

  prepare(query: string): PlayerDatabaseStatement {
    this.databaseTouches += 1;
    return new TrainingStatement(this, query);
  }

  async batch<T = unknown>(statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
    this.databaseTouches += 1;
    const sessionSnapshot = new Map([...this.sessions].map(([key, value]) => [key, { ...value }]));
    const eventSnapshot = new Map([...this.events].map(([key, value]) => [key, { ...value }]));
    const milestoneSnapshot = new Map([...this.milestones].map(([key, value]) => [key, { ...value }]));
    const writesLength = this.writes.length;
    try {
      return statements.map((statement) => this.execute(statement as TrainingStatement) as PlayerDatabaseResult<T>);
    } catch (error) {
      this.sessions.clear();
      this.events.clear();
      this.milestones.clear();
      for (const [key, value] of sessionSnapshot) this.sessions.set(key, value);
      for (const [key, value] of eventSnapshot) this.events.set(key, value);
      for (const [key, value] of milestoneSnapshot) this.milestones.set(key, value);
      this.writes.splice(writesLength);
      throw error;
    }
  }

  first(statement: TrainingStatement): unknown {
    const query = statement.query;
    if (query.includes('FROM chess_training_session_events')) {
      const [sessionId, uid, idempotencyKey] = statement.values as [string, string, string];
      const session = this.sessions.get(sessionId);
      if (!session || session.user_id !== uid) return null;
      return this.events.get(`${sessionId}:${idempotencyKey}`) ?? null;
    }
    if (query.includes('FROM chess_training_sessions') && query.includes('session_id = ? AND user_id = ?')) {
      const [sessionId, uid] = statement.values as [string, string];
      const session = this.sessions.get(sessionId);
      return session?.user_id === uid ? { ...session } : null;
    }
    if (query.includes('FROM chess_training_sessions') && query.includes("status IN ('active', 'completed')")) {
      const [uid] = statement.values as [string];
      const candidates = [...this.sessions.values()]
        .filter((session) => session.user_id === uid && (session.status === 'active' || session.status === 'completed'))
        .sort((left, right) => {
          const statusOrder = Number(left.status !== 'active') - Number(right.status !== 'active');
          return statusOrder || right.updated_at.localeCompare(left.updated_at);
        });
      return candidates[0] ? { ...candidates[0] } : null;
    }
    throw new Error(`Unexpected D1 first query: ${query}`);
  }

  execute(statement: TrainingStatement): PlayerDatabaseResult {
    const query = statement.query;
    this.writes.push(query);
    if (query.includes('INSERT INTO player_progression')) {
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes('INSERT OR IGNORE INTO network_player_milestones')) {
      const [uid, , , now] = statement.values as [string, string, number, string];
      if (!this.milestones.has(uid)) {
        this.milestones.set(uid, { chessTrainingCompletedAt: null, updatedAt: now });
        return { success: true, meta: { changes: 1 } };
      }
      return { success: true, meta: { changes: 0 } };
    }
    if (query.includes('INSERT INTO chess_training_sessions')) {
      const [id, uid, fen, expiresAt, createdAt, updatedAt] = statement.values as [string, string, string, string, string, string];
      if ([...this.sessions.values()].some((session) => session.user_id === uid && session.status === 'active')) {
        throw new Error('UNIQUE constraint failed: chess_training_sessions.user_id');
      }
      this.sessions.set(id, {
        session_id: id,
        user_id: uid,
        status: 'active',
        step_index: 0,
        fen,
        version: 0,
        expires_at: expiresAt,
        created_at: createdAt,
        updated_at: updatedAt,
        completed_at: null,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes("SET status = 'expired'")) {
      const [updatedAt, id, uid, version, limit] = statement.values as [string, string, string, number, string];
      const session = this.sessions.get(id);
      if (!session || session.user_id !== uid || session.status !== 'active' || session.version !== version || session.expires_at > limit) {
        return { success: true, meta: { changes: 0 } };
      }
      session.status = 'expired';
      session.updated_at = updatedAt;
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes('UPDATE chess_training_sessions') && query.includes('SET status = ?')) {
      const [status, stepIndex, fen, version, updatedAt, completedAt, id, uid, expectedVersion, now] = statement.values as [
        SessionStatus, number, string, number, string, string | null, string, string, number, string,
      ];
      const session = this.sessions.get(id);
      if (!session || session.user_id !== uid || session.status !== 'active'
        || session.version !== expectedVersion || session.expires_at <= now) {
        return { success: true, meta: { changes: 0 } };
      }
      session.status = status;
      session.step_index = stepIndex;
      session.fen = fen;
      session.version = version;
      session.updated_at = updatedAt;
      session.completed_at = completedAt;
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes('INSERT INTO chess_training_session_events')) {
      const [, sessionId, uid, eventType, version, stepIndex, idempotencyKey, fingerprint, responseJson] = statement.values as [
        string, string, string, string, number, number, string, string, string, string,
      ];
      const session = this.sessions.get(sessionId);
      if (!session || session.user_id !== uid || session.version !== version || session.step_index !== stepIndex) {
        throw new Error('chess training event state mismatch');
      }
      if (this.events.has(`${sessionId}:${idempotencyKey}`)) {
        throw new Error('UNIQUE constraint failed: chess_training_session_events');
      }
      this.events.set(`${sessionId}:${idempotencyKey}`, {
        request_fingerprint: fingerprint,
        response_json: responseJson,
        event_type: eventType,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes('UPDATE network_player_milestones') && query.includes('chess_training_completed_at')) {
      const [completedAt, updatedAt, uid] = statement.values as [string, string, string];
      const current = this.milestones.get(uid);
      if (!current) throw new Error('missing network player');
      this.milestones.set(uid, {
        chessTrainingCompletedAt: current.chessTrainingCompletedAt ?? completedAt,
        updatedAt,
      });
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unexpected D1 write query: ${query}`);
  }
}

function rolloutPolicy(enabled = true): string | undefined {
  return enabled ? JSON.stringify({
    version: 1,
    expiresAt: '2099-01-01T00:00:00.000Z',
    networkEnabled: true,
  }) : undefined;
}

function environment(database: TrainingDatabase, enabled = true): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_ROLLOUT_POLICY: rolloutPolicy(enabled),
    PLAYER_DB: database,
  };
}

function request(
  path: string,
  uid: string,
  body?: Record<string, unknown>,
): Request {
  return new Request(`http://localhost:8788/api/player/network/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer token-${uid}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Origin: 'http://localhost:8788',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function id(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

interface TrainingResponse {
  protocolVersion: 1;
  training: 'chess';
  session: {
    id: string;
    status: SessionStatus;
    version: number;
    stepIndex: number;
    step: string | null;
    fen?: string;
    completedAt: string | null;
  };
}

async function start(database: TrainingDatabase, uid = 'alice'): Promise<TrainingResponse> {
  const response = await getChessTraining({ request: request('chess-training', uid), env: environment(database) });
  assert.equal(response.status, 200);
  return response.json() as Promise<TrainingResponse>;
}

async function submit(
  database: TrainingDatabase,
  uid: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return postChessTraining({ request: request('chess-training', uid, body), env: environment(database) });
}

function move(session: TrainingResponse, key: number, from: string, to: string): Record<string, unknown> {
  return {
    version: 1,
    sessionId: session.session.id,
    idempotencyKey: id(key),
    expectedVersion: session.session.version,
    from,
    to,
  };
}

beforeEach(() => {
  globalThis.fetch = async (_input, init) => {
    const idToken = JSON.parse(String(init?.body ?? '{}')).idToken as string;
    const uid = idToken.replace(/^token-/, '');
    return Response.json({
      users: [{
        localId: uid,
        displayName: uid,
        createdAt: '1700000000000',
        lastLoginAt: '1700000100000',
        providerUserInfo: [{ providerId: 'password' }],
      }],
    });
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('verified chess training gateway', () => {
  it('issues only one UID-bound board and fails closed before D1 when Network is disabled', async () => {
    const database = new TrainingDatabase();
    const disabled = await getChessTraining({
      request: request('chess-training', 'alice'),
      env: environment(database, false),
    });
    assert.equal(disabled.status, 403);
    assert.deepEqual(await disabled.json(), {
      error: 'This experience is not available yet.',
      code: 'rollout_disabled',
    });
    assert.equal(database.databaseTouches, 0);

    const first = await start(database, 'alice');
    const resumed = await start(database, 'alice');
    assert.equal(first.session.id, resumed.session.id);
    assert.equal(first.session.step, 'develop-a-knight');
    assert.equal(first.session.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    const crossUser = await submit(database, 'bob', move(first, 1, 'g1', 'f3'));
    assert.equal(crossUser.status, 404);
    assert.deepEqual(await crossUser.json(), {
      error: 'This verified training session was not found.',
      code: 'training_session_not_found',
    });
    assert.equal(database.sessions.get(first.session.id)?.version, 0);
  });

  it('rejects illegal and legal-but-wrong moves without changing the server board', async () => {
    const database = new TrainingDatabase();
    const session = await start(database);
    const wrong = await submit(database, 'alice', move(session, 2, 'a2', 'a3'));
    assert.equal(wrong.status, 422);
    assert.deepEqual(await wrong.json(), {
      error: 'That legal move does not satisfy this training objective.',
      code: 'training_goal_not_met',
    });
    const illegal = await submit(database, 'alice', move(session, 3, 'e2', 'e5'));
    assert.equal(illegal.status, 422);
    assert.deepEqual(await illegal.json(), {
      error: 'That chess move is not legal on this training board.',
      code: 'invalid_training_move',
    });
    assert.equal(database.sessions.get(session.session.id)?.version, 0);
    assert.equal(database.events.size, 1, 'only the start event is retained');
  });

  it('uses versioning and immutable idempotency responses for accepted moves', async () => {
    const database = new TrainingDatabase();
    const session = await start(database);
    const requestBody = move(session, 4, 'g1', 'f3');
    const first = await submit(database, 'alice', requestBody);
    assert.equal(first.status, 200);
    const firstJson = await first.json() as TrainingResponse;
    assert.equal(firstJson.session.version, 1);
    assert.equal(firstJson.session.step, 'escape-check');

    const duplicate = await submit(database, 'alice', requestBody);
    assert.equal(duplicate.status, 200);
    assert.deepEqual(await duplicate.json(), firstJson);
    assert.equal(database.sessions.get(session.session.id)?.version, 1);
    assert.equal(database.events.size, 2, 'the duplicate must not apply another move');

    const stale = await submit(database, 'alice', {
      ...move(session, 5, 'b1', 'c3'),
      expectedVersion: 0,
    });
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), {
      error: 'This training board changed. Resume the latest board.',
      code: 'training_stale_version',
    });

    const reused = await submit(database, 'alice', {
      ...requestBody,
      to: 'h3',
    });
    assert.equal(reused.status, 409);
    assert.deepEqual(await reused.json(), {
      error: 'This training request key was already used for another move.',
      code: 'training_idempotency_reused',
    });
  });

  it('expires a stale board instead of accepting a late move', async () => {
    const database = new TrainingDatabase();
    const session = await start(database);
    const stored = database.sessions.get(session.session.id)!;
    stored.expires_at = '2000-01-01T00:00:00.000Z';
    const response = await submit(database, 'alice', move(session, 6, 'g1', 'f3'));
    assert.equal(response.status, 410);
    assert.deepEqual(await response.json(), {
      error: 'This training board expired. Start or resume a new board.',
      code: 'training_session_expired',
    });
    assert.equal(database.sessions.get(session.session.id)?.status, 'expired');
    assert.equal(database.milestones.get('alice')?.chessTrainingCompletedAt, null);
  });

  it('requires all three server-validated lessons and only stamps the training milestone', async () => {
    const database = new TrainingDatabase();
    const first = await start(database);
    const development = await submit(database, 'alice', move(first, 7, 'g1', 'f3'));
    assert.equal(development.status, 200);
    const second = await development.json() as TrainingResponse;
    assert.equal(second.session.step, 'escape-check');

    const survival = await submit(database, 'alice', move(second, 8, 'e1', 'f1'));
    assert.equal(survival.status, 200);
    const third = await survival.json() as TrainingResponse;
    assert.equal(third.session.step, 'capture-hanging-queen');

    const capture = await submit(database, 'alice', move(third, 9, 'e2', 'd4'));
    assert.equal(capture.status, 200);
    const completed = await capture.json() as TrainingResponse;
    assert.equal(completed.session.status, 'completed');
    assert.equal(completed.session.step, null);
    assert.ok(completed.session.completedAt);
    assert.ok(database.milestones.get('alice')?.chessTrainingCompletedAt);

    const queryText = database.writes.join('\n').toLowerCase();
    assert.doesNotMatch(queryText, /xp_reward|currency|coin|achievement|chess_ratings|chess_rating_events/);

    const duplicateCompletion = await submit(database, 'alice', move(third, 9, 'e2', 'd4'));
    assert.equal(duplicateCompletion.status, 200);
    assert.deepEqual(await duplicateCompletion.json(), completed);
    assert.equal(database.events.size, 4, 'start plus exactly three accepted server moves');
  });
});
