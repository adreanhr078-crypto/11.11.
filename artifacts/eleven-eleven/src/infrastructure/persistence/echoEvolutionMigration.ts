import type {
  EchoEvolutionProgressState,
} from '../../core/echoEvolutionTypes';
import {
  normalizeEchoEvolutionProgressState,
} from '../../domain/echo/echoEvolutionProgress';

/**
 * Definition-independent migration keeps future stage IDs intact. It never
 * reads legacy `transformationStage`, psychological metrics, or author canon.
 */
export function migrateEchoEvolutionProgress(
  value: unknown,
): EchoEvolutionProgressState {
  return normalizeEchoEvolutionProgressState(value);
}
