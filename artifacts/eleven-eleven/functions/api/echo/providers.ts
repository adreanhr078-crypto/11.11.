export type EchoProviderMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface WorkersAiBinding {
  run(
    model: string,
    input: {
      messages: EchoProviderMessage[];
      max_tokens: number;
      temperature: number;
    },
  ): Promise<unknown>;
}

export interface EchoProviderEnv {
  AI?: WorkersAiBinding;
  ECHO_PROVIDER_ORDER?: string;
  ECHO_PROVIDER_TIMEOUT_MS?: string;
  ECHO_PROVIDER_DEADLINE_MS?: string;
  ECHO_MAX_PROVIDER_ATTEMPTS?: string;
  ECHO_CLOUDFLARE_MODELS?: string;
  GEMINI_API_KEY?: string;
  GEMINI_API_KEYS?: string;
  GEMINI_MODELS?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_API_KEYS?: string;
  OPENROUTER_MODELS?: string;
  GROQ_API_KEY?: string;
  GROQ_API_KEYS?: string;
  GROQ_MODELS?: string;
  HF_TOKEN?: string;
  HF_TOKENS?: string;
  HF_MODELS?: string;
  OPENAI_API_KEY?: string;
  OPENAI_API_KEYS?: string;
  OPENAI_MODELS?: string;
  ECHO_AI_MODEL?: string;
}

export interface GenerateEchoReplyInput {
  env: EchoProviderEnv;
  messages: EchoProviderMessage[];
  instructions: string;
  safetyIdentifier?: string;
  referer?: string;
}

interface ProviderAttempt {
  id: string;
  run: (timeoutMs: number) => Promise<string>;
}

interface ChatCompletionPayload {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

interface ResponsesPayload {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
  }>;
}

interface GeminiPayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: unknown;
        thought?: unknown;
      }>;
    };
  }>;
}

const DEFAULT_PROVIDER_ORDER = [
  'cloudflare',
  'gemini',
  'openrouter',
  'groq',
  'huggingface',
  'openai',
] as const;

const DEFAULT_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const DEFAULT_CLOUDFLARE_MODELS = [
  '@cf/openai/gpt-oss-120b',
  '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

/**
 * Free conversation must never leave a player waiting behind an unbounded
 * provider failover chain. This is a product and safety boundary, not merely
 * a default: Operations may lower it, but cannot raise it above six seconds.
 */
export const MAX_ECHO_CHAT_DEADLINE_MS = 6_000;

export interface EchoProviderTiming {
  attemptLimit: number;
  perAttemptTimeoutMs: number;
  deadlineMs: number;
}

const DEFAULT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const DEFAULT_HF_MODELS = [
  'openai/gpt-oss-120b:fastest',
  'Qwen/Qwen2.5-7B-Instruct-1M:fastest',
];

function splitList(...values: Array<string | undefined>): string[] {
  return values
    .flatMap((value) => (value ?? '').split(/[\n,]/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function configuredList(
  value: string | undefined,
  fallback: readonly string[],
): string[] {
  const configured = splitList(value);
  return configured.length > 0 ? configured : [...fallback];
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

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .flatMap((part) => {
      if (typeof part === 'string') return [part];
      if (
        typeof part === 'object'
        && part !== null
        && 'text' in part
        && typeof part.text === 'string'
      ) return [part.text];
      return [];
    })
    .join('');
}

function cleanModelText(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:text|markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
    .slice(0, 5_000);
}

export function extractChatCompletionText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const response = payload as ChatCompletionPayload;
  return cleanModelText(textFromContent(response.choices?.[0]?.message?.content));
}

export function extractResponsesText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const response = payload as ResponsesPayload;
  if (typeof response.output_text === 'string') {
    return cleanModelText(response.output_text);
  }
  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('') ?? '';
  return cleanModelText(text);
}

export function extractGeminiText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const response = payload as GeminiPayload;
  const text = response.candidates?.[0]?.content?.parts
    ?.filter((part) => part.thought !== true && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('') ?? '';
  return cleanModelText(text);
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`provider_http_${response.status}`);
    }
    return await response.json() as unknown;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = globalThis.setTimeout(
          () => reject(new Error('provider_timeout')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) globalThis.clearTimeout(timeout);
  }
}

