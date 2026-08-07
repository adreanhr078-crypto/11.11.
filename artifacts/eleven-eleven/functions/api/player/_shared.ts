export interface PlayerApiEnv {
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_WEB_API_KEY?: string;
  PLAYER_ALLOWED_ORIGINS?: string;
  PLAYER_DB?: import('./_database').PlayerDatabase;
}

export interface PlayerApiContext {
  request: Request;
  env: PlayerApiEnv;
}

export interface FirebaseAccount {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: string;
  createdAt: string;
  lastLoginAt: string;
}

interface FirebaseLookupUser {
  localId?: unknown;
  displayName?: unknown;
  email?: unknown;
  photoUrl?: unknown;
  createdAt?: unknown;
  lastLoginAt?: unknown;
  providerUserInfo?: Array<{ providerId?: unknown }>;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
}

export interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

export class PlayerApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function cleanOptionalText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maximumLength);
  return cleaned || null;
}

function timestampFromMilliseconds(value: unknown): string {
  const milliseconds = typeof value === 'string' ? Number(value) : NaN;
  const date = Number.isFinite(milliseconds)
    ? new Date(milliseconds)
    : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function requireFirebaseConfig(env: PlayerApiEnv): {
  projectId: string;
  webApiKey: string;
} {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const webApiKey = env.FIREBASE_WEB_API_KEY?.trim();
  if (!projectId || !webApiKey) {
    throw new PlayerApiError(
      503,
      'server_not_configured',
      'Player services are not configured.',
    );
  }
  return { projectId, webApiKey };
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw new PlayerApiError(401, 'unauthorized', 'Authentication is required.');
  }
  return match[1].trim();
}

export function corsHeaders(
  request: Request,
  env: PlayerApiEnv,
): HeadersInit {
  const requestOrigin = request.headers.get('Origin') ?? '';
  const sameOrigin = requestOrigin === new URL(request.url).origin;
  const allowedOrigins = (env.PLAYER_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigin = sameOrigin || allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : '';

  return {
    ...(allowedOrigin
      ? { 'Access-Control-Allow-Origin': allowedOrigin }
      : {}),
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function errorResponse(
  error: unknown,
  headers: HeadersInit,
): Response {
  if (error instanceof PlayerApiError) {
    return jsonResponse({
      error: error.message,
      code: error.code,
    }, error.status, headers);
  }
  return jsonResponse({
    error: 'Player service is temporarily unavailable.',
    code: 'service_unavailable',
  }, 503, headers);
}

export async function authenticatePlayer(
  request: Request,
  env: PlayerApiEnv,
): Promise<{ account: FirebaseAccount; idToken: string }> {
  const { webApiKey } = requireFirebaseConfig(env);
  const idToken = bearerToken(request);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(webApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) {
    throw new PlayerApiError(401, 'invalid_token', 'The session has expired.');
  }

  const payload = await response.json() as { users?: FirebaseLookupUser[] };
  const user = payload.users?.[0];
  const uid = cleanOptionalText(user?.localId, 128);
  if (!user || !uid) {
    throw new PlayerApiError(401, 'invalid_token', 'The session has expired.');
  }

  const providerId = cleanOptionalText(
    user.providerUserInfo?.[0]?.providerId,
    80,
  ) ?? (user.email ? 'password' : 'anonymous');

  return {
    idToken,
    account: {
      uid,
      displayName: cleanOptionalText(user.displayName, 80),
      email: cleanOptionalText(user.email, 254),
      photoURL: cleanOptionalText(user.photoUrl, 2_000),
      providerId,
      createdAt: timestampFromMilliseconds(user.createdAt),
      lastLoginAt: timestampFromMilliseconds(user.lastLoginAt),
    },
  };
}

function firestoreDocumentUrl(
  env: PlayerApiEnv,
  documentPath: string,
): URL {
  const { projectId } = requireFirebaseConfig(env);
  const safePath = documentPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${safePath}`,
  );
}

export async function readFirestoreDocument(
  env: PlayerApiEnv,
  idToken: string,
  documentPath: string,
): Promise<FirestoreDocument | null> {
  const response = await fetch(firestoreDocumentUrl(env, documentPath), {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new PlayerApiError(
      502,
      'database_read_failed',
      'Unable to read the player save.',
    );
  }
  return response.json() as Promise<FirestoreDocument>;
}

export async function writeFirestoreDocument(
  env: PlayerApiEnv,
  idToken: string,
  documentPath: string,
  fields: Record<string, FirestoreValue>,
  precondition?: { exists?: boolean; updateTime?: string },
): Promise<FirestoreDocument> {
  const url = firestoreDocumentUrl(env, documentPath);
  if (typeof precondition?.exists === 'boolean') {
    url.searchParams.set(
      'currentDocument.exists',
      String(precondition.exists),
    );
  }
  if (precondition?.updateTime) {
    url.searchParams.set('currentDocument.updateTime', precondition.updateTime);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (response.status === 409 || response.status === 412) {
    throw new PlayerApiError(
      409,
      'save_conflict',
      'The cloud save changed on another device.',
    );
  }
  if (!response.ok) {
    throw new PlayerApiError(
      502,
      'database_write_failed',
      'Unable to update the player save.',
    );
  }
  return response.json() as Promise<FirestoreDocument>;
}

export function stringField(value: string): FirestoreValue {
  return { stringValue: value };
}

export function integerField(value: number): FirestoreValue {
  return { integerValue: String(Math.max(0, Math.floor(value))) };
}

export function booleanField(value: boolean): FirestoreValue {
  return { booleanValue: value };
}

export function timestampField(value: string): FirestoreValue {
  return { timestampValue: value };
}

export function readStringField(
  document: FirestoreDocument,
  key: string,
): string | null {
  const value = document.fields?.[key]?.stringValue;
  return typeof value === 'string' ? value : null;
}

export function readIntegerField(
  document: FirestoreDocument,
  key: string,
): number {
  const value = Number(document.fields?.[key]?.integerValue ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function readTimestampField(
  document: FirestoreDocument,
  key: string,
): string | null {
  const value = document.fields?.[key]?.timestampValue;
  return typeof value === 'string' ? value : null;
}

export function optionsResponse(
  request: Request,
  env: PlayerApiEnv,
): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}
