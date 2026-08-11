import {
  STARTER_PLAYER_AVATAR_IDS,
  isRarePlayerAvatarId,
  isStarterPlayerAvatarId,
  type PlayerAvatarId,
  type RarePlayerAvatarId,
} from '../../../src/domain/player-profile/playerProfile';
import type { PlayerDatabase } from './_database';
import { PlayerApiError } from './_shared';

interface AvatarUnlockRow {
  avatar_id: string;
}

export async function readRareUnlockedAvatarIds(
  db: PlayerDatabase,
  uid: string,
): Promise<RarePlayerAvatarId[]> {
  const rows = await db.prepare(`
    SELECT avatar_id
    FROM player_avatar_unlock_events
    WHERE user_id = ?
    ORDER BY unlocked_at ASC, avatar_id ASC
  `).bind(uid).all<AvatarUnlockRow>();
  return (rows.results ?? [])
    .map((row) => row.avatar_id)
    .filter(isRarePlayerAvatarId);
}

export async function readUnlockedAvatarIds(
  db: PlayerDatabase,
  uid: string,
): Promise<PlayerAvatarId[]> {
  return [
    ...STARTER_PLAYER_AVATAR_IDS,
    ...await readRareUnlockedAvatarIds(db, uid),
  ];
}

export async function requireAvatarOwnership(
  db: PlayerDatabase,
  uid: string,
  avatarId: PlayerAvatarId,
): Promise<void> {
  if (isStarterPlayerAvatarId(avatarId)) return;
  const owned = await db.prepare(`
    SELECT avatar_id
    FROM player_avatar_unlock_events
    WHERE user_id = ? AND avatar_id = ?
  `).bind(uid, avatarId).first<AvatarUnlockRow>();
  if (!owned || !isRarePlayerAvatarId(owned.avatar_id)) {
    throw new PlayerApiError(
      403,
      'avatar_not_unlocked',
      'This rare avatar must be earned from a verified weekly mission.',
    );
  }
}
