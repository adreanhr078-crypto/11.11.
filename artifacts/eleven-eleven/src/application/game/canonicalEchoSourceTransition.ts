import {
  CANONICAL_ECHO_METRIC_KEYS,
  type CanonicalEchoEffect,
  type CanonicalEchoMetric,
} from '../../core/echoEventTypes';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  EchoPersonality,
} from '../../domain/echo/echoPersonality';
import {
  applyEchoEffects,
  type GameProgressionTransitionResult,
} from '../../domain/progression/gameProgressionReducer';

const PERSONALITY_METRICS = new Set<keyof EchoPersonality>([
  'humanity',
  'trust',
  'fear',
  'anger',
  'corruption',
  'memoriesRecovered',
]);

/**
 * Converts the result of an established source transaction into same-semantic
 * canonical deltas. Compatibility aliases are deliberately absent:
 * `hope`, `ragePoints`, and `memoryStability` are never inferred from another
 * personality field.
 */
export function createCanonicalEffectFromPersonality(
  current: GameProgressionState['echo'],
  next: EchoPersonality,
): CanonicalEchoEffect {
  const effect: Partial<Record<CanonicalEchoMetric, number>> = {};

  for (const metric of CANONICAL_ECHO_METRIC_KEYS) {
    if (!PERSONALITY_METRICS.has(metric as keyof EchoPersonality)) continue;
    const nextValue = next[metric as keyof EchoPersonality];
    if (!Number.isFinite(nextValue)) continue;
    const delta = nextValue - current[metric];
    if (delta !== 0) effect[metric] = delta;
  }

  return effect;
}

/**
 * Applies Memory, Dialogue, or Cinematic Echo output inside that source's
 * transaction. Idempotency remains owned by the source ledger; this helper
 * never creates a standalone Echo receipt.
 */
export function applyEchoPersonalitySourceTransition(
  state: GameProgressionState,
  next: EchoPersonality,
  timestamp: number | null = null,
): GameProgressionTransitionResult {
  const effect = createCanonicalEffectFromPersonality(state.echo, next);
  if (Object.keys(effect).length === 0) {
    return { success: true, state };
  }
  return applyEchoEffects(state, effect, timestamp);
}
