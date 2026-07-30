import type {
  NarrativeKnowledgeAudience,
} from '../../core/narrativeEventTypes';

export interface RuntimeKnowledgeNodeDefinition {
  nodeId: string;
  audience: NarrativeKnowledgeAudience;
  published: boolean;
  playerVisible: boolean;
}

/**
 * Runtime narrative knowledge registry.
 *
 * No Memory, Dialogue, Story, or Cinematic knowledge nodes are authored in
 * the current runtime data. Author Canon is deliberately not imported here.
 */
export const RUNTIME_NARRATIVE_KNOWLEDGE_NODES = Object.freeze(
  [] satisfies RuntimeKnowledgeNodeDefinition[],
);
