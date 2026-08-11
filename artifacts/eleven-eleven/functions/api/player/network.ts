import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import { ensureNetworkPlayer, readNetworkEligibility } from './_network';

interface RatingRow {
  speed: 'blitz' | 'rapid';
  rating: number;
  deviation: number;
  volatility: number;
  games_played: number;
}

interface MatchRow {
  match_id: string;
  mode: string;
  status: string;
  winner_uid: string | null;
  completed_at: string;
  outcome: string;
  xp_amount: number;
}

interface SeasonProgressRow {
  season_id: string;
  activity_id: string;
  status: string;
  mastery_score: number;
  completed_at: string | null;
}

interface CharacterBondRow {
  character_id: string;
  bond_points: number;
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const database = requirePlayerDatabase(env);
    await ensureNetworkPlayer(database, account);
    const [ratings, matches, cosmetics, seasonProgress, characterBonds] = await database.batch([
      database.prepare(`
        SELECT speed, rating, deviation, volatility, games_played
        FROM chess_ratings WHERE user_id = ? ORDER BY speed ASC
      `).bind(account.uid),
      database.prepare(`
        SELECT r.match_id, r.mode, r.status, r.winner_uid, r.completed_at,
          p.outcome, p.xp_amount
        FROM network_match_participants p
        JOIN network_match_receipts r ON r.match_id = p.match_id
        WHERE p.user_id = ?
        ORDER BY r.completed_at DESC LIMIT 12
      `).bind(account.uid),
      database.prepare(`
        SELECT cosmetic_id FROM network_cosmetic_unlock_events
        WHERE user_id = ? ORDER BY unlocked_at ASC
      `).bind(account.uid),
      database.prepare(`
        SELECT season_id, activity_id, status, mastery_score, completed_at
        FROM season_player_progress
        WHERE user_id = ? ORDER BY updated_at DESC
      `).bind(account.uid),
      database.prepare(`
        SELECT character_id, SUM(bond_points) AS bond_points
        FROM player_character_bond_events
        WHERE user_id = ? GROUP BY character_id ORDER BY character_id ASC
      `).bind(account.uid),
    ]);
    return jsonResponse({
      eligibility: await readNetworkEligibility(database, account.uid),
      ratings: (ratings.results ?? []) as RatingRow[],
      recentMatches: (matches.results ?? []) as MatchRow[],
      cosmetics: (cosmetics.results ?? []).flatMap((row) => {
        const cosmeticId = (row as { cosmetic_id?: unknown }).cosmetic_id;
        return typeof cosmeticId === 'string' ? [cosmeticId] : [];
      }),
      seasonProgress: (seasonProgress.results ?? []) as SeasonProgressRow[],
      characterBonds: (characterBonds.results ?? []) as CharacterBondRow[],
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
