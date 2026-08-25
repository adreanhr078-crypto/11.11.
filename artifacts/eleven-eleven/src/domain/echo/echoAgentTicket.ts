/**
 * A short-lived, opaque WebSocket admission ticket for the deterministic Echo
 * companion transport. The Firebase UID is deliberately never serialised into
 * the browser ticket or WebSocket URL.
 */
export interface EchoAgentTicketPayload {
  v: 1;
  iss: 'eleven-eleven-pages';
  aud: 'eleven-eleven-echo-agent';
  /** HMAC-derived opaque subject, not a Firebase UID. */
  sub: string;
  /** Exact browser origin allowed to use this ticket. */
  origin: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface IssueEchoAgentTicketInput {
  uid: string;
  origin: string;
  issuedAt?: number;
  /** Bounded to two minutes even when called by server-side code. */
  ttlSeconds?: number;
  jti?: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const ECHO_AGENT_TICKET_TTL_SECONDS = 120;
const MAX_CLOCK_SKEW_SECONDS = 30;
const SUBJECT_PATTERN = /^[a-f0-9]{64}$/;
const JTI_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Echo agent ticket contains invalid base64url data.');
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0
    ? ''
    : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function isPrivateDevelopmentHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized === '::1' || normalized === '127.0.0.1') {
    return true;
  }
  const octets = normalized.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => (
    !Number.isInteger(octet) || octet < 0 || octet > 255
  ))) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

/**
 * WebSocket Origin values are origins, not arbitrary URLs. Production must be
 * HTTPS; HTTP is accepted only for explicitly local development hosts.
 */
export function normalizeEchoAgentOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 320) return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:')
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash
      || (url.protocol === 'http:' && !isPrivateDevelopmentHost(url.hostname))
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) {
    throw new Error('Echo agent ticket secret must contain at least 32 characters.');
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validPayload(value: unknown): value is EchoAgentTicketPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  return source.v === 1
    && source.iss === 'eleven-eleven-pages'
    && source.aud === 'eleven-eleven-echo-agent'
    && typeof source.sub === 'string'
    && SUBJECT_PATTERN.test(source.sub)
    && normalizeEchoAgentOrigin(source.origin) === source.origin
    && Number.isInteger(source.iat)
    && Number.isInteger(source.exp)
    && typeof source.jti === 'string'
    && JTI_PATTERN.test(source.jti);
}

/** Returns a stable opaque per-player subject without exposing the UID. */
export async function deriveEchoAgentSubject(
  secret: string,
  uid: string,
): Promise<string> {
  const normalizedUid = uid.trim();
  if (!normalizedUid || normalizedUid.length > 128) {
    throw new Error('Echo agent subject is invalid.');
  }
  return hmacSha256Hex(secret, `eleven-eleven:echo-agent-subject:v1:${normalizedUid}`);
}

export async function issueEchoAgentTicket(
  secret: string,
  input: IssueEchoAgentTicketInput,
): Promise<string> {
  const origin = normalizeEchoAgentOrigin(input.origin);
  if (!origin) throw new Error('Echo agent ticket origin is invalid.');
  const issuedAt = input.issuedAt ?? Math.floor(Date.now() / 1_000);
  const requestedTtl = input.ttlSeconds ?? ECHO_AGENT_TICKET_TTL_SECONDS;
  if (!Number.isInteger(requestedTtl)) {
    throw new Error('Echo agent ticket lifetime is invalid.');
  }
  const ttlSeconds = Math.min(ECHO_AGENT_TICKET_TTL_SECONDS, Math.max(1, requestedTtl));
  const jti = input.jti ?? crypto.randomUUID();
  if (!Number.isInteger(issuedAt) || !JTI_PATTERN.test(jti)) {
    throw new Error('Echo agent ticket metadata is invalid.');
  }
  const payload: EchoAgentTicketPayload = {
    v: 1,
    iss: 'eleven-eleven-pages',
    aud: 'eleven-eleven-echo-agent',
    sub: await deriveEchoAgentSubject(secret, input.uid),
    origin,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti,
  };
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verifies signature, audience, bounded lifetime, clock skew, and origin
 * shape. Origin equality is checked by the Worker against the browser header.
 */
export async function verifyEchoAgentTicket(
  secret: string,
  token: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
): Promise<EchoAgentTicketPayload | null> {
  if (secret.length < 32 || token.length < 16 || token.length > 4_096) return null;
  const [body, signaturePart, extra] = token.split('.');
  if (!body || !signaturePart || extra) return null;
  try {
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(base64UrlToBytes(signaturePart)),
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body))) as unknown;
    if (!validPayload(payload)) return null;
    if (
      payload.exp < nowSeconds
      || payload.iat > nowSeconds + MAX_CLOCK_SKEW_SECONDS
      || payload.exp <= payload.iat
      || payload.exp - payload.iat > ECHO_AGENT_TICKET_TTL_SECONDS
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export function echoAgentTicketAllowsOrigin(
  ticket: EchoAgentTicketPayload,
  origin: string,
): boolean {
  return normalizeEchoAgentOrigin(origin) === ticket.origin;
}
