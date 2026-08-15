import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  PlayerApiError,
  readJsonBody,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase, type PlayerDatabase } from './_database';
import {
  cleanBio,
  cleanUsername,
  fallbackUsername,
  normalizeUsername,
  type StoredPlayerProfile,
} from './_profile';
import {
  readLeaderboard,
  readPlayerProfileStats,
} from './_progressionRepository';
import {
  isPlayerAvatarId,
  PROFILE_FEATURED_ACHIEVEMENT_LIMIT,
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_USERNAME_MAX_LENGTH,
  type PlayerAvatarId,
} from '../../../src/domain/player-profile/playerProfile';
import {
  readUnlockedAvatarIds,
  requireAvatarOwnership,
} from './_avatarOwnership';
import {
  ensureAuthoritativePlayerProfile,
  writeAuthoritativePlayerProfile,
} from './_profileAuthority';

interface UsernameReservationRow {
  normalized_username: string;
  user_id: string;
}

interface ProfileUpdateBody {
  username?: unknown;
  bio?: unknown;
  avatarId?: unknown;
  featuredAchievementIds?: unknown;
}

async function ensureProgressionRow(
  db: PlayerDatabase,
  uid: string,
  username: string,
  createdAt: string,
): Promise<void> {
  await db.prepare(`
    INSERT INTO player_progression (
      user_id,
      username,
      total_xp,
      created_at,
      updated_at
    ) VALUES (?, ?, 0, ?, ?)
    ON CONFLICT(user_id) DO NOTHING
  `).bind(uid, username, createdAt, new Date().toISOString()).run();
}

async function reserveUsername(
  db: PlayerDatabase,
  uid: string,
  username: string,
  createdAt: string,
): Promise<void> {
  const normalized = normalizeUsername(username);
  await ensureProgressionRow(db, uid, username, createdAt);
  const owner = await db.prepare(`
    SELECT normalized_username, user_id
    FROM player_username_reservations
    WHERE normalized_username = ?
  `).bind(normalized).first<UsernameReservationRow>();
  if (owner && owner.user_id !== uid) {
    throw new PlayerApiError(
      409,
      'username_taken',
      'This username is already in use.',
    );
  }

  const now = new Date().toISOString();
  try {
    await db.batch([
      db.prepare(`
        INSERT INTO player_username_reservations (
          normalized_username,
          user_id,
          username,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          normalized_username = excluded.normalized_username,
          username = excluded.username,
          updated_at = excluded.updated_at
      `).bind(normalized, uid, username, createdAt, now),
      db.prepare(`
        UPDATE player_progression
        SET username = ?, updated_at = ?
        WHERE user_id = ?
      `).bind(username, now, uid),
    ]);
  } catch (error) {
    if (error instanceof Error && /unique|constraint/i.test(error.message)) {
      throw new PlayerApiError(
        409,
        'username_taken',
        'This username is already in use.',
      );
    }
    throw error;
  }
}

function validateUpdateBody(body: unknown): ProfileUpdateBody {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new PlayerApiError(400, 'invalid_request', 'Profile update is invalid.');
  }
  const input = body as ProfileUpdateBody & Record<string, unknown>;
  const allowed = new Set(['username', 'bio', 'avatarId', 'featuredAchievementIds']);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new PlayerApiError(
      400,
      'profile_fields_forbidden',
      'Only username, bio, avatarId, and verified achievements can be changed.',
    );
  }
  if (typeof input.username !== 'string') {
    throw new PlayerApiError(400, 'invalid_username', 'Username is invalid.');
  }
  if (typeof input.bio !== 'string' || input.bio.length > PROFILE_BIO_MAX_LENGTH) {
    throw new PlayerApiError(400, 'invalid_bio', 'Bio must be 160 characters or fewer.');
  }
  if (!isPlayerAvatarId(input.avatarId)) {
    throw new PlayerApiError(400, 'invalid_avatar', 'Avatar ID is not allowed.');
  }
  if (input.featuredAchievementIds !== undefined && (
    !Array.isArray(input.featuredAchievementIds)
    || input.featuredAchievementIds.length > PROFILE_FEATURED_ACHIEVEMENT_LIMIT
    || input.featuredAchievementIds.some((id) => typeof id !== 'string' || !/^[a-z0-9_-]{1,100}$/i.test(id))
  )) {
    throw new PlayerApiError(400, 'invalid_featured_achievements', 'Up to three verified achievements can be showcased.');
  }
  return input;
}

