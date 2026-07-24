import type { GameActions } from '../../core/gameTypes';
import {
  chooseCinematicOption,
  completeCinematicScene,
  pauseCinematic,
  resumeCinematic,
  startCinematicEpisode,
  stopCinematic,
  type CinematicTransitionResult,
} from '../../domain/cinematics/cinematicEngine';
import type { CinematicEpisodeId } from '../../domain/cinematics/contracts';
import { withEvaluatedEndings } from '../../domain/narrative/endingEngine';
import {
  CINEMATIC_EPISODE_DEFINITIONS,
} from '../../infrastructure/content/cinematicContentRegistry';
import {
  ENDING_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import { syncEchoPersonality } from '../game/echoCompatibility';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../game/statePorts';

type CinematicActions = Pick<
  GameActions,
  | 'startCinematicEpisode'
  | 'completeCinematicScene'
  | 'chooseCinematicChoice'
  | 'pauseCinematic'
  | 'resumeCinematic'
  | 'stopCinematic'
  | 'setCinematicPreferences'
>;

function getEpisode(episodeId: CinematicEpisodeId) {
  const episode = CINEMATIC_EPISODE_DEFINITIONS.find((item) => (
    item.id === episodeId
  ));
  if (!episode) throw new Error(`Unknown cinematic episode: ${episodeId}`);
  return episode;
}

function contextFrom(get: GameStateGetter) {
  const state = get();
  return {
    echo: state.echo.personality,
    progression: state.progression,
    narrative: state.narrative,
    cinematic: state.cinematic,
  };
}

function applyTransition(
  set: GameStateSetter,
  get: GameStateGetter,
  result: CinematicTransitionResult,
) {
  const state = get();
  const narrative = withEvaluatedEndings(
    result.narrative,
    ENDING_DEFINITIONS,
    {
      echo: result.echo,
      progression: state.progression,
    },
  );
  set({
    echo: syncEchoPersonality(state.echo, result.echo),
    narrative,
    cinematic: result.cinematic,
  });
}

export function createCinematicActions(
  set: GameStateSetter,
  get: GameStateGetter,
): CinematicActions {
  return {
    startCinematicEpisode(episodeId) {
      const result = startCinematicEpisode(
        getEpisode(episodeId),
        contextFrom(get),
      );
      applyTransition(set, get, result);
    },

    completeCinematicScene() {
      const state = get();
      const episodeId = state.cinematic.activeEpisodeId;
      if (!episodeId) throw new Error('No active cinematic episode');
      const result = completeCinematicScene(
        getEpisode(episodeId),
        contextFrom(get),
      );
      applyTransition(set, get, result);
    },

    chooseCinematicChoice(choiceId) {
      const state = get();
      const episodeId = state.cinematic.activeEpisodeId;
      if (!episodeId) throw new Error('No active cinematic episode');
      const result = chooseCinematicOption(
        getEpisode(episodeId),
        choiceId,
        contextFrom(get),
      );
      applyTransition(set, get, result);
    },

    pauseCinematic() {
      set((state) => ({
        cinematic: pauseCinematic(state.cinematic),
      }));
    },

    resumeCinematic() {
      set((state) => ({
        cinematic: resumeCinematic(state.cinematic),
      }));
    },

    stopCinematic() {
      set((state) => ({
        cinematic: stopCinematic(state.cinematic),
      }));
    },

    setCinematicPreferences(preferences) {
      set((state) => ({
        cinematic: {
          ...state.cinematic,
          preferences: {
            ...state.cinematic.preferences,
            ...preferences,
            voiceLocale: 'ja-JP',
          },
        },
      }));
    },
  };
}

