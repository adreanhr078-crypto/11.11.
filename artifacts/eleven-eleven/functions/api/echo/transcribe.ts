import {
  extractGeminiText,
  type EchoProviderEnv,
} from './providers';

interface EchoTranscribeEnv extends EchoProviderEnv {
  ECHO_ALLOWED_ORIGINS?: string;
}

interface EchoTranscribeContext {
  request: Request;
  env: EchoTranscribeEnv;
}

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/wav',
  'audio/mp3',
  'audio/aiff',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
]);
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
] as const;

function splitList(...values: Array<string | undefined>): string[] {
  return values
    .flatMap((value) => (value ?? '').split(/[\n,]/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function corsHeaders(
  request: Request,
  env: EchoTranscribeEnv,
): HeadersInit {
  const requestOrigin = request.headers.get('Origin') ?? '';
  const sameOrigin = requestOrigin === new URL(request.url).origin;
  const allowedOrigins = splitList(env.ECHO_ALLOWED_ORIGINS);
  const allowedOrigin = sameOrigin || allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : '';

  return {
    ...(allowedOrigin
      ? { 'Access-Control-Allow-Origin': allowedOrigin }
      : {}),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

function jsonResponse(
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)),
    );
  }
  return btoa(binary);
}

function normalizeAudioType(value: string): string {
  return value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

function transcriptionPrompt(locale: string): string {
  const language = locale === 'en' ? 'English' : 'Arabic';
  return [
    'Transcribe the spoken audio exactly.',
    `The expected language is ${language}, but preserve any other language that is clearly spoken.`,
    'Return only the words spoken by the player, with no description, labels, quotation marks, or explanation.',
    'If there is no intelligible speech, return an empty response.',
  ].join(' ');
}

async function transcribeWithGemini(
  key: string,
  model: string,
  mimeType: string,
  audioData: string,
  locale: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: transcriptionPrompt(locale) },
              {
                inlineData: {
                  mimeType,
                  data: audioData,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 700,
          },
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`transcription_http_${response.status}`);
    const payload = await response.json() as unknown;
    return extractGeminiText(payload).slice(0, 2_000);
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function onRequestOptions({
  request,
  env,
}: EchoTranscribeContext): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}

export async function onRequestPost({
  request,
  env,
}: EchoTranscribeContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  const keys = splitList(env.GEMINI_API_KEYS, env.GEMINI_API_KEY);
  if (keys.length === 0) {
    return jsonResponse({ error: 'Echo voice AI is not configured.' }, 503, headers);
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AUDIO_BYTES) {
    return jsonResponse({ error: 'Audio is too large.' }, 413, headers);
  }

  const mimeType = normalizeAudioType(request.headers.get('Content-Type') ?? '');
  if (!SUPPORTED_AUDIO_TYPES.has(mimeType)) {
    return jsonResponse({ error: 'Unsupported audio format.' }, 415, headers);
  }

  const audioBuffer = await request.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return jsonResponse({ error: 'Audio is required.' }, 400, headers);
  }
  if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return jsonResponse({ error: 'Audio is too large.' }, 413, headers);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const models = splitList(env.GEMINI_MODELS);
  const selectedModels = models.length > 0 ? models : [...DEFAULT_GEMINI_MODELS];
  const audioData = bytesToBase64(new Uint8Array(audioBuffer));
  const timeoutMs = boundedInteger(
    env.ECHO_PROVIDER_TIMEOUT_MS,
    20_000,
    5_000,
    45_000,
  );
  const deadline = Date.now() + boundedInteger(
    env.ECHO_PROVIDER_DEADLINE_MS,
    40_000,
    10_000,
    60_000,
  );

  for (const key of keys) {
    for (const model of selectedModels) {
      const remaining = deadline - Date.now();
      if (remaining < 1_000) break;
      try {
        const transcript = await transcribeWithGemini(
          key,
          model,
          mimeType,
          audioData,
          locale,
          Math.min(timeoutMs, remaining),
        );
        if (transcript) return jsonResponse({ transcript }, 200, headers);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'provider_error';
        console.warn(`[Echo Mind] voice transcription unavailable (${reason.slice(0, 80)})`);
      }
    }
  }

  return jsonResponse(
    { error: 'Echo voice AI is temporarily unavailable.' },
    503,
    headers,
  );
}
