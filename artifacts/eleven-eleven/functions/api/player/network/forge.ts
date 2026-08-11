import { z } from 'zod';
import { moderateCommunityText } from '../../../../src/domain/echo-network/communitySafety';
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
import { ensureNetworkPlayer, readNetworkEligibility } from '../_network';

const submissionSchema = z.object({
  locale: z.enum(['ar', 'en']),
  title: z.string().trim().min(3).max(80),
  mechanic: z.enum(['sequence', 'cipher', 'wiring', 'evidence', 'pattern']),
  prompt: z.string().trim().min(12).max(500),
  options: z.array(z.string().trim().min(1).max(80)).min(2).max(8),
  answerIndex: z.number().int().nonnegative(),
  canonAssetId: z.string().trim().max(96).nullable().default(null),
});

async function fingerprint(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function assertSafeText(value: string): string {
  const result = moderateCommunityText(value);
  if (!result.allowed) {
    throw new PlayerApiError(400, `unsafe_${result.reason}`, 'Submission text did not pass safety checks.');
  }
  return result.sanitized;
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const db = requirePlayerDatabase(env);
    await ensureNetworkPlayer(db, account);
    const rows = await db.prepare(`
      SELECT submission_id, definition_json, status, created_at, updated_at
      FROM puzzle_forge_submissions
      WHERE author_uid = ? ORDER BY created_at DESC LIMIT 20
    `).bind(account.uid).all<{
      submission_id: string;
      definition_json: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>();
    return jsonResponse({ submissions: (rows.results ?? []).map((row) => ({
      id: row.submission_id,
      definition: JSON.parse(row.definition_json) as unknown,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = submissionSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: 12_000,
      tooLargeCode: 'forge_submission_too_large',
      tooLargeMessage: 'Puzzle Forge submission is too large.',
      invalidMessage: 'Puzzle Forge submission is invalid.',
    }));
    if (!parsed.success || parsed.data.answerIndex >= parsed.data.options.length) {
      throw new PlayerApiError(400, 'invalid_forge_submission', 'Puzzle Forge submission is invalid.');
    }
    const db = requirePlayerDatabase(env);
    await ensureNetworkPlayer(db, account);
    const eligibility = await readNetworkEligibility(db, account.uid);
    if (!eligibility.communityRulesAccepted || !eligibility.ageGateConfirmed) {
      throw new PlayerApiError(403, 'community_rules_required', 'Accept the community rules first.');
    }
    const safe = {
      ...parsed.data,
      title: assertSafeText(parsed.data.title),
      prompt: assertSafeText(parsed.data.prompt),
      options: parsed.data.options.map(assertSafeText),
    };
    const normalizedOptions = safe.options.map((option) => option.toLocaleLowerCase(safe.locale));
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      throw new PlayerApiError(400, 'duplicate_options', 'Puzzle options must be unique.');
    }
    const solutionFingerprint = await fingerprint({
      mechanic: safe.mechanic,
      prompt: safe.prompt.toLocaleLowerCase(safe.locale),
      options: normalizedOptions,
      answer: normalizedOptions[safe.answerIndex],
      canonAssetId: safe.canonAssetId,
    });
    const duplicate = await db.prepare(`
      SELECT submission_id FROM puzzle_forge_submissions
      WHERE solution_fingerprint = ? AND status <> 'rejected' LIMIT 1
    `).bind(solutionFingerprint).first<{ submission_id: string }>();
    if (duplicate) {
      throw new PlayerApiError(409, 'duplicate_puzzle', 'This puzzle fingerprint already exists.');
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO puzzle_forge_submissions (
        submission_id, author_uid, definition_json, solution_fingerprint,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).bind(id, account.uid, JSON.stringify(safe), solutionFingerprint, now, now).run();
    return jsonResponse({
      submission: { id, status: 'pending', createdAt: now },
      published: false,
      rewardGranted: false,
    }, 201, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
