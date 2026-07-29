import {
  CANONICAL_ECHO_METRIC_KEYS,
  ECHO_METRIC_CONTRACTS,
} from '../../core/echoEventTypes';
import type {
  CanonicalEchoEffect,
  CanonicalEchoMetric,
} from '../../core/echoEventTypes';
import type { EchoProgressState } from '../../core/gameProgressionTypes';

const CANONICAL_ECHO_METRIC_KEY_SET = new Set<string>(
  CANONICAL_ECHO_METRIC_KEYS,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function clampCanonicalEchoMetric(
  metric: CanonicalEchoMetric,
  value: number,
): number {
  const contract = ECHO_METRIC_CONTRACTS[metric];
  if (!Number.isFinite(value)) return contract.min;
  return Math.min(
    contract.max,
    Math.max(contract.min, Math.round(value)),
  );
}

export function normalizeCanonicalEchoEffect(
  value: unknown,
): CanonicalEchoEffect | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0) return null;
  if (entries.some(([key, amount]) => (
    !CANONICAL_ECHO_METRIC_KEY_SET.has(key)
    || typeof amount !== 'number'
    || !Number.isFinite(amount)
  ))) {
    return null;
  }

  const normalized: Partial<Record<CanonicalEchoMetric, number>> = {};
  for (const metric of CANONICAL_ECHO_METRIC_KEYS) {
    const amount = value[metric];
    if (typeof amount !== 'number') continue;
    normalized[metric] = Object.is(amount, -0) ? 0 : amount;
  }
  return normalized;
}

export interface CanonicalEchoMetricTransitionResult {
  success: boolean;
  echo: EchoProgressState;
}

/**
 * Pure canonical metric reducer.
 *
 * Compatibility channels are deliberately absent from the accepted contract:
 * humanity never mutates hope, anger never mutates ragePoints, and
 * memoryStability never mutates memoriesRecovered.
 */
export function applyCanonicalEchoEffect(
  echo: EchoProgressState,
  effect: CanonicalEchoEffect,
): CanonicalEchoMetricTransitionResult {
  const normalized = normalizeCanonicalEchoEffect(effect);
  if (!normalized) return { success: false, echo };

  const next = { ...echo };
  for (const metric of CANONICAL_ECHO_METRIC_KEYS) {
    const amount = normalized[metric];
    if (amount === undefined) continue;
    next[metric] = clampCanonicalEchoMetric(
      metric,
      next[metric] + amount,
    );
  }

  return {
    success: true,
    echo: next,
  };
}
