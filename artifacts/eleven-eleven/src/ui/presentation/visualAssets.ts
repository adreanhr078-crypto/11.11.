export interface EchoPresentationAssetSet {
  portrait: string;
  fallbackLabel: string;
}

/**
 * Replaceable presentation assets. These are not character or narrative data,
 * and are intentionally kept outside the gameplay content registries.
 */
export const ECHO_PRESENTATION_ASSETS: EchoPresentationAssetSet = {
  portrait: '/assets/characters/echo-portrait-v1.png',
  fallbackLabel: 'Echo',
};

export interface EnvironmentPresentationAssetSet {
  mainMenuWorld: string;
  memoryLaboratory: string;
}

export const ENVIRONMENT_PRESENTATION_ASSETS:
EnvironmentPresentationAssetSet = {
  mainMenuWorld: '/assets/environments/main-menu-world-v1.png',
  memoryLaboratory: '/assets/environments/memory-lab-v1.png',
};
