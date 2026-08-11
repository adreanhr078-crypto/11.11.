import {
  realtimeTicketPayloadSchema,
  type RealtimeTicketPayload,
} from './contracts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
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

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signRealtimeTicket(
  secret: string,
  payload: RealtimeTicketPayload,
): Promise<string> {
  if (secret.length < 32) {
    throw new Error('Realtime ticket secret must contain at least 32 characters.');
  }
  const verifiedPayload = realtimeTicketPayloadSchema.parse(payload);
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(verifiedPayload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyRealtimeTicket(
  secret: string,
  token: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
): Promise<RealtimeTicketPayload | null> {
  if (secret.length < 32 || token.length > 4_096) return null;
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
    const payload = realtimeTicketPayloadSchema.parse(
      JSON.parse(decoder.decode(base64UrlToBytes(body))) as unknown,
    );
    if (payload.exp < nowSeconds || payload.iat > nowSeconds + 30) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  if (secret.length < 32) {
    throw new Error('HMAC secret must contain at least 32 characters.');
  }
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
