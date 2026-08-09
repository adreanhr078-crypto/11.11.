import type { PlayerProfile } from '../../domain/player-profile/playerProfile';

const DEFAULT_SUBJECT_USERNAME = /^SUBJECT-[A-Z0-9]{6,10}$/i;

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

