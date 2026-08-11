import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { onRequestGet as getProfile, onRequestPut as putProfile } from '../../functions/api/player/profile';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

interface FakePlayer {
  user_id: string;
  username: string;
  total_xp: number;
  created_at: string;
}

class FakeStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(readonly database: FakeProfileDatabase, readonly query: string) {}

  bind(...values: unknown[]): PlayerDatabaseStatement {
    this.values = values;
    return this;
  }

  first<T>(): Promise<T | null> {
    return Promise.resolve(this.database.first(this) as T | null);
  }

  all<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve({
      results: this.database.all(this) as T[],
      success: true,
    });
  }

  run<T>(): Promise<PlayerDatabaseResult<T>> {
    return Promise.resolve(this.database.run(this) as PlayerDatabaseResult<T>);
  }
}

class FakeProfileDatabase implements PlayerDatabase {
  players = new Map<string, FakePlayer>();
  reservations = new Map<string, { normalized: string; userId: string; username: string }>();
  fragments = new Set<string>();

  prepare(query: string): PlayerDatabaseStatement {
    return new FakeStatement(this, query);
  }

  batch<T = unknown>(statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
    return Promise.resolve(statements.map((statement) => (
      this.run(statement as FakeStatement) as PlayerDatabaseResult<T>
    )));
  }

  private normalized(statement: FakeStatement): string {
    return statement.query.replace(/\s+/g, ' ').trim();
  }

