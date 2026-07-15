/**
 * Lazy loading utilities for 11.11
 * Ensures heavy components, audio, and visuals load only when needed.
 * Optimizes initial page load for Cloudflare Pages deployment.
 */

// ─── Speech Synthesis Lazy Load ──────────────────────────────────────────────

let voicesLoaded = false;
let voicesPromise: Promise<void> | null = null;

export function ensureVoicesLoaded(): Promise<void> {
  if (voicesLoaded) return Promise.resolve();
  if (voicesPromise) return voicesPromise;
  
  voicesPromise = new Promise((resolve) => {
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        resolve();
        return;
      }
      window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = true;
        resolve();
      };
      setTimeout(() => {
        voicesLoaded = true;
        resolve();
      }, 3000);
    } else {
      voicesLoaded = true;
      resolve();
    }
  });
  
  return voicesPromise;
}

// ─── Deferred Context Builder ────────────────────────────────────────────────

let deviceContextCache: string | null = null;

export function buildDeviceContextLazy(): string {
  if (deviceContextCache) return deviceContextCache;
  
  const parts: string[] = [];
  parts.push(`المنطقة الزمنية: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  parts.push(`اللغة: ${navigator.language}`);
  
  deviceContextCache = parts.join(" | ");
  
  requestIdleCallback(() => {
    const extra: string[] = [];
    extra.push(`الشاشة: ${screen.width}×${screen.height}`);
    const hour = new Date().getHours();
    const timeLabel = hour < 5 ? "منتصف الليل" : hour < 12 ? "الصباح" : hour < 17 ? "الظهر" : hour < 21 ? "المساء" : "الليل";
    extra.push(`الوقت: ${timeLabel} (${new Date().toLocaleTimeString("ar")})`);
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    if (mem) extra.push(`الذاكرة: ~${mem}GB`);
    const conn = (navigator as { connection?: { effectiveType?: string } }).connection;
    if (conn?.effectiveType) extra.push(`الاتصال: ${conn.effectiveType}`);
    extra.push(`النظام: ${navigator.platform || "مجهول"}`);
    deviceContextCache = parts.join(" | ") + " | " + extra.join(" | ");
  });
  
  return deviceContextCache;
}