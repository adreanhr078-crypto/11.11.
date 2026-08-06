import type {
  GameActions,
  TimePhase,
  WishNode,
  WishStatus,
} from '../../core/gameTypes';
import { getDailyMissions } from '../../core/dailyMissions';
import {
  checkAllAchievements,
  checkEndingProgress,
  mergeAchievements,
  updateEchoMood,
  updateTraits,
} from '../../stores/gameStoreHelpers';
import {
  applyEchoEffects,
} from '../../domain/progression/gameProgressionReducer';
import {
  projectCanonicalEchoCompatibility,
} from '../../domain/echo/echoCompatibilityProjection';
import type { GameStateGetter, GameStateSetter } from './statePorts';
import { GAME_STORAGE_NAME } from '../../infrastructure/persistence/gamePersistence';
import { ExpandedEndingSystem } from '../../domain/endings/endingCatalog';
import {
  ECHO_MIND_LIVING_STORAGE_KEY,
} from '../echo/echoMindLivingStore';

type WorldActions = Pick<
  GameActions,
  | 'advanceTime'
  | 'addWish'
  | 'completeWish'
  | 'checkEndings'
  | 'makeFinalChoice'
  | 'resetGame'
  | 'replayEnding'
>;

function resolveTime(now: Date): {
  phase: TimePhase;
  phaseIndex: number;
  isNight: boolean;
} {
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour >= 5 && hour < 12) {
    return { phase: 'morning', phaseIndex: 0, isNight: false };
  }
  if (hour >= 12 && hour < 17) {
    return { phase: 'day', phaseIndex: 0, isNight: false };
  }
  if (hour >= 17 && hour < 23) {
    return { phase: 'evening', phaseIndex: 0, isNight: false };
  }
  if (hour === 23 && minute < 5) {
    return { phase: '11:00', phaseIndex: 1, isNight: true };
  }
  if (hour === 23 && minute < 11) {
    return { phase: '11:05', phaseIndex: 2, isNight: true };
  }
  return { phase: '11:11', phaseIndex: 3, isNight: true };
}

export function createWorldActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: () => Date = () => new Date(),
): WorldActions {
  return {
    advanceTime: () => {
      const currentTime = now();
      set((state) => {
        const clock = resolveTime(currentTime);
        const newDayCycle = (
          currentTime.getHours() === 0
          && state.time.hour === 23
        )
          ? state.time.dayCycle + 1
          : state.time.dayCycle;
        const echoEffects = clock.isNight
          ? {
              fear: 0.4,
              corruption: -0.1,
            }
          : {
              fear: -0.2,
            };
        const transition = applyEchoEffects(
          state.progressionState,
          echoEffects,
        );
        if (!transition.success) return {};
        const projectedEcho = projectCanonicalEchoCompatibility(
          transition.state.echo,
          state.echo,
        );
        const echo = {
          ...projectedEcho,
          mood: updateEchoMood(projectedEcho),
          personalityTraits: updateTraits(projectedEcho),
        };
        const glitchLevel = Math.max(
          0,
          state.world.glitchLevel - (clock.isNight ? 0.2 : 0.3),
        );
        const world = {
          ...state.world,
          glitchLevel,
          stability: Math.max(0, 100 - glitchLevel - echo.corruption),
          corruptionLevel: Math.min(
            100,
            glitchLevel + echo.corruption,
          ),
        };
        const patch = {
          progressionState: transition.state,
          time: {
            ...state.time,
            ...clock,
            hour: currentTime.getHours(),
            minute: currentTime.getMinutes(),
            dayCycle: newDayCycle,
          },
          world,
          echo,
          narrativeTriggers: clock.phaseIndex >= 1
            ? { ...state.narrativeTriggers, first_night: true }
            : state.narrativeTriggers,
        };

        return newDayCycle > state.time.dayCycle
          ? {
              ...patch,
              dailyMissions: getDailyMissions(
                state.progression.completedPuzzleIds,
              ),
              lastMissionRefresh: currentTime.getTime(),
            }
          : patch;
      });
    },

    addWish: (text) => {
      const state = get();
      const wish: WishNode = {
        id: `w_${Date.now()}`,
        text,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        storyImpact: Math.floor(Math.random() * 30) + 10,
      };
      const achievements = checkAllAchievements(
        state.solvedPuzzles,
        state.echo,
        state.flower.stage,
        state.wishes.length + 1,
        state.time.dayCycle,
        state.endings,
      );
      set({
        wishes: [...state.wishes, wish],
        achievements: mergeAchievements(state.achievements, achievements),
      });
    },

    completeWish: (wishId) => {
      const state = get();
      const wishes = state.wishes.map((wish) => (
        wish.id === wishId
          ? {
              ...wish,
              status: 'completed' as WishStatus,
              progress: 100,
            }
          : wish
      ));
      set({
        wishes,
        endings: checkEndingProgress({ ...state, wishes }),
      });
    },

    checkEndings: () => {
      const state = get();
      set({ endings: checkEndingProgress(state) });
    },

    makeFinalChoice: (choice) => {
      const state = get();
      const isKnownEnding = ExpandedEndingSystem.endings.some(
        (ending) => ending.id === choice,
      );
      if (!isKnownEnding) return;
      set({
        finalChoice: choice,
        unlockedEndings: [...new Set([...state.unlockedEndings, choice])],
        seenEndings: [...new Set([...state.seenEndings, choice])],
        achievedEnding: choice,
        lastEndingViewed: choice,
      });
    },

    resetGame: () => {
      localStorage.removeItem(GAME_STORAGE_NAME);
      localStorage.removeItem('eleven_full_save');
      localStorage.removeItem('eleven_echo_state');
      localStorage.removeItem('eleven_last_insert');
      localStorage.removeItem(ECHO_MIND_LIVING_STORAGE_KEY);
      window.location.reload();
    },

    replayEnding: (endingId) => {
      const state = get();
      set({
        lastEndingViewed: endingId,
        seenEndings: [...new Set([...state.seenEndings, endingId])],
      });
    },
  };
}