  run(statement: FakeStatement): PlayerDatabaseResult {
    const query = this.normalized(statement);
    if (query.startsWith('INSERT INTO player_progression')) {
      const [userId, username, createdAt] = statement.values.map(String);
      const current = this.players.get(userId);
      this.players.set(userId, {
        user_id: userId,
        username: current?.username ?? username,
        total_xp: current?.total_xp ?? 0,
        created_at: current?.created_at ?? createdAt,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_username_reservations')) {
      const [normalized, userId, username] = statement.values.map(String);
      const owner = this.reservations.get(normalized);
      if (owner && owner.userId !== userId) throw new Error('unique username');
      for (const [key, reservation] of this.reservations) {
        if (reservation.userId === userId && key !== normalized) {
          this.reservations.delete(key);
        }
      }
      this.reservations.set(normalized, { normalized, userId, username });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('DELETE FROM player_username_reservations')) {
      const userId = String(statement.values[0]);
      for (const [key, value] of this.reservations) {
        if (value.userId === userId) this.reservations.delete(key);
      }
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('UPDATE player_progression')) {
      const values = statement.values.map(String);
      if (query.includes('SET total_xp')) {
        const userId = values[2];
        const player = this.players.get(userId);
        assert.ok(player);
        player.total_xp = 0;
        return { success: true, meta: { changes: 1 } };
      }
      const [username, , userId] = values;
      const player = this.players.get(userId);
      assert.ok(player);
      player.username = username;
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_profile_stats')) {
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unhandled fake D1 run: ${query}`);
  }

  first(statement: FakeStatement): Record<string, unknown> | null {
    const query = this.normalized(statement);
    if (query.includes('FROM player_username_reservations')) {
      const value = String(statement.values[0]);
      if (query.includes('normalized_username = ?')) {
        const owner = this.reservations.get(value);
        return owner ? {
          normalized_username: owner.normalized,
          user_id: owner.userId,
        } : null;
      }
      const owner = [...this.reservations.values()].find((entry) => entry.userId === value);
      return owner ? {
        normalized_username: owner.normalized,
        user_id: owner.userId,
      } : null;
    }
    if (query.includes('FROM player_progression AS player')) {
      const player = this.players.get(String(statement.values[0]));
      if (!player) return null;
      return this.apiRow(player);
    }
    if (query.includes('SELECT COUNT(*) AS total')) {
      if (query.includes('player_memory_fragment_events')) return { total: this.fragments.size };
      return { total: this.players.size };
    }
    throw new Error(`Unhandled fake D1 first: ${query}`);
  }

  all(statement: FakeStatement): Record<string, unknown>[] {
    const query = this.normalized(statement);
    if (query.includes('SELECT source_id')) return [];
    if (query.includes('RANK() OVER')) {
      return [...this.players.values()]
        .sort((left, right) => right.total_xp - left.total_xp)
        .slice(0, Number(statement.values[0]))
        .map((player) => this.apiRow(player));
    }
    throw new Error(`Unhandled fake D1 all: ${query}`);
  }

  private apiRow(player: FakePlayer): Record<string, unknown> {
    return {
      user_id: player.user_id,
      username: player.username,
      total_xp: player.total_xp,
      position: 1,
    };
  }
}

const originalFetch = globalThis.fetch;

function request(path: string, init?: RequestInit): Request {
  return new Request(`https://game.example${path}`, {
    ...init,
    headers: {
      Authorization: 'Bearer valid-id-token',
      'Content-Type': 'application/json',
      Origin: 'https://game.example',
      ...init?.headers,
    },
  });
}

function env(database: PlayerDatabase): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_DB: database,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('player profile gateway', () => {
  it('creates a server profile and starts verified Secrets Found at zero', async () => {
    const database = new FakeProfileDatabase();
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('accounts:lookup')) {
        return Response.json({
          users: [{
            localId: 'profile-player',
            displayName: 'Profile Runner',
            createdAt: '1700000000000',
            lastLoginAt: '1700000100000',
            providerUserInfo: [{ providerId: 'anonymous' }],
          }],
        });
      }
      if (init?.method === 'PATCH') {
        return Response.json({ updateTime: '2026-08-08T12:00:00.000Z' });
      }
      return Response.json({}, { status: 404 });
    };

    const response = await getProfile({
      request: request('/api/player/profile'),
      env: env(database),
    });
    const payload = await response.json() as {
      profile: {
        uid: string;
        subjectId: string;
        stats: { secretsFound: number };
        progression: { rank: number; totalXp: number };
      };
    };
    assert.equal(response.status, 200);
    assert.equal(payload.profile.uid, 'profile-player');
    assert.match(payload.profile.subjectId, /^SUBJECT-/);
    assert.equal(payload.profile.stats.secretsFound, 0);
    assert.equal(payload.profile.progression.rank, 1);
    assert.equal(payload.profile.progression.totalXp, 0);
  });

  it('rejects external avatar values before writing profile data', async () => {
    const database = new FakeProfileDatabase();
    let writes = 0;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('accounts:lookup')) {
        return Response.json({
          users: [{
            localId: 'profile-player',
            providerUserInfo: [{ providerId: 'password' }],
            createdAt: '1700000000000',
            lastLoginAt: '1700000100000',
          }],
        });
      }
      if (init?.method === 'PATCH') writes += 1;
      return Response.json({}, { status: 404 });
    };

    const response = await putProfile({
      request: request('/api/player/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: 'Valid Name',
          bio: '',
          avatarId: 'https://example.com/avatar.png',
        }),
      }),
      env: env(database),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json() as { code: string }).code, 'invalid_avatar');
    assert.equal(writes, 0);
  });

  it('rejects a username owned by another UID without merging profiles', async () => {
    const database = new FakeProfileDatabase();
    let activeUid = 'profile-one';
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('accounts:lookup')) {
        return Response.json({
          users: [{
            localId: activeUid,
            displayName: 'Runner',
            providerUserInfo: [{ providerId: 'password' }],
            createdAt: '1700000000000',
            lastLoginAt: '1700000100000',
          }],
        });
      }
      if (init?.method === 'PATCH') {
        return Response.json({ updateTime: '2026-08-08T12:00:00.000Z' });
      }
      return Response.json({}, { status: 404 });
    };

    const first = await putProfile({
      request: request('/api/player/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: 'Shared Name', bio: '', avatarId: 'echo' }),
      }),
      env: env(database),
    });
    assert.equal(first.status, 200);
    activeUid = 'profile-two';
    const second = await putProfile({
      request: request('/api/player/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: 'Shared Name', bio: '', avatarId: 'echo' }),
      }),
      env: env(database),
    });
    assert.equal(second.status, 409);
    assert.equal((await second.json() as { code: string }).code, 'username_taken');
    assert.equal(database.reservations.get('shared name')?.userId, 'profile-one');
  });

  it('atomically replaces a player username without leaving a stale reservation', async () => {
    const database = new FakeProfileDatabase();
    globalThis.fetch = async (input, init) => {
      if (String(input).includes('accounts:lookup')) {
        return Response.json({
          users: [{
            localId: 'profile-player',
            providerUserInfo: [{ providerId: 'password' }],
            createdAt: '1700000000000',
            lastLoginAt: '1700000100000',
          }],
        });
      }
      if (init?.method === 'PATCH') {
        return Response.json({ updateTime: '2026-08-08T12:00:00.000Z' });
      }
      return Response.json({}, { status: 404 });
    };

    for (const username of ['Old Signal', 'New Signal']) {
      const response = await putProfile({
        request: request('/api/player/profile', {
          method: 'PUT',
          body: JSON.stringify({ username, bio: '', avatarId: 'echo' }),
        }),
        env: env(database),
      });
      assert.equal(response.status, 200);
    }

    assert.equal(database.reservations.has('old signal'), false);
    assert.equal(database.reservations.get('new signal')?.userId, 'profile-player');
    assert.equal(database.reservations.size, 1);
  });
});
