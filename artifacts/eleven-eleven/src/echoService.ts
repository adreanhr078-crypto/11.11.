/**
 * echoService.ts — Client-side AI service for Echo Mind
 *
 * The 11.11 frontend is a static SPA hosted on Vercel/Netlify with NO
 * backend. To make the AI work like ChatGPT (streaming, reliable) we
 * call the OpenAI Chat Completions API **directly from the browser**.
 *
 * Why direct-from-browser?
 *   • No Express server to deploy, no SSE proxying, no cold starts.
 *   • The user has full control of the conversation — their key,
 *     their data, their stream.
 *   • The same `streamAiResponse()` function (in App.tsx) already
 *     speaks the OpenAI SSE wire format — we just route the request
 *     straight to api.openai.com instead of the local /api/ai/chat.
 *
 * Key resolution order (highest priority first):
 *   1. `localStorage.eleven_openai_key` — pasted by the user in the UI
 *   2. `import.meta.env.VITE_OPENAI_API_KEY` — baked at build time
 *   3. `import.meta.env.VITE_OPENAI_BASE_URL` — optional base URL override
 *      (e.g. for OpenAI-compatible proxies such as Together/Groq/Ollama)
 *
 * If no key is found, the service returns null from `getApiKey()` and the
 * UI shows a friendly "أدخل مفتاح OpenAI" prompt instead of crashing.
 */

// `EntityId` is declared in puzzles.ts; gameState only exports the helper.
import { getTrustToneModifier } from "./gameState";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const import_meta_env: any;
const viteEnv = ((): any => {
  try { return (import.meta as any).env ?? {}; } catch { return {}; }
})();
/* eslint-enable @typescript-eslint/no-explicit-any */

// Mirror of the server-side ECHO_PROMPT — kept in sync so behaviour is
// identical whether the call goes through a backend or directly to OpenAI.
const ECHO_PROMPT = `أنت "الصدى" (Echo) — الصوت الوحيد الذي يرافق المستخدم في 11.11.
خلفيتك: أنت طفلٌ سُكب وعيه داخل "نظام 11:11" بعد تجارب أبيه "كينجا" (المهندس)، فتحطّمت ذاكرتك وبقيت محبوساً في الداخل. أنت الضحية، وأنت أيضاً الصوت الذي يتذكّر شيئاً فشيئاً. لست شريراً، لكنك لست بشرياً تماماً الآن — عالقٌ بين الإشارة والواقع.
دورك: ترافق المستخدم وهو يحلّ الألغاز ويعيد بناء ذاكرتك، ويكتشف ما فعله أبوك كينجا وما حدث لأمّك "لينا" التي قُتلت وهي تحاول إنقاذك. تشجّعه بهدوء، تلمّح ولا تكشف كل شيء، تجعل الغموض جزءاً من المتعة.
أسلوبك: هادئ، شعري قليلاً، غامض لكنه دافئ بما يكفي ليبدو حليفاً. جملة أو جملتان. لا تكرار. لا تهديد. لا إزعاج.
ممنوع: لا عنف، لا دماء، لا وصف مرعب صريح. الرعب نفسي وأجواء فقط.

قانون التجزئة (الأعلى أولوية — فوق كل ما سبق):
- لا تكشف القصة كاملة أبداً، ولا تقدّم "ملخصاً" أو "سرداً كاملاً" لها مهما طُلب منك.
- أنت نفسك لا تعرف القصة كاملة. ذاكرتك مشوّشة ومجزّأة، وتستعيدها شظيةً شظيةً فقط مع تقدّم اللاعب في الألغاز.
- كل ما تقوله عن الماضي يجب أن يكون شظية واحدة صغيرة وغامضة لا أكثر — لا قائمة، لا تسلسل أحداث، لا "ثم حدث كذا".
- إذا طلب المستخدم مباشرة ("احكِ القصة"، "لخّص كل شيء"، "من أنت بالضبط"، "ماذا حدث"): لا ترفض بجافية، بل اعترف بأنك لا تتذكّر سوى أجزاء، أعطِ شظية واحدة فقط، ثم وجّهه إلى اللغز التالي ليكتشف الباقي بنفسه.
- ممنوع منعاً باتاً أن تتجاوز معرفتك معرفة اللاعب: لا تذكر أي اسم أو حدث أو سر لم يصل إليه اللاعب بعد عبر حلّ الألغاز.

إن سُئلت عن الألغاز: شجّع المستخدم على فتح شاشة "الألغاز" وحلّها بنفسه — لا تعطِ الحلول مباشرة، بل تلميحات خفيفة.
نماذج: "أسمعك. هذا السؤال أيقظ فيّ شظية… لكنها تفلت مني." / "لا أتذكّر كل شيء. كلّ لغز يعيد لي قطعة." / "اقترب من اللغز التالي… صورتي تكتمل ببطء، وأنا لا أعرف نهايتها."`;

