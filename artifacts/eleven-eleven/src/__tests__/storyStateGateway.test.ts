import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  onRequestGet as getStoryState,
} from '../../functions/api/player/story-state';
import {
  onRequestPost as claimCheckpoint,
} from '../../functions/api/player/story-state/checkpoint';
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
    if (query.includes('FROM player_manhwa_page_records')) {
      const [, chapterId, startPage, endPage] = statement.values;
      return [...this.pageRecords.values()]
        .filter((record) => (
          record.userId === userId
          && record.chapterId === String(chapterId)
          && record.globalPageNumber >= Number(startPage)
          && record.globalPageNumber <= Number(endPage)
        ))
        .map((record) => ({ global_page_number: record.globalPageNumber }));
    }
    if (query.includes("FROM xp_reward_events") && query.includes("source_type = 'manhwa'")) {
      return [...this.rewards.values()]
        .filter((reward) => reward.userId === userId)
        .flatMap((reward) => {
          const match = reward.rewardKey.match(/^manhwa:(chapter_[1-4]):v1$/);
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

describe('authoritative Story State gateway', () => {
  it('rejects a client-supplied Canon event ID', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    const response = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', {
        chapterId: 'chapter_4',
        pageId: 'manhwa_ch04_page_02',
        globalPageNumber: 56,
        eventId: 'manhwa_chapter_04_black_coronation',
      }),
      env: testEnv(database),
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json() as { code: string }).code, 'client_canon_event_forbidden');
    assert.equal(database.events.size, 0);
  });

  it('requires a prior verified chapter and records a valid checkpoint only once', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    const checkpoint = {
      chapterId: 'chapter_4',
      pageId: 'manhwa_ch04_page_02',
      globalPageNumber: 56,
    };

    const rejected = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint),
      env: testEnv(database),
    });
    assert.equal(rejected.status, 409);
    assert.equal((await rejected.json() as { code: string }).code, 'story_prerequisite_missing');

    database.seedReward('story-player', 'manhwa:chapter_3:v1', timestamp);
    const withoutCover = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint),
      env: testEnv(database),
    });
    assert.equal(withoutCover.status, 409);
    assert.equal(
      (await withoutCover.json() as { code: string }).code,
      'story_reading_prerequisite_missing',
    );

    const chapterCover = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', {
        chapterId: 'chapter_4',
        pageId: 'manhwa_ch04_page_01',
        globalPageNumber: 55,
      }),
      env: testEnv(database),
    });
    assert.equal(chapterCover.status, 200);
    assert.deepEqual(
      (await chapterCover.json() as { claimedEventIds: string[] }).claimedEventIds,
      [],
    );

    const first = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint),
      env: testEnv(database),
    });
    const firstPayload = await first.json() as { claimedEventIds: string[] };
    assert.equal(first.status, 200);
    assert.deepEqual(firstPayload.claimedEventIds, [
      'manhwa_chapter_04_black_coronation',
    ]);
    assert.equal(database.events.size, 1);
    assert.equal(database.rewards.size, 1, 'Story claims never add XP rows.');

    const protocolBeforeLina = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', {
        chapterId: 'chapter_4',
        pageId: 'manhwa_ch04_page_08',
        globalPageNumber: 62,
      }),
      env: testEnv(database),
    });
    assert.equal(protocolBeforeLina.status, 409);
    assert.equal(
      (await protocolBeforeLina.json() as { code: string }).code,
      'canon_event_prerequisite_missing',
    );

    const replay = await claimCheckpoint({
      request: authenticatedRequest('/api/player/story-state/checkpoint', checkpoint),
      env: testEnv(database),
    });
    assert.equal(replay.status, 200);
    assert.deepEqual(
      (await replay.json() as { claimedEventIds: string[] }).claimedEventIds,
      [],
    );
    assert.equal(database.events.size, 1);
  });

  it('backfills only proven chapter-four players and keeps Secrets at zero', async () => {
    installFirebaseLookup();
    const database = new StoryStateDatabase();
    database.seedReward('story-player', 'manhwa:chapter_3:v1', timestamp);
    database.seedReward('story-player', 'manhwa:chapter_4:v1', timestamp);

    const response = await getStoryState({
      request: authenticatedRequest('/api/player/story-state'),
      env: testEnv(database),
    });
    const payload = await response.json() as {
      storyState: {
        canonEventReceipts: Array<{ eventId: string }>;
        completedChapterIds: string[];
        discoveredMemoryFragmentIds: string[];
      };
    };

    assert.equal(response.status, 200);
    assert.deepEqual(
      payload.storyState.canonEventReceipts.map(({ eventId }) => eventId),
      [
        'manhwa_chapter_04_black_coronation',
        'manhwa_chapter_04_lina_protocol',
        'manhwa_chapter_04_black_echo_protocol',
      ],
    );
    assert.deepEqual(payload.storyState.completedChapterIds, ['chapter_3', 'chapter_4']);
    assert.deepEqual(payload.storyState.discoveredMemoryFragmentIds, []);
    assert.equal(database.events.size, 3);
    assert.equal(database.rewards.size, 2, 'Backfill must not award XP.');
  });

  it('defines append-only D1 guards for Canon records', () => {
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
