import type { FinalManhwaCanonEventId } from '../../content/story/finalManhwaCanonEvents';
import type { GameProgressionState } from '../../core/gameProgressionTypes';
import { createStoryStateReadModel } from '../story/storyState';

export type AttachmentCharacterId =
  | 'echo'
  | 'yuki'
  | 'zero'
  | 'kenja'
  | 'lina'
  | 'nara';

export type CharacterMomentContentType =
  | 'visual'
  | 'archive-file'
  | 'message'
  | 'reaction'
  | 'memory'
  | 'environment-clue';

export type CharacterMomentSpoilerLevel = 'none' | 'partial' | 'revealed';

export interface CharacterMomentDefinition {
  momentId: string;
  characterId: AttachmentCharacterId;
  unlockCanonEvent: FinalManhwaCanonEventId | null;
  minimumStoryState: {
    requiredCanonEventIds: readonly FinalManhwaCanonEventId[];
  };
  contentType: CharacterMomentContentType;
  contentReference: string | null;
  spoilerLevel: CharacterMomentSpoilerLevel;
  replayable: boolean;
  ownerContentRequired: boolean;
}

export interface CharacterKnowledgeGateDefinition {
  gateId: string;
  characterId: AttachmentCharacterId;
  unlockCanonEvent: FinalManhwaCanonEventId | null;
  minimumStoryState: {
    requiredCanonEventIds: readonly FinalManhwaCanonEventId[];
  };
  spoilerLevel: CharacterMomentSpoilerLevel;
  ownerContentRequired: boolean;
}

export interface CharacterMomentReadModel extends CharacterMomentDefinition {
  unlocked: boolean;
  seenState: 'unseen' | 'seen';
}

/**
 * Framework registry only. This entry points at the already-approved partial
 * Lina archive file; it does not author a new scene, dialogue, or image.
 */
export const CHARACTER_MOMENTS: readonly CharacterMomentDefinition[] = Object.freeze([
  {
    momentId: 'lina-partial-protocol-file',
    characterId: 'lina',
    unlockCanonEvent: 'manhwa_chapter_04_lina_protocol',
    minimumStoryState: {
      requiredCanonEventIds: ['manhwa_chapter_04_black_coronation', 'manhwa_chapter_04_lina_protocol'],
    },
    contentType: 'archive-file',
    contentReference: 'character_lina_partial_file',
    spoilerLevel: 'partial',
    replayable: true,
    ownerContentRequired: false,
  },
] as const satisfies readonly CharacterMomentDefinition[]);

/**
 * Character-specific knowledge boundaries. Entries without published owner
 * content stay locked even if local legacy flags mention the character.
 */
export const CHARACTER_KNOWLEDGE_GATES: readonly CharacterKnowledgeGateDefinition[] = Object.freeze([
  {
    gateId: 'yuki-knowledge',
    characterId: 'yuki',
    unlockCanonEvent: null,
    minimumStoryState: { requiredCanonEventIds: [] },
    spoilerLevel: 'partial',
    ownerContentRequired: true,
  },
  {
    gateId: 'zero-knowledge',
    characterId: 'zero',
    unlockCanonEvent: null,
    minimumStoryState: { requiredCanonEventIds: [] },
    spoilerLevel: 'partial',
    ownerContentRequired: true,
  },
  {
    gateId: 'kenja-knowledge',
    characterId: 'kenja',
    unlockCanonEvent: null,
    minimumStoryState: { requiredCanonEventIds: [] },
    spoilerLevel: 'partial',
    ownerContentRequired: true,
  },
  {
    gateId: 'nara-knowledge',
    characterId: 'nara',
    unlockCanonEvent: null,
    minimumStoryState: { requiredCanonEventIds: [] },
    spoilerLevel: 'partial',
    ownerContentRequired: true,
  },
] as const satisfies readonly CharacterKnowledgeGateDefinition[]);

function requiredEventsReached(
  required: readonly FinalManhwaCanonEventId[],
  reached: ReadonlySet<FinalManhwaCanonEventId>,
): boolean {
  return required.every((eventId) => reached.has(eventId));
}

export function getCharacterMomentReadModels(
  progressionState: GameProgressionState,
): CharacterMomentReadModel[] {
  const story = createStoryStateReadModel(progressionState);
  const reached = new Set(story.reachedCanonEvents);
  return CHARACTER_MOMENTS.map((moment) => ({
    ...moment,
    unlocked: !moment.ownerContentRequired
      && requiredEventsReached(moment.minimumStoryState.requiredCanonEventIds, reached),
    // Seen state is deliberately not inferred from a page view. A future
    // server receipt can add it without changing unlock semantics.
    seenState: 'unseen',
  }));
}

export function isCharacterKnowledgeGateOpen(
  gate: CharacterKnowledgeGateDefinition,
  progressionState: GameProgressionState,
): boolean {
  if (gate.ownerContentRequired) return false;
  const story = createStoryStateReadModel(progressionState);
  return requiredEventsReached(
    gate.minimumStoryState.requiredCanonEventIds,
    new Set(story.reachedCanonEvents),
  );
}
