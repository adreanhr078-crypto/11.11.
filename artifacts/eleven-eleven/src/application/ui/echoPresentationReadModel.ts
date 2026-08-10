import type { GameState } from '../../core/gameTypes';
import {
  createStoryStateReadModel,
} from '../../domain/story/storyState';
import {
  ECHO_STATES,
  type EchoPresenceStageId,
} from '../../domain/echo/echoPresence';

export type EchoPresentationForm =
  | 'normal'
  | 'black-coronation'
  | 'second-contract-marked'
  | 'black-echo-protocol'
  /** Legacy-only form retained for existing asset compatibility. */
  | 'corrupted';

/**
 * @deprecated Published Echo forms are now gated by server-issued Canon
 * receipts, never by a mutable client narrative flag.
 */
export const ECHO_CORRUPTED_FORM_FLAG = 'echo.form.corrupted';

export interface EchoPresentationReadModel {
  form: EchoPresentationForm;
  stageId: string;
  visualFormId: string;
  assetStatus: 'existing-safe-asset' | 'visual-slot';
  isContractFormRevealed: boolean;
  atmosphere: {
    redEnergy: number;
    glitchIntensity: number;
    scanIntensity: number;
  };
}

export function getEchoPresentationForStageId(
  stageId: string,
  visualFormId = 'echo_default',
  assetStatus: EchoPresentationReadModel['assetStatus'] = 'existing-safe-asset',
): EchoPresentationReadModel {
  const state = ECHO_STATES.find((candidate) => candidate.stageId === stageId)
    ?? ECHO_STATES[0]!;
  return {
    form: state.form,
    stageId: state.stageId as EchoPresenceStageId,
    visualFormId: state.stageId === 'awakening_fragile' ? 'echo_default' : visualFormId,
    assetStatus: state.assetStatus === 'existing-safe-asset'
      ? 'existing-safe-asset'
      : assetStatus,
    isContractFormRevealed: state.stageId !== 'awakening_fragile',
    atmosphere: {
      redEnergy: state.redEnergy,
      glitchIntensity: state.glitchIntensity,
      scanIntensity: state.scanIntensity,
    },
  };
}

/**
 * The presentation layer reads the central, server-backed Story State rather
 * than emotional meters, page views, or mutable legacy flags.
 */
export function createEchoPresentationReadModel(
  state: GameState,
): EchoPresentationReadModel {
  const story = createStoryStateReadModel(state.progressionState);
  return getEchoPresentationForStageId(
    story.echoState.stageId,
    story.echoState.visualFormId,
    story.echoState.assetStatus,
  );
}
