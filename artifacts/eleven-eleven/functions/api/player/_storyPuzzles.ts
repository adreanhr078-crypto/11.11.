import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLE_ECHO_IMPACTS,
  STORY_PUZZLES,
} from '../../../src/content/puzzles/storyPuzzleCatalog';
import type {
  StoryPuzzleDraft,
  StoryPuzzleEchoResonanceAxis,
  StoryPuzzleRewardReceipt,
  StoryPuzzleSnapshot,
  StoryPuzzleSnapshotEntry,
} from '../../../src/domain/story-puzzles/storyPuzzleContracts';
import { createXpRewardKey } from '../../../src/domain/player-progression/playerProgression';
import { requirePlayerDatabase, type PlayerDatabase } from './_database';
import {
  SERVER_STORY_PUZZLE_BY_ID,
  STORY_PUZZLE_HINT_COSTS,
  isServerStoryPuzzleSubmissionCorrect,
} from './_storyPuzzleDefinitions';
import { ensurePlayerProgressionRow } from './_progressionRepository';
import { PlayerApiError, type FirebaseAccount } from './_shared';

interface PageRow { page_id: string; }
interface CanonEventRow { event_id: string; }
interface CompletionRow {
  puzzle_id: string;
  perfect_solve: number | string;
  completed_at: string;
}
interface DiscoveryRow { puzzle_id: string; }
interface HintRow { puzzle_id: string; hint_index: number | string; }
interface ProgressRow { puzzle_id: string; progress_json: string; }
interface CountRow { total: number | string; }
interface BalanceRow { total: number | string | null; }

const MAX_TOKEN_COUNT = 32;
const MAX_TOKEN_LENGTH = 80;
const MAX_ASSIGNMENTS = 20;
const MAX_DRAFT_BYTES = 12_000;

const emptyDraft = (): StoryPuzzleDraft => ({
  stageIndex: 0,
  tokens: [],
  assignments: {},
  imageOrder: [],
  rotations: {},
});

function toNonNegativeInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

function cleanTokenList(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_TOKEN_COUNT) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  const tokens = value.map((token) => (
    typeof token === 'string' ? token.trim() : ''
  ));
  if (tokens.some((token) => !/^[a-z0-9_-]{1,80}$/i.test(token))) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  return tokens;
}

function cleanAssignments(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_ASSIGNMENTS || entries.some(([key, entry]) => (
    !/^[a-z0-9_-]{1,80}$/i.test(key)
    || typeof entry !== 'string'
    || entry.length > MAX_DRAFT_BYTES
  ))) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  return Object.fromEntries(entries.map(([key, entry]) => [key, String(entry).trim()]));
}

function cleanRotations(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_TOKEN_COUNT || entries.some(([key, entry]) => (
    !/^[a-z0-9_-]{1,80}$/i.test(key)
    || typeof entry !== 'number'
    || !Number.isInteger(entry)
    || entry < 0
    || entry > 3
  ))) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  return Object.fromEntries(entries) as Record<string, number>;
}

/** Only a compact UI draft is accepted; no reward field can cross this boundary. */
export function parseStoryPuzzleDraft(value: unknown): StoryPuzzleDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  const input = value as Record<string, unknown>;
  const allowed = new Set(['stageIndex', 'tokens', 'assignments', 'imageOrder', 'rotations']);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  if (
    typeof input.stageIndex !== 'number'
    || !Number.isInteger(input.stageIndex)
    || input.stageIndex < 0
    || input.stageIndex > 8
  ) {
    throw new PlayerApiError(400, 'invalid_puzzle_state', 'Puzzle state is invalid.');
  }
  const draft: StoryPuzzleDraft = {
    stageIndex: input.stageIndex,
    tokens: cleanTokenList(input.tokens ?? []),
    assignments: cleanAssignments(input.assignments ?? {}),
    imageOrder: cleanTokenList(input.imageOrder ?? []),
    rotations: cleanRotations(input.rotations ?? {}),
  };
  if (new TextEncoder().encode(JSON.stringify(draft)).byteLength > MAX_DRAFT_BYTES) {
    throw new PlayerApiError(413, 'puzzle_state_too_large', 'Puzzle state is too large.');
  }
  return draft;
}

function parseStoredDraft(serialized: string): StoryPuzzleDraft | null {
  try {
    return parseStoryPuzzleDraft(JSON.parse(serialized));
  } catch {
    return null;
  }
}

