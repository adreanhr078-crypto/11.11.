import type { GameState } from '../../core/gameTypes';
import type {
  CinematicChoice,
  CinematicEpisodeDefinition,
  CinematicSceneDefinition,
} from '../../domain/cinematics/contracts';
import { conditionsPass } from '../../domain/narrative/ruleEngine';
import {
  CINEMATIC_EPISODE_DEFINITIONS,
} from '../../infrastructure/content/cinematicContentRegistry';

export interface CinematicPlaybackReadModel {
  episode: CinematicEpisodeDefinition;
  scene: CinematicSceneDefinition;
  availableChoices: CinematicChoice[];
  elapsedFromCheckpointMs: number;
}

export function getCinematicPlaybackReadModel(
  state: GameState,
  now = Date.now(),
): CinematicPlaybackReadModel | null {
  const episodeId = state.cinematic.activeEpisodeId;
  const sceneId = state.cinematic.activeSceneId;
  if (!episodeId || !sceneId) return null;

  const episode = CINEMATIC_EPISODE_DEFINITIONS.find((item) => (
    item.id === episodeId
  ));
  const scene = episode?.scenes.find((item) => item.id === sceneId);
  if (!episode || !scene) return null;

  const context = {
    echo: state.echo.personality,
    progression: state.progression,
    narrative: state.narrative,
  };

  return {
    episode,
    scene,
    availableChoices: scene.choice?.choices.filter((choice) => (
      conditionsPass(choice.conditions, context)
    )) ?? [],
    elapsedFromCheckpointMs: state.cinematic.currentSceneStartedAt === null
      ? 0
      : Math.max(0, now - state.cinematic.currentSceneStartedAt),
  };
}

