import {
  INITIAL_ECHO_EVOLUTION_STAGE_ID,
  type EchoEvolutionProgressState,
} from '../../core/echoEvolutionTypes';
import {
  createInitialEchoEvolutionProgressState,
} from '../../core/gameProgressionDefaults';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value.map(normalizeId).filter((id): id is string => id !== null),
  )];
}

/**
 * Definition-independent normalization keeps future stage IDs intact.
 * It never reads legacy `transformationStage`, psychological metrics, or
 * author-only canon.
 */
export function normalizeEchoEvolutionProgressState(
  value: unknown,
): EchoEvolutionProgressState {
  if (!isRecord(value)) return createInitialEchoEvolutionProgressState();

  const currentStageId = normalizeId(value.currentStageId)
    ?? INITIAL_ECHO_EVOLUTION_STAGE_ID;
  const reachedStageIds = uniqueIds(value.reachedStageIds);
  if (!reachedStageIds.includes(INITIAL_ECHO_EVOLUTION_STAGE_ID)) {
    reachedStageIds.unshift(INITIAL_ECHO_EVOLUTION_STAGE_ID);
  }
  if (!reachedStageIds.includes(currentStageId)) {
    reachedStageIds.push(currentStageId);
  }

  const rawReachedAt = isRecord(value.stageReachedAt)
    ? value.stageReachedAt
    : {};
  const stageReachedAt: Record<string, string> = {};
  for (const [stageId, timestamp] of Object.entries(rawReachedAt)) {
    if (
      reachedStageIds.includes(stageId)
      && typeof timestamp === 'string'
      && Boolean(timestamp.trim())
      && Number.isFinite(Date.parse(timestamp))
    ) {
      stageReachedAt[stageId] = timestamp;
    }
  }

  return {
    currentStageId,
    reachedStageIds,
    stageReachedAt,
  };
}
