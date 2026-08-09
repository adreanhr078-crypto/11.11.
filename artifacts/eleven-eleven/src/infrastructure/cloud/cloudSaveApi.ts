import { getCurrentAuthToken } from '../../features/auth/authService';
import type { PersistedGameState } from '../persistence/gamePersistence';
import { playerApiRoot } from '../player-api/apiRoot';

export interface CloudPlayerProfile {
  uid: string;
  subjectId?: string;
  username?: string;
  bio?: string;
  avatarId?: 'echo' | 'silver_signal' | 'red_rift';
  isAnonymous?: boolean;
  featuredAchievementIds?: string[];
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: string;
  createdAt: string;
}

export interface CloudSaveSnapshot {
  saveVersion: number;
  revision: number;
  updatedAt: string | null;
  payload: PersistedGameState;
}

export interface CloudPlayerBootstrap {
  profile: CloudPlayerProfile;
  save: CloudSaveSnapshot | null;
}

interface CloudSaveWriteResult {
  save: Omit<CloudSaveSnapshot, 'payload'>;
}

interface ApiErrorBody {
  error?: unknown;
  code?: unknown;
  currentRevision?: unknown;
  updatedAt?: unknown;
}

export class CloudSaveApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly currentRevision: number | null = null,
    readonly updatedAt: string | null = null,
  ) {
    super(message);
  }
}

function apiRoot(): string {
  const configured = import.meta.env.VITE_PLAYER_API_URL?.trim();
  return playerApiRoot(configured);
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: ApiErrorBody & Partial<T> = {};
  try {
    payload = await response.json() as ApiErrorBody & Partial<T>;
  } catch {
    // A structured fallback is produced below.
  }
  if (!response.ok) {
    throw new CloudSaveApiError(
      response.status,
      typeof payload.code === 'string' ? payload.code : 'request_failed',
      typeof payload.error === 'string'
        ? payload.error
        : 'Cloud save request failed.',
      typeof payload.currentRevision === 'number'
        ? payload.currentRevision
        : null,
      typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
    );
  }
  return payload as T;
}

async function authorizedRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getCurrentAuthToken();
  if (!token) {
    throw new CloudSaveApiError(
      401,
      'unauthorized',
      'Authentication is required.',
    );
  }

  const response = await fetch(`${apiRoot()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  return parseResponse<T>(response);
}

export function bootstrapCloudPlayer(): Promise<CloudPlayerBootstrap> {
  return authorizedRequest<CloudPlayerBootstrap>('/bootstrap');
}

export function fetchCloudSave(): Promise<{ save: CloudSaveSnapshot | null }> {
  return authorizedRequest<{ save: CloudSaveSnapshot | null }>('/save');
}

export function writeCloudSave(input: {
  saveVersion: number;
  baseRevision: number;
  payload: PersistedGameState;
}): Promise<CloudSaveWriteResult> {
  return authorizedRequest<CloudSaveWriteResult>('/save', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