function getPuzzle(puzzleId: string) {
  const puzzle = STORY_PUZZLE_BY_ID[puzzleId];
  if (!puzzle || !SERVER_STORY_PUZZLE_BY_ID[puzzleId]) {
    throw new PlayerApiError(404, 'unknown_puzzle', 'Puzzle is not recognized.');
  }
  return puzzle;
}

export function parseStoryPuzzleId(value: unknown): string {
  if (typeof value !== 'string' || !/^story_puzzle_\d{2}_[a-z0-9_]+$/.test(value)) {
    throw new PlayerApiError(400, 'invalid_puzzle', 'Puzzle ID is invalid.');
  }
  return value;
}

function isPuzzleReadable(
  puzzleId: string,
  readPageIds: ReadonlySet<string>,
  canonEventIds: ReadonlySet<string>,
): boolean {
  const puzzle = getPuzzle(puzzleId);
  return readPageIds.has(puzzle.source.pageId)
    && (!puzzle.source.requiredCanonEventId
      || canonEventIds.has(puzzle.source.requiredCanonEventId));
}

interface PlayerPuzzleRows {
  readPageIds: Set<string>;
  canonEventIds: Set<string>;
  completionByPuzzleId: Map<string, CompletionRow>;
  discoveredPuzzleIds: Set<string>;
  hintsByPuzzleId: Map<string, number[]>;
  draftByPuzzleId: Map<string, StoryPuzzleDraft>;
  coinBalance: number;
  shardCount: number;
}

