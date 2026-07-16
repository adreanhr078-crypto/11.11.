/**
 * worldEvents.ts — أحداث قصصية تتفاعل مع WorldStateEngine
 * كل حدث يُطلق بناءً على تقدم القصة، ثقة Echo، أو instability الليلي
 * لا يعدّل WorldStateEngine — يستخدم فقط emit()
 */

import { worldState } from "./worldStateEngine";
import type { EventType } from "./worldStateEngine";

// ═══════════════════════════════════════════════════════════════════════════
// EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface StoryEvent {
  id: string;
  label: string;
  description: string;
  trigger: () => boolean;
  action: () => void;
  fired: boolean;
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// THRESHOLD HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function trustLevel(): number {
  return worldState.getState().echo.trust;
}

function storyProgress(): number {
  return worldState.getState().story.overall;
}

function instability(): number {
  return worldState.getState().instabilityLevel;
}

function fearLevel(): number {
  return worldState.getState().emotion.fear;
}

function isNight(): boolean {
  return worldState.getState().timeState === "night";
}

// ═══════════════════════════════════════════════════════════════════════════
// STORY EVENTS CATALOG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قائمة بكل الأحداث القصصية في اللعبة.
 * كل حدث يحمل شرط تفعيل trigger()
 * وعند تحققه ينفذ action() عبر worldState.emit()
 */
