import type { GameActions } from '../../core/gameTypes';
import type { DialogueId } from '../../domain/content/contracts';
import type { EchoPersonality } from '../../domain/echo/echoPersonality';
import {
  chooseDialogueOption,
  startDialogue,
} from '../../domain/narrative/dialogueGraph';
import { recordDecision } from '../../domain/narrative/decisionLedger';
import { evaluateEndingEligibility } from '../../domain/narrative/endingEngine';
import { unlockEligibleMemories } from '../../domain/narrative/memorySystem';
import type { NarrativeState } from '../../domain/narrative/narrativeState';
import {
  DIALOGUE_DEFINITIONS,
  ENDING_DEFINITIONS,
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../game/statePorts';
import { syncEchoPersonality } from '../game/echoCompatibility';

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

export function createNarrativeActions(
  set: GameStateSetter,
  get: GameStateGetter,
): NarrativeActions {
  return {
    setNarrativeFlag(flag, value) {
      set((state) => ({
        narrative: withEndingEligibility(
          {
            ...state.narrative,
            activeFlags: {
              ...state.narrative.activeFlags,
              [flag]: value,
            },
          },
          state.echo.personality,
          state.progression,
        ),
      }));
    },

    recordNarrativeDecision(decisionId, choiceId, source = 'system') {
      set((state) => ({
        narrative: withEndingEligibility(
          recordDecision(state.narrative, {
            decisionId,
            choiceId,
            source,
          }),
          state.echo.personality,
          state.progression,
        ),
      }));
    },

    unlockEligibleMemories() {
      const state = get();
      const result = unlockEligibleMemories(MEMORY_DEFINITIONS, {
        echo: state.echo.personality,
        progression: state.progression,
        narrative: state.narrative,
      });
      const narrative = withEndingEligibility(
        result.narrative,
        result.echo,
        state.progression,
      );

      set({
        echo: syncEchoPersonality(state.echo, result.echo),
        narrative,
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
        unlockedMemoryIds: result.unlockedMemoryIds,
        unlockedFragmentIds: result.unlockedFragmentIds,
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
        echo: state.echo.personality,
        progression: state.progression,
        narrative: state.narrative,
      });
      set({
        narrative: withEndingEligibility(
          result.narrative,
          result.echo,
          state.progression,
        ),
      });
    },

    chooseDialogueOption(choiceId) {
      const state = get();
      const dialogueId = state.narrative.dialogue.activeDialogueId;
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
        echo: state.echo.personality,
        progression: state.progression,
        narrative: state.narrative,
      });
      set({
        echo: syncEchoPersonality(state.echo, result.echo),
        narrative: withEndingEligibility(
          result.narrative,
          result.echo,
          state.progression,
        ),
      });
    },

    evaluateNarrativeEndings() {
      const state = get();
      const result = evaluateEndingEligibility(ENDING_DEFINITIONS, {
        echo: state.echo.personality,
        progression: state.progression,
        narrative: state.narrative,
      });
      set({
        narrative: {
          ...state.narrative,
          endingEligibility: result.eligibility,
        },
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
