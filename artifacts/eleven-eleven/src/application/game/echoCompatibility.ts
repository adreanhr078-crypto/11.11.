import type { EchoState } from '../../core/gameTypes';
import {
  applyEchoPersonalityEffects,
  clampStat,
} from '../../domain/echo/echoPersonality';
import type { EchoStat } from '../../domain/content/contracts';

export type LegacyEchoEffects = Partial<Pick<
  EchoState,
  | 'trust'
  | 'fear'
  | 'memoryStability'
  | 'corruption'
  | 'hope'
  | 'ragePoints'
>>;

const legacyToCanonical: Record<keyof LegacyEchoEffects, EchoStat> = {
  trust: 'trust',
  fear: 'fear',
  memoryStability: 'memoriesRecovered',
  corruption: 'corruption',
  hope: 'humanity',
  ragePoints: 'anger',
};

export function applyLegacyEchoEffects(
  echo: EchoState,
  effects: LegacyEchoEffects,
): EchoState {
  const personalityEffects: Partial<Record<EchoStat, number>> = {};

  for (const [legacyKey, amount] of Object.entries(effects) as Array<
    [keyof LegacyEchoEffects, number | undefined]
  >) {
    if (amount === undefined) continue;
    personalityEffects[legacyToCanonical[legacyKey]] = amount;
  }

  const personality = applyEchoPersonalityEffects(
    echo.personality,
    personalityEffects,
  );

  return {
    ...echo,
    personality,
    trust: personality.trust,
    fear: personality.fear,
    memoryStability: personality.memoriesRecovered,
    corruption: personality.corruption,
    hope: personality.humanity,
    ragePoints: personality.anger,
  };
}

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
