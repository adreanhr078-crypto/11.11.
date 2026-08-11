import {
  LIVE_BALANCE_VERSION,
  LIVE_CHALLENGE_VERSION,
  LIVE_HINT_COSTS,
  LIVE_REWARD_CONFIG,
  LIVE_RESET_LABEL,
  LIVE_TIMEZONE,
  createLiveTemplateForSlot,
  isLiveAnswerCorrect,
  type LiveTemplate,
} from '../../../src/domain/live-challenges/liveChallengeEngine';
import type {
  LiveChallengePublicDefinition,
  LiveChallengeStatus,
  LiveChallengesSnapshot,
  LiveCompletionReceipt,
} from '../../../src/domain/live-challenges/liveChallengeContracts';
import { ensurePlayerProgressionRow } from './_progressionRepository';
import type { PlayerDatabase, PlayerDatabaseResult } from './_database';
import { PlayerApiError, type FirebaseAccount } from './_shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_MINUTES = 11 * 60 + 11;
const RESET_HOUR = Math.floor(RESET_MINUTES / 60);
const RESET_MINUTE = RESET_MINUTES % 60;
const WEEKLY_STAGE_COUNT = 4;

interface DefinitionRow {
  challenge_id: string;
  challenge_kind: 'daily' | 'weekly';
  period_key: string;
  challenge_version: string;
  mechanic: string;
  public_definition_json: string;
  solution_json: string;
}
interface DailyAttemptRow {
  challenge_id: string;
  period_key: string;
  status: LiveChallengeStatus;
  draft_json: string;
  hints_used: number | string;
  perfect_solve: number | string;
  started_at: string | null;
  completed_at: string | null;
}
interface WeeklyRow {
  week_id: string;
  status: LiveChallengeStatus;
  current_stage: number | string;
  completed_stages: number | string;
  draft_json: string;
  hints_used: number | string;
  current_stage_hints_used?: number | string;
  score: number | string;
  started_at: string | null;
  completed_at: string | null;
}
interface CountRow { total: number | string | null; }