async function validateFeaturedAchievementOwnership(
  db: PlayerDatabase,
  uid: string,
  requested: string[] | undefined,
  fallback: string[],
): Promise<string[]> {
  const ids = [...new Set(requested ?? fallback)].slice(0, PROFILE_FEATURED_ACHIEVEMENT_LIMIT);
  if (ids.length === 0) return [];
  const rows = await db.prepare(`
    SELECT achievement_id
    FROM player_achievement_unlock_events
    WHERE user_id = ?
  `).bind(uid).all<{ achievement_id: string }>();
  const owned = new Set((rows.results ?? []).map((row) => row.achievement_id));
  if (ids.some((id) => !owned.has(id))) {
    throw new PlayerApiError(403, 'achievement_not_unlocked', 'Only verified achievements can be showcased.');
  }
  return ids;
}

async function responseProfile(
  db: PlayerDatabase,
  account: Awaited<ReturnType<typeof authenticatePlayer>>['account'],
  stored: StoredPlayerProfile,
): Promise<Record<string, unknown>> {
  const [leaderboard, stats, unlockedAvatarIds] = await Promise.all([
    readLeaderboard(db, account, 1),
    readPlayerProfileStats(db, account.uid),
    readUnlockedAvatarIds(db, account.uid),
  ]);
  const progression = leaderboard.currentPlayer;
  const avatarId = unlockedAvatarIds.includes(stored.avatarId)
    ? stored.avatarId
    : 'echo';
  return {
    uid: stored.uid,
    subjectId: stored.subjectId,
    username: stored.username,
    bio: stored.bio,
    avatarId,
    unlockedAvatarIds,
    email: stored.email,
    providerId: stored.providerId,
    isAnonymous: stored.isAnonymous,
    joinDate: stored.joinDate,
    progression: {
      rank: progression.rank,
      level: progression.level,
      totalXp: progression.totalXp,
      currentLevelXp: progression.currentLevelXp,
      nextLevelXp: progression.nextLevelXp,
      xpIntoLevel: progression.xpIntoLevel,
      xpForNextLevel: progression.xpForNextLevel,
      progressPercent: progression.progressPercent,
    },
    stats,
    featuredAchievementIds: stored.featuredAchievementIds.slice(0, 3),
  };
}

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const db = requirePlayerDatabase(env);
    let stored = await ensureAuthoritativePlayerProfile(db, account);
    try {
      await reserveUsername(db, account.uid, stored.username, stored.joinDate);
    } catch (error) {
      if (!(error instanceof PlayerApiError)
        || error.code !== 'username_taken'
        || stored.usernameSource !== 'default') {
        throw error;
      }
      stored = await writeAuthoritativePlayerProfile(db, account, {
        ...stored,
        username: fallbackUsername(account),
        usernameSource: 'default',
      });
      await reserveUsername(db, account.uid, stored.username, stored.joinDate);
    }
    return jsonResponse({
      profile: await responseProfile(db, account, stored),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

export async function onRequestPut({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const db = requirePlayerDatabase(env);
    const body = validateUpdateBody(await readJsonBody<ProfileUpdateBody>(request, {
      maxBytes: 8 * 1024,
      tooLargeCode: 'profile_too_large',
      tooLargeMessage: 'Profile update is too large.',
      invalidMessage: 'Profile update is invalid.',
    }));
    const stored = await ensureAuthoritativePlayerProfile(db, account);
    const username = cleanUsername(body.username);
    if (!username || username.length > PROFILE_USERNAME_MAX_LENGTH) {
      throw new PlayerApiError(400, 'invalid_username', 'Username is invalid.');
    }
    const requestedAvatarId = body.avatarId as PlayerAvatarId;
    await requireAvatarOwnership(db, account.uid, requestedAvatarId);
    const nextProfile: StoredPlayerProfile = {
      ...stored,
      username,
      usernameSource: 'stored',
      bio: cleanBio(body.bio),
      avatarId: requestedAvatarId,
      featuredAchievementIds: await validateFeaturedAchievementOwnership(
        db,
        account.uid,
        body.featuredAchievementIds as string[] | undefined,
        stored.featuredAchievementIds,
      ),
    };
    await reserveUsername(db, account.uid, username, stored.joinDate);
    const saved = await writeAuthoritativePlayerProfile(db, account, nextProfile);
    // The public identity is D1-owned.  Do not mirror it to Firestore here:
    // cloud-save availability and Firestore rules must never block sign-in,
    // onboarding, profile recovery, or the authoritative profile response.
    return jsonResponse({
      profile: await responseProfile(db, account, saved),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