async function readPlayerPuzzleRows(
  database: PlayerDatabase,
  uid: string,
): Promise<PlayerPuzzleRows> {
  const [pages, canonEvents, completions, discoveries, hints, progress, balance, shards] = await Promise.all([
    database.prepare(`SELECT page_id FROM player_manhwa_page_records WHERE user_id = ?`).bind(uid).all<PageRow>(),
    database.prepare(`SELECT event_id FROM player_canon_event_records WHERE user_id = ?`).bind(uid).all<CanonEventRow>(),
    database.prepare(`
      SELECT puzzle_id, perfect_solve, completed_at
      FROM player_story_puzzle_completion_events
      WHERE user_id = ?
    `).bind(uid).all<CompletionRow>(),
    database.prepare(`SELECT puzzle_id FROM player_story_puzzle_discovery_events WHERE user_id = ?`).bind(uid).all<DiscoveryRow>(),
    database.prepare(`SELECT puzzle_id, hint_index FROM player_story_puzzle_hint_events WHERE user_id = ?`).bind(uid).all<HintRow>(),
    database.prepare(`SELECT puzzle_id, progress_json FROM player_story_puzzle_progress WHERE user_id = ?`).bind(uid).all<ProgressRow>(),
    database.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM player_coin_events WHERE user_id = ?`).bind(uid).first<BalanceRow>(),
    database.prepare(`
      SELECT COUNT(*) AS total
      FROM player_memory_fragment_events
      WHERE user_id = ? AND source_id GLOB 'story_puzzle_*'
    `).bind(uid).first<CountRow>(),
  ]);
  const hintsByPuzzleId = new Map<string, number[]>();
  for (const hint of hints.results ?? []) {
    const list = hintsByPuzzleId.get(hint.puzzle_id) ?? [];
    list.push(toNonNegativeInteger(hint.hint_index));
    hintsByPuzzleId.set(hint.puzzle_id, list);
  }
  const draftByPuzzleId = new Map<string, StoryPuzzleDraft>();
  for (const row of progress.results ?? []) {
    const draft = parseStoredDraft(row.progress_json);
    if (draft) draftByPuzzleId.set(row.puzzle_id, draft);
  }
  return {
    readPageIds: new Set((pages.results ?? []).map((row) => row.page_id)),
    canonEventIds: new Set((canonEvents.results ?? []).map((row) => row.event_id)),
    completionByPuzzleId: new Map((completions.results ?? []).map((row) => [row.puzzle_id, row])),
    discoveredPuzzleIds: new Set((discoveries.results ?? []).map((row) => row.puzzle_id)),
    hintsByPuzzleId,
    draftByPuzzleId,
    coinBalance: toNonNegativeInteger(balance?.total),
    shardCount: toNonNegativeInteger(shards?.total),
  };
}

function canReachPuzzle(
  puzzleId: string,
  rows: PlayerPuzzleRows,
): boolean {
  const puzzle = getPuzzle(puzzleId);
  return isPuzzleReadable(puzzleId, rows.readPageIds, rows.canonEventIds)
    && puzzle.prerequisitePuzzleIds.every((requiredId) => (
      rows.completionByPuzzleId.has(requiredId)
    ));
}

function entryForPuzzle(
  puzzleId: string,
  rows: PlayerPuzzleRows,
): StoryPuzzleSnapshotEntry {
  const puzzle = getPuzzle(puzzleId);
  const completion = rows.completionByPuzzleId.get(puzzleId);
  const discovered = puzzle.classification === 'main'
    || rows.discoveredPuzzleIds.has(puzzleId);
  const reachable = canReachPuzzle(puzzleId, rows);
  const draft = rows.draftByPuzzleId.get(puzzleId) ?? null;
  const hintIndexes = [...(rows.hintsByPuzzleId.get(puzzleId) ?? [])]
    .filter((index) => index >= 0 && index <= 2)
    .sort((left, right) => left - right);
  const status = completion
    ? 'completed' as const
    : puzzle.classification === 'secret' && !discovered
      ? 'hidden' as const
      : !reachable
        ? 'locked' as const
        : draft
          ? 'in_progress' as const
          : 'available' as const;
  return {
    puzzleId,
    status,
    discovered,
    completedAt: completion?.completed_at ?? null,
    perfectSolve: toNonNegativeInteger(completion?.perfect_solve) === 1,
    unlockedHintIndexes: hintIndexes,
    hintCosts: [...STORY_PUZZLE_HINT_COSTS],
    draft,
  };
}

function snapshotFromRows(rows: PlayerPuzzleRows): StoryPuzzleSnapshot {
  const entries = STORY_PUZZLES.map((puzzle) => entryForPuzzle(puzzle.id, rows));
  const mainCompletedCount = STORY_PUZZLES.filter((puzzle) => (
    puzzle.classification === 'main' && rows.completionByPuzzleId.has(puzzle.id)
  )).length;
  const discoverableSecretPuzzleIds = STORY_PUZZLES.filter((puzzle) => (
    puzzle.classification === 'secret'
    && !rows.discoveredPuzzleIds.has(puzzle.id)
    && canReachPuzzle(puzzle.id, rows)
  )).map((puzzle) => puzzle.id);
  const axes: StoryPuzzleEchoResonanceAxis[] = [
    'clarity', 'memory', 'trust', 'resolve', 'stability', 'anomaly',
  ];
  const byAxis = Object.fromEntries(axes.map((axis) => [axis, 0])) as Record<
    StoryPuzzleEchoResonanceAxis,
    number
  >;
  const completed = [...rows.completionByPuzzleId.values()]
    .sort((left, right) => Date.parse(left.completed_at) - Date.parse(right.completed_at));
  for (const row of completed) {
    const impact = STORY_PUZZLE_ECHO_IMPACTS[row.puzzle_id];
    if (impact) byAxis[impact.axis] += impact.amount;
  }
  return {
    coinBalance: rows.coinBalance,
    shardCount: rows.shardCount,
    mainCompletedCount,
    totalCompletedCount: rows.completionByPuzzleId.size,
    entries,
    discoverableSecretPuzzleIds,
    echoResonance: {
      total: Object.values(byAxis).reduce((total, value) => total + value, 0),
      byAxis,
      lastPuzzleId: completed.at(-1)?.puzzle_id ?? null,
    },
    syncedAt: new Date().toISOString(),
  };
}

export async function readStoryPuzzleSnapshot(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<StoryPuzzleSnapshot> {
  await ensurePlayerProgressionRow(database, account);
  return snapshotFromRows(await readPlayerPuzzleRows(database, account.uid));
}

function assertPuzzleAccessible(
  puzzleId: string,
  snapshot: StoryPuzzleSnapshot,
): StoryPuzzleSnapshotEntry {
  const entry = snapshot.entries.find((candidate) => candidate.puzzleId === puzzleId);
  if (!entry || entry.status === 'hidden' || entry.status === 'locked') {
    throw new PlayerApiError(409, 'puzzle_locked', 'The required story evidence is not verified yet.');
  }
  return entry;
}

export async function saveStoryPuzzleDraft(
  database: PlayerDatabase,
  account: FirebaseAccount,
  puzzleId: string,
  draft: StoryPuzzleDraft,
): Promise<StoryPuzzleSnapshot> {
  const puzzle = getPuzzle(puzzleId);
  const snapshot = await readStoryPuzzleSnapshot(database, account);
  const entry = assertPuzzleAccessible(puzzle.id, snapshot);
  if (entry.status === 'completed') return snapshot;
  const now = new Date().toISOString();
  await database.prepare(`
    INSERT INTO player_story_puzzle_progress (
      user_id, puzzle_id, stage_index, progress_json, updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, puzzle_id) DO UPDATE SET
      stage_index = excluded.stage_index,
      progress_json = excluded.progress_json,
      updated_at = excluded.updated_at
  `).bind(
    account.uid,
    puzzle.id,
    draft.stageIndex,
    JSON.stringify(draft),
    now,
  ).run();
  return readStoryPuzzleSnapshot(database, account);
}

export async function discoverStoryPuzzle(
  database: PlayerDatabase,
  account: FirebaseAccount,
  puzzleId: string,
): Promise<StoryPuzzleSnapshot> {
  const puzzle = getPuzzle(puzzleId);
  if (puzzle.classification !== 'secret') {
    throw new PlayerApiError(400, 'not_secret_puzzle', 'Only a secret signal can be discovered.');
  }
  const snapshot = await readStoryPuzzleSnapshot(database, account);
  const discoverable = snapshot.discoverableSecretPuzzleIds.includes(puzzle.id);
  const existing = snapshot.entries.find((entry) => entry.puzzleId === puzzle.id);
  if (!discoverable && !existing?.discovered) {
    throw new PlayerApiError(409, 'secret_not_detected', 'The anomaly has not been verified yet.');
  }
  await database.prepare(`
    INSERT OR IGNORE INTO player_story_puzzle_discovery_events (
      user_id, puzzle_id, discovered_at
    ) VALUES (?, ?, ?)
  `).bind(account.uid, puzzle.id, new Date().toISOString()).run();
  return readStoryPuzzleSnapshot(database, account);
}

function xpProgressionUpdateStatement(
  database: PlayerDatabase,
  uid: string,
  now: string,
) {
  return database.prepare(`
    UPDATE player_progression
    SET total_xp = (
      SELECT COALESCE(SUM(xp_amount), 0)
      FROM xp_reward_events
      WHERE user_id = ?
    ), updated_at = ?
    WHERE user_id = ?
  `).bind(uid, now, uid);
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

function isInsufficientCoinBalanceError(error: unknown): boolean {
  return error instanceof Error && /insufficient verified coins/i.test(error.message);
}

export async function completeStoryPuzzle(
  database: PlayerDatabase,
  account: FirebaseAccount,
  puzzleId: string,
  draft: StoryPuzzleDraft,
): Promise<StoryPuzzleRewardReceipt> {
  const puzzle = getPuzzle(puzzleId);
  const serverDefinition = SERVER_STORY_PUZZLE_BY_ID[puzzle.id]!;
  const before = await readStoryPuzzleSnapshot(database, account);
  const entry = assertPuzzleAccessible(puzzle.id, before);
  if (entry.status === 'completed') {
    return {
      awarded: false,
      puzzleId: puzzle.id,
      xpGranted: 0,
      coinsGranted: 0,
      perfectBonusCoins: 0,
      shardId: serverDefinition.shardId,
      echoImpact: STORY_PUZZLE_ECHO_IMPACTS[puzzle.id]!,
      snapshot: before,
    };
  }
  if (!isServerStoryPuzzleSubmissionCorrect(puzzle.id, draft)) {
    throw new PlayerApiError(422, 'puzzle_not_verified', 'The puzzle solution could not be verified.');
  }
  const perfect = entry.unlockedHintIndexes.length === 0;
  const now = new Date().toISOString();
  const rewardKey = createXpRewardKey('puzzle', puzzle.id);
  const bonus = perfect ? serverDefinition.balance.perfectBonusCoins : 0;
  try {
    await database.batch([
      database.prepare(`
        INSERT INTO player_story_puzzle_completion_events (
          user_id, puzzle_id, chapter_id, classification, source_page_id,
          source_page_number, perfect_solve, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        account.uid, puzzle.id, puzzle.chapterId, puzzle.classification,
        puzzle.source.pageId, puzzle.source.globalPageNumber, perfect ? 1 : 0, now,
      ),
      ...(puzzle.classification === 'secret' ? [database.prepare(`
        INSERT OR IGNORE INTO player_story_puzzle_discovery_events (
          user_id, puzzle_id, discovered_at
        ) VALUES (?, ?, ?)
      `).bind(account.uid, puzzle.id, now)] : []),
      database.prepare(`
        INSERT INTO xp_reward_events (
          user_id, reward_key, source_type, source_id, xp_amount, granted_at
        ) VALUES (?, ?, 'puzzle', ?, ?, ?)
      `).bind(
        account.uid, rewardKey, puzzle.id, serverDefinition.balance.xp, now,
      ),
      database.prepare(`
        INSERT INTO player_memory_fragment_events (
          user_id, fragment_id, source_type, source_id, found_at
        ) VALUES (?, ?, 'puzzle', ?, ?)
      `).bind(account.uid, serverDefinition.shardId, puzzle.id, now),
      database.prepare(`
        INSERT INTO player_coin_events (
          user_id, event_key, source_type, source_id, amount, recorded_at
        ) VALUES (?, ?, 'story_puzzle_reward', ?, ?, ?)
      `).bind(
        account.uid, `${puzzle.id}:base:v1`, puzzle.id, serverDefinition.balance.coins, now,
      ),
      ...(bonus > 0 ? [database.prepare(`
        INSERT INTO player_coin_events (
          user_id, event_key, source_type, source_id, amount, recorded_at
        ) VALUES (?, ?, 'story_puzzle_perfect', ?, ?, ?)
      `).bind(account.uid, `${puzzle.id}:perfect:v1`, puzzle.id, bonus, now)] : []),
      database.prepare(`DELETE FROM player_story_puzzle_progress WHERE user_id = ? AND puzzle_id = ?`).bind(account.uid, puzzle.id),
      xpProgressionUpdateStatement(database, account.uid, now),
    ]);
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const afterRace = await readStoryPuzzleSnapshot(database, account);
    const racedEntry = afterRace.entries.find((candidate) => candidate.puzzleId === puzzle.id);
    if (racedEntry?.status !== 'completed') throw error;
    return {
      awarded: false,
      puzzleId: puzzle.id,
      xpGranted: 0,
      coinsGranted: 0,
      perfectBonusCoins: 0,
      shardId: serverDefinition.shardId,
      echoImpact: STORY_PUZZLE_ECHO_IMPACTS[puzzle.id]!,
      snapshot: afterRace,
    };
  }
  return {
    awarded: true,
    puzzleId: puzzle.id,
    xpGranted: serverDefinition.balance.xp,
    coinsGranted: serverDefinition.balance.coins,
    perfectBonusCoins: bonus,
    shardId: serverDefinition.shardId,
    echoImpact: STORY_PUZZLE_ECHO_IMPACTS[puzzle.id]!,
    snapshot: await readStoryPuzzleSnapshot(database, account),
  };
}