interface LiveSolution {
  answer: string;
  hints: readonly string[];
}

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function dateMs(periodKey: string): number {
  const parsed = Date.parse(`${periodKey}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) throw new Error('Invalid live period key.');
  return parsed;
}

function shiftDate(periodKey: string, days: number): string {
  return isoDate(dateMs(periodKey) + days * DAY_MS);
}

function periodKeyFor(nowMs: number): string {
  // UTC is the server-canonical clock. Client timezone and device time never affect this key.
  const date = new Date(nowMs);
  const resetAt = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    RESET_HOUR,
    RESET_MINUTE,
  );
  return isoDate(nowMs < resetAt ? resetAt - DAY_MS : resetAt);
}

export function liveDailyPeriodKeyFor(nowMs: number): string {
  return periodKeyFor(nowMs);
}

function resetAtFor(periodKey: string): number {
  const day = new Date(dateMs(periodKey));
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), RESET_HOUR, RESET_MINUTE);
}

function weekIdFor(periodKey: string): string {
  const day = dateMs(periodKey);
  const weekday = new Date(day).getUTCDay();
  const daysFromMonday = (weekday + 6) % 7;
  return shiftDate(periodKey, -daysFromMonday);
}

export function liveWeekIdFor(periodKey: string): string {
  return weekIdFor(periodKey);
}

function publicDefinition(
  id: string,
  kind: 'daily' | 'weekly',
  periodKey: string,
  template: LiveTemplate,
  stageIndex?: number,
): LiveChallengePublicDefinition {
  return {
    id,
    kind,
    periodKey,
    version: LIVE_CHALLENGE_VERSION,
    mechanic: template.mechanic,
    title: template.title,
    instructions: template.instructions,
    prompt: template.prompt,
    options: [...template.options],
    ...(stageIndex === undefined ? {} : {
      stageIndex,
      stageCount: WEEKLY_STAGE_COUNT,
    }),
  };
}

function solution(template: LiveTemplate): LiveSolution {
  return { answer: template.answer, hints: [...template.hints] };
}

export function liveDailyTemplateFor(periodKey: string): LiveTemplate {
  const daySlot = Math.floor(dateMs(periodKey) / DAY_MS);
  return createLiveTemplateForSlot(
    `${LIVE_CHALLENGE_VERSION}:daily:${periodKey}`,
    daySlot,
  );
}

export function liveWeeklyTemplatesFor(weekId: string): LiveTemplate[] {
  const weekSlot = Math.floor(dateMs(weekId) / (DAY_MS * 7));
  return Array.from({ length: WEEKLY_STAGE_COUNT }, (_, index) => (
    createLiveTemplateForSlot(
      `${LIVE_CHALLENGE_VERSION}:weekly:${weekId}:${index}`,
      (weekSlot * WEEKLY_STAGE_COUNT) + index,
    )
  ));
}

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function isConflict(error: unknown): boolean {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

async function ensureDefinitions(
  db: PlayerDatabase,
  nowMs: number,
): Promise<{ daily: DefinitionRow; weekly: DefinitionRow; stages: DefinitionRow[]; periodKey: string; weekId: string }> {
  const periodKey = periodKeyFor(nowMs);
  const weekId = weekIdFor(periodKey);
  const dailyTemplate = liveDailyTemplateFor(periodKey);
  const dailyId = `${LIVE_CHALLENGE_VERSION}:daily:${periodKey}`;
  const dailyPublic = publicDefinition(dailyId, 'daily', periodKey, dailyTemplate);
  const weeklyStageTemplates = liveWeeklyTemplatesFor(weekId);
  const weeklyId = `${LIVE_CHALLENGE_VERSION}:weekly:${weekId}`;
  const weeklyPublic: LiveChallengePublicDefinition & { stages: readonly LiveChallengePublicDefinition[] } = {
    id: weeklyId,
    kind: 'weekly',
    periodKey: weekId,
    version: LIVE_CHALLENGE_VERSION,
    mechanic: weeklyStageTemplates[0]!.mechanic,
    title: 'WEEKLY SYSTEM TRIAL',
    instructions: 'أكمل أربع مراحل مستقلة واحفظ تقدمك بين الجلسات.',
    prompt: 'SYSTEM TRIAL // 04 STAGES',
    options: [],
    stageCount: WEEKLY_STAGE_COUNT,
    stages: weeklyStageTemplates.map((template, index) => publicDefinition(
      `${weeklyId}:stage:${index}`,
      'weekly',
      weekId,
      template,
      index,
    )),
  };
  const definitions: Array<{
    id: string; kind: 'daily' | 'weekly'; period: string; mechanic: string;
    publicValue: unknown; solutionValue: unknown;
  }> = [
    { id: dailyId, kind: 'daily', period: periodKey, mechanic: dailyTemplate.mechanic, publicValue: dailyPublic, solutionValue: solution(dailyTemplate) },
    { id: weeklyId, kind: 'weekly', period: weekId, mechanic: weeklyPublic.mechanic, publicValue: weeklyPublic, solutionValue: { stages: weeklyStageTemplates.map(solution) } },
    ...weeklyStageTemplates.map((template, index) => ({
      id: `${weeklyId}:stage:${index}`,
      kind: 'weekly' as const,
      period: weekId,
      mechanic: template.mechanic,
      publicValue: weeklyPublic.stages[index],
      solutionValue: solution(template),
    })),
  ];
  for (const definition of definitions) {
    await db.prepare(`
      INSERT OR IGNORE INTO live_challenge_definitions (
        challenge_id, challenge_kind, period_key, challenge_version,
        mechanic, public_definition_json, solution_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      definition.id,
      definition.kind,
      definition.period,
      LIVE_CHALLENGE_VERSION,
      definition.mechanic,
      JSON.stringify(definition.publicValue),
      JSON.stringify(definition.solutionValue),
      new Date(nowMs).toISOString(),
    ).run();
  }
  const rows = await db.prepare(`
    SELECT challenge_id, challenge_kind, period_key, challenge_version,
           mechanic, public_definition_json, solution_json
    FROM live_challenge_definitions
    WHERE challenge_id = ? OR challenge_id LIKE ?
    ORDER BY challenge_id ASC
  `).bind(dailyId, `${weeklyId}:stage:%`).all<DefinitionRow>();
  const result = rows.results ?? [];
  const daily = result.find((row) => row.challenge_id === dailyId);
  const stages = result
    .filter((row) => row.challenge_id.startsWith(`${weeklyId}:stage:`))
    .sort((left, right) => left.challenge_id.localeCompare(right.challenge_id));
  if (!daily || stages.length !== WEEKLY_STAGE_COUNT) throw new Error('Live definitions were not cached.');
  const weekly: DefinitionRow = {
    challenge_id: weeklyId,
    challenge_kind: 'weekly',
    period_key: weekId,
    challenge_version: LIVE_CHALLENGE_VERSION,
    mechanic: weeklyPublic.mechanic,
    public_definition_json: JSON.stringify(weeklyPublic),
    solution_json: JSON.stringify({ stages: stages.map((row) => parseJson<LiveSolution>(row.solution_json, { answer: '', hints: [] })) }),
  };
  return { daily, weekly, stages, periodKey, weekId };
}

