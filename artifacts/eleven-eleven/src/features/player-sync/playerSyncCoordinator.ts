import {
  AuthSessionError,
  getCurrentAuthSession,
} from '../auth/authService';
import {
  usePlayerProgressionStore,
} from '../player-progression/playerProgressionStore';
import {
  fetchAuthoritativeStoryState,
  fetchPlayerProfile,
  PlayerProgressionApiError,
} from '../../infrastructure/player-progression/playerProgressionApi';
import {
  startCloudSaveSync,
  stopCloudSaveSync,
} from '../cloud-save/cloudSaveCoordinator';
import { useCloudSaveStore } from '../cloud-save/cloudSaveStore';
import { useCollectionStore } from '../collection/collectionStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useLiveChallengeStore } from '../live-challenges/liveChallengeStore';
import { useGameStore } from '../../stores/gameStore';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';
import {
  updatePlayerSyncState,
  resetPlayerSyncState,
  usePlayerSyncStore,
  type PlayerSyncFailure,
  type PlayerSyncStage,
} from './playerSyncStore';
import {
  INITIAL_PLAYER_SYNC_MACHINE_STATE,
  transitionPlayerSyncMachine,
} from './playerSyncMachine';
import { createSingleFlight } from './singleFlight';
import { CloudSaveApiError } from '../../infrastructure/cloud/cloudSaveApi';

export interface PlayerSyncResult {
  phase: 'ready' | 'degraded' | 'error' | 'cancelled';
  uid: string;
}

class PlayerSyncRequiredError extends Error {
  constructor(readonly failure: PlayerSyncFailure) {
    super(failure.message);
    this.name = 'PlayerSyncRequiredError';
  }
}

let activeUid: string | null = null;
const playerFlight = createSingleFlight<string, PlayerSyncResult>();

function isCurrent(uid: string, runGeneration: number): boolean {
  return activeUid === uid && playerFlight.isCurrent(uid, runGeneration);
}

