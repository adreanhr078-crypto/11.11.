import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rewardLiveEvent } from '../../functions/api/player/_liveChallenges';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';

interface RecordedStatement extends PlayerDatabaseStatement {
  query: string;
  values: unknown[];
}

function recordingDatabase(rewardEventChanges: number): {
  db: PlayerDatabase;
  batches: RecordedStatement[][];
} {
  const batches: RecordedStatement[][] = [];
  const db: PlayerDatabase = {
    prepare(query) {
      const statement: RecordedStatement = {
        query,
        values: [],
        bind(...values) {
          statement.values = values;
          return statement;
        },
        async first() { return null; },
        async all() { return { results: [] }; },
        async run() { return { meta: { changes: 1 } }; },
      };
      return statement;
    },
    async batch<T = unknown>(statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
      const recorded = statements as RecordedStatement[];
      batches.push(recorded);
      return recorded.map((_, index) => ({
        meta: { changes: index === 1 ? rewardEventChanges : 1 },
      })) as PlayerDatabaseResult<T>[];
    },
  };
  return { db, batches };
}

const account = {
  uid: 'weekly-player',
  displayName: null,
  email: null,
  photoURL: null,
  providerId: 'test',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
};

describe('live challenge reward transaction', () => {
  it('commits the final progress state and rare ownership in one batch', async () => {
    const { db, batches } = recordingDatabase(1);
    const progressStatement = db.prepare(
      "UPDATE live_player_weekly_progress SET status = 'completed'",
    );

    const receipt = await rewardLiveEvent(db, account, {
      rewardKey: 'weekly:2026-08-10:v1',
      rewardType: 'weekly',
      sourceId: 'smart-v2:weekly:2026-08-10',
      xp: 300,
      coins: 120,
      perfect: true,
      avatarId: 'rare_yuki',
      reward: { tier: 'rare', kind: 'avatar', label: 'Yuki', icon: '◇' },
      progressStatement,
    });

    assert.equal(batches.length, 1);
    assert.match(batches[0]![0]!.query, /UPDATE live_player_weekly_progress/);
    assert.match(batches[0]![1]!.query, /INSERT OR IGNORE INTO live_challenge_reward_events/);
    assert.ok(batches[0]!.some((statement) => statement.query.includes('player_avatar_unlock_events')));
    assert.equal(receipt.awarded, true);
    assert.equal(receipt.reward?.kind, 'avatar');
  });

  it('does not replay presentation rewards for an idempotent duplicate', async () => {
    const { db } = recordingDatabase(0);
    const receipt = await rewardLiveEvent(db, account, {
      rewardKey: 'daily:2026-08-11:v1',
      rewardType: 'daily',
      sourceId: 'smart-v2:daily:2026-08-11',
      xp: 90,
      coins: 30,
      perfect: false,
      reward: { tier: 'standard', kind: 'gift', label: 'Signal', icon: '⌁' },
      progressStatement: db.prepare(
        "UPDATE live_player_daily_attempts SET status = 'completed'",
      ),
    });

    assert.equal(receipt.awarded, false);
    assert.equal(receipt.xp, 0);
    assert.equal(receipt.coins, 0);
    assert.equal(receipt.reward, undefined);
  });
});
