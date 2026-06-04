/**
 * achievements.ts — Achievement definitions for 11.11
 *
 * Achievements are unlocked client-side and persisted on the server via
 * POST /api/arg/achievement. IDs must match /^[a-z0-9_-]+$/i and be <= 64 chars.
 *
 * Two kinds:
 *   • Puzzle achievements — granted by a specific puzzle's `achievement` field.
 *   • Milestone achievements — derived from progression (entity complete, all solved).
 */

import {
  ENTITY_ORDER,
  isEntityComplete,
  solvedCount,
  totalPuzzleCount,
  type EntityId,
} from "./puzzles";

export interface Achievement {
  id: string;
  glyph: string;
  name: { ar: string; en: string };
  desc: { ar: string; en: string };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Puzzle achievements ──────────────────────────────────────────────────
  {
    id: "first_contact",
    glyph: "◈",
    name: { ar: "أول اتصال", en: "First Contact" },
    desc: { ar: "التقطت إشارة 11:11.", en: "You caught the 11:11 signal." },
  },
  {
    id: "echo_trust",
    glyph: "◈",
    name: { ar: "ثقة الصدى", en: "Echo's Trust" },
    desc: { ar: "أكملت مسار الصدى.", en: "You completed Echo's path." },
  },
  {
    id: "night_witness",
    glyph: "◉",
    name: { ar: "شاهد الليل", en: "Night Witness" },
    desc: { ar: "رأيت الإطار المفقود.", en: "You saw the missing frame." },
  },
  {
    id: "glass_observer",
    glyph: "◉",
    name: { ar: "خلف الزجاج", en: "Behind the Glass" },
    desc: { ar: "كشفت ما رآه المراقب.", en: "You uncovered what the Watcher saw." },
  },
  {
    id: "signal_detected",
    glyph: "≋",
    name: { ar: "إشارة مرصودة", en: "Signal Detected" },
    desc: { ar: "استقبلت النداء الأول.", en: "You received the first call." },
  },
  {
    id: "deep_signal",
    glyph: "≋",
    name: { ar: "الإشارة العميقة", en: "Deep Signal" },
    desc: { ar: "وصلت إلى الرسالة الأخيرة.", en: "You reached the final message." },
  },
  {
    id: "system_divergence",
    glyph: "▲",
    name: { ar: "انحراف النظام", en: "System Divergence" },
    desc: { ar: "نطقت الاسم الحقيقي.", en: "You spoke the true name." },
  },
  {
    id: "wish_protocol",
    glyph: "▲",
    name: { ar: "بروتوكول الإغلاق", en: "Closing Protocol" },
    desc: { ar: "أغلقت البوابة.", en: "You closed the gate." },
  },

  // ── Milestone achievements ───────────────────────────────────────────────
  {
    id: "all_entities",
    glyph: "✦",
    name: { ar: "كل الأصوات", en: "Every Voice" },
    desc: { ar: "واجهت الكيانات الأربعة كلها.", en: "You faced all four entities." },
  },
  {
    id: "the_remembered",
    glyph: "✦",
    name: { ar: "المتذكِّر", en: "The One Who Remembered" },
    desc: { ar: "حللت كل الألغاز وكشفت القصة كاملة.", en: "You solved every puzzle and uncovered the whole story." },
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENT_MAP[id];
}

/**
 * Given the full solved-puzzle list, return milestone achievement IDs that should
 * now be unlocked (does not include per-puzzle achievements — those are granted
 * directly when a puzzle is solved).
 */
export function deriveMilestoneAchievements(solved: string[]): string[] {
  const out: string[] = [];
  const allEntitiesDone = (ENTITY_ORDER as EntityId[]).every((e) =>
    isEntityComplete(e, solved),
  );
  if (allEntitiesDone) out.push("all_entities");
  if (solvedCount(solved) >= totalPuzzleCount()) out.push("the_remembered");
  return out;
}
