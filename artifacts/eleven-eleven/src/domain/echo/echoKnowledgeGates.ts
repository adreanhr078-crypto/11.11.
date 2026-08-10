import type { GameProgressionState } from '../../core/gameProgressionTypes';
import {
  createStoryStateReadModel,
} from '../story/storyState';
import type { FinalManhwaCanonEventId } from '../../content/story/finalManhwaCanonEvents';

export type EchoKnowledgeTopicStatus = 'locked' | 'available' | 'seen';

export interface EchoKnowledgeGateDefinition {
  topicId: string;
  requiredCanonEventId: FinalManhwaCanonEventId;
  safeLabel: string;
}

export interface EchoKnowledgeTopicReadModel extends EchoKnowledgeGateDefinition {
  status: EchoKnowledgeTopicStatus;
  lockedLabel: 'DATA INSUFFICIENT' | null;
}

/** Topic labels are intentionally neutral and do not expose future spoilers. */
export const ECHO_KNOWLEDGE_GATES: readonly EchoKnowledgeGateDefinition[] = Object.freeze([
  {
    topicId: 'echo_knowledge_black_coronation',
    requiredCanonEventId: 'manhwa_chapter_04_black_coronation',
    safeLabel: 'VERIFIED SIGNAL',
  },
  {
    topicId: 'echo_knowledge_lina_protocol',
    requiredCanonEventId: 'manhwa_chapter_04_lina_protocol',
    safeLabel: 'PARTIAL FILE',
  },
  {
    topicId: 'echo_knowledge_black_echo_protocol',
    requiredCanonEventId: 'manhwa_chapter_04_black_echo_protocol',
    safeLabel: 'PROTOCOL TRACE',
  },
] as const satisfies readonly EchoKnowledgeGateDefinition[]);

export function createEchoKnowledgeTopicReadModels(
  progressionState: GameProgressionState,
): EchoKnowledgeTopicReadModel[] {
  const story = createStoryStateReadModel(progressionState);
  const reached = new Set(story.reachedCanonEvents);
  const known = new Set(story.unlockedKnowledge.echo);
  return ECHO_KNOWLEDGE_GATES.map((gate) => {
    const unlocked = reached.has(gate.requiredCanonEventId)
      && known.has(gate.topicId);
    return {
      ...gate,
      status: unlocked ? 'available' : 'locked',
      lockedLabel: unlocked ? null : 'DATA INSUFFICIENT',
    };
  });
}
