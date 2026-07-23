import type { GameActions } from '../../core/gameTypes';
import {
  checkAllAchievements,
  generateEchoDialogue,
  mergeAchievements,
  updateEchoMood,
  updateTraits,
} from '../../stores/gameStoreHelpers';
import {
  applyLegacyEchoEffects,
  setLegacyEchoValue,
} from './echoCompatibility';
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
): EchoActions {
  return {
    chat: () => {
      const state = get();
      const dialogue = generateEchoDialogue(state);
      const effects = {
        trust: 3,
        fear: -2,
        hope: 2,
      };
      let echo = applyLegacyEchoEffects(state.echo, effects);
      echo = {
        ...echo,
        loneliness: Math.max(0, echo.loneliness - 3),
        lastDialogue: dialogue,
        dialogueHistory: [...echo.dialogueHistory.slice(-50), dialogue],
        xp: echo.xp + 10,
        coins: echo.coins + 5,
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
      const state = get();
      const echo = type === 'rage'
        ? setLegacyEchoValue(
            state.echo,
            'ragePoints',
            state.echo.ragePoints + amount,
          )
        : {
            ...state.echo,
            forgivenessPoints: Math.min(
              100,
              Math.max(0, state.echo.forgivenessPoints + amount),
            ),
          };
      set({ echo });
    },

    incrementTrust: (amount = 1) => {
      const state = get();
      set({
        echo: setLegacyEchoValue(
          state.echo,
          'trust',
          state.echo.trust + amount,
        ),
      });
    },

    decrementTrust: (amount = 1) => {
      const state = get();
      set({
        echo: setLegacyEchoValue(
          state.echo,
          'trust',
          state.echo.trust - amount,
        ),
      });
    },

    incrementFear: (amount = 1) => {
      const state = get();
      set({
        echo: setLegacyEchoValue(
          state.echo,
          'fear',
          state.echo.fear + amount,
        ),
      });
    },

    decrementFear: (amount = 1) => {
      const state = get();
      set({
        echo: setLegacyEchoValue(
          state.echo,
          'fear',
          state.echo.fear - amount,
        ),
      });
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
