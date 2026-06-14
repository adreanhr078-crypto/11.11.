/**
 * narrativeEngine.ts — محرك السرد القصصي
 * يتحكم بتقدم القصة ويربط WorldStateEngine بمنطق السرد
 * كل الأنظمة (Day/Night/Echo) تقرأ منه فقط
 * لا يعدّل WorldStateEngine — يستخدم emit() لتغيير الحالة
 */

import { worldState } from "./worldStateEngine";
import { checkStoryEvents, NARRATIVE_MOMENTS, type NarrativeMoment } from "./worldEvents";

// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface NarrativeState {
  currentChapter: number;
  chapterLabel: string;
  activeMoment: NarrativeMoment | null;
  pendingEvents: number;
  escalationLevel: "calm" | "building" | "intense" | "critical";
}

const CHAPTERS: Record<number, string> = {
  1: "الفصل الأول: الصدى",
  2: "الفصل الثاني: بين الذاكرة والواقع",
  3: "الفصل الثالث: الحقيقة المكسورة",
  4: "الفصل الرابع: المواجهة",
  5: "الفصل الأخير: 11:11",
};

// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

class NarrativeEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: NarrativeState) => void> = new Set();

  // ─── بدء/إيقاف المحرك ──────────────────────────────────────────────

  start(): void {
    if (this.intervalId) return;
    
    // فحص الأحداث كل 5 ثوانٍ
    this.intervalId = setInterval(() => {
      this.tick();
    }, 5000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ─── الدورة الرئيسية ───────────────────────────────────────────────

  private tick(): void {
    // 1. فحص الأحداث القصصية
    const triggered = checkStoryEvents();
    
    // 2. حساب حالة السرد
    const narrativeState = this.computeNarrativeState(triggered.length);
    
    // 3. تحديث التصعيد حسب الوقت
    this.updateEscalation();
    
    // 4. إعلام المستمعين
    this.listeners.forEach(l => l(narrativeState));
  }

  // ─── حساب حالة السرد ───────────────────────────────────────────────

  private computeNarrativeState(pendingEvents: number): NarrativeState {
    const progress = worldState.getState().story.overall;
    
    // تحديد الفصل
    let currentChapter = 1;
    if (progress >= 80) currentChapter = 5;
    else if (progress >= 65) currentChapter = 4;
    else if (progress >= 50) currentChapter = 3;
    else if (progress >= 30) currentChapter = 2;

    // تحديد اللحظة السردية النشطة
    const activeMoment = NARRATIVE_MOMENTS
      .filter(m => m.progress <= progress)
      .slice(-1)[0] || null;

    // تحديد مستوى التصعيد
    let escalationLevel: NarrativeState["escalationLevel"] = "calm";
    if (progress >= 80) escalationLevel = "critical";
    else if (progress >= 55) escalationLevel = "intense";
    else if (progress >= 30) escalationLevel = "building";

    return {
      currentChapter,
      chapterLabel: CHAPTERS[currentChapter] || "المجهول",
      activeMoment,
      pendingEvents,
      escalationLevel,
    };
  }

  // ─── تصعيد تلقائي ──────────────────────────────────────────────────

  private updateEscalation(): void {
    const state = worldState.getState();
    
    // كلما زاد instability، يزيد الخوف تلقائياً
    if (state.instabilityLevel >= 2 && state.timeState === "night") {
      // الخوف يتصاعد ببطء في الليل
      if (Math.random() < 0.1) {
        worldState.emit("NIGHT_GLITCH_INCREASE", { source: "narrative_engine" });
      }
    }

    // كلما زادت ثقة Echo، يزيد تقدم القصة تلقائياً
    if (state.echo.trust >= 50 && state.story.overall < 30) {
      worldState.emit("DAY_PROGRESS", { source: "narrative_auto" });
    }
  }

  // ─── الاشتراك ──────────────────────────────────────────────────────

  subscribe(listener: (state: NarrativeState) => void): () => void {
    this.listeners.add(listener);
    listener(this.computeNarrativeState(0));
    return () => this.listeners.delete(listener);
  }

  // ─── دليل السرد (Documentation) ────────────────────────────────────

  getNarrativeGuide(): string {
    const progress = worldState.getState().story.overall;
    const state = this.computeNarrativeState(0);

    return `
📖 ${state.chapterLabel}
━━━━━━━━━━━━━━━━━━
التقدم: ${progress}%
التصعيد: ${state.escalationLevel}
الأحداث المعلقة: ${state.pendingEvents}

${state.activeMoment ? `📜 "${state.activeMoment.text}" — ${state.activeMoment.speaker}` : ""}

🔗 الربط:
  المحادثة → الألغاز → الذكريات → الزهور → النهايات
    `.trim();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

export const narrativeEngine = new NarrativeEngine();