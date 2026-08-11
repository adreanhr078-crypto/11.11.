import { z } from 'zod';
import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase, type PlayerDatabase } from '../_database';
import { ensureNetworkPlayer, readNetworkEligibility } from '../_network';

const socialActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('request'),
    signalCode: z.string().trim().min(8).max(16),
  }),
  z.object({
    action: z.enum(['accept', 'decline', 'remove', 'block', 'unblock', 'mute', 'unmute']),
    targetUid: z.string().trim().min(1).max(128),
  }),
  z.object({
    action: z.literal('report'),
    targetType: z.enum(['message', 'post', 'profile', 'puzzle', 'match']),
    targetId: z.string().trim().min(1).max(128),
    reason: z.enum(['abuse', 'spam', 'privacy', 'cheating', 'unsafe-content', 'other']),
    detail: z.string().trim().max(500).default(''),
  }),
]);

type SocialAction = z.infer<typeof socialActionSchema>;

interface RelationshipRow {
  friend_uid: string;
  username: string;
  status: 'pending' | 'accepted' | 'declined';
  direction: 'friend' | 'incoming' | 'outgoing';
  updated_at: string;
  muted: number;
}

interface SafetyRow {
  user_id: string;
  username: string;
  created_at: string;
}

const SIGNAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeSignalCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = [...bytes]
    .map((byte) => SIGNAL_ALPHABET[byte % SIGNAL_ALPHABET.length])
    .join('');
  return `ECHO-${suffix}`;
}

async function ensureSocialProfile(
  db: PlayerDatabase,
  uid: string,
  now: string,
): Promise<string> {
  const existing = await db.prepare(`
    SELECT signal_code FROM network_social_profiles WHERE user_id = ?
  `).bind(uid).first<{ signal_code: string }>();
  if (existing?.signal_code) return existing.signal_code;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const signalCode = makeSignalCode();
    await db.prepare(`
      INSERT OR IGNORE INTO network_social_profiles (
        user_id, signal_code, locale, presence_visibility, created_at, updated_at
      ) VALUES (?, ?, 'ar', 'friends', ?, ?)
    `).bind(uid, signalCode, now, now).run();
    const created = await db.prepare(`
      SELECT signal_code FROM network_social_profiles WHERE user_id = ?
    `).bind(uid).first<{ signal_code: string }>();
    if (created?.signal_code) return created.signal_code;
  }
  throw new PlayerApiError(503, 'signal_code_unavailable', 'A private signal code could not be reserved.');
}

async function requireCommunityAccess(db: PlayerDatabase, uid: string): Promise<void> {
  const eligibility = await readNetworkEligibility(db, uid);
  if (!eligibility.communityRulesAccepted || !eligibility.ageGateConfirmed) {
    throw new PlayerApiError(403, 'community_rules_required', 'Accept the community rules first.');
  }
}

async function assertSocialRate(
  db: PlayerDatabase,
  uid: string,
  action: SocialAction['action'],
  now: string,
): Promise<void> {
  const since = new Date(Date.parse(now) - 60_000).toISOString();
  const row = await db.prepare(`
    SELECT COUNT(*) AS total FROM social_action_events
    WHERE actor_uid = ? AND created_at >= ?
      AND (? <> 'request' OR action_type = 'request')
  `).bind(uid, since, action).first<{ total: number | string }>();
  const limit = action === 'request' ? 5 : 30;
  if (Number(row?.total ?? 0) >= limit) {
    throw new PlayerApiError(429, 'social_rate_limited', 'Too many social actions. Wait a minute and try again.');
  }
}

