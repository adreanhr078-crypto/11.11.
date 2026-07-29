import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INITIAL_ECHO_EVOLUTION_STAGE_ID,
} from '../core/echoEvolutionTypes';
import {
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';

const FUTURE_STAGE_ID = 'stage_from_newer_build';
const FUTURE_STAGE_AT = '2027-01-02T03:04:05.000Z';

describe('Echo evolution persistence and migration', () => {
  it('starts at the safe initial stage', () => {
    assert.deepEqual(buildInitialState().progressionState.evolution, {
      currentStageId: INITIAL_ECHO_EVOLUTION_STAGE_ID,
      reachedStageIds: [INITIAL_ECHO_EVOLUTION_STAGE_ID],
      stageReachedAt: {},
    });
  });

  it('never infers canonical evolution from legacy transformationStage', () => {
    const migrated = migrateGameState({
      echo: {
        transformationStage: 'vengeful',
        corruption: 100,
        ragePoints: 100,
        awareness: 100,
      },
    }, 14);

    assert.deepEqual(migrated.progressionState?.evolution, {
      currentStageId: INITIAL_ECHO_EVOLUTION_STAGE_ID,
      reachedStageIds: [INITIAL_ECHO_EVOLUTION_STAGE_ID],
      stageReachedAt: {},
    });
  });

  it('preserves an unknown future stage without exposing a definition', () => {
    const migrated = migrateGameState({
      progressionState: {
        evolution: {
          currentStageId: FUTURE_STAGE_ID,
          reachedStageIds: [
            INITIAL_ECHO_EVOLUTION_STAGE_ID,
            FUTURE_STAGE_ID,
          ],
          stageReachedAt: {
            [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
          },
        },
      },
    }, 15);

    assert.deepEqual(migrated.progressionState?.evolution, {
      currentStageId: FUTURE_STAGE_ID,
      reachedStageIds: [
        INITIAL_ECHO_EVOLUTION_STAGE_ID,
        FUTURE_STAGE_ID,
      ],
      stageReachedAt: {
        [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
      },
    });
  });

  it('normalizes ledgers without inventing timestamps or hidden content', () => {
    const migrated = migrateGameState({
      progressionState: {
        evolution: {
          currentStageId: FUTURE_STAGE_ID,
          reachedStageIds: [
            FUTURE_STAGE_ID,
            FUTURE_STAGE_ID,
            ' ',
          ],
          stageReachedAt: {
            [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
            hidden_unreached_stage: FUTURE_STAGE_AT,
            invalid_timestamp_stage: 'not-a-date',
          },
        },
      },
    }, 15);
    const evolution = migrated.progressionState?.evolution;

    assert.deepEqual(evolution?.reachedStageIds, [
      INITIAL_ECHO_EVOLUTION_STAGE_ID,
      FUTURE_STAGE_ID,
    ]);
    assert.deepEqual(evolution?.stageReachedAt, {
      [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
    });
  });

  it('round-trips current, reached, and reached-at state through reload', () => {
    const initial = buildInitialState();
    const evolved = structuredClone(initial);
    evolved.progressionState.evolution = {
      currentStageId: FUTURE_STAGE_ID,
      reachedStageIds: [
        INITIAL_ECHO_EVOLUTION_STAGE_ID,
        FUTURE_STAGE_ID,
      ],
      stageReachedAt: {
        [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
      },
    };

    const firstPersist = partializeGameState(evolved);
    const firstReload = mergeGameState(firstPersist, buildInitialState());
    const secondPersist = partializeGameState(firstReload);
    const secondReload = mergeGameState(secondPersist, buildInitialState());

    assert.deepEqual(
      firstReload.progressionState.evolution,
      evolved.progressionState.evolution,
    );
    assert.deepEqual(
      secondReload.progressionState.evolution,
      evolved.progressionState.evolution,
    );
  });

  it('does not mutate a migration input', () => {
    const save = {
      progressionState: {
        evolution: {
          currentStageId: FUTURE_STAGE_ID,
          reachedStageIds: [FUTURE_STAGE_ID],
          stageReachedAt: {
            [FUTURE_STAGE_ID]: FUTURE_STAGE_AT,
          },
        },
      },
    };
    const before = structuredClone(save);

    migrateGameState(save, 15);

    assert.deepEqual(save, before);
  });
});
