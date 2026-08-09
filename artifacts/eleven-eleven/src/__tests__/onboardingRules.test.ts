import test from 'node:test';
import assert from 'node:assert/strict';
import { needsFirstTimeOnboarding } from '../features/onboarding/onboardingRules';
import type { PlayerProfile } from '../domain/player-profile/playerProfile';

function profile(username: string): PlayerProfile {
  return {
    uid: 'uid-onboarding',
    subjectId: 'SUBJECT-TEST',
    username,
    bio: '',
    avatarId: 'echo',
    email: null,
    providerId: 'anonymous',
    isAnonymous: true,
    joinDate: '2026-08-09T00:00:00.000Z',
    progression: {
      rank: 1,
      level: 1,
      totalXp: 0,
      currentLevelXp: 0,
      nextLevelXp: 100,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      progressPercent: 0,
    },
    stats: {
      chaptersCompleted: 0,
      puzzlesSolved: 0,
      secretsFound: 0,
    },
    featuredAchievementIds: [],
  };
}

test('first-time onboarding only targets generated subject identities', () => {
  assert.equal(needsFirstTimeOnboarding(profile('SUBJECT-ABC123'), false), true);
  assert.equal(needsFirstTimeOnboarding(profile('SUBJECT-ABC123'), true), false);
  assert.equal(needsFirstTimeOnboarding(profile('Echo Runner'), false), false);
  assert.equal(needsFirstTimeOnboarding(null, false), false);
});

