export const AD_PLACEMENTS = ['echo-network-hub', 'community-board'] as const;
export type AdPlacement = typeof AD_PLACEMENTS[number];
export type AdConsent = 'unset' | 'contextual' | 'declined';

export const AD_FREQUENCY_CAP_MS = 30 * 60 * 1_000;

export interface AdEligibilityInput {
  placement: string;
  consent: AdConsent;
  providerReady: boolean;
  online: boolean;
  lastShownAt: number | null;
  now?: number;
}

export function canShowAdvertisement(input: AdEligibilityInput): boolean {
  if (!AD_PLACEMENTS.includes(input.placement as AdPlacement)) return false;
  if (input.consent !== 'contextual' || !input.providerReady || !input.online) return false;
  if (input.lastShownAt === null) return true;
  return (input.now ?? Date.now()) - input.lastShownAt >= AD_FREQUENCY_CAP_MS;
}
