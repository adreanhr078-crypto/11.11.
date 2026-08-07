import { useGameStore } from '../../stores/gameStore';
import {
  GAME_SAVE_VERSION,
  mergeGameState,
  partializeGameState,
  type PersistedGameState,
} from '../../infrastructure/persistence/gamePersistence';
import {
  CloudSaveApiError,
  bootstrapCloudPlayer,
  fetchCloudSave,
  writeCloudSave,
  type CloudSaveSnapshot,
} from '../../infrastructure/cloud/cloudSaveApi';
import {
  resetCloudSaveState,
  updateCloudSaveState,
} from './cloudSaveStore';

const SYNC_METADATA_KEY = '11-11-cloud-sync-v1';
const LOCAL_BACKUP_PREFIX = '11-11-pre-cloud-backup-v1';
const SAVE_DEBOUNCE_MS = 1_800;

interface PlayerSyncMetadata {
  revision: number;
  fingerprint: string;
  updatedAt: string | null;
}

interface SyncMetadataState {
  byUid: Record<string, PlayerSyncMetadata>;
}

let activeUid: string | null = null;
let activeRevision = 0;
let activeFingerprint = '';
let generation = 0;
let applyingCloudSave = false;
let conflictActive = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeGame: (() => void) | null = null;

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readMetadata(): SyncMetadataState {
  if (!storageAvailable()) return { byUid: {} };
  try {
    const raw = window.localStorage.getItem(SYNC_METADATA_KEY);
    if (!raw) return { byUid: {} };
    const parsed = JSON.parse(raw) as Partial<SyncMetadataState>;
    return parsed.byUid && typeof parsed.byUid === 'object'
      ? { byUid: parsed.byUid }
      : { byUid: {} };
  } catch {
    return { byUid: {} };
  }
}

function writePlayerMetadata(
  uid: string,
  metadata: PlayerSyncMetadata,
): void {
  if (!storageAvailable()) return;
  const current = readMetadata();
  current.byUid[uid] = metadata;
  window.localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(current));
}

function backupLocalSave(uid: string, payload: PersistedGameState): void {
  if (!storageAvailable()) return;
  const key = `${LOCAL_BACKUP_PREFIX}:${uid}`;
  if (window.localStorage.getItem(key)) return;
  window.localStorage.setItem(key, JSON.stringify({
    savedAt: new Date().toISOString(),
    saveVersion: GAME_SAVE_VERSION,
    payload,
  }));
}

function hashText(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

function snapshotLocalSave(): {
  payload: PersistedGameState;
  fingerprint: string;
} {
  const payload = partializeGameState(useGameStore.getState());
  return {
    payload,
    fingerprint: hashText(JSON.stringify(payload)),
  };
}

function friendlySyncError(error: unknown): string {
  if (error instanceof CloudSaveApiError) {
    if (error.code === 'server_not_configured') {
      return 'السيرفر غير مربوط بإعدادات Firebase بعد.';
    }
    if (error.code === 'invalid_token' || error.code === 'unauthorized') {
      return 'انتهت جلسة الحساب. سجّل الدخول من جديد.';
    }
    if (error.code === 'database_read_failed') {
      return 'تعذر تحميل الحفظ السحابي من Firestore.';
    }
    if (error.code === 'database_write_failed') {
      return 'تعذر رفع التقدم إلى Firestore.';
    }
    if (error.code === 'save_too_large') {
      return 'حجم ملف الحفظ تجاوز الحد المسموح.';
    }
  }
  return 'تعذر الاتصال بخدمة الحفظ السحابي.';
}

function setSynced(
  uid: string,
  revision: number,
  fingerprint: string,
  updatedAt: string | null,
): void {
  activeRevision = revision;
  activeFingerprint = fingerprint;
  conflictActive = false;
  writePlayerMetadata(uid, { revision, fingerprint, updatedAt });
  updateCloudSaveState({
    status: 'synced',
    revision,
    lastSyncedAt: updatedAt ?? new Date().toISOString(),
    message: null,
  });
}

function applyCloudSnapshot(uid: string, cloud: CloudSaveSnapshot): void {
  const currentState = useGameStore.getState();
  const mergedState = mergeGameState(cloud.payload, currentState);
  const mergedPayload = partializeGameState(mergedState);
  const fingerprint = hashText(JSON.stringify(mergedPayload));

  applyingCloudSave = true;
  setSynced(uid, cloud.revision, fingerprint, cloud.updatedAt);
  useGameStore.setState(mergedState, true);
  queueMicrotask(() => {
    applyingCloudSave = false;
  });
}

async function uploadSnapshot(
  uid: string,
  payload: PersistedGameState,
  fingerprint: string,
  baseRevision: number,
): Promise<void> {
  updateCloudSaveState({ status: 'syncing', message: null });
  try {
    const result = await writeCloudSave({
      saveVersion: GAME_SAVE_VERSION,
      baseRevision,
      payload,
    });
    if (uid !== activeUid) return;
    setSynced(
      uid,
      result.save.revision,
      fingerprint,
      result.save.updatedAt,
    );

    const current = snapshotLocalSave();
    if (current.fingerprint !== fingerprint) scheduleUpload();
  } catch (error) {
    if (uid !== activeUid) return;
    if (error instanceof CloudSaveApiError && error.code === 'save_conflict') {
      conflictActive = true;
      updateCloudSaveState({
        status: 'conflict',
        revision: error.currentRevision ?? activeRevision,
        lastSyncedAt: error.updatedAt,
        message: 'يوجد تقدم أحدث من جهاز آخر. اختر النسخة التي تريد الاحتفاظ بها.',
      });
      return;
    }
    updateCloudSaveState({
      status: 'error',
      message: friendlySyncError(error),
    });
  }
}

function scheduleUpload(): void {
  if (!activeUid || applyingCloudSave || conflictActive) return;
  const current = snapshotLocalSave();
  if (current.fingerprint === activeFingerprint) return;

  updateCloudSaveState({ status: 'pending', message: null });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!activeUid || conflictActive) return;
    const pending = snapshotLocalSave();
    if (pending.fingerprint === activeFingerprint) return;
    void uploadSnapshot(
      activeUid,
      pending.payload,
      pending.fingerprint,
      activeRevision,
    );
  }, SAVE_DEBOUNCE_MS);
}

