export interface EchoPresentationAssetSet {
  portrait: string;
  fullBodyNormal: string;
  fullBodyCorrupted: string;
  fallbackLabel: string;
}

export type EchoVisualStageId =
  | 'awakening_fragile'
  | 'black_coronation'
  | 'second_contract_marked'
  | 'black_echo_protocol';

export interface EchoStatePresentationAssets {
  portrait: string;
  fullBody: string;
  transitionVideo?: string;
  transitionFrames?: readonly string[];
}

/**
 * Replaceable presentation assets. These are not character or narrative data,
 * and are intentionally kept outside the gameplay content registries.
 */
export const ECHO_PRESENTATION_ASSETS: EchoPresentationAssetSet = {
  portrait: '/assets/characters/echo-portrait-v1.webp',
  fullBodyNormal: '/assets/characters/echo-fullbody-normal-v2.webp',
  fullBodyCorrupted:
    '/assets/characters/echo-fullbody-corrupted-v1.webp',
  fallbackLabel: 'Echo',
};

/**
 * Only the opening state has an approved visual mapping in the corrected
 * publication. The other identifiers remain as persistence-compatible inputs
 * for retired saves, but intentionally resolve to the neutral base look. Do
 * not turn an old receipt into a new transformation, character reveal, or
 * Manhwa spoiler through presentation.
 */
export const ECHO_STATE_PRESENTATION_ASSETS: Readonly<
  Record<EchoVisualStageId, EchoStatePresentationAssets>
> = Object.freeze({
  awakening_fragile: {
    portrait: ECHO_PRESENTATION_ASSETS.portrait,
    fullBody: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
  black_coronation: {
    portrait: ECHO_PRESENTATION_ASSETS.portrait,
    fullBody: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
  second_contract_marked: {
    portrait: ECHO_PRESENTATION_ASSETS.portrait,
    fullBody: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
  black_echo_protocol: {
    portrait: ECHO_PRESENTATION_ASSETS.portrait,
    fullBody: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
});

export function getEchoStatePresentationAssets(
  stageId: string,
): EchoStatePresentationAssets {
  return ECHO_STATE_PRESENTATION_ASSETS[
    stageId as EchoVisualStageId
  ] ?? ECHO_STATE_PRESENTATION_ASSETS.awakening_fragile;
}

export function getEchoStatePresentationAssetsForForm(
  form: string,
): EchoStatePresentationAssets {
  const stageId = form === 'black-coronation'
    ? 'black_coronation'
    : form === 'second-contract-marked'
      ? 'second_contract_marked'
      : form === 'black-echo-protocol'
        ? 'black_echo_protocol'
        : 'awakening_fragile';
  return getEchoStatePresentationAssets(stageId);
}

export interface EnvironmentPresentationAssetSet {
  mainMenuWorld: string;
  memoryLaboratory: string;
}

export const ENVIRONMENT_PRESENTATION_ASSETS:
EnvironmentPresentationAssetSet = {
  mainMenuWorld: '/assets/environments/main-menu-world-v1.webp',
  memoryLaboratory: '/assets/environments/memory-lab-v1.png',
};
