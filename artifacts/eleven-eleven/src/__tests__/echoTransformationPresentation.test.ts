import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildInitialState } from '../stores/gameStoreHelpers';
import {
  ECHO_STATES,
} from '../domain/echo/echoPresence';
import {
  ECHO_STATE_PRESENTATION_ASSETS,
  getEchoStatePresentationAssets,
} from '../ui/presentation/visualAssets';
import { createStoryStateActions } from '../application/story/createStoryStateActions';
import type { GameState } from '../core/gameTypes';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';

describe('Phase 6.5 Echo transformation presentation', () => {
  it('maps only the published opening stage to an approved in-game asset', () => {
    assert.deepEqual(
      ECHO_STATES.map((state) => state.stageId),
      [
        'awakening_fragile',
        'black_coronation',
        'second_contract_marked',
        'black_echo_protocol',
      ],
    );
    assert.equal(
      getEchoStatePresentationAssets('awakening_fragile').transitionVideo,
      undefined,
    );
    assert.match(
      ECHO_STATE_PRESENTATION_ASSETS.second_contract_marked.portrait,
      /echo-portrait-v1\.webp$/,
    );
    assert.match(
      ECHO_STATE_PRESENTATION_ASSETS.black_echo_protocol.portrait,
      /echo-portrait-v1\.webp$/,
    );
  });

  it('keeps the visual progression monotonic without publishing a fifth state', () => {
    const [base, coronation, contract, protocol] = ECHO_STATES;
    assert.ok(base && coronation && contract && protocol);
    assert.ok(base.redEnergy < coronation.redEnergy);
    assert.ok(coronation.redEnergy < contract.redEnergy);
    assert.ok(contract.redEnergy < protocol.redEnergy);
    assert.ok(base.glitchIntensity < coronation.glitchIntensity);
    assert.ok(coronation.glitchIntensity < contract.glitchIntensity);
    assert.ok(contract.glitchIntensity < protocol.glitchIntensity);
    assert.ok(base.scanIntensity < coronation.scanIntensity);
    assert.ok(coronation.scanIntensity < contract.scanIntensity);
    assert.ok(contract.scanIntensity < protocol.scanIntensity);
    assert.equal(ECHO_STATES.length, 4);
  });

  it('records presentation acknowledgement without unlocking a stage', () => {
    let state: GameState = buildInitialState();
    const get: GameStateGetter = () => state;
    const set: GameStateSetter = (partial) => {
      const update = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...update };
    };
    state = {
      ...state,
      progressionState: {
        ...state.progressionState,
        evolution: {
          ...state.progressionState.evolution,
          currentStageId: 'black_coronation',
          reachedStageIds: ['awakening_fragile', 'black_coronation'],
        },
      },
    };
    const actions = createStoryStateActions(set, get);

    assert.equal(actions.markEchoTransformationIntroSeen('black_coronation'), true);
    assert.deepEqual(
      state.progressionState.evolution.transformationIntroSeen,
      ['black_coronation'],
    );
    assert.equal(actions.markEchoTransformationIntroSeen('black_coronation'), true);
    assert.equal(actions.markEchoTransformationIntroSeen('black_echo_protocol'), false);
    assert.equal(
      state.progressionState.evolution.currentStageId,
      'black_coronation',
    );
  });
});
