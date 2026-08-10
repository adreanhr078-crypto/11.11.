import type {
  EchoEvolutionStageDefinition,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';
import {
  FINAL_MANHWA_ECHO_EVOLUTION_STAGES,
  FINAL_MANHWA_RUNTIME_STORY_EVENTS,
} from '../../content/story/finalManhwaCanonEvents';

/**
 * Runtime publication registry for evolution-driving story events.
 *
 * These published entries come only from the final approved Manhwa. Author
 * Canon remains outside the player bundle.
 */
export const RUNTIME_ECHO_STORY_EVENTS: readonly RuntimeStoryEventDefinition[] =
  FINAL_MANHWA_RUNTIME_STORY_EVENTS;

/**
 * Every transition requires a source-proven published event. No final or
 * unpublished transformation is represented in this runtime registry.
 */
export const RUNTIME_ECHO_EVOLUTION_STAGES: readonly EchoEvolutionStageDefinition[] =
  FINAL_MANHWA_ECHO_EVOLUTION_STAGES;