function publicFromRow(row: DefinitionRow): LiveChallengePublicDefinition {
  return parseJson<LiveChallengePublicDefinition>(row.public_definition_json, {
    id: row.challenge_id,
    kind: row.challenge_kind,
    periodKey: row.period_key,
    version: row.challenge_version,
    mechanic: 'signal',
    title: 'LIVE SIGNAL',
    instructions: 'Verified live challenge.',
    prompt: 'SYSTEM',
    options: [],
  });
}

function solutionFromRow(row: DefinitionRow): LiveSolution {
  return parseJson<LiveSolution>(row.solution_json, { answer: '', hints: [] });
}

function statusFromRow(row: DailyAttemptRow | WeeklyRow | null): LiveChallengeStatus {
  return row?.status ?? 'available';
}

function parseDraft(value: unknown): string {
  if (value === undefined) return '{}';
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_live_draft', 'Live challenge progress is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== 'answer')) {
    throw new PlayerApiError(400, 'invalid_live_draft', 'Live challenge progress is invalid.');
  }
  if (input.answer !== undefined && (typeof input.answer !== 'string' || input.answer.length > 80)) {
    throw new PlayerApiError(400, 'invalid_live_draft', 'Live challenge progress is invalid.');
  }
  return JSON.stringify(input);
}

function parseAnswer(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > 80) {
    throw new PlayerApiError(400, 'invalid_live_answer', 'Live answer is invalid.');
  }
  return value.trim();
}

async function ensureDailyAttempt(db: PlayerDatabase, uid: string, definition: DefinitionRow, now: string): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO live_player_daily_attempts (
      user_id, challenge_id, period_key, status, draft_json, updated_at
    ) VALUES (?, ?, ?, 'available', '{}', ?)
  `).bind(uid, definition.challenge_id, definition.period_key, now).run();
}

async function ensureWeeklyProgress(db: PlayerDatabase, uid: string, weekId: string, now: string): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO live_player_weekly_progress (
      user_id, week_id, status, current_stage, completed_stages, draft_json, updated_at
    ) VALUES (?, ?, 'available', 0, 0, '{}', ?)
  `).bind(uid, weekId, now).run();
}

