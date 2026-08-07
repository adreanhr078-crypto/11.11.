import {
  getPlayerLevelProgress,
  normalizeTotalXp,
  type LeaderboardPlayer,
} from '../../../src/domain/player-progression/playerProgression';
import {
  PlayerApiError,
  type FirebaseAccount,
} from './_shared';
import type {
  PlayerDatabase,
  PlayerDatabaseResult,
} from './_database';
import type { VerifiedXpReward } from './_xpRewards';

interface ProgressionRow {
  user_id: string;
  username: string;
  total_xp: number | string;
  position?: number | string;
}

interface CountRow {
  total: number | string;
}

export interface LeaderboardSnapshot {
  entries: LeaderboardPlayer[];
  currentPlayer: LeaderboardPlayer;
  totalPlayers: number;
  generatedAt: string;
}

export interface XpClaimResult {
  awarded: boolean;
  xpGranted: number;
  progression: LeaderboardPlayer;
}

function publicUsername(account: FirebaseAccount): string {
  const displayName = account.displayName
    ?.replace(/[^\p{L}\p{N} ._-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 28);
  return displayName || `SUBJECT-${account.uid.slice(-6).toUpperCase()}`;
}

function toPositiveInteger(value: unknown, fallback = 1): number {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.max(fallback, Math.floor(numeric))
    : fallback;
}

function mapPlayerRow(
  row: ProgressionRow,
  currentUid: string,
): LeaderboardPlayer {
  const progress = getPlayerLevelProgress(row.total_xp);
  return {
    rank: toPositiveInteger(row.position),
    username: row.username,
    ...progress,
    isCurrentPlayer: row.user_id === currentUid,
  };
}

function upsertPlayerStatement(
  db: PlayerDatabase,
  account: FirebaseAccount,
  now: string,
) {
  return db.prepare(`
    INSERT INTO player_progression (
      user_id,
      username,
      total_xp,
      created_at,
      updated_at
    ) VALUES (?, ?, 0, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      updated_at = excluded.updated_at
  `).bind(account.uid, publicUsername(account), now, now);
}

async function currentPlayerRow(
  db: PlayerDatabase,
  uid: string,
): Promise<ProgressionRow> {
  const row = await db.prepare(`
    SELECT
      player.user_id,
      player.username,
      player.total_xp,
      1 + (
        SELECT COUNT(*)
        FROM player_progression AS higher
        WHERE higher.total_xp > player.total_xp
      ) AS position
    FROM player_progression AS player
    WHERE player.user_id = ?
  `).bind(uid).first<ProgressionRow>();

  if (!row) {
    throw new Error('Player progression row was not created.');
  }
  return row;
}

async function assertRewardPrerequisites(
  db: PlayerDatabase,
  uid: string,
  requiredRewardKeys: readonly string[],
): Promise<void> {
  if (requiredRewardKeys.length === 0) return;
  const placeholders = requiredRewardKeys.map(() => '?').join(', ');
  const row = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM xp_reward_events
    WHERE user_id = ?
      AND reward_key IN (${placeholders})
  `).bind(uid, ...requiredRewardKeys).first<CountRow>();
  if (toPositiveInteger(row?.total, 0) !== requiredRewardKeys.length) {
    throw new PlayerApiError(
      409,
      'reward_prerequisite_missing',
      'The previous XP reward must be verified first.',
    );
  }
}

export async function readLeaderboard(
  db: PlayerDatabase,
  account: FirebaseAccount,
  limit: number,
): Promise<LeaderboardSnapshot> {
  const now = new Date().toISOString();
  await upsertPlayerStatement(db, account, now).run();

  const [topResult, currentRow, countRow] = await Promise.all([
    db.prepare(`
      SELECT
        user_id,
        username,
        total_xp,
        RANK() OVER (ORDER BY total_xp DESC) AS position
      FROM player_progression
      ORDER BY total_xp DESC, created_at ASC, user_id ASC
      LIMIT ?
    `).bind(limit).all<ProgressionRow>(),
    currentPlayerRow(db, account.uid),
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM player_progression
    `).first<CountRow>(),
  ]);

  return {
    entries: (topResult.results ?? []).map((row) => (
      mapPlayerRow(row, account.uid)
    )),
    currentPlayer: mapPlayerRow(currentRow, account.uid),
    totalPlayers: toPositiveInteger(countRow?.total, 0),
    generatedAt: now,
  };
}

export async function claimXpReward(
  db: PlayerDatabase,
  account: FirebaseAccount,
  reward: VerifiedXpReward,
): Promise<XpClaimResult> {
  await assertRewardPrerequisites(
    db,
    account.uid,
    reward.requiredRewardKeys,
  );
  const now = new Date().toISOString();
  const results = await db.batch([
    upsertPlayerStatement(db, account, now),
    db.prepare(`
      INSERT OR IGNORE INTO xp_reward_events (
        user_id,
        reward_key,
        source_type,
        source_id,
        xp_amount,
        granted_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      account.uid,
      reward.rewardKey,
      reward.sourceType,
      reward.sourceId,
      reward.xpAmount,
      now,
    ),
    db.prepare(`
      UPDATE player_progression
      SET
        total_xp = (
          SELECT COALESCE(SUM(xp_amount), 0)
          FROM xp_reward_events
          WHERE user_id = ?
        ),
        updated_at = ?
      WHERE user_id = ?
    `).bind(account.uid, now, account.uid),
  ]);
  const insertResult = results[1] as PlayerDatabaseResult | undefined;
  const awarded = Number(insertResult?.meta?.changes ?? 0) > 0;
  const current = await currentPlayerRow(db, account.uid);

  return {
    awarded,
    xpGranted: awarded ? normalizeTotalXp(reward.xpAmount) : 0,
    progression: mapPlayerRow(current, account.uid),
  };
}
