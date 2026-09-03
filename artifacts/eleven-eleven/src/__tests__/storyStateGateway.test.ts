import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  onRequestGet as getStoryState,
} from '../../functions/api/player/story-state';
import {
  onRequestPost as claimCheckpoint,
} from '../../functions/api/player/story-state/checkpoint';
import {
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  getFinalManhwaChapterRewardSourceId,
} from '../content/manhwa/finalManhwa';
import { createXpRewardKey } from '../domain/player-progression/playerProgression';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

interface RewardRow {
  userId: string;
  rewardKey: string;
  grantedAt: string;
}

interface CanonRow {
  userId: string;
  eventId: string;
  eventVersion: number;
  sourceType: string;
  sourceId: string;
  sourcePageId: string;
  sourcePageNumber: number;
  reachedAt: string;
}

interface PageRecordRow {
  userId: string;
  chapterId: string;
  pageId: string;
  globalPageNumber: number;
}

class FakeStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(
    readonly database: StoryStateDatabase,
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

class StoryStateDatabase implements PlayerDatabase {
  readonly players = new Set<string>();
  readonly rewards = new Map<string, RewardRow>();
  readonly events = new Map<string, CanonRow>();
  readonly pageRecords = new Map<string, PageRecordRow>();
  readonly fragments = new Set<string>();
  readonly completions = new Set<string>();

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

  seedReward(userId: string, rewardKey: string, grantedAt: string): void {
    this.rewards.set(`${userId}:${rewardKey}`, { userId, rewardKey, grantedAt });
  }

  seedCompletion(userId: string, puzzleId: string): void {
    this.completions.add(`${userId}:${puzzleId}`);
  }

  private normalized(statement: FakeStatement): string {
    return statement.query.replace(/\s+/g, ' ').trim();
  }

  run(statement: FakeStatement): PlayerDatabaseResult {
    const query = this.normalized(statement);
    if (query.startsWith('INSERT INTO player_progression')) {
      this.players.add(String(statement.values[0]));
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT OR IGNORE INTO player_manhwa_page_records')) {
      const [userId, chapterId, pageId, globalPageNumber] = statement.values;
      const key = `${userId}:${pageId}`;
      if (this.pageRecords.has(key)) return { success: true, meta: { changes: 0 } };
      this.pageRecords.set(key, {
        userId: String(userId),
        chapterId: String(chapterId),
        pageId: String(pageId),
        globalPageNumber: Number(globalPageNumber),
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT OR IGNORE INTO player_canon_event_records')) {
      const [
        userId,
        eventId,
        eventVersion,
        sourceType,
        sourceId,
        sourcePageId,
        sourcePageNumber,
        reachedAt,
      ] = statement.values;
      const key = `${userId}:${eventId}:${eventVersion}`;
      if (this.events.has(key)) return { success: true, meta: { changes: 0 } };
      this.events.set(key, {
        userId: String(userId),
        eventId: String(eventId),
        eventVersion: Number(eventVersion),
        sourceType: String(sourceType),
        sourceId: String(sourceId),
        sourcePageId: String(sourcePageId),
        sourcePageNumber: Number(sourcePageNumber),
        reachedAt: String(reachedAt),
      });
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unhandled fake D1 run: ${query}`);
  }

  first(statement: FakeStatement): Record<string, unknown> | null {
    const query = this.normalized(statement);
    if (query.includes('SELECT granted_at FROM xp_reward_events')) {
      const [userId, rewardKey] = statement.values.map(String);
      const reward = this.rewards.get(`${userId}:${rewardKey}`);
      return reward ? { granted_at: reward.grantedAt } : null;
    }
    if (query.includes('SELECT COUNT(*) AS total FROM xp_reward_events')) {
      const [userId, rewardKey] = statement.values.map(String);
      return { total: this.rewards.has(`${userId}:${rewardKey}`) ? 1 : 0 };
    }
    if (query.includes('SELECT COUNT(*) AS total FROM player_canon_event_records')) {
      const [userId, eventId] = statement.values.map(String);
      return {
        total: [...this.events.values()].filter((event) => (
          event.userId === userId && event.eventId === eventId
        )).length,
      };
    }
    throw new Error(`Unhandled fake D1 first: ${query}`);
  }

  all(statement: FakeStatement): Record<string, unknown>[] {
    const query = this.normalized(statement);
    const userId = String(statement.values[0]);
    if (query.includes('FROM player_story_puzzle_completion_events')) {
      return [...this.completions]
        .filter((entry) => entry.startsWith(`${userId}:`))
        .map((entry) => ({ puzzle_id: entry.slice(userId.length + 1) }));
    }
    if (query.includes('FROM player_canon_event_records')) {
      return [...this.events.values()]
        .filter((event) => event.userId === userId)
        .sort((left, right) => left.sourcePageNumber - right.sourcePageNumber)
        .map((event) => ({
          event_id: event.eventId,
          event_version: event.eventVersion,
          source_type: event.sourceType,
          source_id: event.sourceId,
          source_page_id: event.sourcePageId,
          source_page_number: event.sourcePageNumber,
          reached_at: event.reachedAt,
        }));
    }
    if (query.startsWith('SELECT page_id FROM player_manhwa_page_records')) {
      const pageIds = new Set(statement.values.slice(1).map(String));
      return [...this.pageRecords.values()]
        .filter((record) => record.userId === userId && pageIds.has(record.pageId))
        .map((record) => ({ page_id: record.pageId }));
    }
    if (query.includes("FROM xp_reward_events") && query.includes("source_type = 'manhwa'")) {
      return [...this.rewards.values()]
        .filter((reward) => reward.userId === userId)
        .flatMap((reward) => {
          const match = reward.rewardKey.match(/^manhwa:(.+):v1$/);
          return match ? [{ source_id: match[1] }] : [];
        });
    }
    if (query.includes('FROM player_memory_fragment_events')) {
      return [...this.fragments]
        .filter((entry) => entry.startsWith(`${userId}:`))
        .map((entry) => ({ fragment_id: entry.slice(userId.length + 1) }));
    }
    throw new Error(`Unhandled fake D1 all: ${query}`);
  }
}

const originalFetch = globalThis.fetch;
const timestamp = '2026-08-09T11:11:00.000Z';
const page = (number: number) => FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[number]!;

function testEnv(database: PlayerDatabase): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_DB: database,
  };
}

function authenticatedRequest(path: string, body?: unknown): Request {
  return new Request(`https://game.example${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer valid-id-token',
      Origin: 'https://game.example',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function checkpoint(pageNumber: number) {
  const current = page(pageNumber);
  return {
    chapterId: current.chapterId,
    pageId: current.id,
    globalPageNumber: current.globalPageNumber,
  };
}

function installFirebaseLookup(): void {
  globalThis.fetch = async (input) => {
    assert.match(String(input), /accounts:lookup/);
    return Response.json({
      users: [{
        localId: 'story-player',
        displayName: 'Story Player',
        createdAt: '1700000000000',
        lastLoginAt: '1700000100000',
        providerUserInfo: [{ providerId: 'anonymous' }],
      }],
    });
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('corrected authoritative Story State gateway', () => {
  it('rejects client-supplied Canon event IDs and V2 page identifiers', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    const eventResponse = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', {
        ...checkpoint(7),
        eventId: 'manhwa_chapter_04_black_coronation',
      }),
      env: testEnv(database),
    });
    assert.equal(eventResponse.status, 400);
    assert.equal((await eventResponse.json() as { code: string }).code,
      'client_canon_event_forbidden');

    const v2Response = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', {
        chapterId: 'chapter_1',
        pageId: 'manhwa_ch01_page_07',
        globalPageNumber: 7,
      }),
      env: testEnv(database),
    });
    assert.equal(v2Response.status, 400);
    assert.equal((await v2Response.json() as { code: string }).code, 'invalid_request');
    assert.equal(database.pageRecords.size, 0);
  });

  it('records a published baseline page but refuses p8/p9 without a verified current puzzle', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();

    const baseline = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint(7)),
      env: testEnv(database),
    });
    assert.equal(baseline.status, 200);
    assert.deepEqual((await baseline.json() as { claimedEventIds: string[] }).claimedEventIds, []);
    assert.equal(database.pageRecords.size, 1);

    const locked = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint(9)),
      env: testEnv(database),
    });
    assert.equal(locked.status, 409);
    assert.equal((await locked.json() as { code: string }).code, 'story_page_locked');
    assert.equal(database.pageRecords.size, 1);
  });

  it('permits p8/p9 only after the V3 signal-sync receipt and records no unapproved Canon event', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    database.seedCompletion('story-player', 'story_puzzle_01_echo_network_signal_sync');

    const eight = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint(8)),
      env: testEnv(database),
    });
    const nine = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint(9)),
      env: testEnv(database),
    });
    assert.equal(eight.status, 200);
    assert.equal(nine.status, 200);
    assert.deepEqual((await eight.json() as { claimedEventIds: string[] }).claimedEventIds, []);
    assert.deepEqual((await nine.json() as { claimedEventIds: string[] }).claimedEventIds, []);
    assert.equal(database.pageRecords.size, 2);
    assert.equal(database.events.size, 0);
  });

  it('does not backfill retired V2 rewards or events into the corrected story snapshot', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    database.seedReward('story-player', 'manhwa:chapter_4:v1', timestamp);
    database.seedReward('story-player', 'manhwa:chapter_3:v1', timestamp);

    const response = await getStoryState({
      request: authenticatedRequest('/api/player/story-state'),
      env: testEnv(database),
    });
    const payload = await response.json() as {
      storyState: {
        canonEventReceipts: Array<{ eventId: string }>;
        completedChapterIds: string[];
      };
    };
    assert.equal(response.status, 200);
    assert.deepEqual(payload.storyState.canonEventReceipts, []);
    assert.deepEqual(payload.storyState.completedChapterIds, []);
    assert.equal(database.events.size, 0);
  });

  it('maps only a correctly namespaced V3 Chapter 1 reward to the public completion state', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    const sourceId = getFinalManhwaChapterRewardSourceId('chapter_1')!;
    database.seedReward('story-player', createXpRewardKey('manhwa', sourceId), timestamp);

    const response = await getStoryState({
      request: authenticatedRequest('/api/player/story-state'),
      env: testEnv(database),
    });
    const payload = await response.json() as {
      storyState: { completedChapterIds: string[] };
    };
    assert.equal(response.status, 200);
    assert.deepEqual(payload.storyState.completedChapterIds, ['chapter_1']);
  });

  it('defines append-only D1 guards for Canon and reader records', () => {
    const migration = readFileSync(
      new URL('../../migrations/0004_story_state_events.sql', import.meta.url),
      'utf8',
    );

    assert.match(migration, /CREATE TABLE IF NOT EXISTS player_canon_event_records/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS player_manhwa_page_records/);
    assert.match(migration, /prevent_player_manhwa_page_record_update/);
    assert.match(migration, /prevent_player_manhwa_page_record_delete/);
    assert.match(migration, /prevent_player_canon_event_record_update/);
    assert.match(migration, /prevent_player_canon_event_record_delete/);
    assert.match(migration, /append-only/);
  });
});
