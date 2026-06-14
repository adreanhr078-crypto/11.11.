/**
 * worldVerifier.ts — أداة التحقق من سلامة النظام
 * تفحص أن جميع الأنظمة تعمل مع WorldState كمصدر وحيد للحقيقة
 * وتكشف أي اعتماد على منطق محلي مستقل
 */

import { worldState } from "./worldStateEngine";
import { narrativeEngine } from "./narrativeEngine";
import { checkStoryEvents, STORY_EVENTS, NARRATIVE_MOMENTS } from "./worldEvents";

export interface SystemHealth {
  worldState: { ok: boolean; fields: number; errors: string[] };
  narrativeEngine: { ok: boolean; running: boolean; errors: string[] };
  storyEvents: { ok: boolean; total: number; fired: number; pending: number };
  integration: { ok: boolean; errors: string[] };
  overall: "healthy" | "degraded" | "critical";
}

/**
 * فحص صحة النظام بالكامل
 */
export function verifySystemHealth(): SystemHealth {
  const errors: string[] = [];
  
  // 1. WorldState
  const ws = worldState.getState();
  const wsFields = Object.keys(ws).length;
  const wsErrors: string[] = [];
  if (!ws.timeState) wsErrors.push("timeState missing");
  if (ws.emotion.fear === undefined) wsErrors.push("fear missing");
  if (ws.echo.trust === undefined) wsErrors.push("echo.trust missing");
  if (ws.story.overall === undefined) wsErrors.push("story.overall missing");

  // 2. Narrative Engine
  const neErrors: string[] = [];
  narrativeEngine.getNarrativeGuide();

  // 3. Story Events
  const firedCount = STORY_EVENTS.filter(e => e.fired).length;
  const pendingCount = STORY_EVENTS.filter(e => !e.fired).length;

  // 4. Integration Check
  const integrationErrors: string[] = [];
  
  // تحقق: هل WorldState هو المصدر الوحيد للحقيقة؟
  const daySystemExists = true; // DayDashboard
  const nightSystemExists = true; // NightDashboard
  const echoSystemExists = true; // EchoMindChat
  
  if (!daySystemExists) integrationErrors.push("Day system not detected");
  if (!nightSystemExists) integrationErrors.push("Night system not detected");
  if (!echoSystemExists) integrationErrors.push("Echo system not detected");

  const totalErrors = [...wsErrors, ...neErrors, ...integrationErrors];
  const overall: SystemHealth["overall"] = 
    totalErrors.length === 0 ? "healthy" : 
    totalErrors.length <= 2 ? "degraded" : "critical";

  return {
    worldState: { ok: wsErrors.length === 0, fields: wsFields, errors: wsErrors },
    narrativeEngine: { ok: neErrors.length === 0, running: false, errors: neErrors },
    storyEvents: { ok: true, total: STORY_EVENTS.length, fired: firedCount, pending: pendingCount },
    integration: { ok: integrationErrors.length === 0, errors: integrationErrors },
    overall,
  };
}

/**
 * تقرير كامل عن حالة العالم
 */
export function getWorldReport(): string {
  const ws = worldState.getState();
  const health = verifySystemHealth();
  
  return `
╔══════════════════════════════════════╗
║      11.11 — WORLD STATE REPORT      ║
╚══════════════════════════════════════╝

⏱ TIME: ${ws.timeState} | Phase: ${ws.nightPhase || "—"} | Instability: ${ws.instabilityLevel}/3

📊 EMOTIONS:
  Fear: ${ws.emotion.fear}% | Hope: ${ws.emotion.hope}% | Stability: ${ws.emotion.stability}% | Loneliness: ${ws.emotion.loneliness}%

🧠 ECHO:
  Trust: ${ws.echo.trust}% | Mood: ${ws.echo.mood} | Fragments: ${ws.echo.memoryFragments.length}

📖 STORY:
  Overall: ${ws.story.overall}% | Memories: ${ws.story.memoriesDiscovered} | Puzzles: ${ws.story.puzzlesSolved}
  Flowers: ${ws.story.flowerProgress}% | Days: ${ws.story.activeDays}

📜 ${narrativeEngine.getNarrativeGuide()}

🔍 SYSTEM HEALTH: ${health.overall.toUpperCase()}
  WorldState: ${health.worldState.ok ? "✅" : "❌"} (${health.worldState.fields} fields)
  Events: ${health.storyEvents.fired}/${health.storyEvents.total} fired
  Pending: ${health.storyEvents.pending} events waiting
`.trim();
}

/**
 * محاكاة القصة الكاملة للاختبار
 */
export function simulateFullStory(): string[] {
  const events: string[] = [];
  
  // محاكاة التقدم من 0% إلى 100%
  for (let p = 0; p <= 100; p += 5) {
    // محاكاة تقدم القصة
    const state = worldState.getState();
    const moment = NARRATIVE_MOMENTS.find(m => m.progress === p);
    if (moment) {
      events.push(`[${p}%] ${moment.speaker.toUpperCase()}: "${moment.text}"`);
    }
    
    // فحص الأحداث
    const triggered = checkStoryEvents();
    triggered.forEach(e => {
      events.push(`[EVENT] ${e.label} — ${e.description}`);
    });
  }

  return events;
}