async function runCompatibleChat(
  url: string,
  key: string,
  model: string,
  messages: EchoProviderMessage[],
  timeoutMs: number,
  extraHeaders: HeadersInit = {},
): Promise<string> {
  const payload = await fetchJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.72,
      max_tokens: 420,
      stream: false,
    }),
  }, timeoutMs);
  return extractChatCompletionText(payload);
}

function createCloudflareAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
): ProviderAttempt[] {
  if (!env.AI) return [];
  return configuredList(
    env.ECHO_CLOUDFLARE_MODELS,
    DEFAULT_CLOUDFLARE_MODELS,
  ).map((model) => ({
    id: `cloudflare:${model}`,
    run: async (timeoutMs) => {
      const response = await withTimeout(
        env.AI!.run(model, {
          messages,
          max_tokens: 420,
          temperature: 0.72,
        }),
        timeoutMs,
      );
      if (typeof response === 'object' && response !== null && 'response' in response) {
        return cleanModelText(
          typeof response.response === 'string' ? response.response : '',
        );
      }
      return extractChatCompletionText(response);
    },
  }));
}

function createOpenRouterAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
  referer?: string,
): ProviderAttempt[] {
  const keys = splitList(env.OPENROUTER_API_KEYS, env.OPENROUTER_API_KEY);
  const models = configuredList(env.OPENROUTER_MODELS, ['openrouter/free']);
  return keys.flatMap((key, keyIndex) => models.map((model) => ({
    id: `openrouter:${keyIndex}:${model}`,
    run: (timeoutMs: number) => runCompatibleChat(
      'https://openrouter.ai/api/v1/chat/completions',
      key,
      model,
      messages,
      timeoutMs,
      {
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        'X-Title': '11:11 Echo Mind',
      },
    ),
  })));
}

function createGeminiAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
  instructions: string,
): ProviderAttempt[] {
  const keys = splitList(env.GEMINI_API_KEYS, env.GEMINI_API_KEY);
  const models = configuredList(env.GEMINI_MODELS, DEFAULT_GEMINI_MODELS);
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  return keys.flatMap((key, keyIndex) => models.map((model) => ({
    id: `gemini:${keyIndex}:${model}`,
    run: async (timeoutMs: number) => {
      const payload = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: instructions }],
            },
            contents,
            generationConfig: {
              temperature: 0.72,
              maxOutputTokens: 420,
            },
          }),
        },
        timeoutMs,
      );
      return extractGeminiText(payload);
    },
  })));
}

function createGroqAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
): ProviderAttempt[] {
  const keys = splitList(env.GROQ_API_KEYS, env.GROQ_API_KEY);
  const models = configuredList(env.GROQ_MODELS, DEFAULT_GROQ_MODELS);
  return keys.flatMap((key, keyIndex) => models.map((model) => ({
    id: `groq:${keyIndex}:${model}`,
    run: (timeoutMs: number) => runCompatibleChat(
      'https://api.groq.com/openai/v1/chat/completions',
      key,
      model,
      messages,
      timeoutMs,
    ),
  })));
}

function createHuggingFaceAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
): ProviderAttempt[] {
  const keys = splitList(env.HF_TOKENS, env.HF_TOKEN);
  const models = configuredList(env.HF_MODELS, DEFAULT_HF_MODELS);
  return keys.flatMap((key, keyIndex) => models.map((model) => ({
    id: `huggingface:${keyIndex}:${model}`,
    run: (timeoutMs: number) => runCompatibleChat(
      'https://router.huggingface.co/v1/chat/completions',
      key,
      model,
      messages,
      timeoutMs,
    ),
  })));
}

