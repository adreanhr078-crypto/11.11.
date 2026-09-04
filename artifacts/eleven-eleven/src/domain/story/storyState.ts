import {
  FINAL_MANHWA_CANON_EVENTS,
  FINAL_MANHWA_ECHO_EVOLUTION_STAGES,
  getFinalManhwaCanonEvent,
  type FinalManhwaCanonEventId,
} from '../../content/story/finalManhwaCanonEvents';
import type {
  FinalManhwaChapterId,
} from '../../content/manhwa/finalManhwa';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import {
  createInitialStoryUnlockState,
  normalizeStoryUnlockState,
  type StoryUnlockState,
} from '../opening/openingProgress';

export interface AuthoritativeStoryEventReceipt {
  eventId: FinalManhwaCanonEventId;
  eventVersion: number;
  sourceType: 'manhwa';
  sourceId: FinalManhwaChapterId;
  sourcePageId: string;
  sourcePageNumber: number;
  reachedAt: string;
}

export interface AuthoritativeStoryState {
  /** Server-issued Canon receipts; the local narrative projection is derived. */
  canonEventReceipts: AuthoritativeStoryEventReceipt[];
  /** Server-derived Manhwa chapter completion IDs, never client rewards. */
  completedChapterIds: Array<'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4'>;
  /** Server-issued Memory Fragment IDs only. */
  discoveredMemoryFragmentIds: string[];
  /** Server-issued opening gateway and room receipts. */
  openingCoverPuzzleCompleted?: boolean;
  openingRoomCompleted?: boolean;
  /** Explicit page packets; an empty list means Manhwa remains hidden. */
  manhwaPacketIds?: readonly string[];
  /** Reserved until an authored Echo chess memory is server-issued. */
  chessHobbyUnlocked?: boolean;
  syncedAt: string | null;
}

export type StoryCharacterAccessLevel = 'unknown' | 'partial' | 'identified' | 'full';

export interface StoryStateReadModel {
  currentStoryChapter: string | null;
  completedChapters: string[];
  reachedCanonEvents: FinalManhwaCanonEventId[];
  echoState: {
    stageId: string;
    visualFormId: string;
    assetStatus: 'existing-safe-asset' | 'visual-slot';
  };
  unlockedKnowledge: {
    player: string[];
    echo: string[];
  };
  unlockedCharacterFiles: Array<{
    characterId: 'lina';
    accessLevel: StoryCharacterAccessLevel;
  }>;
  discoveredMemoryFragments: string[];
  majorTransformationFlags: string[];
}

const CHAPTER_IDS = new Set([
  'chapter_1',
  'chapter_2',
  'chapter_3',
  'chapter_4',
]);

const FRAGMENT_ID_PATTERN = /^[a-z][a-z0-9._-]{0,127}$/i;

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string'
    && Boolean(value.trim())
    && Number.isFinite(Date.parse(value));
}

function accessRank(access: StoryCharacterAccessLevel): number {
  switch (access) {
    case 'full': return 3;
    case 'identified': return 2;
    case 'partial': return 1;
    default: return 0;
  }
}

export function createInitialAuthoritativeStoryState(): AuthoritativeStoryState {
  const opening = createInitialStoryUnlockState();
  return {
    canonEventReceipts: [],
    completedChapterIds: [],
    discoveredMemoryFragmentIds: [],
    ...opening,
    syncedAt: null,
  };
}

/**
 * Filters unknown and mismatched data at the persistence boundary. Unknown
 * future records remain server data, but never execute or surface in this
 * player build until a published definition exists.
 */
export function normalizeAuthoritativeStoryState(
  value: unknown,
): AuthoritativeStoryState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return createInitialAuthoritativeStoryState();
  }
  const source = value as Record<string, unknown>;
  const rawReceipts = Array.isArray(source.canonEventReceipts)
    ? source.canonEventReceipts
    : [];
  const byEvent = new Map<FinalManhwaCanonEventId, AuthoritativeStoryEventReceipt>();
  for (const raw of rawReceipts) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const definition = typeof item.eventId === 'string'
      ? getFinalManhwaCanonEvent(item.eventId)
      : undefined;
    if (
      !definition
      || item.eventVersion !== definition.eventVersion
      || item.sourceType !== definition.source.sourceType
      || item.sourceId !== definition.source.chapterId
      || item.sourcePageId !== definition.source.pageId
      || item.sourcePageNumber !== definition.source.globalPageNumber
      || !validTimestamp(item.reachedAt)
    ) {
      continue;
    }
    const receipt: AuthoritativeStoryEventReceipt = {
      eventId: definition.eventId,
      eventVersion: definition.eventVersion,
      sourceType: definition.source.sourceType,
      sourceId: definition.source.chapterId,
      sourcePageId: definition.source.pageId,
      sourcePageNumber: definition.source.globalPageNumber,
      reachedAt: item.reachedAt,
    };
    const existing = byEvent.get(receipt.eventId);
    if (!existing || receipt.reachedAt < existing.reachedAt) {
      byEvent.set(receipt.eventId, receipt);
    }
  }

  const candidateCanonEventReceipts = [...byEvent.values()].sort((left, right) => (
    left.sourcePageNumber - right.sourcePageNumber
    || left.eventId.localeCompare(right.eventId)
  ));
  const completedChapterIds = Array.isArray(source.completedChapterIds)
    ? uniqueStrings(source.completedChapterIds.filter(
      (chapterId): chapterId is string => typeof chapterId === 'string',
    )).filter((chapterId): chapterId is AuthoritativeStoryState['completedChapterIds'][number] => (
      CHAPTER_IDS.has(chapterId)
    ))
    : [];
  const reachedCanonEventIds = new Set<FinalManhwaCanonEventId>();
  const canonEventReceipts = candidateCanonEventReceipts.filter((receipt) => {
    const definition = getFinalManhwaCanonEvent(receipt.eventId);
    if (!definition) return false;
    if (!completedChapterIds.includes(definition.source.requiredCompletedChapterId)) {
      return false;
    }
    if (
      definition.source.requiredCanonEventId
      && !reachedCanonEventIds.has(definition.source.requiredCanonEventId)
    ) {
      return false;
    }
    reachedCanonEventIds.add(receipt.eventId);
    return true;
  });
  const discoveredMemoryFragmentIds = Array.isArray(
    source.discoveredMemoryFragmentIds,
  )
    ? uniqueStrings(source.discoveredMemoryFragmentIds.filter(
      (fragmentId): fragmentId is string => typeof fragmentId === 'string',
    )).filter((fragmentId) => FRAGMENT_ID_PATTERN.test(fragmentId))
    : [];
  const opening = normalizeStoryUnlockState(source);

  return {
    canonEventReceipts,
    completedChapterIds,
    discoveredMemoryFragmentIds,
    openingCoverPuzzleCompleted: opening.openingCoverPuzzleCompleted,
    openingRoomCompleted: opening.openingRoomCompleted,
    manhwaPacketIds: [...opening.manhwaPacketIds],
    chessHobbyUnlocked: opening.chessHobbyUnlocked,
    syncedAt: validTimestamp(source.syncedAt) ? source.syncedAt : null,
  };
}

