import type {
  DecisionRecord,
  NarrativeState,
} from './narrativeState';

export interface RecordDecisionInput {
  decisionId: string;
  choiceId: string;
  source: DecisionRecord['source'];
  createdAt?: number;
  metadata?: DecisionRecord['metadata'];
}

export function recordDecision(
  state: NarrativeState,
  input: RecordDecisionInput,
): NarrativeState {
  const record: DecisionRecord = {
    id: input.decisionId,
    choiceId: input.choiceId,
    source: input.source,
    createdAt: input.createdAt ?? Date.now(),
    metadata: input.metadata,
  };

  return {
    ...state,
    latestDecisions: {
      ...state.latestDecisions,
      [input.decisionId]: input.choiceId,
    },
    decisionHistory: [...state.decisionHistory, record],
  };
}

export function hasDecision(
  state: NarrativeState,
  decisionId: string,
): boolean {
  return decisionId in state.latestDecisions;
}

export function getLatestDecision(
  state: NarrativeState,
  decisionId: string,
): string | null {
  return state.latestDecisions[decisionId] ?? null;
}

