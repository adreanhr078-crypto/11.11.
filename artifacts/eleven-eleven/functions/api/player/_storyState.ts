import {
  FINAL_MANHWA_CANON_EVENTS,
  getFinalManhwaCanonEventsForCheckpoint,
  type FinalManhwaCanonEventDefinition,
} from '../../../src/content/story/finalManhwaCanonEvents';
import {
  FINAL_MANHWA_CHAPTERS,
  FINAL_MANHWA_PAGE_BY_ID,
} from '../../../src/content/manhwa/finalManhwa';
import {
  createXpRewardKey,
} from '../../../src/domain/player-progression/playerProgression';
import {
  normalizeAuthoritativeStoryState,
  type AuthoritativeStoryState,
} from '../../../src/domain/story/storyState';
import type {
  PlayerDatabase,
} from './_database';
import {
  ensurePlayerProgressionRow,
} from './_progressionRepository';
import {
  PlayerApiError,
  type FirebaseAccount,
} from './_shared';

interface CountRow {
  total: number | string;
}

interface CanonEventRow {
  event_id: string;
  event_version: number | string;
  source_type: string;
  source_id: string;
  source_page_id: string;
  source_page_number: number | string;
  reached_at: string;
}

interface ChapterRow {
  source_id: string;
}

interface FragmentRow {
  fragment_id: string;
}

interface RewardTimestampRow {
  granted_at: string;
}

interface ReadPageRow {
  global_page_number: number | string;
}

export interface ManhwaReaderCheckpoint {
  chapterId: string;
  pageId: string;
  globalPageNumber: number;
}

function toNonNegativeInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

function hasRows(row: CountRow | null): boolean {
  return toNonNegativeInteger(row?.total) > 0;
}

function assertOnlyCheckpointFields(body: Record<string, unknown>): void {
  const allowed = new Set(['chapterId', 'pageId', 'globalPageNumber']);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    if ('eventId' in body || 'eventVersion' in body) {
      throw new PlayerApiError(
        400,
        'client_canon_event_forbidden',
        'Canon event IDs are resolved by the server.',
      );
    }
    throw new PlayerApiError(400, 'invalid_request', 'Story checkpoint is invalid.');
  }
}

export function parseManhwaReaderCheckpoint(
  body: unknown,
): ManhwaReaderCheckpoint {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new PlayerApiError(400, 'invalid_request', 'Story checkpoint is invalid.');
  }
  const input = body as Record<string, unknown>;
  assertOnlyCheckpointFields(input);
  if (
    typeof input.chapterId !== 'string'
    || typeof input.pageId !== 'string'
    || typeof input.globalPageNumber !== 'number'
    || !Number.isInteger(input.globalPageNumber)
  ) {
    throw new PlayerApiError(400, 'invalid_request', 'Story checkpoint is invalid.');
  }
  const checkpoint = {
    chapterId: input.chapterId.trim(),
    pageId: input.pageId.trim(),
    globalPageNumber: input.globalPageNumber,
  };
  const page = FINAL_MANHWA_PAGE_BY_ID[checkpoint.pageId];
  if (
    !page
    || page.chapterId !== checkpoint.chapterId
    || page.globalPageNumber !== checkpoint.globalPageNumber
  ) {
    throw new PlayerApiError(400, 'invalid_request', 'Story checkpoint is invalid.');
  }
  return checkpoint;
}

async function recordManhwaPageCheckpoint(
  database: PlayerDatabase,
  account: FirebaseAccount,
  checkpoint: ManhwaReaderCheckpoint,
): Promise<void> {
  await database.prepare(`
    INSERT OR IGNORE INTO player_manhwa_page_records (
      user_id,
      chapter_id,
      page_id,
      global_page_number,
      viewed_at
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    account.uid,
    checkpoint.chapterId,
    checkpoint.pageId,
    checkpoint.globalPageNumber,
    new Date().toISOString(),
  ).run();
}

async function hasReadChapterThroughPage(
  database: PlayerDatabase,
  uid: string,
  chapterId: string,
  throughPageNumber: number,
): Promise<boolean> {
  const chapter = FINAL_MANHWA_CHAPTERS.find((candidate) => (
    candidate.chapterId === chapterId
  ));
  if (!chapter || throughPageNumber < chapter.startPage || throughPageNumber > chapter.endPage) {
    return false;
  }
  const records = await database.prepare(`
    SELECT global_page_number
    FROM player_manhwa_page_records
    WHERE user_id = ?
      AND chapter_id = ?
      AND global_page_number >= ?
      AND global_page_number <= ?
  `).bind(
    uid,
    chapterId,
    chapter.startPage,
    throughPageNumber,
  ).all<ReadPageRow>();
  const readPageNumbers = new Set(
    (records.results ?? []).map((row) => Number(row.global_page_number)),
  );
  for (let pageNumber = chapter.startPage; pageNumber <= throughPageNumber; pageNumber += 1) {
    if (!readPageNumbers.has(pageNumber)) return false;
  }
  return true;
}

async function hasReward(
  database: PlayerDatabase,
  uid: string,
  rewardKey: string,
): Promise<boolean> {
  const row = await database.prepare(`
    SELECT COUNT(*) AS total
    FROM xp_reward_events
    WHERE user_id = ? AND reward_key = ?
  `).bind(uid, rewardKey).first<CountRow>();
  return hasRows(row);
}

async function hasCanonEvent(
  database: PlayerDatabase,
  uid: string,
  eventId: string,
): Promise<boolean> {
  const row = await database.prepare(`
    SELECT COUNT(*) AS total
    FROM player_canon_event_records
    WHERE user_id = ? AND event_id = ?
  `).bind(uid, eventId).first<CountRow>();
  return hasRows(row);
}

async function assertCheckpointPrerequisites(
  database: PlayerDatabase,
  uid: string,
  event: FinalManhwaCanonEventDefinition,
): Promise<void> {
  const completedChapter = await hasReward(
    database,
    uid,
    createXpRewardKey('manhwa', event.source.requiredCompletedChapterId),
  );
  if (!completedChapter) {
    throw new PlayerApiError(
      409,
      'story_prerequisite_missing',
      'The preceding verified chapter is required.',
    );
  }
  if (
    event.source.requiredCanonEventId
    && !await hasCanonEvent(database, uid, event.source.requiredCanonEventId)
  ) {
    throw new PlayerApiError(
      409,
      'canon_event_prerequisite_missing',
      'The preceding Canon event is required.',
    );
  }
  const hasSequentialReading = await hasReadChapterThroughPage(
    database,
    uid,
    event.source.chapterId,
    event.source.globalPageNumber,
  );
  if (!hasSequentialReading) {
    throw new PlayerApiError(
      409,
      'story_reading_prerequisite_missing',
      'The verified reading sequence is required.',
    );
  }
}

/**
 * Existing players can only be backfilled from the established, server-issued
 * Chapter 4 completion receipt. No local page number or client state is used.
 */
async function backfillVerifiedChapterFourEvents(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<void> {
  const completion = await database.prepare(`
    SELECT granted_at
    FROM xp_reward_events
    WHERE user_id = ? AND reward_key = ?
    LIMIT 1
  `).bind(
    account.uid,
    createXpRewardKey('manhwa', 'chapter_4'),
  ).first<RewardTimestampRow>();
  if (!completion?.granted_at || Number.isNaN(Date.parse(completion.granted_at))) {
    return;
  }

  for (const event of FINAL_MANHWA_CANON_EVENTS) {
    await database.prepare(`
      INSERT OR IGNORE INTO player_canon_event_records (
        user_id,
        event_id,
        event_version,
        source_type,
        source_id,
        source_page_id,
        source_page_number,
        reached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      account.uid,
      event.eventId,
      event.eventVersion,
      event.source.sourceType,
      event.source.chapterId,
      event.source.pageId,
      event.source.globalPageNumber,
      completion.granted_at,
    ).run();
  }
}

