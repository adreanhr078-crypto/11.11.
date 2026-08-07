import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  onRequestGet as getLeaderboard,
} from '../../functions/api/player/leaderboard';
import {
  onRequestPost as claimXp,
} from '../../functions/api/player/xp/claim';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';
import {
  CHAPTER_01_PUZZLES,
} from '../content/puzzles/chapter01Campaign';
import type {
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
} from '../domain/puzzles/campaignContracts';

interface FakePlayerRow {
  userId: string;
  username: string;
  totalXp: number;
  createdAt: string;
  updatedAt: string;
}

interface FakeRewardRow {
  userId: string;
  rewardKey: string;
  xpAmount: number;
}

class FakeStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(
    readonly database: FakePlayerDatabase,
    readonly query: string,
  ) {}

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

class FakePlayerDatabase implements PlayerDatabase {
  readonly players = new Map<string, FakePlayerRow>();
  readonly rewards = new Map<string, FakeRewardRow>();

  prepare(query: string): PlayerDatabaseStatement {
    return new FakeStatement(this, query);
  }

  async batch<T = unknown>(
    statements: PlayerDatabaseStatement[],
  ): Promise<PlayerDatabaseResult<T>[]> {
    return statements.map((statement) => (
      this.run(statement as FakeStatement) as PlayerDatabaseResult<T>
    ));
  }