async function recordAction(
  db: PlayerDatabase,
  uid: string,
  action: SocialAction['action'],
  targetUid: string | null,
  now: string,
): Promise<void> {
  await db.prepare(`
    INSERT INTO social_action_events (
      event_id, actor_uid, action_type, target_uid, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), uid, action, targetUid, now).run();
}

async function ensureTargetExists(db: PlayerDatabase, targetUid: string): Promise<void> {
  const target = await db.prepare(`
    SELECT user_id FROM player_progression WHERE user_id = ?
  `).bind(targetUid).first<{ user_id: string }>();
  if (!target) throw new PlayerApiError(404, 'signal_not_found', 'That player signal is unavailable.');
}

async function socialSnapshot(db: PlayerDatabase, uid: string, signalCode: string) {
  const [relationships, blocks, mutes] = await db.batch([
    db.prepare(`
      SELECT
        CASE WHEN r.requester_uid = ? THEN r.addressee_uid ELSE r.requester_uid END AS friend_uid,
        p.username,
        r.status,
        CASE
          WHEN r.status = 'accepted' THEN 'friend'
          WHEN r.requester_uid = ? THEN 'outgoing'
          ELSE 'incoming'
        END AS direction,
        r.updated_at,
        CASE WHEN m.muted_uid IS NULL THEN 0 ELSE 1 END AS muted
      FROM social_relationships r
      JOIN player_progression p ON p.user_id = CASE
        WHEN r.requester_uid = ? THEN r.addressee_uid ELSE r.requester_uid END
      LEFT JOIN social_mutes m ON m.muter_uid = ? AND m.muted_uid = p.user_id
      WHERE (r.requester_uid = ? OR r.addressee_uid = ?)
        AND r.status IN ('pending', 'accepted')
      ORDER BY CASE r.status WHEN 'accepted' THEN 0 ELSE 1 END, r.updated_at DESC
      LIMIT 100
    `).bind(uid, uid, uid, uid, uid, uid),
    db.prepare(`
      SELECT b.blocked_uid AS user_id, p.username, b.created_at
      FROM social_blocks b
      JOIN player_progression p ON p.user_id = b.blocked_uid
      WHERE b.blocker_uid = ? ORDER BY b.created_at DESC LIMIT 100
    `).bind(uid),
    db.prepare(`
      SELECT m.muted_uid AS user_id, p.username, m.created_at
      FROM social_mutes m
      JOIN player_progression p ON p.user_id = m.muted_uid
      WHERE m.muter_uid = ? ORDER BY m.created_at DESC LIMIT 100
    `).bind(uid),
  ]);
  const rows = (relationships.results ?? []) as unknown as RelationshipRow[];
  return {
    signalCode,
    friends: rows.filter((row) => row.direction === 'friend'),
    incoming: rows.filter((row) => row.direction === 'incoming'),
    outgoing: rows.filter((row) => row.direction === 'outgoing'),
    blocked: (blocks.results ?? []) as unknown as SafetyRow[],
    muted: (mutes.results ?? []) as unknown as SafetyRow[],
    freeTextEnabled: false,
  };
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const db = requirePlayerDatabase(env);
    const now = new Date().toISOString();
    await ensureNetworkPlayer(db, account, now);
    await requireCommunityAccess(db, account.uid);
    const signalCode = await ensureSocialProfile(db, account.uid, now);
    return jsonResponse(await socialSnapshot(db, account.uid, signalCode), 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = socialActionSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: 4_096,
      tooLargeCode: 'social_request_too_large',
      tooLargeMessage: 'Social request is too large.',
      invalidMessage: 'Social request is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_social_request', 'Social request is invalid.');
    }
    const action = parsed.data;
    const db = requirePlayerDatabase(env);
    const now = new Date().toISOString();
    await ensureNetworkPlayer(db, account, now);
    await requireCommunityAccess(db, account.uid);
    const signalCode = await ensureSocialProfile(db, account.uid, now);
    await assertSocialRate(db, account.uid, action.action, now);

    let targetUid: string | null = 'targetUid' in action ? action.targetUid : null;
    if (action.action === 'request') {
      const normalizedCode = action.signalCode.toUpperCase().replace(/\s+/g, '');
      const target = await db.prepare(`
        SELECT user_id FROM network_social_profiles WHERE signal_code = ?
      `).bind(normalizedCode).first<{ user_id: string }>();
      targetUid = target?.user_id ?? null;
      if (!targetUid) throw new PlayerApiError(404, 'signal_not_found', 'That player signal is unavailable.');
      if (targetUid === account.uid) throw new PlayerApiError(409, 'self_request', 'You already own that signal.');
      const blocked = await db.prepare(`
        SELECT 1 AS blocked FROM social_blocks
        WHERE (blocker_uid = ? AND blocked_uid = ?)
           OR (blocker_uid = ? AND blocked_uid = ?)
        LIMIT 1
      `).bind(account.uid, targetUid, targetUid, account.uid).first<{ blocked: number }>();
      if (blocked) throw new PlayerApiError(409, 'social_unavailable', 'That signal cannot receive this request.');
      const existing = await db.prepare(`
        SELECT status FROM social_relationships
        WHERE (requester_uid = ? AND addressee_uid = ?)
           OR (requester_uid = ? AND addressee_uid = ?)
      `).bind(account.uid, targetUid, targetUid, account.uid)
        .first<{ status: 'pending' | 'accepted' | 'declined' }>();
      if (existing?.status === 'accepted') {
        throw new PlayerApiError(409, 'already_friends', 'That signal is already in your friends list.');
      }
      if (existing?.status === 'pending') {
        throw new PlayerApiError(409, 'request_pending', 'A friend request is already pending.');
      }
      if (existing) {
        await db.prepare(`
          UPDATE social_relationships
          SET requester_uid = ?, addressee_uid = ?, status = 'pending', updated_at = ?
          WHERE (requester_uid = ? AND addressee_uid = ?)
             OR (requester_uid = ? AND addressee_uid = ?)
        `).bind(account.uid, targetUid, now, account.uid, targetUid, targetUid, account.uid).run();
      } else {
        await db.prepare(`
          INSERT INTO social_relationships (
            requester_uid, addressee_uid, status, created_at, updated_at
          ) VALUES (?, ?, 'pending', ?, ?)
        `).bind(account.uid, targetUid, now, now).run();
      }
    } else if (action.action === 'accept' || action.action === 'decline') {
      if (action.targetUid === account.uid) throw new PlayerApiError(409, 'self_action', 'That action is unavailable.');
      const pending = await db.prepare(`
        SELECT status FROM social_relationships
        WHERE requester_uid = ? AND addressee_uid = ? AND status = 'pending'
      `).bind(action.targetUid, account.uid).first<{ status: string }>();
      if (!pending) throw new PlayerApiError(409, 'request_not_pending', 'That friend request is no longer pending.');
      await db.prepare(`
        UPDATE social_relationships SET status = ?, updated_at = ?
        WHERE requester_uid = ? AND addressee_uid = ?
      `).bind(action.action === 'accept' ? 'accepted' : 'declined', now, action.targetUid, account.uid).run();
    } else if (action.action === 'remove') {
      await db.prepare(`
        DELETE FROM social_relationships
        WHERE (requester_uid = ? AND addressee_uid = ?)
           OR (requester_uid = ? AND addressee_uid = ?)
      `).bind(account.uid, action.targetUid, action.targetUid, account.uid).run();
    } else if (action.action === 'block') {
      if (action.targetUid === account.uid) throw new PlayerApiError(409, 'self_action', 'That action is unavailable.');
      await ensureTargetExists(db, action.targetUid);
      await db.batch([
        db.prepare(`
          DELETE FROM social_relationships
          WHERE (requester_uid = ? AND addressee_uid = ?)
             OR (requester_uid = ? AND addressee_uid = ?)
        `).bind(account.uid, action.targetUid, action.targetUid, account.uid),
        db.prepare(`
          INSERT OR IGNORE INTO social_blocks (blocker_uid, blocked_uid, created_at)
          VALUES (?, ?, ?)
        `).bind(account.uid, action.targetUid, now),
        db.prepare(`
          DELETE FROM social_mutes WHERE muter_uid = ? AND muted_uid = ?
        `).bind(account.uid, action.targetUid),
      ]);
    } else if (action.action === 'unblock') {
      await db.prepare(`
        DELETE FROM social_blocks WHERE blocker_uid = ? AND blocked_uid = ?
      `).bind(account.uid, action.targetUid).run();
    } else if (action.action === 'mute') {
      if (action.targetUid === account.uid) throw new PlayerApiError(409, 'self_action', 'That action is unavailable.');
      await ensureTargetExists(db, action.targetUid);
      await db.prepare(`
        INSERT OR IGNORE INTO social_mutes (muter_uid, muted_uid, created_at)
        VALUES (?, ?, ?)
      `).bind(account.uid, action.targetUid, now).run();
    } else if (action.action === 'unmute') {
      await db.prepare(`
        DELETE FROM social_mutes WHERE muter_uid = ? AND muted_uid = ?
      `).bind(account.uid, action.targetUid).run();
    } else if (action.action === 'report') {
      const detail = action.detail.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
      await db.prepare(`
        INSERT INTO moderation_cases (
          case_id, reporter_uid, target_type, target_id, reason,
          detail, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)
      `).bind(
        crypto.randomUUID(), account.uid, action.targetType, action.targetId,
        action.reason, detail, now, now,
      ).run();
    }

    await recordAction(db, account.uid, action.action, targetUid, now);
    return jsonResponse({
      social: await socialSnapshot(db, account.uid, signalCode),
      action: action.action,
      accepted: true,
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