/**
 * Echo-only knowledge comes from immutable server receipts. This helper is
 * also used by the Echo gateway so a browser cannot forge a future topic by
 * editing local storage or the request payload.
 */
export function getAuthoritativeEchoKnowledgeIds(
  value: unknown,
): string[] {
  const authoritative = normalizeAuthoritativeStoryState(value);
  const reached = new Set(
    authoritative.canonEventReceipts.map((receipt) => receipt.eventId),
  );
  return uniqueStrings(FINAL_MANHWA_CANON_EVENTS
    .filter((event) => reached.has(event.eventId))
    .flatMap((event) => event.knowledgeGrants)
    .filter((grant) => grant.audience === 'echo')
    .map((grant) => grant.nodeId));
}

export function createStoryStateReadModel(
  progressionState: GameProgressionState,
): StoryStateReadModel {
  const authoritative = normalizeAuthoritativeStoryState(
    progressionState.story.authoritative,
  );
  const reached = new Set(
    authoritative.canonEventReceipts.map((receipt) => receipt.eventId),
  );
  let stage = FINAL_MANHWA_ECHO_EVOLUTION_STAGES[0]!;
  for (const candidate of FINAL_MANHWA_ECHO_EVOLUTION_STAGES.slice(1)) {
    if (candidate.requiredStoryEventId && reached.has(
      candidate.requiredStoryEventId as FinalManhwaCanonEventId,
    )) {
      stage = candidate;
    }
  }

  const echoKnowledge = getAuthoritativeEchoKnowledgeIds(authoritative);
  const playerKnowledge = FINAL_MANHWA_CANON_EVENTS
    .filter((event) => reached.has(event.eventId))
    .flatMap((event) => event.knowledgeGrants)
    .filter((grant) => grant.audience === 'player')
    .map((grant) => grant.nodeId);

  const accessByCharacter = new Map<'lina', StoryCharacterAccessLevel>();
  for (const event of FINAL_MANHWA_CANON_EVENTS) {
    if (!reached.has(event.eventId)) continue;
    for (const unlock of event.characterFileUnlocks) {
      const previous = accessByCharacter.get(unlock.characterId) ?? 'unknown';
      if (accessRank(unlock.accessLevel) > accessRank(previous)) {
        accessByCharacter.set(unlock.characterId, unlock.accessLevel);
      }
    }
  }
  const completedChapters = authoritative.completedChapterIds;
  const unlockedCharacterFiles = [...accessByCharacter.entries()].map(([
    characterId,
    accessLevel,
  ]): {
    characterId: 'lina';
    accessLevel: StoryCharacterAccessLevel;
  } => ({ characterId, accessLevel }));
  const currentStoryChapter = progressionState.manhwa.lastReadChapterId
    ?? completedChapters.at(-1)
    ?? 'chapter_1';

  return {
    currentStoryChapter,
    completedChapters,
    reachedCanonEvents: FINAL_MANHWA_CANON_EVENTS
      .map((event) => event.eventId)
      .filter((eventId) => reached.has(eventId)),
    echoState: {
      stageId: stage.stageId,
      visualFormId: stage.visualFormId,
      assetStatus: stage.visualFormId === 'echo_default'
        ? 'existing-safe-asset'
        : 'visual-slot',
    },
    unlockedKnowledge: {
      player: uniqueStrings(playerKnowledge),
      echo: uniqueStrings(echoKnowledge),
    },
    unlockedCharacterFiles,
    discoveredMemoryFragments: authoritative.discoveredMemoryFragmentIds,
    majorTransformationFlags: [],
  };
}

export function getStoryCharacterAccess(
  progressionState: GameProgressionState,
  characterId: 'lina',
): StoryCharacterAccessLevel {
  return createStoryStateReadModel(progressionState)
    .unlockedCharacterFiles
    .find((entry) => entry.characterId === characterId)
    ?.accessLevel ?? 'unknown';
}