  seed(userId: string, username: string, totalXp: number, index: number): void {
    const timestamp = new Date(1_700_000_000_000 + index).toISOString();
    this.players.set(userId, {
      userId,
      username,
      totalXp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  private normalized(statement: FakeStatement): string {
    return statement.query.replace(/\s+/g, ' ').trim();
  }

  run(statement: FakeStatement): PlayerDatabaseResult {
    const query = this.normalized(statement);
    if (query.startsWith('INSERT INTO player_progression')) {
      const [userId, username, createdAt, updatedAt] = statement.values as string[];
      const current = this.players.get(userId!);
      this.players.set(userId!, {
        userId: userId!,
        username: username!,
        totalXp: current?.totalXp ?? 0,
        createdAt: current?.createdAt ?? createdAt!,
        updatedAt: updatedAt!,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT OR IGNORE INTO xp_reward_events')) {
      const [userId, rewardKey, , , xpAmount] = statement.values;
      const key = `${String(userId)}:${String(rewardKey)}`;
      if (this.rewards.has(key)) {
        return { success: true, meta: { changes: 0 } };
      }
      this.rewards.set(key, {
        userId: String(userId),
        rewardKey: String(rewardKey),
        xpAmount: Number(xpAmount),
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('UPDATE player_progression')) {
      const [rewardUserId, updatedAt, userId] = statement.values;
      const player = this.players.get(String(userId));
      assert.ok(player);
      player.totalXp = [...this.rewards.values()]
        .filter((reward) => reward.userId === String(rewardUserId))
        .reduce((sum, reward) => sum + reward.xpAmount, 0);
      player.updatedAt = String(updatedAt);
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unhandled fake D1 run: ${query}`);
  }

  first(statement: FakeStatement): Record<string, unknown> | null {
    const query = this.normalized(statement);
    if (query.includes('SELECT COUNT(*) AS total')) {
      if (query.includes('FROM xp_reward_events')) {
        const [userId, ...rewardKeys] = statement.values.map(String);
        return {
          total: rewardKeys.filter((rewardKey) => (
            this.rewards.has(`${userId}:${rewardKey}`)
          )).length,
        };
      }
      return { total: this.players.size };
    }
    if (query.includes('FROM player_progression AS player')) {
      const player = this.players.get(String(statement.values[0]));
      if (!player) return null;
      return this.apiRow(player);
    }
    throw new Error(`Unhandled fake D1 first: ${query}`);
  }

  all(statement: FakeStatement): Record<string, unknown>[] {
    const query = this.normalized(statement);
    if (!query.includes('RANK() OVER')) {
      throw new Error(`Unhandled fake D1 all: ${query}`);
    }
    const limit = Number(statement.values[0]);
    return this.sortedPlayers().slice(0, limit).map((player) => (
      this.apiRow(player)
    ));
  }

  private sortedPlayers(): FakePlayerRow[] {
    return [...this.players.values()].sort((left, right) => (
      right.totalXp - left.totalXp
      || left.createdAt.localeCompare(right.createdAt)
      || left.userId.localeCompare(right.userId)
    ));
  }

  private apiRow(player: FakePlayerRow): Record<string, unknown> {
    return {
      user_id: player.userId,
      username: player.username,
      total_xp: player.totalXp,
      position: 1 + [...this.players.values()].filter(
        (other) => other.totalXp > player.totalXp,
      ).length,
    };
  }
}

const originalFetch = globalThis.fetch;

function correctSubmission(
  definition: CampaignPuzzleDefinition,
): CampaignPuzzleProgress[] {
  return definition.stages.map((stage, stageIndex) => ({
    stageIndex,
    values: stage.mode === 'match' ? [] : [...stage.solution],
    matches: stage.mode === 'match' ? { ...stage.solution } : {},
  }));
}

function authenticatedRequest(path: string, init?: RequestInit): Request {
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

function installFirebaseLookup(): void {
  globalThis.fetch = async (input) => {
    assert.match(String(input), /accounts:lookup/);
    return Response.json({
      users: [{
        localId: 'player-current',
        displayName: 'Current Player',
        createdAt: '1700000000000',
        lastLoginAt: '1700000100000',
        providerUserInfo: [{ providerId: 'password' }],
      }],
    });
  };
}

function testEnv(database: PlayerDatabase): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_DB: database,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('global leaderboard gateway', () => {
  it('awards a verified puzzle once and derives total XP from the ledger', async () => {
    installFirebaseLookup();
    const database = new FakePlayerDatabase();
    const env = testEnv(database);
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    const body = JSON.stringify({
      sourceType: 'puzzle',
      sourceId: puzzle.id,
      proof: correctSubmission(puzzle),
    });

    const first = await claimXp({
      request: authenticatedRequest('/api/player/xp/claim', {
        method: 'POST',
        body,
      }),
      env,
    });
    const firstPayload = await first.json() as {
      reward: { awarded: boolean; xpGranted: number };
      progression: { totalXp: number; level: number };
    };
    assert.equal(first.status, 200);
    assert.equal(firstPayload.reward.awarded, true);
    assert.equal(firstPayload.reward.xpGranted, 75);
    assert.equal(firstPayload.progression.totalXp, 75);
    assert.equal(firstPayload.progression.level, 1);

    const duplicate = await claimXp({
      request: authenticatedRequest('/api/player/xp/claim', {
        method: 'POST',
        body,
      }),
      env,
    });
    const duplicatePayload = await duplicate.json() as {
      reward: { awarded: boolean; xpGranted: number };
      progression: { totalXp: number };
    };
    assert.equal(duplicatePayload.reward.awarded, false);
    assert.equal(duplicatePayload.reward.xpGranted, 0);
    assert.equal(duplicatePayload.progression.totalXp, 75);
    assert.equal(database.rewards.size, 1);
  });

  it('rejects client-authored XP before touching the database', async () => {
    installFirebaseLookup();
    const database = new FakePlayerDatabase();
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    const response = await claimXp({
      request: authenticatedRequest('/api/player/xp/claim', {
        method: 'POST',
        body: JSON.stringify({
          sourceType: 'puzzle',
          sourceId: puzzle.id,
          proof: correctSubmission(puzzle),
          xp: 999_999,
        }),
      }),
      env: testEnv(database),
    });
    assert.equal(response.status, 400);
    assert.equal(
      (await response.json() as { code: string }).code,
      'client_xp_forbidden',
    );
    assert.equal(database.players.size, 0);
  });

  it('rejects a later puzzle until its previous reward exists', async () => {
    installFirebaseLookup();
    const database = new FakePlayerDatabase();
    const puzzle = CHAPTER_01_PUZZLES[1];
    assert.ok(puzzle);
    const response = await claimXp({
      request: authenticatedRequest('/api/player/xp/claim', {
        method: 'POST',
        body: JSON.stringify({
          sourceType: 'puzzle',
          sourceId: puzzle.id,
          proof: correctSubmission(puzzle),
        }),
      }),
      env: testEnv(database),
    });
    assert.equal(response.status, 409);
    assert.equal(
      (await response.json() as { code: string }).code,
      'reward_prerequisite_missing',
    );
    assert.equal(database.rewards.size, 0);
  });

  it('returns the current player even when outside the requested top list', async () => {
    installFirebaseLookup();
    const database = new FakePlayerDatabase();
    for (let index = 1; index <= 12; index += 1) {
      database.seed(
        `player-${index}`,
        `Player ${index}`,
        (13 - index) * 100,
        index,
      );
    }

    const response = await getLeaderboard({
      request: authenticatedRequest('/api/player/leaderboard?limit=5'),
      env: testEnv(database),
    });
    const payload = await response.json() as {
      leaderboard: {
        entries: Array<{ isCurrentPlayer: boolean }>;
        currentPlayer: { rank: number; username: string; totalXp: number };
        totalPlayers: number;
      };
      rankingMetric: string;
    };

    assert.equal(response.status, 200);
    assert.equal(payload.rankingMetric, 'total_xp');
    assert.equal(payload.leaderboard.entries.length, 5);
    assert.equal(
      payload.leaderboard.entries.some((entry) => entry.isCurrentPlayer),
      false,
    );
    assert.equal(payload.leaderboard.currentPlayer.rank, 13);
    assert.equal(payload.leaderboard.currentPlayer.username, 'Current Player');
    assert.equal(payload.leaderboard.currentPlayer.totalXp, 0);
    assert.equal(payload.leaderboard.totalPlayers, 13);
  });
});
