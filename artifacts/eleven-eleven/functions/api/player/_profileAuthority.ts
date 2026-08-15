import type { PlayerAvatarId } from '../../../src/domain/player-profile/playerProfile';
import type { FirebaseAccount } from './_shared';
import type { PlayerDatabase } from './_database';
import {
  cleanBio,
  createSubjectId,
  fallbackUsername,
  type StoredPlayerProfile,
} from './_profile';
import { readUnlockedAvatarIds } from './_avatarOwnership';

interface AuthoritativeProfileRow {
  user_id: string;
  subject_id: string;
  username: string;
  bio: string;
  avatar_id: string;
  featured_achievement_ids_json: string;
  created_at: string;
  updated_at: string;
}

function safeFeaturedIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && /^[a-z0-9_-]{1,100}$/i.test(id)).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

function profileFromRow(row: AuthoritativeProfileRow, account: FirebaseAccount): StoredPlayerProfile {
  return {
    uid: row.user_id,
    subjectId: row.subject_id,
    username: row.username,
    bio: cleanBio(row.bio),
    avatarId: row.avatar_id as PlayerAvatarId,
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    joinDate: row.created_at,
    featuredAchievementIds: safeFeaturedIds(row.featured_achievement_ids_json),
    usernameSource: row.username.startsWith('SUBJECT-') ? 'default' : 'stored',
    updateTime: row.updated_at,
  };
}

async function verifiedFeaturedIds(
  database: PlayerDatabase,
  uid: string,
  requested: readonly string[],
): Promise<string[]> {
  if (requested.length === 0) return [];
  const rows = await database.prepare(`
    SELECT achievement_id FROM player_achievement_unlock_events WHERE user_id = ?
  `).bind(uid).all<{ achievement_id: string }>();
  const owned = new Set((rows.results ?? []).map((row) => row.achievement_id));
  return requested.filter((id) => owned.has(id)).slice(0, 3);
}

/**
 * Establishes D1 as the profile authority.  The first authoritative row never
 * imports mutable Firestore fields: those fields may have been written directly
 * by a player before this migration.  Existing players receive a safe default
 * identity and can choose their public presentation again through onboarding.
 */
export async function ensureAuthoritativePlayerProfile(
  database: PlayerDatabase,
  account: FirebaseAccount,
): Promise<StoredPlayerProfile> {
  const existing = await database.prepare(`
    SELECT user_id, subject_id, username, bio, avatar_id,
      featured_achievement_ids_json, created_at, updated_at
    FROM player_profile_authority WHERE user_id = ?
  `).bind(account.uid).first<AuthoritativeProfileRow>();
  if (existing) return profileFromRow(existing, account);

  const now = new Date().toISOString();
  const profile: StoredPlayerProfile = {
    uid: account.uid,
    subjectId: createSubjectId(),
    username: fallbackUsername(account),
    bio: '',
    avatarId: 'echo',
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    joinDate: account.createdAt,
    featuredAchievementIds: [],
    usernameSource: 'default',
    updateTime: now,
  };
  await database.prepare(`
    INSERT INTO player_profile_authority (
      user_id, subject_id, username, bio, avatar_id,
      featured_achievement_ids_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO NOTHING
  `).bind(
    profile.uid,
    profile.subjectId,
    profile.username,
    profile.bio,
    profile.avatarId,
    '[]',
    profile.joinDate,
    now,
  ).run();
  return (await ensureAuthoritativePlayerProfile(database, account));
}

export async function writeAuthoritativePlayerProfile(
  database: PlayerDatabase,
  account: FirebaseAccount,
  next: StoredPlayerProfile,
): Promise<StoredPlayerProfile> {
  const unlocked = await readUnlockedAvatarIds(database, account.uid);
  const avatarId = unlocked.includes(next.avatarId) ? next.avatarId : 'echo';
  const featuredAchievementIds = await verifiedFeaturedIds(
    database,
    account.uid,
    next.featuredAchievementIds,
  );
  const now = new Date().toISOString();
  await database.prepare(`
    UPDATE player_profile_authority
    SET username = ?, bio = ?, avatar_id = ?, featured_achievement_ids_json = ?, updated_at = ?
    WHERE user_id = ?
  `).bind(
    next.username,
    cleanBio(next.bio),
    avatarId,
    JSON.stringify(featuredAchievementIds),
    now,
    account.uid,
  ).run();
  return {
    ...next,
    avatarId,
    bio: cleanBio(next.bio),
    featuredAchievementIds,
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    updateTime: now,
  };
}

export async function readAuthoritativeFeaturedAchievementIds(
  database: PlayerDatabase,
  uid: string,
): Promise<string[]> {
  const row = await database.prepare(`
    SELECT featured_achievement_ids_json FROM player_profile_authority WHERE user_id = ?
  `).bind(uid).first<{ featured_achievement_ids_json: string }>();
  return row ? safeFeaturedIds(row.featured_achievement_ids_json) : [];
}

export async function readAuthoritativeDisplayName(
  database: PlayerDatabase,
  uid: string,
  fallback: string,
): Promise<string> {
  const row = await database.prepare(`
    SELECT username FROM player_profile_authority WHERE user_id = ?
  `).bind(uid).first<{ username: string }>();
  return row?.username || fallback;
}