async function readSnapshot(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<AuthoritativeStoryState> {
  await ensurePlayerProgressionRow(database, account);
  await backfillVerifiedChapterFourEvents(database, account);
  const [events, chapters, fragments] = await Promise.all([
    database.prepare(`
      SELECT
        event_id,
        event_version,
        source_type,
        source_id,
        source_page_id,
        source_page_number,
        reached_at
      FROM player_canon_event_records
      WHERE user_id = ?
      ORDER BY source_page_number ASC, event_id ASC
    `).bind(account.uid).all<CanonEventRow>(),
    database.prepare(`
      SELECT source_id
      FROM xp_reward_events
      WHERE user_id = ? AND source_type = 'manhwa'
    `).bind(account.uid).all<ChapterRow>(),
    database.prepare(`
      SELECT fragment_id
      FROM player_memory_fragment_events
      WHERE user_id = ?
        AND fragment_id NOT GLOB 'story_puzzle_shard_*'
      ORDER BY found_at ASC, fragment_id ASC
    `).bind(account.uid).all<FragmentRow>(),
  ]);
  const validChapterIds = new Set<string>(
    FINAL_MANHWA_CHAPTERS.map((chapter) => chapter.chapterId),
  );
  return normalizeAuthoritativeStoryState({
    canonEventReceipts: (events.results ?? []).map((row) => ({
      eventId: row.event_id,
      eventVersion: Number(row.event_version),
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourcePageId: row.source_page_id,
      sourcePageNumber: Number(row.source_page_number),
      reachedAt: row.reached_at,
    })),
    completedChapterIds: (chapters.results ?? [])
      .map((row) => row.source_id)
      .filter((chapterId) => validChapterIds.has(chapterId)),
    discoveredMemoryFragmentIds: (fragments.results ?? [])
      .map((row) => row.fragment_id),
    syncedAt: new Date().toISOString(),
  });
}

export async function readAuthoritativeStoryState(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<AuthoritativeStoryState> {
  return readSnapshot(database, account);
}

export async function claimManhwaStoryCheckpoint(
  database: PlayerDatabase,
  account: FirebaseAccount,
  checkpoint: ManhwaReaderCheckpoint,
): Promise<{
  claimedEventIds: string[];
  storyState: AuthoritativeStoryState;
}> {
  await ensurePlayerProgressionRow(database, account);
  await backfillVerifiedChapterFourEvents(database, account);
  await recordManhwaPageCheckpoint(database, account, checkpoint);
  const events = getFinalManhwaCanonEventsForCheckpoint(checkpoint);
  const claimedEventIds: string[] = [];
  for (const event of events) {
    await assertCheckpointPrerequisites(database, account.uid, event);
    const inserted = await database.prepare(`
      INSERT OR IGNORE INTO player_canon_event_records (
        user_id,
        event_id,
        event_version,
        source_type,
        source_id,
        source_page_id,
        source_page_number,
        reached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      account.uid,
      event.eventId,
      event.eventVersion,
      event.source.sourceType,
      event.source.chapterId,
      event.source.pageId,
      event.source.globalPageNumber,
      new Date().toISOString(),
    ).run();
    if (toNonNegativeInteger(inserted.meta?.changes) > 0) {
      claimedEventIds.push(event.eventId);
    }
  }
  return {
    claimedEventIds,
    storyState: await readSnapshot(database, account),
  };
}
