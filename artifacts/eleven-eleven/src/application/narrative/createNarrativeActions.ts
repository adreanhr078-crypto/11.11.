import type { GameActions } from '../../core/gameTypes';
import type { DialogueId } from '../../domain/content/contracts';
import type { EchoPersonality } from '../../domain/echo/echoPersonality';
import {
  chooseDialogueOption,
  startDialogue,
} from '../../domain/narrative/dialogueGraph';
import { recordDecision } from '../../domain/narrative/decisionLedger';
import { evaluateEndingEligibility } from '../../domain/narrative/endingEngine';
import {
  findNextEligibleMemorySource,
} from '../../domain/narrative/memorySystem';
import type { NarrativeState } from '../../domain/narrative/narrativeState';
import {
  applyNarrativeEventTransaction,
} from '../../domain/narrative/narrativeEventTransaction';
import {
  RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
} from '../../domain/narrative/knowledgeRegistry';
import {
  RUNTIME_ECHO_EVOLUTION_STAGES,
  RUNTIME_ECHO_STORY_EVENTS,
} from '../../domain/echo/echoEvolutionDefinitions';
import {
  DIALOGUE_DEFINITIONS,
  ENDING_DEFINITIONS,
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import type {
  GameStateGetter,
  GameStateSetter,
  GameTimestampProvider,
} from '../game/statePorts';
import {
  projectGameProgressionCompatibility,
} from '../game/createGameProgressionActions';
import {
  createDialogueNarrativeEffectPlan,
  createMemoryNarrativeEffectPlan,
} from './narrativeSourceAdapters';

type NarrativeActions = Pick<
  GameActions,
  | 'setNarrativeFlag'
  | 'recordNarrativeDecision'
  | 'unlockEligibleMemories'
  | 'startDialogueGraph'
  | 'chooseDialogueOption'
  | 'evaluateNarrativeEndings'
>;

function withEndingEligibility(
  narrative: NarrativeState,
  echo: EchoPersonality,
  progression: ReturnType<GameStateGetter>['progression'],
): NarrativeState {
  const result = evaluateEndingEligibility(ENDING_DEFINITIONS, {
    echo,
    progression,
    narrative,
  });

  return {
    ...narrative,
    endingEligibility: result.eligibility,
  };
}

function canonicalPersonality(
  state: ReturnType<GameStateGetter>,
  progressionState = state.progressionState,
): EchoPersonality {
  return {
    humanity: progressionState.echo.humanity,
    trust: progressionState.echo.trust,
    fear: progressionState.echo.fear,
    anger: progressionState.echo.anger,
    sadness: progressionState.echo.sadness,
    corruption: progressionState.echo.corruption,
    memoriesRecovered: progressionState.echo.memoriesRecovered,
  };
}

const NARRATIVE_TRANSACTION_CONTEXT = {
  knowledgeNodes: RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
  storyEvents: RUNTIME_ECHO_STORY_EVENTS,
  evolutionStages: RUNTIME_ECHO_EVOLUTION_STAGES,
};

export function createNarrativeActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: GameTimestampProvider = () => new Date().toISOString(),
): NarrativeActions {
  return {
    setNarrativeFlag(flag, value) {
      set((state) => {
        const narrative = withEndingEligibility(
          {
            ...state.progressionState.story.narrative,
            activeFlags: {
              ...state.progressionState.story.narrative.activeFlags,
              [flag]: value,
            },
          },
          canonicalPersonality(state),
          state.progressionState.puzzles.journey,
        );
        return projectGameProgressionCompatibility(state, {
          ...state.progressionState,
          story: { ...state.progressionState.story, narrative },
        });
      });
    },

    recordNarrativeDecision(decisionId, choiceId, source = 'system') {
      set((state) => {
        const narrative = withEndingEligibility(
          recordDecision(state.progressionState.story.narrative, {
            decisionId,
            choiceId,
            source,
          }),
          canonicalPersonality(state),
          state.progressionState.puzzles.journey,
        );
        return projectGameProgressionCompatibility(state, {
          ...state.progressionState,
          story: { ...state.progressionState.story, narrative },
        });
      });
    },

    unlockEligibleMemories() {
      const state = get();
      let progressionState = state.progressionState;
      const unlockedMemoryIds: string[] = [];
      const unlockedFragmentIds: string[] = [];
      const timestamp = now();

      for (;;) {
        const source = findNextEligibleMemorySource(
          MEMORY_DEFINITIONS,
          {
            echo: canonicalPersonality(state, progressionState),
            progression: progressionState.puzzles.journey,
            narrative: progressionState.story.narrative,
          },
        );
        if (!source) break;
        const plan = createMemoryNarrativeEffectPlan(
          source,
          timestamp,
        );
        if (!plan) {
          throw new Error('Memory contains a non-canonical effect');
        }
        const transaction = applyNarrativeEventTransaction(
          progressionState,
          plan,
          NARRATIVE_TRANSACTION_CONTEXT,
        );
        if (!transaction.success) {
          throw new Error(
            `Memory transaction failed: ${transaction.failureReason}`,
          );
        }
        if (transaction.state === progressionState) {
          throw new Error('Memory receipt does not match narrative state');
        }
        progressionState = transaction.state;
        if (source.kind === 'memory') {
          unlockedMemoryIds.push(source.definition.id);
        } else {
          unlockedFragmentIds.push(source.fragment.id);
        }
      }

      const narrative = withEndingEligibility(
        progressionState.story.narrative,
        canonicalPersonality(state, progressionState),
        progressionState.puzzles.journey,
      );
      progressionState = {
        ...progressionState,
        story: { ...progressionState.story, narrative },
      };
      set({
        ...projectGameProgressionCompatibility(state, progressionState),
        memory: {
          ...state.memory,
          fragmentsCollected: narrative.unlockedMemoryFragmentIds.length,
          totalFragments: MEMORY_DEFINITIONS.reduce(
            (count, memory) => count + memory.fragments.length,
            0,
          ),
        },
      });

      return {
        unlockedMemoryIds,
        unlockedFragmentIds,
      };
    },

    startDialogueGraph(dialogueId: DialogueId) {
      const state = get();
      const definition = DIALOGUE_DEFINITIONS.find((item) => (
        item.id === dialogueId
      ));
      if (!definition) {
        throw new Error(`Unknown dialogue graph: ${dialogueId}`);
      }

      const result = startDialogue(definition, {
        echo: canonicalPersonality(state),
        progression: state.progressionState.puzzles.journey,
        narrative: state.progressionState.story.narrative,
      });
      const narrative = withEndingEligibility(
        result.narrative,
        canonicalPersonality(state),
        state.progressionState.puzzles.journey,
      );
      set({
        ...projectGameProgressionCompatibility(state, {
          ...state.progressionState,
          story: { ...state.progressionState.story, narrative },
        }),
      });
    },

    chooseDialogueOption(choiceId) {
      const state = get();
      const narrativeState = state.progressionState.story.narrative;
      const dialogueId = narrativeState.dialogue.activeDialogueId;
      if (!dialogueId) {
        throw new Error('No active dialogue graph');
      }
      const definition = DIALOGUE_DEFINITIONS.find((item) => (
        item.id === dialogueId
      ));
      if (!definition) {
        throw new Error(`Unknown active dialogue graph: ${dialogueId}`);
      }

      const result = chooseDialogueOption(definition, choiceId, {
        echo: canonicalPersonality(state),
        progression: state.progressionState.puzzles.journey,
        narrative: narrativeState,
      });
      const activeNodeId = narrativeState.dialogue.currentNodeId
        ?? definition.entryNodeId;
      const activeNode = definition.nodes.find(
        ({ id }) => id === activeNodeId,
      );
      if (!activeNode) {
        throw new Error(
          `${definition.id} current node is missing: ${activeNodeId}`,
        );
      }
      const timestamp = now();
      const plan = createDialogueNarrativeEffectPlan(
        definition,
        activeNode,
        choiceId,
        {
          nextNodeId: result.node?.nodeId ?? null,
          completed: result.completed,
        },
        timestamp,
        narrativeState.dialogue.completedDialogueIds.includes(
          definition.id,
        ),
      );
      if (!plan) {
        throw new Error('Dialogue contains a non-canonical effect');
      }
      const transaction = applyNarrativeEventTransaction(
        state.progressionState,
        plan,
        NARRATIVE_TRANSACTION_CONTEXT,
      );
      if (!transaction.success) {
        throw new Error(
          `Dialogue transaction failed: ${transaction.failureReason}`,
        );
      }
      const narrative = withEndingEligibility(
        transaction.state.story.narrative,
        canonicalPersonality(state, transaction.state),
        transaction.state.puzzles.journey,
      );
      const progressionState = {
        ...transaction.state,
        story: { ...transaction.state.story, narrative },
      };
      set({
        ...projectGameProgressionCompatibility(state, progressionState),
      });
    },

    evaluateNarrativeEndings() {
      const state = get();
      const result = evaluateEndingEligibility(ENDING_DEFINITIONS, {
        echo: canonicalPersonality(state),
        progression: state.progressionState.puzzles.journey,
        narrative: state.progressionState.story.narrative,
      });
      const narrative = {
          ...state.progressionState.story.narrative,
          endingEligibility: result.eligibility,
      };
      set({
        ...projectGameProgressionCompatibility(state, {
          ...state.progressionState,
          story: { ...state.progressionState.story, narrative },
        }),
        unlockedEndings: [
          ...new Set([
            ...state.unlockedEndings,
            ...result.eligibleEndingIds,
          ]),
        ],
      });
      return result.eligibleEndingIds;
    },
  };
}
