import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  completeStoryPuzzle,
  discoverStoryPuzzle,
  saveStoryPuzzleDraft,
  unlockStoryPuzzleHint,
} from '../../functions/api/player/_storyPuzzles';
import { SERVER_STORY_PUZZLE_BY_ID } from '../../functions/api/player/_storyPuzzleDefinitions';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
  PlayerDatabaseStatement,
} from '../../functions/api/player/_database';
import { PlayerApiError, type FirebaseAccount } from '../../functions/api/player/_shared';
import type { StoryPuzzleDraft } from '../domain/story-puzzles/storyPuzzleContracts';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';

interface CompletionRow {
  userId: string;
  puzzleId: string;
  perfectSolve: number;
  completedAt: string;
}

interface HintRow {
  userId: string;
  puzzleId: string;
  hintIndex: number;
}

interface CoinRow {
  userId: string;
  amount: number;
}

class FakeStatement implements PlayerDatabaseStatement {
  values: unknown[] = [];

  constructor(
    readonly database: StoryPuzzleDatabase,
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

/**
 * Small D1 model for the Phase 3 gateway. It mirrors the append-only unique
 * receipts and the 0006 database trigger that records a paid hint debit.
 */
class StoryPuzzleDatabase implements PlayerDatabase {
  players = new Set<string>();
  pages = new Set<string>();
  canonEvents = new Set<string>();
  completions = new Map<string, CompletionRow>();
  discoveries = new Set<string>();
  hints = new Map<string, HintRow>();
  drafts = new Map<string, string>();
  coins = new Map<string, CoinRow>();
  xpRewards = new Map<string, number>();
  fragments = new Map<string, { userId: string; sourceId: string }>();

  prepare(query: string): PlayerDatabaseStatement {
    return new FakeStatement(this, query);
  }

  async batch<T = unknown>(
    statements: PlayerDatabaseStatement[],
  ): Promise<PlayerDatabaseResult<T>[]> {
    const snapshot = this.snapshot();
    try {
      return statements.map((statement) => (
        this.run(statement as FakeStatement) as PlayerDatabaseResult<T>
      ));
    } catch (error) {
      this.restore(snapshot);
      throw error;
    }
  }

  seedPage(userId: string, pageId: string): void {
    this.pages.add(`${userId}:${pageId}`);
  }

  seedCanonEvent(userId: string, eventId: string): void {
    this.canonEvents.add(`${userId}:${eventId}`);
  }

  seedCompletion(userId: string, puzzleId: string): void {
    this.completions.set(`${userId}:${puzzleId}`, {
      userId,
      puzzleId,
      perfectSolve: 0,
      completedAt: '2026-08-09T11:11:00.000Z',
    });
  }

  seedCoins(userId: string, amount: number): void {
    this.coins.set(`${userId}:seed:${this.coins.size}`, { userId, amount });
  }

  coinBalance(userId: string): number {
    return [...this.coins.values()]
      .filter((coin) => coin.userId === userId)
      .reduce((total, coin) => total + coin.amount, 0);
  }

  private normalized(statement: FakeStatement): string {
    return statement.query.replace(/\s+/g, ' ').trim();
  }

  private key(userId: unknown, id: unknown): string {
    return `${String(userId)}:${String(id)}`;
  }

  private unique(): never {
    throw new Error('UNIQUE constraint failed');
  }

  run(statement: FakeStatement): PlayerDatabaseResult {
    const query = this.normalized(statement);
    if (query.startsWith('INSERT INTO player_progression')) {
      this.players.add(String(statement.values[0]));
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_story_puzzle_completion_events')) {
      const [userId, puzzleId, , , , , perfectSolve, completedAt] = statement.values;
      const key = this.key(userId, puzzleId);
      if (this.completions.has(key)) this.unique();
      this.completions.set(key, {
        userId: String(userId),
        puzzleId: String(puzzleId),
        perfectSolve: Number(perfectSolve),
        completedAt: String(completedAt),
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT OR IGNORE INTO player_story_puzzle_discovery_events')) {
      const [userId, puzzleId] = statement.values;
      const key = this.key(userId, puzzleId);
      if (this.discoveries.has(key)) return { success: true, meta: { changes: 0 } };
      this.discoveries.add(key);
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO xp_reward_events')) {
      const [userId, rewardKey, , xpAmount] = statement.values;
      const key = this.key(userId, rewardKey);
      if (this.xpRewards.has(key)) this.unique();
      this.xpRewards.set(key, Number(xpAmount));
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_memory_fragment_events')) {
      const [userId, fragmentId, sourceId] = statement.values;
      const key = this.key(userId, fragmentId);
      if (this.fragments.has(key)) this.unique();
      this.fragments.set(key, { userId: String(userId), sourceId: String(sourceId) });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_coin_events')) {
      const [userId, eventKey, , amount] = statement.values;
      const key = this.key(userId, eventKey);
      if (this.coins.has(key)) this.unique();
      this.coins.set(key, { userId: String(userId), amount: Number(amount) });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('DELETE FROM player_story_puzzle_progress')) {
      const [userId, puzzleId] = statement.values;
      this.drafts.delete(this.key(userId, puzzleId));
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('UPDATE player_progression')) {
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_story_puzzle_progress')) {
      const [userId, puzzleId, , progressJson] = statement.values;
      this.drafts.set(this.key(userId, puzzleId), String(progressJson));
      return { success: true, meta: { changes: 1 } };
    }
    if (query.startsWith('INSERT INTO player_story_puzzle_hint_events')) {
      const [userId, puzzleId, hintIndex, coinCost] = statement.values;
      const key = `${String(userId)}:${String(puzzleId)}:${String(hintIndex)}`;
      if (this.hints.has(key)) this.unique();
      // Mirrors `enforce_story_puzzle_hint_balance` and
      // `record_story_puzzle_hint_spend` in migration 0006.
      if (Number(coinCost) > 0 && this.coinBalance(String(userId)) < Number(coinCost)) {
        throw new Error('insufficient verified coins');
      }
      this.hints.set(key, { userId: String(userId), puzzleId: String(puzzleId), hintIndex: Number(hintIndex) });
      if (Number(coinCost) > 0) {
        this.coins.set(`${String(userId)}:${String(puzzleId)}:hint:${String(hintIndex)}:v1`, {
          userId: String(userId), amount: -Number(coinCost),
        });
      }
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unhandled fake D1 run: ${query}`);
  }

  first(statement: FakeStatement): Record<string, unknown> | null {
    const query = this.normalized(statement);
    const userId = String(statement.values[0]);
    if (query.includes('COALESCE(SUM(amount), 0) AS total FROM player_coin_events')) {
      return { total: this.coinBalance(userId) };
    }
    if (query.includes('COUNT(*) AS total') && query.includes('player_memory_fragment_events')) {
      return {
        total: [...this.fragments.values()].filter((fragment) => (
          fragment.userId === userId && fragment.sourceId.startsWith('story_puzzle_')
        )).length,
      };
    }
    throw new Error(`Unhandled fake D1 first: ${query}`);
  }

  all(statement: FakeStatement): Record<string, unknown>[] {
    const query = this.normalized(statement);
    const userId = String(statement.values[0]);
    if (query.startsWith('SELECT page_id FROM player_manhwa_page_records')) {
      return [...this.pages]
        .filter((key) => key.startsWith(`${userId}:`))
        .map((key) => ({ page_id: key.slice(userId.length + 1) }));
    }
    if (query.startsWith('SELECT event_id FROM player_canon_event_records')) {
      return [...this.canonEvents]
        .filter((key) => key.startsWith(`${userId}:`))
        .map((key) => ({ event_id: key.slice(userId.length + 1) }));
    }
    if (query.includes('FROM player_story_puzzle_completion_events')) {
      return [...this.completions.values()]
        .filter((completion) => completion.userId === userId)
        .map((completion) => ({
          puzzle_id: completion.puzzleId,
          perfect_solve: completion.perfectSolve,
          completed_at: completion.completedAt,
        }));
    }
    if (query.startsWith('SELECT puzzle_id FROM player_story_puzzle_discovery_events')) {
      return [...this.discoveries]
        .filter((key) => key.startsWith(`${userId}:`))
        .map((key) => ({ puzzle_id: key.slice(userId.length + 1) }));
    }
    if (query.startsWith('SELECT puzzle_id, hint_index FROM player_story_puzzle_hint_events')) {
      return [...this.hints.values()]
        .filter((hint) => hint.userId === userId)
        .map((hint) => ({ puzzle_id: hint.puzzleId, hint_index: hint.hintIndex }));
    }
    if (query.startsWith('SELECT puzzle_id, progress_json FROM player_story_puzzle_progress')) {
      return [...this.drafts.entries()]
        .filter(([key]) => key.startsWith(`${userId}:`))
        .map(([key, progressJson]) => ({
          puzzle_id: key.slice(userId.length + 1),
          progress_json: progressJson,
        }));
    }
    throw new Error(`Unhandled fake D1 all: ${query}`);
  }

  private snapshot() {
    return {
      players: new Set(this.players),
      pages: new Set(this.pages),
      canonEvents: new Set(this.canonEvents),
      completions: new Map([...this.completions].map(([key, value]) => [key, { ...value }])),
      discoveries: new Set(this.discoveries),
      hints: new Map([...this.hints].map(([key, value]) => [key, { ...value }])),
      drafts: new Map(this.drafts),
      coins: new Map([...this.coins].map(([key, value]) => [key, { ...value }])),
      xpRewards: new Map(this.xpRewards),
      fragments: new Map([...this.fragments].map(([key, value]) => [key, { ...value }])),
    };
  }

  private restore(snapshot: ReturnType<StoryPuzzleDatabase['snapshot']>): void {
    this.players = snapshot.players;
    this.pages = snapshot.pages;
    this.canonEvents = snapshot.canonEvents;
    this.completions = snapshot.completions;
    this.discoveries = snapshot.discoveries;
    this.hints = snapshot.hints;
    this.drafts = snapshot.drafts;
    this.coins = snapshot.coins;
    this.xpRewards = snapshot.xpRewards;
    this.fragments = snapshot.fragments;
  }
}

const account: FirebaseAccount = {
  uid: 'story-puzzle-player',
  displayName: 'Story Puzzle Player',
  email: null,
  photoURL: null,
  providerId: 'anonymous',
  createdAt: '2026-08-09T11:11:00.000Z',
  lastLoginAt: '2026-08-09T11:11:00.000Z',
};

function draft(input: Partial<StoryPuzzleDraft> = {}): StoryPuzzleDraft {
  return {
    stageIndex: 0,
    tokens: [],
    assignments: {},
    imageOrder: [],
    rotations: {},
    ...input,
  };
}

type ServerPuzzleSolution = (typeof SERVER_STORY_PUZZLE_BY_ID)[string]['solution'];

/** Builds a submission only inside the server-gateway test; it is never player-facing. */
function draftFromAuthoritativeSolution(
  solution: ServerPuzzleSolution,
  stageIndex = 0,
): StoryPuzzleDraft {
  if (solution.stages) {
    return draft({
      stageIndex: Math.max(0, solution.stages.length - 1),
      assignments: {
        __stages: JSON.stringify(solution.stages.map((stage, index) => (
          draftFromAuthoritativeSolution(stage, index)
        ))),
      },
    });
  }
  return draft({
    stageIndex,
    tokens: solution.tokens ? [...solution.tokens] : [],
    assignments: solution.assignments ? { ...solution.assignments } : {},
    imageOrder: solution.imageOrder ? [...solution.imageOrder] : [],
    rotations: solution.rotations ? { ...solution.rotations } : {},
  });
}

describe('server-authoritative Story Puzzle gateway', () => {
  it('records an accessible completion, XP, coins, and shard exactly once', async () => {
    const database = new StoryPuzzleDatabase();
    database.seedPage(account.uid, 'manhwa_ch01_page_02');
    const solution = draft({ tokens: ['58', 'channel-11'] });

    const first = await completeStoryPuzzle(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      solution,
    );
    const replay = await completeStoryPuzzle(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      solution,
    );

    assert.equal(first.awarded, true);
    assert.equal(first.xpGranted, 75);
    assert.equal(first.coinsGranted, 18);
    assert.equal(first.perfectBonusCoins, 6);
    assert.equal(first.snapshot.shardCount, 1);
    assert.equal(replay.awarded, false);
    assert.equal(database.completions.size, 1);
    assert.equal(database.xpRewards.size, 1);
    assert.equal(database.fragments.size, 1);
    assert.equal(database.coinBalance(account.uid), 24);
  });

  it('accepts the authoritative correct submission for every Story puzzle through the reward gateway', async () => {
    const database = new StoryPuzzleDatabase();
    for (const puzzle of STORY_PUZZLES) {
      database.seedPage(account.uid, puzzle.source.pageId);
      if (puzzle.source.requiredCanonEventId) {
        database.seedCanonEvent(account.uid, puzzle.source.requiredCanonEventId);
      }
    }

    for (const puzzle of STORY_PUZZLES) {
      if (puzzle.classification === 'secret') {
        await discoverStoryPuzzle(database, account, puzzle.id);
      }
      const definition = SERVER_STORY_PUZZLE_BY_ID[puzzle.id];
      assert.ok(definition, `missing server solution for ${puzzle.id}`);
      const receipt = await completeStoryPuzzle(
        database,
        account,
        puzzle.id,
        draftFromAuthoritativeSolution(definition.solution),
      );
      assert.equal(receipt.awarded, true, `correct solution was not rewarded: ${puzzle.id}`);
    }

    assert.equal(database.completions.size, STORY_PUZZLES.length);
    assert.equal(database.xpRewards.size, STORY_PUZZLES.length);
    assert.equal(database.fragments.size, STORY_PUZZLES.length);
  });

  it('rejects incorrect opening-slice submissions before any reward receipt is written', async () => {
    const database = new StoryPuzzleDatabase();
    database.seedPage(account.uid, 'manhwa_ch01_page_02');

    await assert.rejects(
      () => completeStoryPuzzle(database, account, 'story_puzzle_01_signal_calibration', draft({
        tokens: ['42', 'channel-07'],
      })),
      (error) => error instanceof PlayerApiError && error.code === 'puzzle_not_verified',
    );
    assert.equal(database.completions.size, 0);
    assert.equal(database.xpRewards.size, 0);
    assert.equal(database.fragments.size, 0);
    assert.equal(database.coinBalance(account.uid), 0);

    await completeStoryPuzzle(database, account, 'story_puzzle_01_signal_calibration', draft({
      tokens: ['58', 'channel-11'],
    }));
    database.seedPage(account.uid, 'manhwa_ch01_page_03');

    await assert.rejects(
      () => completeStoryPuzzle(database, account, 'story_puzzle_02_system_sequence', draft({
        tokens: ['signal', 'memory', 'access', 'echo'],
      })),
      (error) => error instanceof PlayerApiError && error.code === 'puzzle_not_verified',
    );
    assert.equal(database.completions.size, 1);
    assert.equal(database.fragments.size, 1);

    await completeStoryPuzzle(database, account, 'story_puzzle_02_system_sequence', draft({
      tokens: ['signal', 'access', 'memory', 'echo'],
    }));
    database.seedPage(account.uid, 'manhwa_ch01_page_07');
    await discoverStoryPuzzle(database, account, 'story_puzzle_03_torn_memory');

    await assert.rejects(
      () => completeStoryPuzzle(database, account, 'story_puzzle_03_torn_memory', draft({
        imageOrder: ['piece-0', 'piece-0', 'piece-2', 'piece-3', 'piece-4', 'piece-5', 'piece-6', 'piece-7', 'piece-8'],
        rotations: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`piece-${index}`, 0])),
      })),
      (error) => error instanceof PlayerApiError && error.code === 'puzzle_not_verified',
    );
    assert.equal(database.completions.size, 2);
    assert.equal(database.fragments.size, 2);
  });

  it('keeps a secret hidden until its verified source and prerequisite are present', async () => {
    const database = new StoryPuzzleDatabase();
    database.seedPage(account.uid, 'manhwa_ch01_page_02');
    await completeStoryPuzzle(database, account, 'story_puzzle_01_signal_calibration', draft({
      tokens: ['58', 'channel-11'],
    }));
    database.seedPage(account.uid, 'manhwa_ch01_page_03');
    await completeStoryPuzzle(database, account, 'story_puzzle_02_system_sequence', draft({
      tokens: ['signal', 'access', 'memory', 'echo'],
    }));
    database.seedPage(account.uid, 'manhwa_ch01_page_07');

    const discovered = await discoverStoryPuzzle(
      database,
      account,
      'story_puzzle_03_torn_memory',
    );
    const entry = discovered.entries.find((candidate) => (
      candidate.puzzleId === 'story_puzzle_03_torn_memory'
    ));
    assert.equal(entry?.status, 'available');
    assert.equal(database.discoveries.size, 1);

    const reward = await completeStoryPuzzle(database, account, 'story_puzzle_03_torn_memory', draft({
      imageOrder: Array.from({ length: 9 }, (_, index) => `piece-${index}`),
      rotations: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`piece-${index}`, 0])),
    }));
    assert.equal(reward.awarded, true);
    assert.equal(database.discoveries.size, 1, 'completion cannot create a second discovery receipt');
    assert.equal(database.fragments.size, 3);
  });

  it('keeps every hint priced atomically, rejects insufficient coins, and removes only the perfect bonus', async () => {
    const database = new StoryPuzzleDatabase();
    database.seedPage(account.uid, 'manhwa_ch01_page_02');
    await assert.rejects(
      () => unlockStoryPuzzleHint(database, account, 'story_puzzle_01_signal_calibration', 0),
      (error) => error instanceof PlayerApiError && error.code === 'insufficient_coins',
    );

    database.seedCoins(account.uid, 4);
    const firstPaidHint = await unlockStoryPuzzleHint(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      0,
    );
    await assert.rejects(
      () => unlockStoryPuzzleHint(database, account, 'story_puzzle_01_signal_calibration', 1),
      (error) => error instanceof PlayerApiError && error.code === 'insufficient_coins',
    );

    database.seedCoins(account.uid, 8);
    const paidHint = await unlockStoryPuzzleHint(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      1,
    );
    const replay = await unlockStoryPuzzleHint(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      1,
    );
    const reward = await completeStoryPuzzle(
      database,
      account,
      'story_puzzle_01_signal_calibration',
      draft({ tokens: ['58', 'channel-11'] }),
    );

    assert.equal(firstPaidHint.alreadyUnlocked, false);
    assert.equal(paidHint.alreadyUnlocked, false);
    assert.equal(replay.alreadyUnlocked, true);
    assert.equal(database.coinBalance(account.uid), 18, '4 + 8 trusted coins - two paid hints + 18 base reward');
    assert.equal(reward.xpGranted, 75);
    assert.equal(reward.coinsGranted, 18);
    assert.equal(reward.perfectBonusCoins, 0);
    assert.equal(reward.snapshot.shardCount, 1);
  });

  it('persists a multi-stage draft and restores it from a fresh snapshot', async () => {
    const database = new StoryPuzzleDatabase();
    database.seedCompletion(account.uid, 'story_puzzle_13_visual_forensics');
    database.seedPage(account.uid, 'manhwa_ch03_page_26');
    const stagedDraft = draft({
      stageIndex: 1,
      assignments: {
        __stages: JSON.stringify([
          { stageIndex: 0, tokens: ['74', 'channel-11'], assignments: {}, imageOrder: [], rotations: {} },
          { stageIndex: 0, tokens: ['memory'], assignments: {}, imageOrder: [], rotations: {} },
          { stageIndex: 0, tokens: [], assignments: { access: 'echo' }, imageOrder: [], rotations: {} },
        ]),
      },
    });

    const snapshot = await saveStoryPuzzleDraft(
      database,
      account,
      'story_puzzle_15_system_breach',
      stagedDraft,
    );
    const entry = snapshot.entries.find((candidate) => (
      candidate.puzzleId === 'story_puzzle_15_system_breach'
    ));

    assert.equal(entry?.status, 'in_progress');
    assert.deepEqual(entry?.draft, stagedDraft);
  });
});
