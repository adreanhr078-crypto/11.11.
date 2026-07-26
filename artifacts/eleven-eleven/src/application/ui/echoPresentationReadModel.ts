import type { GameState } from '../../core/gameTypes';

export type EchoPresentationForm = 'normal' | 'corrupted';

/**
 * Narrative content can activate this flag through its data-driven effects.
 * The presentation layer never infers a story transformation from a meter.
 */
export const ECHO_CORRUPTED_FORM_FLAG = 'echo.form.corrupted';

export interface EchoPresentationReadModel {
  form: EchoPresentationForm;
  isContractFormRevealed: boolean;
}

export function createEchoPresentationReadModel(
  state: GameState,
): EchoPresentationReadModel {
  const isContractFormRevealed =
    state.narrative.activeFlags[ECHO_CORRUPTED_FORM_FLAG] === true;

  return {
    form: isContractFormRevealed ? 'corrupted' : 'normal',
    isContractFormRevealed,
  };
}
