import type { EchoStat } from '../content/contracts';

export interface EchoPersonality {
  humanity: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  corruption: number;
  memoriesRecovered: number;
}

export type EchoPersonalityEffects = Partial<Record<EchoStat, number>>;

export function clampStat(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function createInitialEchoPersonality(): EchoPersonality {
  return {
    humanity: 35,
    trust: 15,
    fear: 70,
    anger: 0,
    sadness: 65,
    corruption: 2,
    memoriesRecovered: 0,
  };
}

export function applyEchoPersonalityEffects(
  personality: EchoPersonality,
  effects: EchoPersonalityEffects,
): EchoPersonality {
  const next = { ...personality };

  for (const [stat, amount] of Object.entries(effects) as Array<
    [EchoStat, number | undefined]
  >) {
    if (amount === undefined) continue;
    next[stat] = clampStat(next[stat] + amount);
  }

  return next;
}

/**
 * Read-only legacy save fallback.
 *
 * Runtime commands must never use this migration to rebuild canonical Echo
 * state from compatibility aliases.
 */
export function migrateEchoPersonality(legacy: Partial<{
  trust: number;
  fear: number;
  ragePoints: number;
  corruption: number;
  memoryStability: number;
  hope: number;
}>): EchoPersonality {
  const initial = createInitialEchoPersonality();

  return {
    humanity: clampStat(legacy.hope ?? initial.humanity),
    trust: clampStat(legacy.trust ?? initial.trust),
    fear: clampStat(legacy.fear ?? initial.fear),
    anger: clampStat(legacy.ragePoints ?? initial.anger),
    sadness: clampStat(
      100 - (legacy.hope ?? 100 - initial.sadness),
    ),
    corruption: clampStat(legacy.corruption ?? initial.corruption),
    memoriesRecovered: clampStat(
      legacy.memoryStability ?? initial.memoriesRecovered,
    ),
  };
}
