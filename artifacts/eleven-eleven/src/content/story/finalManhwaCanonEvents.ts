import type {
  EchoEvolutionStageDefinition,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';
import type {
  NarrativeKnowledgeGrant,
} from '../../core/narrativeEventTypes';
import type {
  FinalManhwaChapterId,
} from '../manhwa/finalManhwa';

/** Runtime IDs are intentionally open for a future, Owner-approved matrix. */
export type FinalManhwaCanonEventId = string;

export interface FinalManhwaCanonEventDefinition
  extends RuntimeStoryEventDefinition {
  eventId: FinalManhwaCanonEventId;
  source: {
    sourceType: 'manhwa';
    chapterId: FinalManhwaChapterId;
    pageId: string;
    globalPageNumber: number;
    requiredCompletedChapterId: FinalManhwaChapterId;
    requiredCanonEventId: FinalManhwaCanonEventId | null;
  };
  storyFlag: string;
  knowledgeGrants: readonly NarrativeKnowledgeGrant[];
  characterFileUnlocks: ReadonlyArray<{
    characterId: 'lina';
    accessLevel: 'partial';
  }>;
}

/**
 * These receipts were authored for the superseded 71-page publication.  They
 * remain immutable in player ledgers, but cannot project into the corrected
 * publication or unlock its future content.
 */
export const RETIRED_FINAL_MANHWA_CANON_EVENT_IDS = Object.freeze([
  'manhwa_chapter_04_black_coronation',
  'manhwa_chapter_04_lina_protocol',
  'manhwa_chapter_04_black_echo_protocol',
] as const);

export const RETIRED_FINAL_MANHWA_STORY_FLAGS = Object.freeze([
  'canon.manhwa_chapter_04_black_coronation.reached',
  'canon.manhwa_chapter_04_lina_protocol.reached',
  'canon.manhwa_chapter_04_black_echo_protocol.reached',
] as const);

export const RETIRED_FINAL_MANHWA_KNOWLEDGE_NODE_IDS = Object.freeze([
  'echo_knowledge_black_coronation',
  'echo_knowledge_lina_protocol',
  'echo_knowledge_black_echo_protocol',
] as const);

/**
 * The supplied PDF is active as reading material, but it does not by itself
 * approve a new Canon/reward matrix.  Leaving this registry empty prevents a
 * legacy source coordinate from being silently assigned to new art.
 */
export const FINAL_MANHWA_CANON_EVENTS: readonly FinalManhwaCanonEventDefinition[] =
  Object.freeze([]);

export const FINAL_MANHWA_RUNTIME_STORY_EVENTS = Object.freeze(
  FINAL_MANHWA_CANON_EVENTS.map((event) => Object.freeze({
    eventId: event.eventId,
    eventVersion: event.eventVersion,
    chapterId: event.chapterId,
    published: event.published,
  })),
) satisfies readonly RuntimeStoryEventDefinition[];

export const FINAL_MANHWA_SERVER_ECHO_KNOWLEDGE_NODE_IDS = Object.freeze(
  FINAL_MANHWA_CANON_EVENTS
    .flatMap((event) => event.knowledgeGrants)
    .filter((grant) => grant.audience === 'echo')
    .map((grant) => grant.nodeId),
);

/**
 * A single safe default visual form remains until a page/reveal matrix is
 * approved. It preserves the existing player-facing Echo state without
 * asserting any unpublished transformation from the corrected Manhwa.
 */
export const FINAL_MANHWA_ECHO_EVOLUTION_STAGES = Object.freeze([
  Object.freeze({
    stageId: 'awakening_fragile',
    order: 1,
    chapterId: 'chapter_1',
    requiredStoryEventId: null,
    previousStageId: null,
    visualFormId: 'echo_default',
    isPermanent: false,
    published: true,
    playerVisible: true,
    safePlayerLabel: { ar: 'إيكو', en: 'Echo' },
    knowledgeBoundary: 'runtime-public',
  }),
] satisfies readonly EchoEvolutionStageDefinition[]);

const byEventId = Object.fromEntries(
  FINAL_MANHWA_CANON_EVENTS.map((event) => [event.eventId, event]),
) as Record<string, FinalManhwaCanonEventDefinition>;

export const FINAL_MANHWA_CANON_EVENT_BY_ID = Object.freeze(byEventId);

export function getFinalManhwaCanonEvent(
  eventId: string,
): FinalManhwaCanonEventDefinition | undefined {
  return FINAL_MANHWA_CANON_EVENT_BY_ID[eventId];
}

export function getFinalManhwaCanonEventsForCheckpoint(input: {
  chapterId: string;
  pageId: string;
  globalPageNumber: number;
}): readonly FinalManhwaCanonEventDefinition[] {
  return FINAL_MANHWA_CANON_EVENTS.filter((event) => (
    event.source.chapterId === input.chapterId
    && event.source.pageId === input.pageId
    && event.source.globalPageNumber === input.globalPageNumber
  ));
}

export function isFinalManhwaCanonCheckpoint(input: {
  chapterId: string;
  pageId: string;
  globalPageNumber: number;
}): boolean {
  return getFinalManhwaCanonEventsForCheckpoint(input).length > 0;
}
