/**
 * echoService.ts — Client-side AI service for Echo Mind
 *
 * All AI calls go through the backend /api/ai/* endpoints. The API key
 * (GROQ_API_KEY) is stored ONLY in server-side environment variables on
 * Vercel — the frontend never handles any key.
 */

// `EntityId` is declared in puzzles.ts; gameState only exports the helper.
import { getTrustToneModifier } from "./gameState";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const import_meta_env: any;
const viteEnv = ((): any => {
  try { return (import.meta as any).env ?? {}; } catch { return {}; }
})();
/* eslint-enable @typescript-eslint/no-explicit-any */

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
 * Stream a chat completion through the backend /api/ai/chat endpoint.
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
    firstByteTimer = setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, FIRST_BYTE_TIMEOUT_MS);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          deviceContext,
          wishContext,
          trustAI,
          gameLevel,
        }),
        signal,
      });

      if (signal.aborted) { clearTimers(); return; }

      if (!res.ok) {
        clearTimers();
        let serverMsg = "";
        try {
          const errData = (await res.json()) as { message?: string; error?: string };
          serverMsg = errData?.message ?? errData?.error ?? "";
        } catch { /* not JSON */ }
        if (res.status === 401) {
          onError("خطأ في المصادقة. تحقق من إعدادات الخادم.");
        } else if (res.status === 429) {
          onError("تم تجاوز حد الاستخدام. انتظر قليلاً ثم حاول مجدداً.");
        } else if (serverMsg) {
          onError(`خطأ: ${serverMsg.slice(0, 200)}`);
        } else {
          onError(`تعذّر الوصول إلى الصدى (HTTP ${res.status}).`);
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
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              content?: string;
              done?: boolean;
              error?: string;
            };
            if (json.error) {
              clearTimers();
              onError(`خطأ من النموذج: ${json.error}`);
              return;
            }
            if (json.done) { clearTimers(); onDone(); return; }
            if (json.content) onChunk(json.content);
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