import type {
  EchoEvolutionEvaluationResult,
  EchoEvolutionProgressState,
  EchoEvolutionStageDefinition,
  EchoEvolutionTransitionFailureReason,
  ProvenStoryEvent,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';

const ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
const FINGERPRINT_PATTERN = /^[a-f0-9]{8,128}$/i;

function unchanged(
  progress: EchoEvolutionProgressState,
  failureReason: EchoEvolutionTransitionFailureReason,
  success = true,
): EchoEvolutionEvaluationResult {
  return {
    success,
    transitionAvailable: false,
    progress,
    plan: null,
    failureReason,
  };
}

function hasValidLabel(
  stage: EchoEvolutionStageDefinition,
): boolean {
  return Boolean(
    stage.safePlayerLabel.ar.trim()
    && stage.safePlayerLabel.en.trim(),
  );
}

export function validateEchoEvolutionDefinitions(
  stages: readonly EchoEvolutionStageDefinition[],
): boolean {
  if (stages.length === 0) return false;
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const stage of stages) {
    if (
      !ID_PATTERN.test(stage.stageId)
      || ids.has(stage.stageId)
      || !Number.isSafeInteger(stage.order)
      || stage.order < 1
      || orders.has(stage.order)
      || !ID_PATTERN.test(stage.visualFormId)
      || !hasValidLabel(stage)
    ) {
      return false;
    }
    ids.add(stage.stageId);
    orders.add(stage.order);
  }

  const initialStages = stages.filter(
    ({ previousStageId }) => previousStageId === null,
  );
  if (initialStages.length !== 1) return false;
  const initial = initialStages[0]!;
  if (initial.order !== 1 || initial.requiredStoryEventId !== null) {
    return false;
  }

  const byId = new Map(stages.map((stage) => [stage.stageId, stage]));
  for (const stage of stages) {
    if (stage === initial) continue;
    if (
      stage.previousStageId === null
      || stage.requiredStoryEventId === null
      || !ID_PATTERN.test(stage.requiredStoryEventId)
    ) {
      return false;
    }
    const previous = byId.get(stage.previousStageId);
    if (!previous || stage.order !== previous.order + 1) return false;
  }

  return true;
}

function hasValidStoryEventDefinitions(
  events: readonly RuntimeStoryEventDefinition[],
): boolean {
  const ids = new Set<string>();
  return events.every((event) => {
    if (
      !ID_PATTERN.test(event.eventId)
      || !Number.isSafeInteger(event.eventVersion)
      || event.eventVersion < 1
      || ids.has(event.eventId)
    ) {
      return false;
    }
    ids.add(event.eventId);
    return true;
  });
}

function validProof(proof: ProvenStoryEvent): boolean {
  return (
    ID_PATTERN.test(proof.eventId)
    && Number.isSafeInteger(proof.eventVersion)
    && proof.eventVersion > 0
    && FINGERPRINT_PATTERN.test(proof.fingerprint)
    && Boolean(proof.timestamp.trim())
    && Number.isFinite(Date.parse(proof.timestamp))
  );
}

/**
 * Pure Long Fall evolution evaluation.
 *
 * The input deliberately contains no psychological metrics or legacy stage.
 * A published, source-proven story event is the mandatory gate. The returned
 * plan is applied atomically by the owning source transaction in later phases.
 */
export function evaluateEchoEvolution(
  progress: EchoEvolutionProgressState,
  stages: readonly EchoEvolutionStageDefinition[],
  storyEvents: readonly RuntimeStoryEventDefinition[],
  provenEvents: readonly ProvenStoryEvent[],
): EchoEvolutionEvaluationResult {
  if (
    !validateEchoEvolutionDefinitions(stages)
    || !hasValidStoryEventDefinitions(storyEvents)
  ) {
    return unchanged(progress, 'invalid-definitions', false);
  }

  const current = stages.find(
    ({ stageId }) => stageId === progress.currentStageId,
  );
  if (!current) return unchanged(progress, 'unknown-current-stage');
  if (!current.published) {
    return unchanged(progress, 'current-stage-unpublished');
  }
  if (current.isPermanent) {
    return unchanged(progress, 'current-stage-permanent');
  }

  const nextCandidates = stages.filter(
    ({ previousStageId }) => previousStageId === current.stageId,
  );
  if (nextCandidates.length !== 1) {
    return unchanged(
      progress,
      nextCandidates.length === 0
        ? 'no-next-stage'
        : 'invalid-definitions',
      nextCandidates.length === 0,
    );
  }
  const next = nextCandidates[0]!;
  if (!next.published) {
    return unchanged(progress, 'next-stage-unpublished');
  }
  if (progress.reachedStageIds.includes(next.stageId)) {
    return unchanged(progress, 'stage-already-reached');
  }
  const requiredEventId = next.requiredStoryEventId;
  if (requiredEventId === null) {
    return unchanged(progress, 'invalid-definitions', false);
  }
  const eventDefinition = storyEvents.find(
    ({ eventId }) => eventId === requiredEventId,
  );
  if (!eventDefinition) {
    return unchanged(progress, 'missing-story-event-definition');
  }
  if (
    !eventDefinition.published
    || eventDefinition.chapterId !== next.chapterId
  ) {
    return unchanged(progress, 'story-event-unpublished');
  }
  const proof = provenEvents.find(
    ({ eventId }) => eventId === requiredEventId,
  );
  if (!proof) return unchanged(progress, 'story-event-not-proven');
  if (!validProof(proof)) {
    return unchanged(progress, 'invalid-story-event-proof', false);
  }
  if (proof.eventVersion !== eventDefinition.eventVersion) {
    return unchanged(progress, 'story-event-version-mismatch');
  }

  const nextProgress: EchoEvolutionProgressState = {
    currentStageId: next.stageId,
    reachedStageIds: [
      ...new Set([...progress.reachedStageIds, next.stageId]),
    ],
    stageReachedAt: {
      ...progress.stageReachedAt,
      [next.stageId]: proof.timestamp,
    },
  };
  return {
    success: true,
    transitionAvailable: true,
    progress,
    plan: {
      fromStageId: current.stageId,
      toStageId: next.stageId,
      requiredStoryEventId: requiredEventId,
      reachedAt: proof.timestamp,
      nextProgress,
    },
  };
}
