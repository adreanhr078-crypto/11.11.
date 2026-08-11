import {
  AuthSessionError,
  getCurrentAuthSession,
} from '../../features/auth/authService';
import type { PersistedGameState } from '../persistence/gamePersistence';
import { playerApiRoot } from '../player-api/apiRoot';
import {
  fetchPlayerRequest,
  PlayerTransportError,
} from '../player-api/playerRequest';

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
    this.name = 'CloudSaveApiError';
  }
}

function apiRoot(): string {
  const configured = import.meta.env.VITE_PLAYER_API_URL?.trim();
  return playerApiRoot(configured);
}

function invalidResponse(): CloudSaveApiError {
  return new CloudSaveApiError(
    502,
    'invalid_response',
    'Cloud save service returned an invalid response.',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  let parsed = false;
  try {
    payload = await response.json();
    parsed = true;
  } catch {
    // A structured fallback is produced below.
  }
  const payloadRecord: ApiErrorBody & Partial<T> = isRecord(payload)
    ? payload as ApiErrorBody & Partial<T>
    : {};
  if (!response.ok) {
    throw new CloudSaveApiError(
      response.status,
      typeof payloadRecord.code === 'string' ? payloadRecord.code : 'request_failed',
      typeof payloadRecord.error === 'string'
        ? payloadRecord.error
        : 'Cloud save request failed.',
      typeof payloadRecord.currentRevision === 'number'
        ? payloadRecord.currentRevision
        : null,
      typeof payloadRecord.updatedAt === 'string' ? payloadRecord.updatedAt : null,
    );
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!parsed) throw invalidResponse();
  if (contentType && !contentType.toLowerCase().includes('json')) {
    throw invalidResponse();
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw invalidResponse();
  }
  return payload as T;
}

async function authorizedRequest<T>(
  path: string,
  init?: RequestInit,
  tokenOverride?: string,
): Promise<T> {
  let token = tokenOverride;
  if (!token) {
    try {
      token = (await getCurrentAuthSession()).token;
    } catch (error) {
      const authError = error instanceof AuthSessionError
        ? error
        : new AuthSessionError('token_failed', 'Authentication failed.');
      throw new CloudSaveApiError(
        authError.code === 'auth_timeout' || authError.code === 'token_timeout'
          ? 504
          : 401,
        authError.code,
        authError.message,
      );
    }
  }

  try {
    const response = await fetchPlayerRequest(`${apiRoot()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof CloudSaveApiError) throw error;
    if (error instanceof PlayerTransportError) {
      throw new CloudSaveApiError(
        error.code === 'request_timeout' ? 504 : 503,
        error.code,
        error.message,
      );
    }
    throw new CloudSaveApiError(
      503,
      'network_failure',
      'Cloud save service could not be reached.',
    );
  }
}

export function bootstrapCloudPlayer(
  token?: string,
  expectedUid?: string,
): Promise<CloudPlayerBootstrap> {
  return authorizedRequest<CloudPlayerBootstrap>('/bootstrap', undefined, token)
    .then((response) => {
      if (
        !isRecord(response.profile)
        || typeof response.profile.uid !== 'string'
        || !('save' in response)
      ) {
        throw invalidResponse();
      }
      if (expectedUid && response.profile.uid !== expectedUid) {
        throw new CloudSaveApiError(
          409,
          'uid_mismatch',
          'Cloud save belongs to a different account.',
        );
      }
      return response;
    });
}

export function fetchCloudSave(
  token?: string,
): Promise<{ save: CloudSaveSnapshot | null }> {
  return authorizedRequest<{ save: CloudSaveSnapshot | null }>(
    '/save',
    undefined,
    token,
  ).then((response) => {
    if (!('save' in response)) throw invalidResponse();
    return response;
  });
}

export function writeCloudSave(input: {
  saveVersion: number;
  baseRevision: number;
  payload: PersistedGameState;
}, token?: string): Promise<CloudSaveWriteResult> {
  return authorizedRequest<CloudSaveWriteResult>('/save', {
    method: 'PUT',
    body: JSON.stringify(input),
  }, token);
}
