import type { EchoPersonality } from '../echo/echoPersonality';
import type { NarrativeState } from '../narrative/narrativeState';
import {
  applyContentEffects,
  conditionsPass,
  type RuleEvaluationContext,
} from '../narrative/ruleEngine';
import { recordDecision } from '../narrative/decisionLedger';
import type { ProgressionState } from '../progression/progression';
import type {
  CinematicEpisodeDefinition,
  CinematicSceneDefinition,
} from './contracts';
import type { CinematicState } from './cinematicState';

export interface CinematicEngineContext {
  echo: EchoPersonality;
  progression: ProgressionState;
  narrative: NarrativeState;
  cinematic: CinematicState;
}

export interface CinematicTransitionResult {
  echo: EchoPersonality;
  narrative: NarrativeState;
  cinematic: CinematicState;
}

function ruleContext(
  context: CinematicEngineContext,
): RuleEvaluationContext {
  return {
    echo: context.echo,
    progression: context.progression,
    narrative: context.narrative,
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function findScene(
  episode: CinematicEpisodeDefinition,
  sceneId: string,
): CinematicSceneDefinition {
  const scene = episode.scenes.find((item) => item.id === sceneId);
  if (!scene) {
    throw new Error(`${episode.id} references unknown scene ${sceneId}`);
  }
  return scene;
}

function enterScene(
  episode: CinematicEpisodeDefinition,
  scene: CinematicSceneDefinition,
  context: CinematicEngineContext,
  now: number,
): CinematicTransitionResult {
  if (!conditionsPass(scene.conditions, ruleContext(context))) {
    throw new Error(`Cinematic scene conditions failed: ${scene.id}`);
  }

  return {
    echo: context.echo,
    narrative: context.narrative,
    cinematic: {
      ...context.cinematic,
      activeEpisodeId: episode.id,
      activeSceneId: scene.id,
      status: scene.choice ? 'awaitingChoice' : 'playing',
      currentSceneStartedAt: now,
      awaitingDecisionId: scene.choice?.decisionId ?? null,
      visitedSceneIds: unique([
        ...context.cinematic.visitedSceneIds,
        scene.id,
      ]),
    },
  };
}

function completeEpisode(
  episode: CinematicEpisodeDefinition,
  context: CinematicEngineContext,
): CinematicTransitionResult {
  return {
    echo: context.echo,
    narrative: context.narrative,
    cinematic: {
      ...context.cinematic,
      activeEpisodeId: null,
      activeSceneId: null,
      status: 'completed',
      currentSceneStartedAt: null,
      awaitingDecisionId: null,
      completedEpisodeIds: unique([
        ...context.cinematic.completedEpisodeIds,
        episode.id,
      ]),
    },
  };
}

export function startCinematicEpisode(
  episode: CinematicEpisodeDefinition,
  context: CinematicEngineContext,
  now = Date.now(),
): CinematicTransitionResult {
  if (!conditionsPass(episode.unlockConditions, ruleContext(context))) {
    throw new Error(`Cinematic episode is locked: ${episode.id}`);
  }

  const entryScene = findScene(episode, episode.entrySceneId);
  return enterScene(episode, entryScene, context, now);
}

export function completeCinematicScene(
  episode: CinematicEpisodeDefinition,
  context: CinematicEngineContext,
  now = Date.now(),
): CinematicTransitionResult {
  if (!context.cinematic.activeSceneId) {
    throw new Error('No active cinematic scene');
  }

  const scene = findScene(episode, context.cinematic.activeSceneId);
  if (scene.choice) {
    throw new Error(`Scene ${scene.id} requires a cinematic choice`);
  }

  const applied = applyContentEffects(
    scene.completionEffects,
    ruleContext(context),
    'cinematic',
    now,
  );
  const completedCinematic: CinematicState = {
    ...context.cinematic,
    completedSceneIds: unique([
      ...context.cinematic.completedSceneIds,
      scene.id,
    ]),
  };
  const updatedContext: CinematicEngineContext = {
    ...context,
    echo: applied.echo,
    narrative: applied.narrative,
    cinematic: completedCinematic,
  };
  const branch = scene.branches.find((item) => (
    conditionsPass(item.conditions, ruleContext(updatedContext))
  ));

  if (!branch) return completeEpisode(episode, updatedContext);

  return enterScene(
    episode,
    findScene(episode, branch.nextSceneId),
    updatedContext,
    now,
  );
}

export function chooseCinematicOption(
  episode: CinematicEpisodeDefinition,
  choiceId: string,
  context: CinematicEngineContext,
  now = Date.now(),
): CinematicTransitionResult {
  if (!context.cinematic.activeSceneId) {
    throw new Error('No active cinematic scene');
  }

  const scene = findScene(episode, context.cinematic.activeSceneId);
  if (!scene.choice) {
    throw new Error(`Scene ${scene.id} does not contain a choice`);
  }
  const choice = scene.choice.choices.find((item) => item.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown cinematic choice: ${choiceId}`);
  }
  if (!conditionsPass(choice.conditions, ruleContext(context))) {
    throw new Error(`Cinematic choice is unavailable: ${choiceId}`);
  }

  const narrativeWithDecision = recordDecision(context.narrative, {
    decisionId: scene.choice.decisionId,
    choiceId,
    source: 'cinematic',
    createdAt: now,
    metadata: {
      episodeId: episode.id,
      sceneId: scene.id,
    },
  });
  const applied = applyContentEffects(
    choice.effects,
    {
      ...ruleContext(context),
      narrative: narrativeWithDecision,
    },
    'cinematic',
    now,
  );
  const updatedContext: CinematicEngineContext = {
    ...context,
    echo: applied.echo,
    narrative: applied.narrative,
    cinematic: {
      ...context.cinematic,
      awaitingDecisionId: null,
      completedSceneIds: unique([
        ...context.cinematic.completedSceneIds,
        scene.id,
      ]),
    },
  };

  if (!choice.nextSceneId) return completeEpisode(episode, updatedContext);

  return enterScene(
    episode,
    findScene(episode, choice.nextSceneId),
    updatedContext,
    now,
  );
}

export function pauseCinematic(state: CinematicState): CinematicState {
  return state.status === 'playing'
    ? { ...state, status: 'paused' }
    : state;
}

export function resumeCinematic(state: CinematicState): CinematicState {
  return state.status === 'paused'
    ? { ...state, status: 'playing' }
    : state;
}

export function stopCinematic(state: CinematicState): CinematicState {
  return {
    ...state,
    activeEpisodeId: null,
    activeSceneId: null,
    status: 'idle',
    currentSceneStartedAt: null,
    awaitingDecisionId: null,
  };
}