function createOpenAiAttempts(
  env: EchoProviderEnv,
  messages: EchoProviderMessage[],
  instructions: string,
  safetyIdentifier?: string,
): ProviderAttempt[] {
  const keys = splitList(env.OPENAI_API_KEYS, env.OPENAI_API_KEY);
  const models = configuredList(
    env.OPENAI_MODELS ?? env.ECHO_AI_MODEL,
    ['gpt-5.6'],
  );
  const input = messages.filter((message) => message.role !== 'system');

  return keys.flatMap((key, keyIndex) => models.map((model) => ({
    id: `openai:${keyIndex}:${model}`,
    run: async (timeoutMs: number) => {
      const payload = await fetchJson('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          instructions,
          input,
          reasoning: { effort: 'low' },
          max_output_tokens: 420,
          store: false,
          ...(safetyIdentifier ? { safety_identifier: safetyIdentifier } : {}),
        }),
      }, timeoutMs);
      return extractResponsesText(payload);
    },
  })));
}

function createAttempts(input: GenerateEchoReplyInput): ProviderAttempt[] {
  const { env, messages, instructions, safetyIdentifier, referer } = input;
  const groups: Record<string, ProviderAttempt[]> = {
    cloudflare: createCloudflareAttempts(env, messages),
    gemini: createGeminiAttempts(env, messages, instructions),
    openrouter: createOpenRouterAttempts(env, messages, referer),
    groq: createGroqAttempts(env, messages),
    huggingface: createHuggingFaceAttempts(env, messages),
    openai: createOpenAiAttempts(
      env,
      messages,
      instructions,
      safetyIdentifier,
    ),
  };
  const requestedOrder = splitList(env.ECHO_PROVIDER_ORDER);
  const order = requestedOrder.length > 0
    ? requestedOrder
    : [...DEFAULT_PROVIDER_ORDER];
  return order.flatMap((provider) => groups[provider.toLowerCase()] ?? []);
}

export function hasConfiguredEchoProvider(env: EchoProviderEnv): boolean {
  return Boolean(
    env.AI
    || splitList(env.GEMINI_API_KEYS, env.GEMINI_API_KEY).length
    || splitList(env.OPENROUTER_API_KEYS, env.OPENROUTER_API_KEY).length
    || splitList(env.GROQ_API_KEYS, env.GROQ_API_KEY).length
    || splitList(env.HF_TOKENS, env.HF_TOKEN).length
    || splitList(env.OPENAI_API_KEYS, env.OPENAI_API_KEY).length,
  );
}

export function resolveEchoProviderTiming(
  env: EchoProviderEnv,
): EchoProviderTiming {
  const deadlineMs = boundedInteger(
    env.ECHO_PROVIDER_DEADLINE_MS,
    MAX_ECHO_CHAT_DEADLINE_MS,
    2_000,
    MAX_ECHO_CHAT_DEADLINE_MS,
  );
  return {
    attemptLimit: boundedInteger(
      env.ECHO_MAX_PROVIDER_ATTEMPTS,
      10,
      1,
      24,
    ),
    perAttemptTimeoutMs: boundedInteger(
      env.ECHO_PROVIDER_TIMEOUT_MS,
      4_000,
      2_000,
      deadlineMs,
    ),
    deadlineMs,
  };
}

export async function generateEchoReply(
  input: GenerateEchoReplyInput,
): Promise<string> {
  const attempts = createAttempts(input);
  const {
    attemptLimit,
    perAttemptTimeoutMs: perAttemptTimeout,
    deadlineMs,
  } = resolveEchoProviderTiming(input.env);
  const deadline = Date.now() + deadlineMs;

  for (const attempt of attempts.slice(0, attemptLimit)) {
    const remaining = deadline - Date.now();
    if (remaining < 500) break;
    try {
      const response = await attempt.run(Math.min(perAttemptTimeout, remaining));
      if (response.trim()) return response;
      throw new Error('provider_empty_response');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'provider_error';
      console.warn(`[Echo Mind] ${attempt.id} unavailable (${reason.slice(0, 80)})`);
    }
  }

  throw new Error('echo_provider_pool_exhausted');
}
