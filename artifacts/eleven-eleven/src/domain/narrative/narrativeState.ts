import type {
  DialogueId,
  EndingId,
  MemoryFragmentId,
  MemoryId,
  SceneId,
} from '../content/contracts';

export interface DecisionRecord {
  id: string;
  choiceId: string;
  source: 'dialogue' | 'puzzle' | 'system' | 'ending';
  createdAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface DialogueRuntimeState {
  activeDialogueId: DialogueId | null;
  currentNodeId: string | null;
  completedDialogueIds: DialogueId[];
}

export interface EndingEligibility {
  endingId: EndingId;
  eligible: boolean;
  metConditions: number;
  totalConditions: number;
  unmetReasons: string[];
}

export interface NarrativeState {
  unlockedMemoryIds: MemoryId[];
  unlockedMemoryFragmentIds: MemoryFragmentId[];
  activeFlags: Record<string, boolean>;
  decisionHistory: DecisionRecord[];
  latestDecisions: Record<string, string>;
  dialogue: DialogueRuntimeState;
  pendingSceneIds: SceneId[];
  endingEligibility: EndingEligibility[];
}

export function createInitialNarrativeState(): NarrativeState {
  return {
    unlockedMemoryIds: [],
    unlockedMemoryFragmentIds: [],
    activeFlags: {},
    decisionHistory: [],
    latestDecisions: {},
    dialogue: {
      activeDialogueId: null,
      currentNodeId: null,
      completedDialogueIds: [],
    },
    pendingSceneIds: [],
    endingEligibility: [],
  };
}

export function normalizeNarrativeState(
  state: Partial<NarrativeState> | undefined,
): NarrativeState {
  const initial = createInitialNarrativeState();
  if (!state) return initial;

  return {
    unlockedMemoryIds: [...new Set(state.unlockedMemoryIds ?? [])],
    unlockedMemoryFragmentIds: [
      ...new Set(state.unlockedMemoryFragmentIds ?? []),
    ],
    activeFlags: { ...(state.activeFlags ?? {}) },
    decisionHistory: [...(state.decisionHistory ?? [])],
    latestDecisions: { ...(state.latestDecisions ?? {}) },
    dialogue: {
      activeDialogueId: state.dialogue?.activeDialogueId ?? null,
      currentNodeId: state.dialogue?.currentNodeId ?? null,
      completedDialogueIds: [
        ...new Set(state.dialogue?.completedDialogueIds ?? []),
      ],
    },
    pendingSceneIds: [...new Set(state.pendingSceneIds ?? [])],
    endingEligibility: [...(state.endingEligibility ?? [])],
  };
}

