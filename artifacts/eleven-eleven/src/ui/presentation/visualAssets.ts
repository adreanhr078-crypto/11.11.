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
 * Canon-safe visual mapping for the four published Part 1 Echo states.
 * Story authority remains in the server-issued Canon receipts.
 */
export const ECHO_STATE_PRESENTATION_ASSETS: Readonly<
  Record<EchoVisualStageId, EchoStatePresentationAssets>
> = Object.freeze({
  awakening_fragile: {
    portrait: ECHO_PRESENTATION_ASSETS.portrait,
    fullBody: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
  black_coronation: {
    portrait: '/assets/characters/echo-states/echo-black-coronation-v1.png',
    fullBody: '/assets/characters/echo-states/echo-black-coronation-v1.png',
    transitionVideo:
      '/assets/cinematics/echo-transform-base-to-black-coronation-v1.mp4',
  },
  second_contract_marked: {
    portrait: '/assets/characters/echo-states/echo-second-contract-marked-v1.png',
    fullBody: '/assets/characters/echo-states/echo-second-contract-marked-v1.png',
    transitionFrames: [
      '/assets/characters/echo-states/echo-black-coronation-v1.png',
      '/manhwa/final/page-058.webp',
      '/assets/characters/echo-states/echo-second-contract-marked-v1.png',
    ],
  },
  black_echo_protocol: {
    portrait: '/assets/characters/echo-states/echo-black-echo-protocol-v1.png',
    fullBody: '/assets/characters/echo-states/echo-black-echo-protocol-v1.png',
    transitionFrames: [
      '/assets/characters/echo-states/echo-second-contract-marked-v1.png',
      '/manhwa/final/page-062.webp',
      '/assets/characters/echo-states/echo-black-echo-protocol-v1.png',
    ],
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
