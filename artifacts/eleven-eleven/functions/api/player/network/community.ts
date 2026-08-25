import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import { ensureNetworkPlayer } from '../_network';
import { requirePlayerRolloutFeature } from '../_rolloutPolicy';

interface PostRow {
  post_id: string;
  author_uid: string | null;
  author_name: string;
  locale: 'ar' | 'en';
  channel: 'official' | 'story' | 'puzzles' | 'chess' | 'coop' | 'creator';
  body: string;
  card_id: string | null;
  status: 'official' | 'approved';
  created_at: string;
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    requirePlayerRolloutFeature(env.PLAYER_ROLLOUT_POLICY, 'communityEnabled');
    const db = requirePlayerDatabase(env);
    await ensureNetworkPlayer(db, account);
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ar';
    const channel = url.searchParams.get('channel') ?? 'official';
    const allowedChannels = ['official', 'story', 'puzzles', 'chess', 'coop', 'creator'];
    if (!allowedChannels.includes(channel)) {
      throw new PlayerApiError(400, 'invalid_channel', 'The requested community channel is invalid.');
    }
    const rows = await db.prepare(`
      SELECT post_id, author_uid, author_name, locale, channel, body,
        card_id, status, created_at
      FROM community_posts
      WHERE locale = ? AND channel = ? AND status IN ('official', 'approved')
      ORDER BY created_at DESC LIMIT 30
    `).bind(locale, channel).all<PostRow>();
    return jsonResponse({ posts: rows.results ?? [], presetOnly: true }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
