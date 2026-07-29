import type {
  EchoProgressState,
} from '../../core/gameProgressionTypes';
import type { EchoState } from '../../core/gameTypes';

/**
 * One-way projection from canonical progression into the established Echo
 * view. Every value maps only to the field with the same meaning.
 *
 * Compatibility values remain available, but never become the source of a
 * canonical update:
 * - humanity does not write hope
 * - anger does not write ragePoints
 * - memoryStability does not write memoriesRecovered
 */
export function projectCanonicalEchoCompatibility(
  canonical: EchoProgressState,
  current: EchoState,
): EchoState {
  return {
    ...current,
    personality: {
      ...current.personality,
      humanity: canonical.humanity,
      trust: canonical.trust,
      fear: canonical.fear,
      anger: canonical.anger,
      sadness: canonical.sadness,
      corruption: canonical.corruption,
      memoriesRecovered: canonical.memoriesRecovered,
    },
    trust: canonical.trust,
    fear: canonical.fear,
    memoryStability: canonical.memoryStability,
    corruption: canonical.corruption,
    hope: canonical.hope,
    ragePoints: canonical.ragePoints,
    loneliness: canonical.loneliness,
    awareness: canonical.awareness,
    isolation: canonical.isolation,
    forgivenessPoints: canonical.forgivenessPoints,
  };
}
