import {
  realtimeTicketRequestSchema,
  type RealtimeTicketPayload,
} from '../../../../src/domain/echo-network/contracts';
import { signRealtimeTicket } from '../../../../src/domain/echo-network/realtimeTicket';
import { COOP_CASE_BY_ID } from '../../../../src/domain/echo-network/coopCaseCatalog';
import { normalizePartyRoomId } from '../../../../src/domain/echo-network/partyRoomSafety';
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
import { requirePlayerDatabase } from '../_database';
import {
  assertModeEligibility,
  ensureNetworkPlayer,
  networkDisplayName,
  readRankedMatchmakingBand,
  readNetworkEligibility,
  recordNetworkTicket,
} from '../_network';

const MAX_TICKET_REQUEST_BYTES = 4_096;

function realtimeBaseUrl(env: PlayerApiContext['env']): URL {
  const raw = env.PLAYER_REALTIME_URL?.trim();
  if (!raw) {
    throw new PlayerApiError(503, 'realtime_not_configured', 'Online play is not configured.');
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PlayerApiError(503, 'realtime_not_configured', 'Online play is not configured.');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new PlayerApiError(503, 'realtime_not_configured', 'Online play is not configured securely.');
  }
  return url;
}

function requireTicketSecret(env: PlayerApiContext['env']): string {
  const secret = env.REALTIME_TICKET_SECRET?.trim() ?? '';
  if (secret.length < 32) {
    throw new PlayerApiError(503, 'realtime_not_configured', 'Online play is not configured.');
  }
  return secret;
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = realtimeTicketRequestSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: MAX_TICKET_REQUEST_BYTES,
      tooLargeCode: 'ticket_request_too_large',
      tooLargeMessage: 'Connection request is too large.',
      invalidMessage: 'Connection request is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_ticket_request', 'Connection request is invalid.');
    }
    const body = parsed.data;
    const roomId = body.target === 'party'
      ? normalizePartyRoomId(body.roomId)
      : body.roomId;
    if (body.target === 'party' && !roomId) {
      throw new PlayerApiError(400, 'invalid_party', 'The party code is invalid.');
    }
    if (body.purpose === 'queue' && roomId) {
      throw new PlayerApiError(400, 'invalid_ticket_request', 'Queue tickets cannot target a room.');
    }
    if (body.purpose === 'connect' && !roomId) {
      throw new PlayerApiError(400, 'invalid_ticket_request', 'A room is required to reconnect.');
    }
    if (body.purpose === 'queue' && body.target !== 'match') {
      throw new PlayerApiError(400, 'invalid_ticket_target', 'Matchmaking accepts match tickets only.');
    }
    if (body.target === 'community'
      && !/^channel-(ar|en)-(official|story|puzzles|chess|coop|creator)$/.test(body.roomId ?? '')) {
      throw new PlayerApiError(400, 'invalid_channel', 'The community channel is invalid.');
    }
    if (body.caseId && (!COOP_CASE_BY_ID[body.caseId] || body.mode !== 'coop_breach')) {
      throw new PlayerApiError(400, 'invalid_case', 'The selected cooperative case is unavailable.');
    }
    if (body.variant && body.mode !== 'chess_anomaly') {
      throw new PlayerApiError(400, 'invalid_variant', 'Variants are available only in Anomaly chess.');
    }

    const database = requirePlayerDatabase(env);
    const issuedAt = Math.floor(Date.now() / 1_000);
    const expiresAt = issuedAt + 60;
    const jti = crypto.randomUUID();
    await ensureNetworkPlayer(database, account, new Date(issuedAt * 1_000).toISOString());
    if (body.target === 'match') {
      await assertModeEligibility(database, account.uid, body.mode);
    } else {
      const eligibility = await readNetworkEligibility(database, account.uid);
      if (!eligibility.communityRulesAccepted || !eligibility.ageGateConfirmed) {
        throw new PlayerApiError(403, 'community_rules_required', 'Accept the community rules first.');
      }
    }
    if (body.purpose === 'connect' && body.target === 'match') {
      const membership = await database.prepare(`
        SELECT room_id FROM network_room_memberships
        WHERE room_id = ? AND user_id = ? AND mode = ? AND expires_at > ?
      `).bind(
        roomId, account.uid, body.mode, new Date(issuedAt * 1_000).toISOString(),
      ).first<{ room_id: string }>();
      if (!membership) {
        throw new PlayerApiError(403, 'room_membership_required', 'This player is not assigned to that room.');
      }
    }

    const ratingBand = body.purpose === 'queue'
      ? await readRankedMatchmakingBand(database, account.uid, body.mode)
      : undefined;
    const payload: RealtimeTicketPayload = {
      v: 1,
      iss: 'eleven-eleven-pages',
      aud: 'eleven-eleven-realtime',
      purpose: body.purpose,
      target: body.purpose === 'queue' ? 'matchmaking' : body.target,
      uid: account.uid,
      displayName: networkDisplayName(account),
      mode: body.mode,
      ...(roomId ? { roomId } : {}),
      ...(body.caseId ? { caseId: body.caseId } : {}),
      ...(body.variant ? { variant: body.variant } : {}),
      ...(ratingBand ? { ratingBand } : {}),
      region: body.region,
      iat: issuedAt,
      exp: expiresAt,
      jti,
    };
    const token = await signRealtimeTicket(requireTicketSecret(env), payload);
    await recordNetworkTicket(database, {
      jti,
      uid: account.uid,
      purpose: body.purpose,
      mode: body.mode,
      issuedAt: new Date(issuedAt * 1_000).toISOString(),
      expiresAt: new Date(expiresAt * 1_000).toISOString(),
    });

    const base = realtimeBaseUrl(env);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = body.purpose === 'queue'
      ? '/v1/queue'
      : body.target === 'party'
        ? `/v1/parties/${encodeURIComponent(roomId!)}`
        : body.target === 'community'
          ? `/v1/channels/${encodeURIComponent(roomId!)}`
          : body.mode === 'coop_breach'
            ? `/v1/rooms/coop/${encodeURIComponent(roomId!)}`
            : `/v1/rooms/chess/${encodeURIComponent(roomId!)}`;
    base.search = '';
    base.hash = '';

    return jsonResponse({
      ticket: token,
      webSocketUrl: base.toString(),
      protocol: 'echo-network-v1',
      expiresAt: new Date(expiresAt * 1_000).toISOString(),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
