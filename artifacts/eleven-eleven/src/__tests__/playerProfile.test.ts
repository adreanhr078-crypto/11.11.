import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  GAME_SCREEN_REGISTRY,
  getScreensForCategory,
} from '../app/shell/screenRegistry';
import {
  isPlayerAvatarId,
  PLAYER_AVATAR_IDS,
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_FEATURED_ACHIEVEMENT_LIMIT,
} from '../domain/player-profile/playerProfile';
import {
  createSubjectId,
  profileFromDocument,
  normalizeUsername,
} from '../../functions/api/player/_profile';
import { verifyXpRewardClaim } from '../../functions/api/player/_xpRewards';
import { CHAPTER_01_PUZZLES } from '../content/puzzles/chapter01Campaign';
import { PLAYER_AVATAR_CATALOG, playerAvatarPresentationSrc } from '../ui/presentation/playerAvatarCatalog';
import type {
  FirebaseAccount,
  FirestoreDocument,
} from '../../functions/api/player/_shared';

const account: FirebaseAccount = {
  uid: 'player-profile-uid',
  displayName: 'Memory Runner',
  email: 'runner@example.com',
  photoURL: 'https://provider.example/photo.png',
  providerId: 'password',
  createdAt: '2026-08-08T11:11:00.000Z',
  lastLoginAt: '2026-08-08T12:00:00.000Z',
};

function correctProof(puzzle: typeof CHAPTER_01_PUZZLES[number]) {
  return puzzle.stages.map((stage, stageIndex) => ({
    stageIndex,
    values: stage.mode === 'match' ? [] : [...stage.solution],
    matches: stage.mode === 'match' ? { ...stage.solution } : {},
  }));
}

describe('player profile identity and authority', () => {
  it('keeps the Profile screen hidden from primary navigation', () => {
    assert.equal(GAME_SCREEN_REGISTRY.profile.navigation, 'hidden');
    assert.equal(
      getScreensForCategory('settings').some((screen) => screen.id === 'profile'),
      false,
    );
  });

  it('preserves Subject ID and Join Date when the username changes', () => {
    const document: FirestoreDocument = {
      fields: {
        uid: { stringValue: account.uid },
        subjectId: { stringValue: 'SUBJECT-HISTORY-001' },
        username: { stringValue: 'First Name' },
        bio: { stringValue: 'A short record.' },
        avatarId: { stringValue: 'silver_signal' },
        createdAt: { timestampValue: account.createdAt },
      },
    };
    const before = profileFromDocument(document, account);
    const renamed = profileFromDocument({
      ...document,
      fields: {
        ...document.fields,
        username: { stringValue: 'New Name' },
      },
    }, account);
    assert.equal(before.subjectId, renamed.subjectId);
    assert.equal(before.joinDate, renamed.joinDate);
    assert.equal(renamed.username, 'New Name');
  });

  it('uses only fixed in-game Avatar IDs and keeps external URLs out of the contract', () => {
    assert.deepEqual(PLAYER_AVATAR_IDS, ['echo', 'silver_signal', 'red_rift']);
    assert.equal(isPlayerAvatarId('https://example.com/avatar.png'), false);
    assert.equal(isPlayerAvatarId('upload-anything'), false);
    assert.equal(isPlayerAvatarId('red_rift'), true);
  });

  it('maps the selected Avatar to its own Profile presentation', () => {
    assert.equal(playerAvatarPresentationSrc('echo'), '/assets/characters/echo-fullbody-normal-v2.png');
    assert.notEqual(
      playerAvatarPresentationSrc('silver_signal'),
      playerAvatarPresentationSrc('echo'),
    );
    assert.equal(PLAYER_AVATAR_CATALOG.length, PLAYER_AVATAR_IDS.length);
    for (const avatar of PLAYER_AVATAR_CATALOG) {
      assert.ok(avatar.presentationSrc.startsWith('/assets/'));
    }
  });

  it('normalizes usernames for global reservation checks', () => {
    assert.equal(normalizeUsername('  Memory   Runner  '), 'memory runner');
    assert.match(createSubjectId(), /^SUBJECT-[A-Z0-9]{16}$/);
    assert.equal(PROFILE_BIO_MAX_LENGTH, 160);
    assert.equal(PROFILE_FEATURED_ACHIEVEMENT_LIMIT, 3);
  });

  it('derives XP and Memory Fragment IDs from the canonical puzzle only', () => {
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    const reward = verifyXpRewardClaim({
      sourceType: 'puzzle',
      sourceId: puzzle.id,
      proof: correctProof(puzzle),
    });
    assert.equal(reward.xpAmount, 75);
    assert.equal(reward.memoryFragmentId, puzzle.rewards.shardId);
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'puzzle',
        sourceId: puzzle.id,
        proof: correctProof(puzzle),
        fragmentId: puzzle.rewards.shardId,
      }),
      (error: unknown) => (
        typeof error === 'object'
        && error !== null
        && 'code' in error
        && error.code === 'client_xp_forbidden'
      ),
    );
  });

  it('protects the append-only ledgers at the database layer', () => {
    const migration = readFileSync(
      new URL('../../migrations/0002_player_profile.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /BEFORE UPDATE ON xp_reward_events/);
    assert.match(migration, /BEFORE DELETE ON xp_reward_events/);
    assert.match(migration, /BEFORE UPDATE ON player_memory_fragment_events/);
    assert.match(migration, /BEFORE DELETE ON player_memory_fragment_events/);
  });
});
