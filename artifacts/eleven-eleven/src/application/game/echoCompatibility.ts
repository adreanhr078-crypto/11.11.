import type { EchoState } from '../../core/gameTypes';
import { clampStat } from '../../domain/echo/echoPersonality';
import type { EchoPersonality } from '../../domain/echo/echoPersonality';

export type LegacyEchoEffects = Partial<Pick<
  EchoState,
  | 'trust'
  | 'fear'
  | 'memoryStability'
  | 'corruption'
  | 'hope'
  | 'ragePoints'
>>;

/**
 * @deprecated Compatibility snapshot helper only.
 *
 * Active gameplay must update `progressionState.echo` through a canonical or
 * source-owned transaction and then project it. This helper intentionally
 * updates only the requested legacy scalar and never writes Echo personality.
 */
export function applyLegacyEchoEffects(
  echo: EchoState,
  effects: LegacyEchoEffects,
): EchoState {
  const next = { ...echo };
  for (const [key, amount] of Object.entries(effects) as Array<
    [keyof LegacyEchoEffects, number | undefined]
  >) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) continue;
    next[key] = clampStat(next[key] + amount);
  }
  return next;
}

/** @deprecated Compatibility snapshot helper only; never a state authority. */
export function setLegacyEchoValue(
  echo: EchoState,
  key: keyof LegacyEchoEffects,
  value: number,
): EchoState {
  const currentValue = Number(echo[key] ?? 0);
  return applyLegacyEchoEffects(echo, {
    [key]: clampStat(value) - currentValue,
  });
}

export function syncEchoPersonality(
  echo: EchoState,
  personality: EchoPersonality,
): EchoState {
  return {
    ...echo,
    personality,
    trust: personality.trust,
    fear: personality.fear,
    corruption: personality.corruption,
  };
}
