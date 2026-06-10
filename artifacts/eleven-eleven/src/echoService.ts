/**
 * echoService.ts — Client-side AI service for Echo Mind
 * 
 * يحاول الاتصال بالخادم أولاً، وإذا فشل يستخدم المحرك المحلي
 * All AI calls go through the backend /api/ai/* endpoints.
 */

import { getTrustToneModifier } from "./gameState";
import { generateLocalResponse } from "./localAiChat";

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
  maxTokens?: number;
  temperature?: number;
}

/**
 * Stream a chat completion — tries server API first, falls back to local AI
 *
 * @param messages   - Full conversation history
 * @param onChunk    - Called with each text delta from the model
 * @param onDone     - Called once the stream finishes successfully
 * @param onError    - Called with a localized Arabic error message
 * @param deviceContext / wishContext / trustAI / gameLevel - Echo persona knobs
 * @returns          AbortController so the caller can cancel
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

  const FIRST_BYTE_TIMEOUT_MS = 8_000; // shorter timeout for fast fallback
  const STALL_TIMEOUT_MS = 20_000;

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

    let usedLocalFallback = false;

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

      if (signal.aborted) { clearTimers(); throw new Error("ABORTED_FIRST_BYTE"); }

      if (!res.ok) {
        clearTimers();
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) { clearTimers(); throw new Error("NO_BODY"); }

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
              throw new Error(json.error);
            }
            if (json.done) { clearTimers(); onDone(); return; }
            if (json.content) onChunk(json.content);
          } catch { /* skip malformed frame */ }
        }
      }
      clearTimers();
      onDone();
      return;
    } catch (err) {
      clearTimers();
      const e = err as { name?: string; message?: string };
      
      // ─── FALLBACK TO LOCAL AI ENGINE ───────────────────────────
      // إذا فشل الاتصال بالخادم، استخدم المحرك المحلي
      const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
      
      if (lastUserMessage) {
        const localResponse = generateLocalResponse(
          lastUserMessage,
          messages.map(m => ({ role: m.role, content: m.content }))
        );
        
        // محاكاة الـ streaming بالتأخير
        usedLocalFallback = true;
        const chars = localResponse.text.split("");
        let i = 0;
        const streamInterval = setInterval(() => {
          if (i < chars.length) {
            const chunk = chars.slice(i, i + 3).join("");
            onChunk(chunk);
            i += 3;
          } else {
            clearInterval(streamInterval);
            onDone();
            // تنفيذ الإجراء المصاحب إن وجد
            if (localResponse.action === "glitch") {
              try { 
                const event = new CustomEvent("echo-local-action", { detail: { action: "glitch" } });
                window.dispatchEvent(event);
              } catch { /* */ }
            }
          }
        }, 15); // سرعة كتابة 15ms لكل 3 أحرف
        
        // تأكد من تنظيف الـ interval إذا تم إلغاء الطلب
        signal?.addEventListener("abort", () => {
          clearInterval(streamInterval);
        });
        
        return;
      }

      // ─── ERROR HANDLING ──────────────────────────────────────────
      if (e?.name === "AbortError") {
        if (firstByteTimer !== null) {
          onError("لم يتم الرد. أستخدم النظام المحلي للرد.");
        } else {
          onError("توقّف الرد. حاول مرة أخرى.");
        }
        return;
      }
      if (e?.message?.includes("Failed to fetch") || e?.message?.includes("NetworkError") || e?.message === "NO_BODY") {
        // This will be handled by the fallback above if we have a user message
        if (!lastUserMessage) {
          onError("لا يوجد اتصال. الرجاء المحاولة لاحقاً.");
        }
      } else {
        onError("حدث خطأ. جرب مجدداً.");
      }
    }
  })();

  return controller;
}