async function rewardLiveEvent(
  db: PlayerDatabase,
  account: FirebaseAccount,
  input: {
    rewardKey: string;
    rewardType: 'daily' | 'weekly' | 'weekly-recovery' | 'weekly-perfect';
    sourceId: string;
    xp: number;
    coins: number;
    perfect: boolean;
  },
): Promise<{ awarded: boolean; xp: number; coins: number }> {
  const now = new Date().toISOString();
  const sourceType = input.rewardType === 'daily' ? 'daily_trial' : 'weekly_trial';
  const result = await db.batch([
    db.prepare(`
      INSERT OR IGNORE INTO live_challenge_reward_events (
        user_id, reward_key, reward_type, source_id, xp_amount,
        coin_amount, perfect_solve, rewarded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(account.uid, input.rewardKey, input.rewardType, input.sourceId, input.xp, input.coins, input.perfect ? 1 : 0, now),
    db.prepare(`
      INSERT OR IGNORE INTO xp_reward_events (
        user_id, reward_key, source_type, source_id, xp_amount, granted_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(account.uid, input.rewardKey, sourceType, input.sourceId, input.xp, now),
    db.prepare(`
      INSERT OR IGNORE INTO player_coin_events (
        user_id, event_key, source_type, source_id, amount, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(account.uid, `${input.rewardKey}:coins`, sourceType, input.sourceId, input.coins, now),
    db.prepare(`
      UPDATE player_progression SET total_xp = (
        SELECT COALESCE(SUM(xp_amount), 0) FROM xp_reward_events WHERE user_id = ?
      ), updated_at = ? WHERE user_id = ?
    `).bind(account.uid, now, account.uid),
  ]);
  const inserted = Number((result[0] as PlayerDatabaseResult | undefined)?.meta?.changes ?? 0) > 0;
  return { awarded: inserted, xp: inserted ? input.xp : 0, coins: inserted ? input.coins : 0 };
}

async function readDailyHistory(db: PlayerDatabase, uid: string): Promise<LiveChallengesSnapshot['dailyHistory']> {
  const rows = await db.prepare(`
    SELECT period_key, status, perfect_solve, completed_at
    FROM live_player_daily_attempts
    WHERE user_id = ?
    ORDER BY period_key DESC
    LIMIT 14
  `).bind(uid).all<DailyAttemptRow>();
  return (rows.results ?? []).map((row) => ({
    periodKey: row.period_key,
    status: row.status,
    perfectSolve: integer(row.perfect_solve) === 1,
    completedAt: row.completed_at,
  }));
}

export async function readLiveSnapshot(
  db: PlayerDatabase,
  account: FirebaseAccount,
  nowMs = Date.now(),
): Promise<LiveChallengesSnapshot> {
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, nowMs);
  const now = new Date(nowMs).toISOString();
  await ensureDailyAttempt(db, account.uid, definitions.daily, now);
  await ensureWeeklyProgress(db, account.uid, definitions.weekId, now);
  const [dailyResult, weeklyResult, recoveryResult, recoveryReward, dailyMastery, weeklyMastery] = await Promise.all([
    db.prepare(`SELECT challenge_id, period_key, status, draft_json, hints_used, perfect_solve, started_at, completed_at FROM live_player_daily_attempts WHERE user_id = ? AND challenge_id = ?`).bind(account.uid, definitions.daily.challenge_id).first<DailyAttemptRow>(),
    db.prepare(`
      SELECT
        progress.week_id,
        progress.status,
        progress.current_stage,
        progress.completed_stages,
        progress.draft_json,
        progress.hints_used,
        progress.score,
        progress.started_at,
        progress.completed_at,
        (
          SELECT COUNT(*)
          FROM live_challenge_hint_events AS hint
          WHERE hint.user_id = progress.user_id
            AND hint.challenge_id = ? || ':stage:' || progress.current_stage
        ) AS current_stage_hints_used
      FROM live_player_weekly_progress AS progress
      WHERE progress.user_id = ? AND progress.week_id = ?
    `).bind(definitions.weekly.challenge_id, account.uid, definitions.weekId).first<WeeklyRow>(),
    db.prepare(`SELECT COUNT(*) AS total FROM live_player_daily_attempts WHERE user_id = ? AND period_key >= ? AND period_key < ? AND status = 'completed'`).bind(account.uid, definitions.weekId, shiftDate(definitions.weekId, 7)).first<CountRow>(),
    db.prepare(`SELECT reward_key FROM live_challenge_reward_events WHERE user_id = ? AND reward_key = ?`).bind(account.uid, `weekly-recovery:${definitions.weekId}:v1`).first<{ reward_key: string }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM live_player_daily_attempts WHERE user_id = ? AND status = 'completed'`).bind(account.uid).first<CountRow>(),
    db.prepare(`SELECT COUNT(*) AS total FROM live_player_weekly_progress WHERE user_id = ? AND status = 'completed'`).bind(account.uid).first<CountRow>(),
  ]);
  const dailyRow = dailyResult;
  const weeklyRow = weeklyResult;
  const dailyPublic = publicFromRow(definitions.daily);
  const weeklyPublic = parseJson<LiveChallengePublicDefinition & { stages: readonly LiveChallengePublicDefinition[] }>(definitions.weekly.public_definition_json, {
    ...publicFromRow(definitions.weekly), stages: [],
  });
  const recoveryDays = integer(recoveryResult?.total);
  return {
    daily: {
      status: statusFromRow(dailyRow),
      challenge: dailyPublic,
      periodKey: definitions.periodKey,
      serverNow: now,
      nextResetAt: new Date(resetAtFor(definitions.periodKey) + DAY_MS).toISOString(),
      hintsUsed: integer(dailyRow?.hints_used),
      perfectSolve: integer(dailyRow?.perfect_solve) === 1,
      completedAt: dailyRow?.completed_at ?? null,
    },
    weekly: {
      status: statusFromRow(weeklyRow),
      weekId: definitions.weekId,
      weekStartsAt: new Date(resetAtFor(definitions.weekId)).toISOString(),
      nextResetAt: new Date(resetAtFor(shiftDate(definitions.weekId, 7))).toISOString(),
      trial: weeklyPublic,
      currentStage: integer(weeklyRow?.current_stage),
      completedStages: integer(weeklyRow?.completed_stages),
      totalStages: WEEKLY_STAGE_COUNT,
      hintsUsed: integer(weeklyRow?.hints_used),
      currentStageHintsUsed: integer(weeklyRow?.current_stage_hints_used),
      score: integer(weeklyRow?.score),
      completedAt: weeklyRow?.completed_at ?? null,
      recoveryCompletedDays: recoveryDays,
      recoveryTargetDays: 5,
      recoveryRewardClaimed: Boolean(recoveryReward),
      perfectWeek: Boolean(weeklyRow?.status === 'completed' && integer(weeklyRow?.hints_used) === 0),
    },
    dailyHistory: await readDailyHistory(db, account.uid),
    timezone: LIVE_TIMEZONE,
    resetLabel: LIVE_RESET_LABEL,
    balanceVersion: LIVE_BALANCE_VERSION,
    mastery: {
      dailySignalsRecovered: integer(dailyMastery?.total),
      weeklyTrialsCompleted: integer(weeklyMastery?.total),
    },
  };
}

export async function startDaily(db: PlayerDatabase, account: FirebaseAccount): Promise<LiveChallengesSnapshot> {
  return readLiveSnapshot(db, account);
}

export async function saveDailyDraft(db: PlayerDatabase, account: FirebaseAccount, draft: unknown): Promise<LiveChallengesSnapshot> {
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureDailyAttempt(db, account.uid, definitions.daily, new Date().toISOString());
  const serialized = parseDraft(draft);
  await db.prepare(`
    UPDATE live_player_daily_attempts SET draft_json = ?, status = CASE WHEN status = 'available' THEN 'in_progress' ELSE status END, started_at = COALESCE(started_at, ?), updated_at = ?
    WHERE user_id = ? AND challenge_id = ? AND status <> 'completed'
  `).bind(serialized, new Date().toISOString(), new Date().toISOString(), account.uid, definitions.daily.challenge_id).run();
  return readLiveSnapshot(db, account);
}

export async function useDailyHint(db: PlayerDatabase, account: FirebaseAccount, hintValue: unknown): Promise<{ alreadyUnlocked: boolean; hint: string; live: LiveChallengesSnapshot }> {
  const hintIndex = typeof hintValue === 'number' ? hintValue : -1;
  if (!Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex > 2) throw new PlayerApiError(400, 'invalid_hint', 'Hint index is invalid.');
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureDailyAttempt(db, account.uid, definitions.daily, new Date().toISOString());
  const attempt = await db.prepare(`SELECT status FROM live_player_daily_attempts WHERE user_id = ? AND challenge_id = ?`).bind(account.uid, definitions.daily.challenge_id).first<Pick<DailyAttemptRow, 'status'>>();
  if (attempt?.status === 'completed') throw new PlayerApiError(409, 'daily_complete', 'The daily signal is already complete.');
  const existing = await db.prepare(`SELECT hint_index FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id = ? AND hint_index = ?`).bind(account.uid, definitions.daily.challenge_id, hintIndex).first<{ hint_index: number }>();
  if (!existing) {
    const priorHints = await db.prepare(`SELECT COUNT(*) AS total FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id = ? AND hint_index < ?`).bind(account.uid, definitions.daily.challenge_id, hintIndex).first<CountRow>();
    if (integer(priorHints?.total) !== hintIndex) throw new PlayerApiError(409, 'hint_sequence_locked', 'Unlock the previous hint first.');
    const now = new Date().toISOString();
    try {
      await db.batch([
        db.prepare(`INSERT OR IGNORE INTO live_challenge_hint_events (user_id, challenge_id, hint_index, coin_cost, used_at) VALUES (?, ?, ?, ?, ?)`).bind(account.uid, definitions.daily.challenge_id, hintIndex, LIVE_HINT_COSTS[hintIndex], now),
        db.prepare(`UPDATE live_player_daily_attempts SET hints_used = (SELECT COUNT(*) FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id = ?), status = CASE WHEN status = 'available' THEN 'in_progress' ELSE status END, started_at = COALESCE(started_at, ?), updated_at = ? WHERE user_id = ? AND challenge_id = ? AND status <> 'completed'`).bind(account.uid, definitions.daily.challenge_id, now, now, account.uid, definitions.daily.challenge_id),
      ]);
    } catch (error) {
      if (error instanceof Error && /insufficient verified coins/i.test(error.message)) throw new PlayerApiError(409, 'insufficient_coins', 'Verified coins are required for this hint.');
      if (error instanceof Error && /previous live hint required/i.test(error.message)) throw new PlayerApiError(409, 'hint_sequence_locked', 'Unlock the previous hint first.');
      if (error instanceof Error && /live challenge already complete/i.test(error.message)) throw new PlayerApiError(409, 'daily_complete', 'The daily signal is already complete.');
      throw error;
    }
  }
  const live = await readLiveSnapshot(db, account);
  const hint = solutionFromRow(definitions.daily).hints[hintIndex];
  if (!hint) throw new Error('Live daily hint definition is missing.');
  return { alreadyUnlocked: Boolean(existing), hint, live };
}

export async function completeDaily(db: PlayerDatabase, account: FirebaseAccount, answerValue: unknown): Promise<LiveCompletionReceipt> {
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureDailyAttempt(db, account.uid, definitions.daily, new Date().toISOString());
  const existing = await db.prepare(`SELECT challenge_id, period_key, status, draft_json, hints_used, perfect_solve, started_at, completed_at FROM live_player_daily_attempts WHERE user_id = ? AND challenge_id = ?`).bind(account.uid, definitions.daily.challenge_id).first<DailyAttemptRow>();
  const answer = parseAnswer(answerValue);
  const expected = solutionFromRow(definitions.daily).answer;
  if (existing?.status !== 'completed' && !isLiveAnswerCorrect(answer, expected)) throw new PlayerApiError(422, 'live_answer_incorrect', 'The signal is not stabilized yet.');
  const perfect = existing?.status === 'completed' ? integer(existing.perfect_solve) === 1 : integer(existing?.hints_used) === 0;
  const xp = LIVE_REWARD_CONFIG.dailyXp + (perfect ? LIVE_REWARD_CONFIG.dailyPerfectXpBonus : 0);
  const coins = LIVE_REWARD_CONFIG.dailyCoins + (perfect ? LIVE_REWARD_CONFIG.dailyPerfectCoinsBonus : 0);
  const now = new Date().toISOString();
  await db.prepare(`UPDATE live_player_daily_attempts SET status = 'completed', perfect_solve = ?, completed_at = COALESCE(completed_at, ?), updated_at = ? WHERE user_id = ? AND challenge_id = ?`).bind(perfect ? 1 : 0, now, now, account.uid, definitions.daily.challenge_id).run();
  const reward = await rewardLiveEvent(db, account, {
    rewardKey: `daily:${definitions.periodKey}:v1`, rewardType: 'daily', sourceId: definitions.daily.challenge_id, xp, coins, perfect,
  });
  await maybeClaimWeeklyRecovery(db, account);
  return {
    kind: 'daily', challengeId: definitions.daily.challenge_id, awarded: reward.awarded, perfectSolve: perfect,
    xpGranted: reward.xp, coinsGranted: reward.coins, live: await readLiveSnapshot(db, account),
  };
}

export async function startWeekly(db: PlayerDatabase, account: FirebaseAccount): Promise<LiveChallengesSnapshot> {
  return readLiveSnapshot(db, account);
}

export async function saveWeeklyDraft(db: PlayerDatabase, account: FirebaseAccount, draft: unknown): Promise<LiveChallengesSnapshot> {
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureWeeklyProgress(db, account.uid, definitions.weekId, new Date().toISOString());
  const serialized = parseDraft(draft);
  const now = new Date().toISOString();
  await db.prepare(`UPDATE live_player_weekly_progress SET draft_json = ?, status = CASE WHEN status = 'available' THEN 'in_progress' ELSE status END, started_at = COALESCE(started_at, ?), updated_at = ? WHERE user_id = ? AND week_id = ? AND status <> 'completed'`).bind(serialized, now, now, account.uid, definitions.weekId).run();
  return readLiveSnapshot(db, account);
}

export async function useWeeklyHint(db: PlayerDatabase, account: FirebaseAccount, hintValue: unknown): Promise<{ alreadyUnlocked: boolean; hint: string; live: LiveChallengesSnapshot }> {
  const hintIndex = typeof hintValue === 'number' ? hintValue : -1;
  if (!Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex > 2) throw new PlayerApiError(400, 'invalid_hint', 'Hint index is invalid.');
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureWeeklyProgress(db, account.uid, definitions.weekId, new Date().toISOString());
  const row = await db.prepare(`SELECT current_stage, status FROM live_player_weekly_progress WHERE user_id = ? AND week_id = ?`).bind(account.uid, definitions.weekId).first<{ current_stage: number | string; status: LiveChallengeStatus }>();
  if (row?.status === 'completed') throw new PlayerApiError(409, 'weekly_complete', 'The weekly trial is already complete.');
  const stage = definitions.stages[integer(row?.current_stage)];
  if (!stage) throw new PlayerApiError(409, 'weekly_stage_locked', 'The weekly stage is not available.');
  const existing = await db.prepare(`SELECT hint_index FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id = ? AND hint_index = ?`).bind(account.uid, stage.challenge_id, hintIndex).first<{ hint_index: number }>();
  if (!existing) {
    const priorHints = await db.prepare(`SELECT COUNT(*) AS total FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id = ? AND hint_index < ?`).bind(account.uid, stage.challenge_id, hintIndex).first<CountRow>();
    if (integer(priorHints?.total) !== hintIndex) throw new PlayerApiError(409, 'hint_sequence_locked', 'Unlock the previous hint first.');
    const now = new Date().toISOString();
    try {
      await db.batch([
        db.prepare(`INSERT OR IGNORE INTO live_challenge_hint_events (user_id, challenge_id, hint_index, coin_cost, used_at) VALUES (?, ?, ?, ?, ?)`).bind(account.uid, stage.challenge_id, hintIndex, LIVE_HINT_COSTS[hintIndex], now),
        db.prepare(`UPDATE live_player_weekly_progress SET hints_used = (SELECT COUNT(*) FROM live_challenge_hint_events WHERE user_id = ? AND challenge_id LIKE ?), status = CASE WHEN status = 'available' THEN 'in_progress' ELSE status END, started_at = COALESCE(started_at, ?), updated_at = ? WHERE user_id = ? AND week_id = ?`).bind(account.uid, `${definitions.weekly.challenge_id}:stage:%`, now, now, account.uid, definitions.weekId),
      ]);
    } catch (error) {
      if (error instanceof Error && /insufficient verified coins/i.test(error.message)) throw new PlayerApiError(409, 'insufficient_coins', 'Verified coins are required for this hint.');
      if (error instanceof Error && /previous live hint required/i.test(error.message)) throw new PlayerApiError(409, 'hint_sequence_locked', 'Unlock the previous hint first.');
      if (error instanceof Error && /live challenge already complete/i.test(error.message)) throw new PlayerApiError(409, 'weekly_complete', 'The weekly trial is already complete.');
      throw error;
    }
  }
  const hint = solutionFromRow(stage).hints[hintIndex];
  if (!hint) throw new Error('Live weekly hint definition is missing.');
  return {
    alreadyUnlocked: Boolean(existing),
    hint,
    live: await readLiveSnapshot(db, account),
  };
}

export async function completeWeeklyStage(db: PlayerDatabase, account: FirebaseAccount, stageValue: unknown, answerValue: unknown): Promise<LiveCompletionReceipt> {
  if (typeof stageValue !== 'number' || !Number.isInteger(stageValue) || stageValue < 0 || stageValue >= WEEKLY_STAGE_COUNT) throw new PlayerApiError(400, 'invalid_weekly_stage', 'Weekly stage is invalid.');
  await ensurePlayerProgressionRow(db, account);
  const definitions = await ensureDefinitions(db, Date.now());
  await ensureWeeklyProgress(db, account.uid, definitions.weekId, new Date().toISOString());
  const row = await db.prepare(`SELECT week_id, status, current_stage, completed_stages, draft_json, hints_used, score, started_at, completed_at FROM live_player_weekly_progress WHERE user_id = ? AND week_id = ?`).bind(account.uid, definitions.weekId).first<WeeklyRow>();
  if (row?.status === 'completed') return { kind: 'weekly', challengeId: definitions.weekly.challenge_id, awarded: false, perfectSolve: integer(row.hints_used) === 0, xpGranted: 0, coinsGranted: 0, live: await readLiveSnapshot(db, account) };
  if (stageValue !== integer(row?.current_stage)) throw new PlayerApiError(409, 'weekly_stage_locked', 'Complete the current weekly stage first.');
  const stage = definitions.stages[stageValue]!;
  if (!isLiveAnswerCorrect(parseAnswer(answerValue), solutionFromRow(stage).answer)) throw new PlayerApiError(422, 'live_answer_incorrect', 'The trial stage is not stabilized yet.');
  const nextStage = stageValue + 1;
  const completed = nextStage >= WEEKLY_STAGE_COUNT;
  const now = new Date().toISOString();
  const update = await db.prepare(`UPDATE live_player_weekly_progress SET current_stage = ?, completed_stages = ?, status = ?, score = score + ?, completed_at = CASE WHEN ? = 1 THEN COALESCE(completed_at, ?) ELSE completed_at END, started_at = COALESCE(started_at, ?), updated_at = ? WHERE user_id = ? AND week_id = ? AND current_stage = ? AND status <> 'completed'`).bind(nextStage, nextStage, completed ? 'completed' : 'in_progress', 25, completed ? 1 : 0, now, now, now, account.uid, definitions.weekId, stageValue).run();
  if (Number(update.meta?.changes ?? 0) < 1) {
    const latest = await db.prepare(`SELECT status, hints_used FROM live_player_weekly_progress WHERE user_id = ? AND week_id = ?`).bind(account.uid, definitions.weekId).first<Pick<WeeklyRow, 'status' | 'hints_used'>>();
    return { kind: 'weekly', challengeId: definitions.weekly.challenge_id, awarded: false, perfectSolve: integer(latest?.hints_used) === 0, xpGranted: 0, coinsGranted: 0, live: await readLiveSnapshot(db, account) };
  }
  const perfect = !integer(row?.hints_used);
  const reward = completed ? await rewardLiveEvent(db, account, {
    rewardKey: `weekly:${definitions.weekId}:v1`, rewardType: 'weekly', sourceId: definitions.weekly.challenge_id, xp: LIVE_REWARD_CONFIG.weeklyTrialXp, coins: LIVE_REWARD_CONFIG.weeklyTrialCoins + (perfect ? LIVE_REWARD_CONFIG.weeklyPerfectBonusCoins : 0), perfect,
  }) : { awarded: false, xp: 0, coins: 0 };
  return { kind: 'weekly', challengeId: definitions.weekly.challenge_id, awarded: reward.awarded, perfectSolve: perfect, xpGranted: reward.xp, coinsGranted: reward.coins, live: await readLiveSnapshot(db, account) };
}

export async function maybeClaimWeeklyRecovery(db: PlayerDatabase, account: FirebaseAccount): Promise<void> {
  const definitions = await ensureDefinitions(db, Date.now());
  const count = await db.prepare(`SELECT COUNT(*) AS total FROM live_player_daily_attempts WHERE user_id = ? AND period_key >= ? AND period_key < ? AND status = 'completed'`).bind(account.uid, definitions.weekId, shiftDate(definitions.weekId, 7)).first<CountRow>();
  if (integer(count?.total) < 5) return;
  await rewardLiveEvent(db, account, {
    rewardKey: `weekly-recovery:${definitions.weekId}:v1`, rewardType: 'weekly-recovery', sourceId: definitions.weekId, xp: LIVE_REWARD_CONFIG.weeklyRecoveryXp, coins: LIVE_REWARD_CONFIG.weeklyRecoveryCoins, perfect: false,
  });
  if (integer(count?.total) === 7) {
    await rewardLiveEvent(db, account, {
      rewardKey: `weekly-perfect:${definitions.weekId}:v1`, rewardType: 'weekly-perfect', sourceId: definitions.weekId, xp: 1, coins: LIVE_REWARD_CONFIG.weeklyPerfectBonusCoins, perfect: true,
    });
  }
}

export async function parseLiveAction(value: unknown): Promise<{
  action: string; draft?: unknown; answer?: unknown; stageIndex?: unknown; hintIndex?: unknown;
}> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new PlayerApiError(400, 'invalid_live_action', 'Live action is invalid.');
  const input = value as Record<string, unknown>;
  if (typeof input.action !== 'string' || !/^[a-z-]{3,40}$/.test(input.action)) throw new PlayerApiError(400, 'invalid_live_action', 'Live action is invalid.');
  const knownActions = new Set([
    'start-daily',
    'save-daily',
    'use-daily-hint',
    'complete-daily',
    'start-weekly',
    'save-weekly',
    'use-weekly-hint',
    'complete-weekly-stage',
  ]);
  if (!knownActions.has(input.action)) throw new PlayerApiError(400, 'invalid_live_action', 'Live action is invalid.');
  if (
    (input.action === 'use-daily-hint' || input.action === 'use-weekly-hint')
    && (
      typeof input.hintIndex !== 'number'
      || !Number.isInteger(input.hintIndex)
      || input.hintIndex < 0
      || input.hintIndex > 2
    )
  ) {
    throw new PlayerApiError(400, 'invalid_hint', 'Hint index is invalid.');
  }
  const allowed = new Set(['action', 'draft', 'answer', 'stageIndex', 'hintIndex']);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new PlayerApiError(400, 'client_reward_forbidden', 'Live rewards are assigned only by the server.');
  return { action: input.action, draft: input.draft, answer: input.answer, stageIndex: input.stageIndex, hintIndex: input.hintIndex };
}