export async function unlockStoryPuzzleHint(
  database: PlayerDatabase,
  account: FirebaseAccount,
  puzzleId: string,
  hintIndex: number,
): Promise<{ alreadyUnlocked: boolean; snapshot: StoryPuzzleSnapshot }> {
  const puzzle = getPuzzle(puzzleId);
  if (!Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex > 2) {
    throw new PlayerApiError(400, 'invalid_hint', 'Hint selection is invalid.');
  }
  const before = await readStoryPuzzleSnapshot(database, account);
  const entry = assertPuzzleAccessible(puzzle.id, before);
  if (entry.status === 'completed') {
    throw new PlayerApiError(409, 'puzzle_completed', 'Hints cannot be purchased after completion.');
  }
  if (entry.unlockedHintIndexes.includes(hintIndex)) {
    return { alreadyUnlocked: true, snapshot: before };
  }
  if (hintIndex > 0 && !entry.unlockedHintIndexes.includes(hintIndex - 1)) {
    throw new PlayerApiError(409, 'hint_order_required', 'Unlock the previous hint first.');
  }
  const cost = STORY_PUZZLE_HINT_COSTS[hintIndex];
  if (cost > before.coinBalance) {
    throw new PlayerApiError(409, 'insufficient_coins', 'Not enough verified coins for this hint.');
  }
  const now = new Date().toISOString();
  try {
    // Migration 0006 turns this receipt into an atomic debit through D1
    // triggers. Keeping the debit in the database prevents concurrent hint
    // requests from spending the same balance twice.
    await database.prepare(`
      INSERT INTO player_story_puzzle_hint_events (
        user_id, puzzle_id, hint_index, coin_cost, unlocked_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(account.uid, puzzle.id, hintIndex, cost, now).run();
  } catch (error) {
    if (isInsufficientCoinBalanceError(error)) {
      throw new PlayerApiError(409, 'insufficient_coins', 'Not enough verified coins for this hint.');
    }
    if (!isUniqueConflict(error)) throw error;
    const afterRace = await readStoryPuzzleSnapshot(database, account);
    return { alreadyUnlocked: true, snapshot: afterRace };
  }
  return { alreadyUnlocked: false, snapshot: await readStoryPuzzleSnapshot(database, account) };
}

export function requireStoryPuzzleDatabase(env: Parameters<typeof requirePlayerDatabase>[0]): PlayerDatabase {
  return requirePlayerDatabase(env);
}