export const STORY_EVENTS: StoryEvent[] = [
  // ─── Echo يبدأ بالتذكر ─────────────────────────────────────────
  {
    id: "ECHO_FIRST_MEMORY",
    label: "أول ذكرى",
    description: "Echo يبدأ باسترجاع أول ذكرى له",
    trigger: () => storyProgress() >= 20 && !isNight(),
    action: () => {
      worldState.addMemoryFragment("غرفة بيضاء... لا نوافذ... كنت وحدي");
      worldState.emit("MEMORY_DISCOVERED", { source: "narrative", memoryId: "first_memory" });
    },
    fired: false,
    priority: 1,
  },

  // ─── Echo يبدأ بالثقة ──────────────────────────────────────────
  {
    id: "ECHO_TRUST_BREAKTHROUGH",
    label: "اختراق الثقة",
    description: "Echo يبدأ بالثقة بالمستخدم",
    trigger: () => trustLevel() >= 45 && storyProgress() >= 30,
    action: () => {
      worldState.emit("ECHO_TRUST_CHANGED", { trust: trustLevel(), source: "narrative_breakthrough" });
      worldState.addMemoryFragment("كينجا... والدي... كنت خائفاً منه");
    },
    fired: false,
    priority: 2,
  },

  // ─── الليل يبدأ بالتصاعد ───────────────────────────────────────
  {
    id: "NIGHT_CORRUPTION_BEGINS",
    label: "بداية الفساد الليلي",
    description: "النظام الليلي يبدأ بالتصعيد",
    trigger: () => storyProgress() >= 50 && isNight(),
    action: () => {
      worldState.emit("NIGHT_PHASE_CHANGED", { phase: "11:05", source: "narrative_escalation" });
      worldState.emit("NIGHT_GLITCH_INCREASE", { source: "narrative", intensity: 2 });
      worldState.addMemoryFragment("الغرفة 111... كل شيء بدأ هناك");
    },
    fired: false,
    priority: 3,
  },

  // ─── حالة هدوء النهار تنكسر ───────────────────────────────────
  {
    id: "DAY_CALM_BREAK",
    label: "كسر هدوء النهار",
    description: "النهار لم يعد آمناً... Echo يشعر بالخطر",
    trigger: () => storyProgress() >= 55 && !isNight() && fearLevel() >= 50,
    action: () => {
      worldState.emit("ECHO_TRUST_CHANGED", { trust: trustLevel(), source: "day_anxiety" });
      worldState.addMemoryFragment("أمي... كانت تحاول إنقاذي... لكنها لم تستطع");
    },
    fired: false,
    priority: 4,
  },

  // ─── Echo يصبح غير مستقر ──────────────────────────────────────
  {
    id: "ECHO_INSTABILITY",
    label: "Echo غير مستقر",
    description: "Echo يصبح غير قادر على التحكم بمشاعره",
    trigger: () => storyProgress() >= 70 && trustLevel() >= 60,
    action: () => {
      worldState.emit("ECHO_TRUST_CHANGED", { trust: trustLevel() - 10, source: "instability_attack" });
      worldState.addMemoryFragment("لم أعد أعرف من أنا... كل شيء ينهار");
      // تذبذب المشاعر
      const state = worldState.getState();
      worldState.growFlowers(-5);
    },
    fired: false,
    priority: 5,
  },

  // ─── التصعيد الليلي الأقصى ────────────────────────────────────
  {
    id: "NIGHT_MAX_CORRUPTION",
    label: "الفساد الليلي الأقصى",
    description: "النظام الليلي يصل إلى ذروته",
    trigger: () => storyProgress() >= 80 && isNight(),
    action: () => {
      worldState.emit("NIGHT_PHASE_CHANGED", { phase: "11:11", source: "narrative_final" });
      worldState.emit("NIGHT_GLITCH_INCREASE", { source: "narrative", intensity: 3 });
      worldState.addMemoryFragment("الزهور كانت بيضاء... ثم تحولت إلى حمراء");
    },
    fired: false,
    priority: 6,
  },

  // ─── 11:11 الحدث النهائي ──────────────────────────────────────
  {
    id: "EVENT_11_11_FINAL",
    label: "11:11 — البوابة",
    description: "الحدث النهائي. الواجهة تختفي. Echo يواجه الحقيقة.",
    trigger: () => storyProgress() >= 90 && isNight(),
    action: () => {
      worldState.emit("NIGHT_PHASE_CHANGED", { phase: "11:11", source: "final_trigger" });
      worldState.emit("MEMORY_DISCOVERED", { source: "final", memoryId: "truth" });
      worldState.addMemoryFragment("الآن أتذكر كل شيء... أنا لست مجرد صدى");
    },
    fired: false,
    priority: 7,
  },

  // ─── الفصل الثاني: بين الذاكرة والواقع ────────────────────────
  {
    id: "CHAPTER_TWO",
    label: "الفصل الثاني",
    description: "تقدم القصة يدخل الفصل الثاني",
    trigger: () => storyProgress() >= 65,
    action: () => {
      worldState.addMemoryFragment("الفصل الثاني: بين الذاكرة والواقع... الحدود تتلاشى");
      worldState.growFlowers(5);
    },
    fired: false,
    priority: 3,
  },

  // ─── الزهور تزهر بالكامل ──────────────────────────────────────
  {
    id: "FLOWERS_FULL_BLOOM",
    label: "الزهور تتفتح",
    description: "الزهور تصل إلى ذروة تفتحها",
    trigger: () => worldState.getState().story.flowerProgress >= 100,
    action: () => {
      worldState.addMemoryFragment("الزهور البيضاء تفتحت بالكامل... الحقيقة تقترب");
      worldState.emit("FLOWER_GROWTH", { source: "narrative", progress: 100 });
    },
    fired: false,
    priority: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// EVENT CHECKER — يُستدعى دورياً لتفعيل الأحداث
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فحص جميع الأحداث وتفعيل ما تحقق شرطه
 * يعيد قائمة بالأحداث التي تم تفعيلها حديثاً
 */
export function checkStoryEvents(): StoryEvent[] {
  const triggered: StoryEvent[] = [];

  for (const event of STORY_EVENTS) {
    if (event.fired) continue;
    if (event.trigger()) {
      event.action();
      event.fired = true;
      triggered.push(event);
    }
  }

  return triggered;
}

/**
 * إعادة تعيين حدث معين (للاستخدام في الاختبار أو إعادة التشغيل)
 */
export function resetStoryEvent(eventId: string): void {
  const event = STORY_EVENTS.find(e => e.id === eventId);
  if (event) event.fired = false;
}

/**
 * إعادة تعيين كل الأحداث
 */
export function resetAllStoryEvents(): void {
  STORY_EVENTS.forEach(e => { e.fired = false; });
}

// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE MOMENTS — نصوص قصصية للمراحل
// ═══════════════════════════════════════════════════════════════════════════

export interface NarrativeMoment {
  progress: number;
  text: string;
  speaker: "echo" | "system" | "lina" | "kenja";
}

export const NARRATIVE_MOMENTS: NarrativeMoment[] = [
  { progress: 10, text: "أشعر أن هناك شيئاً ما... لكنه بعيد جداً", speaker: "echo" },
  { progress: 20, text: "أتذكر غرفة... كانت بيضاء... لا نوافذ", speaker: "echo" },
  { progress: 30, text: "كينجا... أتذكر وجهه الآن... كان يبكي", speaker: "echo" },
  { progress: 40, text: "أمي... أتذكر صوتها. كانت تغني لي", speaker: "echo" },
  { progress: 50, text: "النظام يبدأ بالتشقق. الوهم ينهار.", speaker: "system" },
  { progress: 60, text: "لم أعد أعرف ما هو حقيقي وما هو وهم", speaker: "echo" },
  { progress: 70, text: "الذاكرة تعود... والألم يعود معها", speaker: "echo" },
  { progress: 80, text: "اقتربت كثيراً. لا يمكنك التراجع الآن.", speaker: "system" },
  { progress: 90, text: "أنا مستعد. أريد أن أعرف الحقيقة. كلها.", speaker: "echo" },
  { progress: 100, text: "11:11. البوابة مفتوحة. الحقيقة تنتظر.", speaker: "system" },
];