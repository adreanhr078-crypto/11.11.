import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  didInsertLiveHint,
  hasLiveChallengeProgression,
  requireLiveChallengeProgression,
  requiredStoryChapterForLiveChallenge,
} from '../../functions/api/player/_liveChallenges';
import { onRequestGet as getLive } from '../../functions/api/player/live';
import { onRequestPost as postLiveAction } from '../../functions/api/player/live/action';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { FirebaseAccount, PlayerApiEnv } from '../../functions/api/player/_shared';
import { createXpRewardKey } from '../domain/player-progression/playerProgression';

const account: FirebaseAccount = {
  uid: 'live-gate-player',
  displayName: null,
  email: null,
  photoURL: null,
  providerId: 'password',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
};

class GateDatabase implements PlayerDatabase {
  readonly queries: Array<{ query: string; values: unknown[] }> = [];

  constructor(private readonly rewardKeys: ReadonlySet<string> = new Set()) {}

  prepare(query: string): PlayerDatabaseStatement {
    const database = this;
    const statement = (values: unknown[] = []): PlayerDatabaseStatement => ({
      bind: (...next: unknown[]) => statement(next),
      first: async <T>() => {
        database.queries.push({ query, values });
        const rewardKey = String(values[1] ?? '');
        return (database.rewardKeys.has(rewardKey) ? { reward_key: rewardKey } : null) as T | null;
      },
      all: async <T>() => ({ results: [] as T[] }),
      run: async <T>() => ({ results: [] as T[] }),
    });
    return statement();
  }

  async batch<T = unknown>(): Promise<PlayerDatabaseResult<T>[]> {
    return [];
  }
}

function livePolicy(): string {
  return JSON.stringify({
    version: 1,
    expiresAt: '2099-01-01T00:00:00.000Z',
    dailyEnabled: true,
    weeklyEnabled: true,
  });
}

function environment(database: PlayerDatabase): PlayerApiEnv {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    PLAYER_ALLOWED_ORIGINS: 'https://game.example',
    PLAYER_ROLLOUT_POLICY: livePolicy(),
    PLAYER_DB: database,
  };
}

function request(path: string, init: RequestInit = {}): Request {
  return new Request(`https://game.example/api/player/${path}`, {
    ...init,
    headers: {
      Authorization: 'Bearer live-gate-token',
      Origin: 'https://game.example',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

async function withAuthenticatedPlayer<T>(work: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: account.uid,
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'password' }],
    }],
  });
  try {
    return await work();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function hasErrorCode(error: unknown, expectedCode: string): boolean {
  return error instanceof Error
    && (error as { code?: unknown }).code === expectedCode;
}

describe('live challenge progression and hint integrity', () => {
  it('maps Daily and Weekly to the only authoritative story gates', () => {
    assert.equal(requiredStoryChapterForLiveChallenge('daily'), 'chapter_1');
    assert.equal(requiredStoryChapterForLiveChallenge('weekly'), 'chapter_2');
  });

  it('fails closed without the required server Manhwa receipt', async () => {
    await assert.rejects(
      () => requireLiveChallengeProgression(new GateDatabase(), account, 'daily'),
      (error: unknown) => hasErrorCode(error, 'daily_story_locked'),
    );
    const weeklyDatabase = new GateDatabase(new Set([
      createXpRewardKey('manhwa', 'chapter_1'),
    ]));
    await assert.rejects(
      () => requireLiveChallengeProgression(weeklyDatabase, account, 'weekly'),
      (error: unknown) => hasErrorCode(error, 'weekly_story_locked'),
    );
  });

  it('keeps Weekly out of a Chapter 1 projection until Chapter 2 is receipted', async () => {
    const chapterOneOnly = new GateDatabase(new Set([
      createXpRewardKey('manhwa', 'chapter_1'),
    ]));
    assert.equal(await hasLiveChallengeProgression(chapterOneOnly, account, 'daily'), true);
    assert.equal(await hasLiveChallengeProgression(chapterOneOnly, account, 'weekly'), false);

    const chapterTwo = new GateDatabase(new Set([
      createXpRewardKey('manhwa', 'chapter_1'),
      createXpRewardKey('manhwa', 'chapter_2'),
    ]));
    assert.equal(await hasLiveChallengeProgression(chapterTwo, account, 'weekly'), true);

    const liveSource = readFileSync(
      new URL('../../functions/api/player/_liveChallenges.ts', import.meta.url),
      'utf8',
    );
    assert.match(liveSource, /const weeklyUnlocked = await hasLiveChallengeProgression\(db, account, 'weekly'\);/);
    assert.match(liveSource, /ensureDefinitions\(db, nowMs, weeklyUnlocked\)/);
    assert.match(liveSource, /weekly: weeklyDefinition && weeklyPublic \? \{/);
    assert.match(liveSource, /ensureDefinitions\(db, Date\.now\(\), false\)/);
  });

  it('enforces the same gate for deep-link reads and every Daily/Weekly write', async () => {
    await withAuthenticatedPlayer(async () => {
      const dailyWrite = await postLiveAction({
        request: request('live/action', {
          method: 'POST',
          body: JSON.stringify({ action: 'save-daily', draft: { answer: 'forged' } }),
        }),
        env: environment(new GateDatabase()),
      });
      assert.equal(dailyWrite.status, 409);
      assert.equal((await dailyWrite.json() as { code: string }).code, 'daily_story_locked');

      const weeklyWrite = await postLiveAction({
        request: request('live/action', {
          method: 'POST',
          body: JSON.stringify({ action: 'save-weekly', draft: { answer: 'forged' } }),
        }),
        env: environment(new GateDatabase()),
      });
      assert.equal(weeklyWrite.status, 409);
      assert.equal((await weeklyWrite.json() as { code: string }).code, 'weekly_story_locked');

      const snapshot = await getLive({
        request: request('live'),
        env: environment(new GateDatabase()),
      });
      assert.equal(snapshot.status, 409);
      assert.equal((await snapshot.json() as { code: string }).code, 'daily_story_locked');
    });
  });

  it('reports a raced INSERT OR IGNORE as an existing hint, never a second purchase', () => {
    assert.equal(didInsertLiveHint({ meta: { changes: 1 } }), true);
    assert.equal(didInsertLiveHint({ meta: { changes: 0 } }), false);
    assert.equal(didInsertLiveHint(undefined), false);
  });

  it('keeps the completed-story-puzzle guard inside the D1 migration authority', () => {
    const migration = readFileSync(
      new URL('../../migrations/0023_story_puzzle_completion_hint_guard.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /BEFORE INSERT ON player_story_puzzle_hint_events/);
    assert.match(migration, /player_story_puzzle_completion_events/);
    assert.match(migration, /story puzzle already complete/);
  });

  it('keeps perfect Daily and Weekly receipts behind a D1 hint-race guard', () => {
    const migration = readFileSync(
      new URL('../../migrations/0025_live_perfect_hint_integrity.sql', import.meta.url),
      'utf8',
    );
    const liveSource = readFileSync(
      new URL('../../functions/api/player/_liveChallenges.ts', import.meta.url),
      'utf8',
    );
    assert.match(migration, /enforce_daily_perfect_without_hint/);
    assert.match(migration, /enforce_live_reward_perfect_without_hint/);
    assert.match(migration, /live perfect solve requires no hint/);
    assert.match(liveSource, /function isLivePerfectHintConflict/);
    assert.match(liveSource, /return completeDaily\(db, account, answerValue, true\);/);
    assert.match(liveSource, /return completeWeeklyStage\(db, account, stageValue, answerValue, true\);/);
  });
});
