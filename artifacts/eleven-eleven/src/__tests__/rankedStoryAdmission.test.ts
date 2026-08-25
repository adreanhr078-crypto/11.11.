import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertRankedStoryEligibility } from '../../functions/api/player/_network';
import { PlayerApiError } from '../../functions/api/player/_shared';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import type { OnlineMode } from '../domain/echo-network/contracts';

class Statement implements PlayerDatabaseStatement {
  constructor(
    private readonly database: StoryReceiptDatabase,
    private readonly query: string,
  ) {}

  bind(..._values: unknown[]): PlayerDatabaseStatement {
    return this;
  }

  async first<T>(): Promise<T | null> {
    this.database.reads += 1;
    if (!this.query.includes('FROM xp_reward_events')) {
      throw new Error(`Unexpected query: ${this.query}`);
    }
    return (this.database.chapterThree
      ? { reward_key: 'manhwa:chapter_3:v1' }
      : null) as T | null;
  }

  async all<T>(): Promise<PlayerDatabaseResult<T>> {
    return { results: [], success: true };
  }

  async run<T>(): Promise<PlayerDatabaseResult<T>> {
    return { success: true, meta: { changes: 0 } };
  }
}

class StoryReceiptDatabase implements PlayerDatabase {
  reads = 0;

  constructor(readonly chapterThree: boolean) {}

  prepare(query: string): PlayerDatabaseStatement {
    return new Statement(this, query);
  }

  async batch<T = unknown>(_statements: PlayerDatabaseStatement[]): Promise<PlayerDatabaseResult<T>[]> {
    return [];
  }
}

async function admission(
  database: StoryReceiptDatabase,
  mode: OnlineMode,
): Promise<PlayerApiError | null> {
  try {
    await assertRankedStoryEligibility(database, 'ranked-player', mode);
    return null;
  } catch (error) {
    if (error instanceof PlayerApiError) return error;
    throw error;
  }
}

describe('Ranked story admission', () => {
  it('does not apply a story gate to Casual chess', async () => {
    const database = new StoryReceiptDatabase(false);
    assert.equal(await admission(database, 'chess_casual'), null);
    assert.equal(database.reads, 0);
  });

  it('refuses Ranked before the server-issued Chapter 3 receipt', async () => {
    const database = new StoryReceiptDatabase(false);
    const error = await admission(database, 'chess_ranked_blitz');
    assert.ok(error);
    assert.equal(error.code, 'ranked_story_locked');
    assert.equal(error.status, 409);
    assert.equal(database.reads, 1);
  });

  it('allows the next Rank gate to evaluate only after Chapter 3 is verified', async () => {
    const database = new StoryReceiptDatabase(true);
    assert.equal(await admission(database, 'chess_ranked_rapid'), null);
    assert.equal(database.reads, 1);
  });
});
