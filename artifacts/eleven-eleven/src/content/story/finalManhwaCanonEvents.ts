import type {
  EchoEvolutionStageDefinition,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';
import type {
  NarrativeKnowledgeGrant,
} from '../../core/narrativeEventTypes';

export type FinalManhwaCanonEventId =
  | 'manhwa_chapter_04_black_coronation'
  | 'manhwa_chapter_04_lina_protocol'
  | 'manhwa_chapter_04_black_echo_protocol';

export interface FinalManhwaCanonEventDefinition
  extends RuntimeStoryEventDefinition {
  eventId: FinalManhwaCanonEventId;
  source: {
    sourceType: 'manhwa';
    chapterId: 'chapter_4';
    pageId: string;
    globalPageNumber: number;
    /** The prior verified chapter needed before this source can be claimed. */
    requiredCompletedChapterId: 'chapter_3';
    /** A prior canonical receipt needed before this event may be recorded. */
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
 * Publication-safe Canon milestones extracted from the approved final Manhwa.
 *
 * These are source coordinates, not client-authored accomplishments. The
 * server resolves a reader checkpoint against this registry and never accepts
 * a Canon event ID from the client.
 */
export const FINAL_MANHWA_CANON_EVENTS: readonly FinalManhwaCanonEventDefinition[] = Object.freeze([
  Object.freeze({
    eventId: 'manhwa_chapter_04_black_coronation',
    eventVersion: 1,
    chapterId: 'chapter_4',
    published: true,
    source: {
      sourceType: 'manhwa',
      chapterId: 'chapter_4',
      pageId: 'manhwa_ch04_page_02',
      globalPageNumber: 56,
      requiredCompletedChapterId: 'chapter_3',
      requiredCanonEventId: null,
    },
    storyFlag: 'canon.manhwa_chapter_04_black_coronation.reached',
    knowledgeGrants: [
      { nodeId: 'echo_knowledge_black_coronation', audience: 'echo' },
    ],
    characterFileUnlocks: [],
  } as const),
  Object.freeze({
    eventId: 'manhwa_chapter_04_lina_protocol',
    eventVersion: 1,
    chapterId: 'chapter_4',
    published: true,
    source: {
      sourceType: 'manhwa',
      chapterId: 'chapter_4',
      pageId: 'manhwa_ch04_page_04',
      globalPageNumber: 58,
      requiredCompletedChapterId: 'chapter_3',
      requiredCanonEventId: 'manhwa_chapter_04_black_coronation',
    },
    storyFlag: 'canon.manhwa_chapter_04_lina_protocol.reached',
    knowledgeGrants: [
      { nodeId: 'echo_knowledge_lina_protocol', audience: 'echo' },
    ],
    characterFileUnlocks: [{ characterId: 'lina', accessLevel: 'partial' }],
  } as const),
  Object.freeze({
    eventId: 'manhwa_chapter_04_black_echo_protocol',
    eventVersion: 1,
    chapterId: 'chapter_4',
    published: true,
    source: {
      sourceType: 'manhwa',
      chapterId: 'chapter_4',
      pageId: 'manhwa_ch04_page_08',
      globalPageNumber: 62,
      requiredCompletedChapterId: 'chapter_3',
      requiredCanonEventId: 'manhwa_chapter_04_lina_protocol',
    },
    storyFlag: 'canon.manhwa_chapter_04_black_echo_protocol.reached',
    knowledgeGrants: [
      { nodeId: 'echo_knowledge_black_echo_protocol', audience: 'echo' },
    ],
    characterFileUnlocks: [],
  } as const),
] satisfies readonly FinalManhwaCanonEventDefinition[]);

export const FINAL_MANHWA_RUNTIME_STORY_EVENTS = Object.freeze(
  FINAL_MANHWA_CANON_EVENTS.map((event) => Object.freeze({
    eventId: event.eventId,
    eventVersion: event.eventVersion,
    chapterId: event.chapterId,
    published: event.published,
  })),
) satisfies readonly RuntimeStoryEventDefinition[];

/**
 * These IDs are derived only from server-issued Canon receipts. A client can
 * never provide one as a fabricated Echo knowledge unlock.
 */
export const FINAL_MANHWA_SERVER_ECHO_KNOWLEDGE_NODE_IDS = Object.freeze(
  FINAL_MANHWA_CANON_EVENTS
    .flatMap((event) => event.knowledgeGrants)
    .filter((grant) => grant.audience === 'echo')
    .map((grant) => grant.nodeId),
);

/**
 * No visual asset is claimed for a transformed stage until a canon-approved
 * asset is supplied. The current presentation uses a lightweight atmosphere
 * slot while retaining the existing safe Echo portrait/body asset.
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
  Object.freeze({
    stageId: 'black_coronation',
    order: 2,
    chapterId: 'chapter_4',
    requiredStoryEventId: 'manhwa_chapter_04_black_coronation',
    previousStageId: 'awakening_fragile',
    visualFormId: 'echo_black_coronation_slot',
    isPermanent: false,
    published: true,
    playerVisible: true,
    safePlayerLabel: { ar: 'Black Coronation', en: 'Black Coronation' },
    knowledgeBoundary: 'story-event-revealed',
  }),
  Object.freeze({
    stageId: 'black_echo_protocol',
    order: 3,
    chapterId: 'chapter_4',
    requiredStoryEventId: 'manhwa_chapter_04_black_echo_protocol',
    previousStageId: 'black_coronation',
    visualFormId: 'echo_black_echo_protocol_slot',
    isPermanent: false,
    published: true,
    playerVisible: true,
    safePlayerLabel: { ar: 'Black Echo Protocol', en: 'Black Echo Protocol' },
    knowledgeBoundary: 'story-event-revealed',
  }),
] satisfies readonly EchoEvolutionStageDefinition[]);

const byEventId = FINAL_MANHWA_CANON_EVENTS.reduce(
  (definitions, event) => {
    definitions[event.eventId] = event;
    return definitions;
  },
  {} as Record<FinalManhwaCanonEventId, FinalManhwaCanonEventDefinition>,
);

export const FINAL_MANHWA_CANON_EVENT_BY_ID = Object.freeze(byEventId);

export function getFinalManhwaCanonEvent(
  eventId: string,
): FinalManhwaCanonEventDefinition | undefined {
  return FINAL_MANHWA_CANON_EVENT_BY_ID[eventId as FinalManhwaCanonEventId];
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
