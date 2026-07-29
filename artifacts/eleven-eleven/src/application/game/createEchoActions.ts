import type { GameActions } from '../../core/gameTypes';
import {
  checkAllAchievements,
  generateEchoDialogue,
  mergeAchievements,
  updateEchoMood,
  updateTraits,
} from '../../stores/gameStoreHelpers';
import {
  type GameProgressionActions,
} from './createGameProgressionActions';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type EchoActions = Pick<
  GameActions,
  | 'chat'
  | 'updateTransformation'
  | 'incrementTrust'
  | 'decrementTrust'
  | 'incrementFear'
  | 'decrementFear'
  | 'incrementCuriosity'
  | 'setLevel'
>;

export function createEchoActions(
  set: GameStateSetter,
  get: GameStateGetter,
  progressionActions: GameProgressionActions,
): EchoActions {
  return {
    chat: () => {
      const effects = {
        trust: 3,
        fear: -2,
      };
      progressionActions.applyEchoEffects(effects);
      progressionActions.addCoins(5);
      const state = get();
      const dialogue = generateEchoDialogue(state);
      let echo = {
        ...state.echo,
        lastDialogue: dialogue,
        dialogueHistory: [
          ...state.echo.dialogueHistory.slice(-50),
          dialogue,
        ],
        xp: state.echo.xp + 10,
      };
      echo = {
        ...echo,
        mood: updateEchoMood(echo),
        personalityTraits: updateTraits(echo),
      };
      const achievements = checkAllAchievements(
        state.solvedPuzzles,
        echo,
        state.flower.stage,
        state.wishes.length,
        state.time.dayCycle,
        state.endings,
      );

      set({
        echo,
        player: {
          ...state.player,
          interactions: state.player.interactions + 1,
        },
        narrativeTriggers: {
          ...state.narrativeTriggers,
          first_chat: true,
        },
        achievements: mergeAchievements(state.achievements, achievements),
      });

      return { dialogue, effects };
    },

    updateTransformation: (type, amount) => {
      // Compatibility API only. Phase 3C will replace stage progression;
      // legacy rage/forgiveness values must not drive canonical Echo.
      void type;
      void amount;
    },

    incrementTrust: (amount = 1) => {
      progressionActions.applyEchoEffects({ trust: amount });
    },

    decrementTrust: (amount = 1) => {
      progressionActions.applyEchoEffects({ trust: -amount });
    },

    incrementFear: (amount = 1) => {
      progressionActions.applyEchoEffects({ fear: amount });
    },

    decrementFear: (amount = 1) => {
      progressionActions.applyEchoEffects({ fear: -amount });
    },

    incrementCuriosity: (amount = 1) => {
      const state = get();
      set({
        player: {
          ...state.player,
          curiosity: Math.min(
            100,
            Math.max(0, state.player.curiosity + amount),
          ),
        },
      });
    },

    setLevel: (level) => {
      const state = get();
      set({
        echo: {
          ...state.echo,
          level: Math.max(1, Math.min(50, level)),
        },
      });
    },
  };
}
