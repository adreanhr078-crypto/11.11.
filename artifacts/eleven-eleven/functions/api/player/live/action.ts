import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  PlayerApiError,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import {
  completeDaily,
  completeWeeklyStage,
  parseLiveAction,
  saveDailyDraft,
  saveWeeklyDraft,
  startDaily,
  startWeekly,
  useWeeklyHint,
  useDailyHint,
} from '../_liveChallenges';

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const database = requirePlayerDatabase(env);
    const body = await parseLiveAction(await readJsonBody<unknown>(request, {
      maxBytes: 8 * 1024,
      tooLargeCode: 'live_action_too_large',
      tooLargeMessage: 'Live action payload is too large.',
      invalidCode: 'invalid_live_action',
      invalidMessage: 'Live action is invalid.',
    }));
    switch (body.action) {
      case 'start-daily':
        return jsonResponse({ live: await startDaily(database, account) }, 200, headers);
      case 'save-daily':
        return jsonResponse({ live: await saveDailyDraft(database, account, body.draft) }, 200, headers);
      case 'use-daily-hint':
        return jsonResponse(await useDailyHint(database, account, body.hintIndex), 200, headers);
      case 'complete-daily':
        return jsonResponse({ receipt: await completeDaily(database, account, body.answer) }, 200, headers);
      case 'start-weekly':
        return jsonResponse({ live: await startWeekly(database, account) }, 200, headers);
      case 'save-weekly':
        return jsonResponse({ live: await saveWeeklyDraft(database, account, body.draft) }, 200, headers);
      case 'use-weekly-hint':
        return jsonResponse(await useWeeklyHint(database, account, body.hintIndex), 200, headers);
      case 'complete-weekly-stage':
        return jsonResponse({ receipt: await completeWeeklyStage(database, account, body.stageIndex, body.answer) }, 200, headers);
      default:
        throw new PlayerApiError(400, 'invalid_live_action', 'Live action is invalid.');
    }
  } catch (error) {
    return errorResponse(error, headers);
  }
}