function elapsed(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function playerFacingMessage(error: unknown): string {
  if (error instanceof AuthSessionError) {
    if (error.code === 'no_authenticated_user' || error.code === 'uid_changed') {
      return 'انتهت جلسة الحساب. سجّل الدخول من جديد.';
    }
    if (error.code === 'auth_timeout' || error.code === 'token_timeout') {
      return 'تأخر التحقق من جلسة الحساب. أعد المحاولة.';
    }
  }
  if (error instanceof PlayerProgressionApiError) {
    if (error.status === 401 || error.status === 409) {
      return 'انتهت جلسة الحساب أو تغيّرت. سجّل الدخول من جديد.';
    }
    if (error.status === 504 || error.code === 'network_failure') {
      return 'تعذر الوصول إلى خدمة اللاعب. تحقق من الاتصال وأعد المحاولة.';
    }
  }
  if (error instanceof CloudSaveApiError && error.status === 504) {
    return 'تأخر الاتصال بالحفظ السحابي. أعد المحاولة.';
  }
  return 'تعذر مزامنة بيانات اللاعب. أعد المحاولة.';
}

function failureFrom(
  error: unknown,
  stage: PlayerSyncStage,
  startedAt: number,
): PlayerSyncFailure {
  if (error instanceof PlayerSyncRequiredError) {
    return error.failure;
  }
  if (error instanceof PlayerProgressionApiError) {
    return {
      stage,
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
      elapsedMs: elapsed(startedAt),
    };
  }
  if (error instanceof CloudSaveApiError) {
    return {
      stage,
      endpoint: '/bootstrap',
      status: error.status,
      code: error.code,
      message: error.message,
      elapsedMs: elapsed(startedAt),
    };
  }
  if (error instanceof AuthSessionError) {
    return {
      stage,
      endpoint: null,
      status: error.code.includes('timeout') ? 504 : 401,
      code: error.code,
      message: error.message,
      elapsedMs: elapsed(startedAt),
    };
  }
  return {
    stage,
    endpoint: null,
    status: null,
    code: 'bootstrap_failed',
    message: error instanceof Error ? error.message : 'Player bootstrap failed.',
    elapsedMs: elapsed(startedAt),
  };
}

function diagnostic(stage: PlayerSyncStage, details: Record<string, unknown> = {}): void {
  if (import.meta.env.DEV) {
    console.debug('[player-sync]', { stage, ...details });
  }
}

function setStage(
  uid: string,
  attempt: number,
  phase: 'auth-wait' | 'syncing',
  stage: PlayerSyncStage,
  startedAt: number,
): void {
  updatePlayerSyncState({
    phase,
    stage,
    uid,
    attempt,
    startedAt,
    completedAt: null,
    error: null,
  });
  diagnostic(stage, { uid, elapsedMs: elapsed(startedAt) });
}

function optionalFailure(
  stage: PlayerSyncStage,
  endpoint: string,
  code: string,
  message: string,
  startedAt: number,
): PlayerSyncFailure {
  return {
    stage,
    endpoint,
    status: null,
    code,
    message,
    elapsedMs: elapsed(startedAt),
  };
}

function resetUserScopedStores(): void {
  usePlayerProgressionStore.getState().actions.reset();
  useCollectionStore.getState().actions.reset();
  useStoryPuzzleStore.getState().actions.reset();
  useLiveChallengeStore.getState().actions.reset();
  stopCloudSaveSync();
}

async function runPlayerSync(
  uid: string,
  runGeneration: number,
  attempt: number,
): Promise<PlayerSyncResult> {
  const startedAt = Date.now();
  try {
    setStage(uid, attempt, 'auth-wait', 'AUTH_RESOLVING', startedAt);
    const session = await getCurrentAuthSession(uid);
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };

    setStage(uid, attempt, 'auth-wait', 'AUTH_READY', startedAt);
    setStage(uid, attempt, 'syncing', 'TOKEN_REQUEST', startedAt);
    // The session call above is the token gate. Keep the explicit stages in
    // the state machine so a stalled token acquisition is diagnosable.
    setStage(uid, attempt, 'syncing', 'TOKEN_READY', startedAt);
    diagnostic('TOKEN_READY', { uid, tokenPresent: Boolean(session.token) });

    setStage(uid, attempt, 'syncing', 'PLAYER_BOOTSTRAP_STARTED', startedAt);
    setStage(uid, attempt, 'syncing', 'PROFILE_REQUEST', startedAt);
    usePlayerProgressionStore.setState({
      profileStatus: 'loading',
      profileError: null,
    });
    const profile = await fetchPlayerProfile(uid);
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };

    usePlayerProgressionStore.getState().actions.hydrateProfile(profile);
    setStage(uid, attempt, 'syncing', 'PROFILE_READY', startedAt);
    setStage(uid, attempt, 'syncing', 'PROGRESSION_REQUEST', startedAt);
    usePlayerProgressionStore.setState({
      storyStatus: 'loading',
      storyError: null,
    });
    const storyState = await fetchAuthoritativeStoryState(uid);
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };

    setStage(uid, attempt, 'syncing', 'PROGRESSION_READY', startedAt);
    usePlayerProgressionStore.getState().actions.hydrateStoryState(storyState);
    useGameStore.getState().actions.syncAuthoritativeStoryState(storyState);
    setStage(uid, attempt, 'syncing', 'SAVE_REQUEST', startedAt);
    const saveResult = await startCloudSaveSync(uid, session.token);
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };

    const optionalFailures: PlayerSyncFailure[] = [];
    if (saveResult === 'error') {
      const message = useCloudSaveStore.getState().message
        ?? 'Cloud save bootstrap failed.';
      throw new PlayerSyncRequiredError({
        stage: 'SAVE_REQUEST',
        endpoint: '/bootstrap',
        status: null,
        code: 'cloud_save_failed',
        message,
        elapsedMs: elapsed(startedAt),
      });
    } else {
      setStage(uid, attempt, 'syncing', 'SAVE_READY', startedAt);
    }

    recordEchoPresenceActivity({ kind: 'login-session-start', sourceId: uid });
    setStage(uid, attempt, 'syncing', 'OPTIONAL_REQUESTS', startedAt);
    await Promise.allSettled([
      usePlayerProgressionStore.getState().actions.loadLeaderboard(true, uid),
      useCollectionStore.getState().actions.load(true, uid),
      useStoryPuzzleStore.getState().actions.load(true, uid),
    ]);
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };

    const progression = usePlayerProgressionStore.getState();
    if (progression.status === 'error') {
      optionalFailures.push(optionalFailure(
        'OPTIONAL_REQUESTS',
        '/leaderboard',
        'leaderboard_failed',
        progression.error ?? 'Leaderboard bootstrap failed.',
        startedAt,
      ));
    }
    const collection = useCollectionStore.getState();
    if (collection.status === 'error') {
      optionalFailures.push(optionalFailure(
        'OPTIONAL_REQUESTS',
        '/collection',
        'collection_failed',
        collection.error ?? 'Collection bootstrap failed.',
        startedAt,
      ));
    }
    const puzzles = useStoryPuzzleStore.getState();
    if (puzzles.status === 'error') {
      optionalFailures.push(optionalFailure(
        'OPTIONAL_REQUESTS',
        '/puzzles',
        'puzzle_state_failed',
        puzzles.error ?? 'Puzzle state bootstrap failed.',
        startedAt,
      ));
    }

    const terminal = transitionPlayerSyncMachine(
      INITIAL_PLAYER_SYNC_MACHINE_STATE,
      { type: 'complete', optionalFailures },
    );
    const phase = terminal.phase as 'ready' | 'degraded';
    const stage = terminal.stage;
    updatePlayerSyncState({
      phase,
      stage,
      uid,
      attempt,
      completedAt: Date.now(),
      error: null,
      optionalFailures,
    });
    diagnostic(stage, {
      uid,
      elapsedMs: elapsed(startedAt),
      optionalFailureCount: optionalFailures.length,
    });
    return { phase, uid };
  } catch (error) {
    if (!isCurrent(uid, runGeneration)) return { phase: 'cancelled', uid };
    const stage = usePlayerSyncStore.getState().stage;
    const failure = failureFrom(error, stage, startedAt);
    const message = playerFacingMessage(error);
    if (stage === 'PROFILE_REQUEST' || stage === 'PROFILE_READY') {
      usePlayerProgressionStore.getState().actions.failProfile(message);
    } else if (stage === 'PROGRESSION_REQUEST' || stage === 'PROGRESSION_READY') {
      usePlayerProgressionStore.getState().actions.failStoryState(message);
    }
    const terminal = transitionPlayerSyncMachine(
      INITIAL_PLAYER_SYNC_MACHINE_STATE,
      { type: 'failure', failure },
    );
    updatePlayerSyncState({
      phase: terminal.phase,
      stage: terminal.stage,
      uid,
      completedAt: Date.now(),
      error: failure,
    });
    diagnostic('PLAYER_ERROR', {
      uid,
      stage: failure.stage,
      endpoint: failure.endpoint,
      status: failure.status,
      code: failure.code,
      elapsedMs: failure.elapsedMs,
    });
    return { phase: 'error', uid };
  }
}

export function startPlayerSync(uid: string): Promise<PlayerSyncResult> {
  if (activeUid !== uid) {
    playerFlight.invalidate();
    activeUid = null;
    resetUserScopedStores();
    resetPlayerSyncState();
  }

  activeUid = uid;
  const attempt = usePlayerSyncStore.getState().attempt + 1;
  return playerFlight.run(
    uid,
    (runGeneration) => runPlayerSync(uid, runGeneration, attempt),
  );
}

export function stopPlayerSync(): void {
  playerFlight.invalidate();
  activeUid = null;
  resetUserScopedStores();
  resetPlayerSyncState();
}

export function retryPlayerSync(): Promise<PlayerSyncResult> {
  if (!activeUid) {
    return Promise.resolve({ phase: 'cancelled', uid: '' });
  }
  return startPlayerSync(activeUid);
}
