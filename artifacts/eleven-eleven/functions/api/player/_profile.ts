import {
  booleanField,
  integerField,
  PlayerApiError,
  readFirestoreDocument,
  readStringArrayField,
  readStringField,
  readTimestampField,
  stringArrayField,
  stringField,
  timestampField,
  writeFirestoreDocument,
  type FirebaseAccount,
  type FirestoreDocument,
  type PlayerApiEnv,
} from './_shared';
import {
  isPlayerAvatarId,
  PLAYER_AVATAR_IDS,
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_FEATURED_ACHIEVEMENT_LIMIT,
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  type PlayerAvatarId,
} from '../../../src/domain/player-profile/playerProfile';

export const PROFILE_SCHEMA_VERSION = 2;

export interface StoredPlayerProfile {
  uid: string;
  subjectId: string;
  username: string;
  bio: string;
  avatarId: PlayerAvatarId;
  email: string | null;
  providerId: string;
  isAnonymous: boolean;
  joinDate: string;
  featuredAchievementIds: string[];
  usernameSource?: 'stored' | 'default';
  updateTime?: string;
}

export function normalizeUsername(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function cleanUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PROFILE_USERNAME_MAX_LENGTH);
  return cleaned.length >= PROFILE_USERNAME_MIN_LENGTH ? cleaned : null;
}

export function cleanBio(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, PROFILE_BIO_MAX_LENGTH);
}

export function publicUsername(account: FirebaseAccount): string {
  const displayName = cleanUsername(account.displayName);
  return displayName || `SUBJECT-${account.uid.slice(-6).toUpperCase()}`;
}

export function fallbackUsername(account: FirebaseAccount): string {
  return `SUBJECT-${account.uid.slice(-10).toUpperCase()}`;
}

export function createSubjectId(): string {
  return `SUBJECT-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
}

function safeAchievementIds(document: FirestoreDocument): string[] {
  return readStringArrayField(document, 'featuredAchievementIds')
    .filter((id) => /^[a-z0-9_-]{1,100}$/i.test(id))
    .slice(0, PROFILE_FEATURED_ACHIEVEMENT_LIMIT);
}

export function profileFromDocument(
  document: FirestoreDocument | null,
  account: FirebaseAccount,
): StoredPlayerProfile {
  const subjectId = readStringField(document ?? {}, 'subjectId') ?? createSubjectId();
  const storedUsername = cleanUsername(readStringField(document ?? {}, 'username'));
  const username = storedUsername ?? publicUsername(account);
  const avatarValue = readStringField(document ?? {}, 'avatarId');
  const avatarId = isPlayerAvatarId(avatarValue) ? avatarValue : PLAYER_AVATAR_IDS[0];
  return {
    uid: account.uid,
    subjectId,
    username,
    bio: cleanBio(readStringField(document ?? {}, 'bio')),
    avatarId,
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    joinDate: readTimestampField(document ?? {}, 'createdAt') ?? account.createdAt,
    featuredAchievementIds: document ? safeAchievementIds(document) : [],
    usernameSource: storedUsername ? 'stored' : 'default',
    ...(document?.updateTime ? { updateTime: document.updateTime } : {}),
  };
}

export function profileDocumentFields(
  profile: StoredPlayerProfile,
  account: FirebaseAccount,
  now: string,
) {
  return {
    uid: stringField(account.uid),
    subjectId: stringField(profile.subjectId),
    username: stringField(profile.username),
    bio: stringField(profile.bio),
    avatarId: stringField(profile.avatarId),
    featuredAchievementIds: stringArrayField(profile.featuredAchievementIds),
    displayName: stringField(account.displayName ?? ''),
    email: stringField(account.email ?? ''),
    photoURL: stringField(account.photoURL ?? ''),
    providerId: stringField(account.providerId),
    isAnonymous: booleanField(account.providerId === 'anonymous'),
    schemaVersion: integerField(PROFILE_SCHEMA_VERSION),
    createdAt: timestampField(profile.joinDate),
    lastLoginAt: timestampField(account.lastLoginAt),
    updatedAt: timestampField(now),
  };
}

function isSaveConflict(error: unknown): boolean {
  if (error instanceof PlayerApiError && error.code === 'save_conflict') {
    return true;
  }
  // A bundled Worker can materialize the same error across module boundaries,
  // where instanceof is not stable. Preserve the server error contract by
  // checking the public code as well.
  return typeof error === 'object'
    && error !== null
    && (error as { code?: unknown }).code === 'save_conflict';
}

function isProfileCreateWriteFailure(error: unknown): boolean {
  if (isSaveConflict(error)) return true;
  if (error instanceof PlayerApiError && error.code === 'database_write_failed') {
    return true;
  }
  return typeof error === 'object'
    && error !== null
    && (error as { code?: unknown }).code === 'database_write_failed';
}

export async function ensurePlayerProfile(
  env: PlayerApiEnv,
  idToken: string,
  account: FirebaseAccount,
): Promise<StoredPlayerProfile> {
  const document = await readFirestoreDocument(
    env,
    idToken,
    `players/${account.uid}`,
  );
  const profile = profileFromDocument(document, account);
  const now = new Date().toISOString();
  let savedDocument: FirestoreDocument;
  try {
    savedDocument = await writeFirestoreDocument(
      env,
      idToken,
      `players/${account.uid}`,
      profileDocumentFields(profile, account, now),
      document
        ? (document.updateTime ? { updateTime: document.updateTime } : undefined)
        : { exists: false },
    );
  } catch (error) {
    if (!isProfileCreateWriteFailure(error)) {
      throw error;
    }

    // Auth bootstrap and progression bootstrap can create the same profile
    // concurrently. The request that loses the Firestore precondition race
    // should reuse the profile that won, rather than failing cloud save.
    let concurrentDocument: FirestoreDocument | null = null;
    for (let attempt = 0; attempt < 3 && !concurrentDocument; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 40));
      }
      concurrentDocument = await readFirestoreDocument(
        env,
        idToken,
        `players/${account.uid}`,
      );
    }
    if (!concurrentDocument) throw error;
    const concurrentProfile = profileFromDocument(concurrentDocument, account);
    return {
      ...concurrentProfile,
      email: account.email,
      providerId: account.providerId,
      isAnonymous: account.providerId === 'anonymous',
      ...(concurrentDocument.updateTime
        ? { updateTime: concurrentDocument.updateTime }
        : {}),
    };
  }
  return {
    ...profile,
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    ...(savedDocument.updateTime ? { updateTime: savedDocument.updateTime } : {}),
  };
}

export async function writePlayerProfile(
  env: PlayerApiEnv,
  idToken: string,
  account: FirebaseAccount,
  profile: StoredPlayerProfile,
): Promise<StoredPlayerProfile> {
  const now = new Date().toISOString();
  const savedDocument = await writeFirestoreDocument(
    env,
    idToken,
    `players/${account.uid}`,
    profileDocumentFields(profile, account, now),
    profile.updateTime ? { updateTime: profile.updateTime } : undefined,
  );
  return {
    ...profile,
    email: account.email,
    providerId: account.providerId,
    isAnonymous: account.providerId === 'anonymous',
    ...(savedDocument.updateTime ? { updateTime: savedDocument.updateTime } : {}),
  };
}
