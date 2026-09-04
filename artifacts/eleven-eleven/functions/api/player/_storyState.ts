import {
  FINAL_MANHWA_CANON_EVENTS,
  getFinalManhwaCanonEventsForCheckpoint,
  type FinalManhwaCanonEventDefinition,
} from '../../../src/content/story/finalManhwaCanonEvents';
import {
  FINAL_MANHWA_CHAPTERS,
  FINAL_MANHWA_PAGE_BY_ID,
  FINAL_MANHWA_PAGES,
  getFinalManhwaChapterRewardSourceId,
} from '../../../src/content/manhwa/finalManhwa';
import {
  createXpRewardKey,
} from '../../../src/domain/player-progression/playerProgression';
import {
  deriveStoryPuzzleManhwaAccess,
} from '../../../src/domain/manhwa/storyPuzzleManhwaAccess';
import {
  normalizeAuthoritativeStoryState,
  type AuthoritativeStoryState,
} from '../../../src/domain/story/storyState';
import {
  OPENING_COVER_PUZZLE_ID,
  OPENING_MANHWA_PACKET_ID,
  OPENING_ROOM_ID,
  OPENING_MANHWA_PACKET_PAGE_IDS,
} from '../../../src/domain/opening/openingProgress';
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

interface ReadPageRow {
  page_id: string;
}

interface StoryPuzzleCompletionRow {
  puzzle_id: string;
}

interface OpeningRecoveryStateRow {
  receipt_id: string;
}

interface OpeningRoomStateRow {
  receipt_id: string;
  room_id: string;
  packet_id: string;
  page_ids_json: string;
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
    || !page.published
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

/**
 * The server owns the reader window. A page being published means its asset
 * exists in the release; it does not mean a client may skip the preceding
 * Story Puzzle to record or redeem it.
 */
async function assertCheckpointWithinReaderWindow(
  database: PlayerDatabase,
  uid: string,
  pageId: string,
): Promise<void> {
  if (await hasOpeningPacketPage(database, uid, pageId)) return;
  const completed = await database.prepare(`
    SELECT puzzle_id
    FROM player_story_puzzle_completion_events
    WHERE user_id = ?
  `).bind(uid).all<StoryPuzzleCompletionRow>();
  const access = deriveStoryPuzzleManhwaAccess(
    (completed.results ?? []).map((row) => row.puzzle_id),
  );
  if (!access.accessiblePageIds.includes(pageId)) {
    throw new PlayerApiError(
      409,
      'story_page_locked',
      'The next Story Puzzle must be verified before this Manhwa page can be read.',
    );
  }
}

function isMissingOpeningTablesError(error: unknown): boolean {
  return error instanceof Error
    && /no such table|Unhandled fake D1/i.test(error.message);
}

async function hasOpeningPacketPage(
  database: PlayerDatabase,
  uid: string,
  pageId: string,
): Promise<boolean> {
  try {
    const row = await database.prepare(`
      SELECT page_ids_json
      FROM player_opening_room_receipts
      WHERE user_id = ? AND room_id = ?
    `).bind(uid, OPENING_ROOM_ID).first<{ page_ids_json: string }>();
    if (!row) return false;
    const parsed: unknown = JSON.parse(row.page_ids_json);
    return Array.isArray(parsed)
      && parsed.includes(pageId)
      && OPENING_MANHWA_PACKET_PAGE_IDS.includes(pageId);
  } catch (error) {
    if (isMissingOpeningTablesError(error)) return false;
    throw error;
  }
}

interface OpeningUnlockSnapshot {
  openingCoverPuzzleCompleted: boolean;
  openingRoomCompleted: boolean;
  manhwaPacketIds: string[];
}

async function readOpeningUnlockSnapshot(
  database: PlayerDatabase,
  uid: string,
): Promise<OpeningUnlockSnapshot> {
  try {
    const [recovery, room] = await Promise.all([
      database.prepare(`
        SELECT receipt_id
        FROM player_opening_recovery_receipts
        WHERE user_id = ? AND puzzle_id = ?
      `).bind(uid, OPENING_COVER_PUZZLE_ID).first<OpeningRecoveryStateRow>(),
      database.prepare(`
        SELECT receipt_id, room_id, packet_id, page_ids_json
        FROM player_opening_room_receipts
        WHERE user_id = ? AND room_id = ?
      `).bind(uid, OPENING_ROOM_ID).first<OpeningRoomStateRow>(),
    ]);
    // Page IDs are validated when the packet is emitted and again by the
    // checkpoint gate. The snapshot exposes only the packet identity.
    return {
      openingCoverPuzzleCompleted: Boolean(recovery?.receipt_id),
      openingRoomCompleted: Boolean(room?.receipt_id),
      manhwaPacketIds: room?.packet_id === OPENING_MANHWA_PACKET_ID
        ? [OPENING_MANHWA_PACKET_ID]
        : [],
    };
  } catch (error) {
    if (isMissingOpeningTablesError(error)) {
      return {
        openingCoverPuzzleCompleted: false,
        openingRoomCompleted: false,
        manhwaPacketIds: [],
      };
    }
    throw error;
  }
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
  if (
    !chapter
    || !chapter.published
    || throughPageNumber < chapter.startPage
    || throughPageNumber > chapter.endPage
  ) {
    return false;
  }
  const expectedPageIds = FINAL_MANHWA_PAGES
    .filter((page) => (
      page.published
      && page.chapterId === chapterId
      && page.globalPageNumber >= chapter.startPage
      && page.globalPageNumber <= throughPageNumber
    ))
    .map((page) => page.id);
  if (expectedPageIds.length !== throughPageNumber - chapter.startPage + 1) {
    return false;
  }
  const placeholders = expectedPageIds.map(() => '?').join(', ');
  const records = await database.prepare(`
    SELECT page_id
    FROM player_manhwa_page_records
    WHERE user_id = ?
      AND page_id IN (${placeholders})
  `).bind(uid, ...expectedPageIds).all<ReadPageRow>();
  const readPageIds = new Set((records.results ?? []).map((row) => row.page_id));
  return expectedPageIds.every((pageId) => readPageIds.has(pageId));
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
    createXpRewardKey(
      'manhwa',
      getFinalManhwaChapterRewardSourceId(
        event.source.requiredCompletedChapterId,
      )!,
    ),
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

async function readSnapshot(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<AuthoritativeStoryState> {
  await ensurePlayerProgressionRow(database, account);
  const [events, chapters, fragments, opening] = await Promise.all([
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
    readOpeningUnlockSnapshot(database, account.uid),
  ]);
  const chapterByPublicationSourceId = new Map(
    FINAL_MANHWA_CHAPTERS.map((chapter) => [
      chapter.publicationChapterId,
      chapter,
    ]),
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
      .map((row) => chapterByPublicationSourceId.get(row.source_id))
      .filter((chapter): chapter is (typeof FINAL_MANHWA_CHAPTERS)[number] => (
        Boolean(chapter?.published)
      ))
      .map((chapter) => chapter.chapterId),
    discoveredMemoryFragmentIds: (fragments.results ?? [])
      .map((row) => row.fragment_id),
    openingCoverPuzzleCompleted: opening.openingCoverPuzzleCompleted,
    openingRoomCompleted: opening.openingRoomCompleted,
    manhwaPacketIds: opening.manhwaPacketIds,
    chessHobbyUnlocked: false,
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
  await assertCheckpointWithinReaderWindow(
    database,
    account.uid,
    checkpoint.pageId,
  );
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
