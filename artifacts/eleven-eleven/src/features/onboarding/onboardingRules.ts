import type { PlayerProfile } from '../../domain/player-profile/playerProfile';

const DEFAULT_SUBJECT_USERNAME = /^SUBJECT-[A-Z0-9]{6,10}$/i;

export const ONBOARDING_STAGE_COUNT = 4;
export type OnboardingStage = 'welcome' | 'mission' | 'identity' | 'complete';

export function onboardingStageNumber(
  step: OnboardingStage | 'loading',
): string {
  const stage = step === 'loading' ? 'welcome' : step;
  const stageNumbers: Record<OnboardingStage, number> = {
    welcome: 1,
    mission: 2,
    identity: 3,
    complete: 4,
  };
  return String(stageNumbers[stage]).padStart(2, '0');
}

export function isDefaultSubjectUsername(username: string): boolean {
  return DEFAULT_SUBJECT_USERNAME.test(username.trim());
}

/**
 * Profiles created before onboarding used a generated SUBJECT username.
 * A saved local completion marker keeps completed identities out of the flow
 * without adding a new backend field or changing the Profile contract.
 */
export function needsFirstTimeOnboarding(
  profile: PlayerProfile | null,
  completedLocally: boolean,
): boolean {
  return Boolean(
    profile
    && !completedLocally
    && isDefaultSubjectUsername(profile.username),
  );
}
