import type {
  EchoEvolutionStageDefinition,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';

/**
 * Runtime publication registry for evolution-driving story events.
 *
 * No event is published in the current runtime canon. Author-only events from
 * Chapters 2 and 3 stay outside the player bundle.
 */
export const RUNTIME_ECHO_STORY_EVENTS = Object.freeze(
  [] satisfies RuntimeStoryEventDefinition[],
);

/**
 * Only the safe initial stage is currently publishable. All later Long Fall
 * stages remain outside this runtime registry until a matching story event is
 * officially published.
 */
export const RUNTIME_ECHO_EVOLUTION_STAGES = Object.freeze([
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
    safePlayerLabel: {
      ar: 'إيكو',
      en: 'Echo',
    },
    knowledgeBoundary: 'runtime-public',
  }),
] satisfies EchoEvolutionStageDefinition[]);