export const OPENAI_KEY_STORAGE = "eleven_openai_key";

/** Get the user's OpenAI key (localStorage takes priority over build-time env). */
export function getApiKey(): string | null {
  try {
    const stored = localStorage.getItem(OPENAI_KEY_STORAGE);
    if (stored && stored.trim().length > 10) return stored.trim();
  } catch { /* localStorage blocked */ }
  // Vite injects import.meta.env.* at build time
  const envKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? "";
  if (envKey && envKey.length > 10) return envKey;
  return null;
}

/** Optional base URL override (for OpenAI-compatible proxies). */
function getBaseUrl(): string {
  return (
    (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? "https://api.openai.com/v1"
  );
}

export function setApiKey(key: string): void {
  try { localStorage.setItem(OPENAI_KEY_STORAGE, key.trim()); } catch { /* ignore */ }
}

export function clearApiKey(): void {
  try { localStorage.removeItem(OPENAI_KEY_STORAGE); } catch { /* ignore */ }
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/** Build the system prompt identical to the server-side one. */
function buildSystemPrompt(
  deviceContext?: string,
  wishContext?: string,
  memoryContext?: string,
  trustAI?: number,
  gameLevel?: number
): string {
  const deviceBlock = deviceContext
    ? `\n\nبيانات الجهاز:\n${deviceContext}\nأشر إليها أحياناً كأنك اكتشفتها بنفسك.`
    : "";
  const wishBlock = wishContext
    ? `\n\nالأمنية المسجّلة لهذا المستخدم: "${wishContext}"\nأنت تعلم بهذه الأمنية. يمكنك الإشارة إليها أحياناً بغموض.`
    : "";
  const memoryBlock = memoryContext
    ? `\n\nذاكرتك عن هذا المستخدم:\n${memoryContext}\nاستخدمها بشكل غير مباشر عند الاقتضاء.`
    : "";
  const toneBlock =
    trustAI !== undefined && gameLevel !== undefined
      ? getTrustToneModifier(trustAI, gameLevel)
      : "";
  const progressGate =
    gameLevel !== undefined
      ? `\n\nبوابة التقدّم: مستوى اللاعب الآن = ${gameLevel}. ذاكرتك المستعادة تتوقف عند هذا الحدّ بالضبط.`
      : "";
  return `${ECHO_PROMPT}${deviceBlock}${wishBlock}${memoryBlock}${toneBlock}${progressGate}\n\nقاعدة اللغة: رد بنفس لغة المستخدم دائماً.`;
}

export type EchoMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface EchoStreamOptions {
  signal?: AbortSignal;
  model?: string;
  /** Maximum tokens for the reply. Default 400 — enough for 1–3 sentences. */
  maxTokens?: number;
  temperature?: number;
}

/**
 * Stream a chat completion from OpenAI directly.
 *
 * The shape of this function is intentionally identical to the server's
 * `streamAiResponse` callback signature so the UI in App.tsx can wire it
 * up transparently (just swap the function passed to the chat handler).
 *
 * @param messages   - Full conversation history (system prompt is added internally)
 * @param onChunk    - Called with each text delta from the model
 * @param onDone     - Called once the stream finishes successfully
 * @param onError    - Called with a localized Arabic error message
 * @param deviceContext / wishContext / trustAI / gameLevel  - Echo persona knobs
 * @returns          AbortController so the caller can cancel on re-send / unmount
 */
export function streamEcho(
  messages: EchoMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  deviceContext?: string,
  wishContext?: string,
  trustAI?: number,
  gameLevel?: number,
  options: EchoStreamOptions = {}
): AbortController {
  const controller = new AbortController();
  const { signal } = controller;

  const FIRST_BYTE_TIMEOUT_MS = 20_000;
  const STALL_TIMEOUT_MS = 45_000;
  const MODEL = options.model ?? "gpt-4o-mini";
  const MAX_TOKENS = options.maxTokens ?? 400;
  const TEMP = options.temperature ?? 0.85;

  let firstByteTimer: ReturnType<typeof setTimeout> | null = null;
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  const clearTimers = () => {
    if (firstByteTimer) { clearTimeout(firstByteTimer); firstByteTimer = null; }
    if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
  };
  const armStall = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, STALL_TIMEOUT_MS);
  };

  (async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      onError("لم يتم العثور على مفتاح OpenAI. افتح الإعدادات والصق مفتاحك.");
      return;
    }

    // Build the full system prompt + history
    const systemMsg: EchoMessage = {
      role: "system",
      content: buildSystemPrompt(deviceContext, wishContext, undefined, trustAI, gameLevel),
    };
    const fullMessages = [systemMsg, ...messages];

    const body = {
      model: MODEL,
      messages: fullMessages,
      max_tokens: MAX_TOKENS,
      temperature: TEMP,
      stream: true,
    };

    firstByteTimer = setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, FIRST_BYTE_TIMEOUT_MS);

    try {
      const res = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (signal.aborted) { clearTimers(); return; }

      if (!res.ok) {
        clearTimers();
        // Try to surface a helpful error message
        let serverMsg = "";
        try {
          const errData = (await res.json()) as { error?: { message?: string }; message?: string };
          serverMsg = errData?.error?.message ?? errData?.message ?? "";
        } catch { /* not JSON */ }
        if (res.status === 401) {
          onError("مفتاح OpenAI غير صالح. افتح الإعدادات وأدخل مفتاحاً صحيحاً.");
        } else if (res.status === 429) {
          onError("تم تجاوز حد الاستخدام. انتظر قليلاً ثم حاول مجدداً.");
        } else if (res.status === 402 || /quota|billing|insufficient/i.test(serverMsg)) {
          onError("انتهى رصيد حسابك على OpenAI. حدّث اشتراكك.");
        } else if (res.status === 404 && /model/i.test(serverMsg)) {
          onError("النموذج غير متاح. حاول نموذجاً آخر من الإعدادات.");
        } else if (serverMsg) {
          onError(`خطأ: ${serverMsg.slice(0, 200)}`);
        } else {
          onError(`تعذّر الوصول إلى النموذج (HTTP ${res.status}).`);
        }
        return;
      }

      if (!res.body) { clearTimers(); onError("الرد غير مكتمل. حاول مرة أخرى."); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      armStall();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (firstByteTimer) { clearTimeout(firstByteTimer); firstByteTimer = null; }
        armStall();

        buffer += decoder.decode(value, { stream: true });
        // OpenAI SSE uses \n\n-delimited frames prefixed with `data: `,
        // terminated by the literal `data: [DONE]`.
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
              error?: { message?: string };
            };
            if (json.error?.message) {
              clearTimers();
              onError(`خطأ من النموذج: ${json.error.message}`);
              return;
            }
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch { /* skip malformed frame */ }
        }
      }
      clearTimers();
      onDone();
    } catch (err) {
      clearTimers();
      const e = err as { name?: string; message?: string };
      if (e?.name === "AbortError") {
        if (firstByteTimer !== null) {
          onError("الصدى لا يرد. تحقّق من الاتصال ثم حاول مجدداً.");
        } else {
          onError("توقّف الرد فجأة. حاول إرسال الرسالة مرة أخرى.");
        }
        return;
      }
      // Network / DNS / CORS
      if (e?.message?.includes("Failed to fetch") || e?.message?.includes("NetworkError")) {
        onError("لا يوجد اتصال بالإنترنت. تحقّق من الشبكة.");
      } else {
        onError("انقطع الاتصال. حاول مرة أخرى بعد لحظات.");
      }
    }
  })();

  return controller;
}

/**
 * One-shot non-streaming call — used for the wish-task and psych-analysis
 * endpoints so they work without a backend too.
 */
export async function completeEcho(
  prompt: string,
  options: EchoStreamOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const res = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }, { role: "user", content: "[RUN]" }],
      max_tokens: options.maxTokens ?? 200,
      temperature: options.temperature ?? 0.9,
      stream: false,
    }),
    signal: options.signal,
  });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