function beginWatchingGame(): void {
  unsubscribeGame?.();
  unsubscribeGame = useGameStore.subscribe(() => scheduleUpload());
}

export function stopCloudSaveSync(): void {
  generation += 1;
  activeUid = null;
  activeRevision = 0;
  activeFingerprint = '';
  applyingCloudSave = false;
  conflictActive = false;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  unsubscribeGame?.();
  unsubscribeGame = null;
  resetCloudSaveState();
}

export async function startCloudSaveSync(uid: string): Promise<void> {
  stopCloudSaveSync();
  activeUid = uid;
  const requestGeneration = generation;
  updateCloudSaveState({ status: 'connecting', message: null });

  try {
    const local = snapshotLocalSave();
    const bootstrap = await bootstrapCloudPlayer();
    if (requestGeneration !== generation || activeUid !== uid) return;

    const savedMetadata = readMetadata().byUid[uid];
    if (!bootstrap.save) {
      await uploadSnapshot(uid, local.payload, local.fingerprint, 0);
    } else if (
      savedMetadata?.revision === bootstrap.save.revision
      && savedMetadata.fingerprint === local.fingerprint
    ) {
      setSynced(
        uid,
        bootstrap.save.revision,
        local.fingerprint,
        bootstrap.save.updatedAt,
      );
    } else if (savedMetadata?.revision === bootstrap.save.revision) {
      activeRevision = bootstrap.save.revision;
      activeFingerprint = savedMetadata.fingerprint;
      await uploadSnapshot(
        uid,
        local.payload,
        local.fingerprint,
        bootstrap.save.revision,
      );
    } else {
      backupLocalSave(uid, local.payload);
      applyCloudSnapshot(uid, bootstrap.save);
    }

    if (requestGeneration === generation && activeUid === uid) {
      beginWatchingGame();
    }
  } catch (error) {
    if (requestGeneration !== generation || activeUid !== uid) return;
    updateCloudSaveState({
      status: 'error',
      message: friendlySyncError(error),
    });
  }
}

export async function retryCloudSaveSync(): Promise<void> {
  if (!activeUid) return;
  await startCloudSaveSync(activeUid);
}

export async function resolveCloudConflictWithCloud(): Promise<void> {
  if (!activeUid) return;
  const uid = activeUid;
  updateCloudSaveState({ status: 'connecting', message: null });
  try {
    const response = await fetchCloudSave();
    if (uid !== activeUid) return;
    if (!response.save) {
      const local = snapshotLocalSave();
      await uploadSnapshot(uid, local.payload, local.fingerprint, 0);
      return;
    }
    backupLocalSave(uid, snapshotLocalSave().payload);
    applyCloudSnapshot(uid, response.save);
    beginWatchingGame();
  } catch (error) {
    if (uid !== activeUid) return;
    updateCloudSaveState({
      status: 'error',
      message: friendlySyncError(error),
    });
  }
}

export async function resolveCloudConflictWithLocal(): Promise<void> {
  if (!activeUid) return;
  const uid = activeUid;
  updateCloudSaveState({ status: 'connecting', message: null });
  try {
    const response = await fetchCloudSave();
    if (uid !== activeUid) return;
    const local = snapshotLocalSave();
    conflictActive = false;
    await uploadSnapshot(
      uid,
      local.payload,
      local.fingerprint,
      response.save?.revision ?? 0,
    );
    beginWatchingGame();
  } catch (error) {
    if (uid !== activeUid) return;
    updateCloudSaveState({
      status: 'error',
      message: friendlySyncError(error),
    });
  }
}
