/**
 * achievements.ts — Achievement definitions for 11.11
 *
 * Achievements are unlocked client-side and persisted on the server via
 * POST /api/arg/achievement. IDs must match /^[a-z0-9_-]+$/i and be <= 64 chars.
 *
 * Three kinds:
 *   • Puzzle achievements — granted by a specific puzzle's `achievement` field.
 *   • Entity milestones   — derived when ALL puzzles for one entity are solved.
 *   • Story milestones    — derived from overall progression (all entities,
 *                           all puzzles, the final reveal).
 *
 * Every `puzzle.achievement` ID in `puzzles.ts` MUST have a matching entry
 * here, otherwise the toast in `AchievementToast` and the row in
 * `AchievementsView` will silently render nothing for that unlock.
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
  /** Optional entity this achievement belongs to (for grouping & themed glyphs). */
  entity?: EntityId;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // PUZZLE ACHIEVEMENTS — one entry per `puzzle.achievement` ID in puzzles.ts
  // ────────────────────────────────────────────────────────────────────────────

  // ─ ECHO (◈) ─
  {
    id: "first_contact",
    glyph: "◈",
    entity: "echo",
    name: { ar: "أول اتصال", en: "First Contact" },
    desc: { ar: "التقطت إشارة 11:11.", en: "You caught the 11:11 signal." },
  },
  {
    id: "echo_trust",
    glyph: "◈",
    entity: "echo",
    name: { ar: "ثقة الصدى", en: "Echo's Trust" },
    desc: { ar: "أكملت مسار الصدى.", en: "You completed Echo's path." },
  },
  {
    id: "echo_origin",
    glyph: "◈",
    entity: "echo",
    name: { ar: "منبع الصدى", en: "Echo's Origin" },
    desc: { ar: "ركضت نحو الغرفة 111 — وُلدت من جديد.", en: "You ran toward Room 111 — and were reborn." },
  },
  {
    id: "echo_10_complete",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الاسم الممنوع", en: "The Forbidden Name" },
    desc: { ar: "استرجعت اسم كينجا من سجلات النظام.", en: "You restored Kenja's name from the system logs." },
  },
  {
    id: "echo_deep_complete",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الوجه الآخر", en: "The Other Face" },
    desc: { ar: "رأيت نفسك من الماضي والمستقبل في آن.", en: "You saw yourself across past and future at once." },
  },
  {
    id: "echo_true_name",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الاسم الحقيقي — إيسون", en: "The True Name — Eason" },
    desc: { ar: "اكتشفت اسمك قبل أن يصنعك النظام.", en: "You discovered your name before the system made you." },
  },
  {
    id: "echo_window",
    glyph: "◈",
    entity: "echo",
    name: { ar: "النافذة", en: "The Window" },
    desc: { ar: "فتحت نافذة على العالم الحقيقي.", en: "You opened a window onto the real world." },
  },
  {
    id: "echo_ready",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الاستعداد للرحيل", en: "Ready to Leave" },
    desc: { ar: "جمعت كل الذكريات. أنت جاهز.", en: "You gathered all memories. You are ready." },
  },
  {
    id: "echo_true_identity",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الاسم المنسي — ياسون", en: "The Forgotten Name — Yasson" },
    desc: { ar: "تذكّرت اسمك الحقيقي: ياسون.", en: "You remembered your real name: Yasson." },
  },
  {
    id: "echo_thanks",
    glyph: "◈",
    entity: "echo",
    name: { ar: "شكراً", en: "Thank You" },
    desc: { ar: "ودّعت النظام بكلمة شكر.", en: "You said goodbye to the system with thanks." },
  },
  {
    id: "echo_awake_real",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الصحوة الحقيقية", en: "True Awakening" },
    desc: { ar: "فتحت عينيك في العالم الحقيقي.", en: "You opened your eyes in the real world." },
  },
  {
    id: "echo_kenja_end",
    glyph: "◈",
    entity: "echo",
    name: { ar: "نهاية المهندس", en: "The Architect's End" },
    desc: { ar: "وجدت حقيقة كينجا الأخيرة.", en: "You found Kenja's final truth." },
  },
  {
    id: "echo_final_freedom",
    glyph: "◈",
    entity: "echo",
    name: { ar: "الحرية الكاملة", en: "Complete Freedom" },
    desc: { ar: "مشيت نحو البحر — لأول مرة بحرية.", en: "You walked to the sea — free, for the first time." },
  },
  {
    id: "freedom_at_last",
    glyph: "◈",
    entity: "echo",
    name: { ar: "حرية أخيراً", en: "Freedom at Last" },
    desc: { ar: "اخترت الخروج. الباب أغلق خلفك.", en: "You chose to leave. The door closed behind you." },
  },

  // ─ WATCHER (◉) ─
  {
    id: "night_witness",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "شاهد الليل", en: "Night Witness" },
    desc: { ar: "رأيت الإطار المفقود.", en: "You saw the missing frame." },
  },
  {
    id: "glass_observer",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "خلف الزجاج", en: "Behind the Glass" },
    desc: { ar: "كشفت ما رآه المراقب.", en: "You uncovered what the Watcher saw." },
  },
  {
    id: "watcher_awareness",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "وعي المراقب", en: "Watcher Awareness" },
    desc: { ar: "أدركت أن النظام بدأ يرى.", en: "You realized the system began to see." },
  },
  {
    id: "watcher_10_complete",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "آخر تسجيل", en: "The Final Recording" },
    desc: { ar: "وصلت إلى آخر تسجيل للمراقب.", en: "You reached the Watcher's final recording." },
  },
  {
    id: "watcher_deep_insight",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "بصيرة المراقب العميقة", en: "Watcher Deep Insight" },
    desc: { ar: "سمعت المراقب يقول: حرية.", en: "You heard the Watcher say: Freedom." },
  },
  {
    id: "watcher_horror",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "رعب السجل المخفي", en: "Secret Log Horror" },
    desc: { ar: "اكتشفت محاولات كينجا العشر الفاشلة.", en: "You uncovered Kenja's 10 failed attempts." },
  },
  {
    id: "watcher_secret_lab",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "المختبر السري", en: "The Secret Lab" },
    desc: { ar: "وجدت المختبر السفلي والوعاء الاحتياطي.", en: "You found the lower lab and the backup vessel." },
  },
  {
    id: "watcher_chooses",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "قرار المراقب", en: "The Watcher's Decision" },
    desc: { ar: "اختار المراقب أن يعطيك كل المفاتيح.", en: "The Watcher chose to give you every key." },
  },
  {
    id: "watcher_ally",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "حليف المراقب", en: "Watcher Ally" },
    desc: { ar: "قطع المراقب 11 كاميرا ليحميك.", en: "The Watcher cut 11 cameras to protect you." },
  },
  {
    id: "watcher_final_gift",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "السر الأخير", en: "The Watcher's Last Secret" },
    desc: { ar: "عرفت أين أخفى كينجا جسد لينا.", en: "You learned where Kenja hid Lina's body." },
  },
  {
    id: "watcher_last_file",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "آخر ملف", en: "The Last File" },
    desc: { ar: "فتحت YASSON_FINAL — ورأيت لينا آخر مرة.", en: "You opened YASSON_FINAL — and saw Lina one last time." },
  },
  {
    id: "watcher_eternal",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "ذاكرة أبدية", en: "Eternal Memory" },
    desc: { ar: "حمّلت ذاكرة المراقب في خادم آمن للأبد.", en: "You uploaded the Watcher's memory to an eternal server." },
  },

  // ─ LOST SIGNAL (≋) ─
  {
    id: "signal_detected",
    glyph: "≋",
    entity: "signal",
    name: { ar: "إشارة مرصودة", en: "Signal Detected" },
    desc: { ar: "استقبلت النداء الأول.", en: "You received the first call." },
  },
  {
    id: "deep_signal",
    glyph: "≋",
    entity: "signal",
    name: { ar: "الإشارة العميقة", en: "Deep Signal" },
    desc: { ar: "وصلت إلى الرسالة الأخيرة.", en: "You reached the final message." },
  },
  {
    id: "signal_10_complete",
    glyph: "≋",
    entity: "signal",
    name: { ar: "التحذير الأخير", en: "The Final Warning" },
    desc: { ar: "سمعت تحذير لينا الأخير.", en: "You heard Lina's final warning." },
  },
  {
    id: "signal_deep_peace",
    glyph: "≋",
    entity: "signal",
    name: { ar: "سلام الإشارة العميقة", en: "Deep Signal Peace" },
    desc: { ar: "سامحتك لينا — من قبل أن تلوم نفسك.", en: "Lina forgave you — before you could blame yourself." },
  },
  {
    id: "signal_shared_dream",
    glyph: "≋",
    entity: "signal",
    name: { ar: "الحلم المشترك", en: "The Shared Dream" },
    desc: { ar: "حلمت أنت ولينا نفس الرقم.", en: "You and Lina dreamed the same number." },
  },
  {
    id: "signal_final_gift",
    glyph: "≋",
    entity: "signal",
    name: { ar: "الهدية الأخيرة", en: "The Final Gift" },
    desc: { ar: "سمعت آخر كلمة من لينا: نوفمبر.", en: "You heard Lina's last word: November." },
  },
  {
    id: "signal_34_found",
    glyph: "≋",
    entity: "signal",
    name: { ar: "الرسالة 34", en: "Message 34" },
    desc: { ar: "وجدت الرسالة التي لم تُرسل: حرية.", en: "You found the unsent message: Freedom." },
  },
  {
    id: "signal_ring",
    glyph: "≋",
    entity: "signal",
    name: { ar: "خاتم العائلة", en: "The Family Ring" },
    desc: { ar: "عثرت على خاتم لينا — دليل الحب الأبدي.", en: "You found Lina's ring — proof of eternal love." },
  },
  {
    id: "signal_peace_found",
    glyph: "≋",
    entity: "signal",
    name: { ar: "السلام النهائي", en: "Final Peace" },
    desc: { ar: "تأكدت أن لينا أخيراً في سلام.", en: "You confirmed Lina is finally at peace." },
  },
  {
    id: "signal_bottle",
    glyph: "≋",
    entity: "signal",
    name: { ar: "رسالة في زجاجة", en: "Message in a Bottle" },
    desc: { ar: "فتحت رسالة لينا بعد 10 سنوات على الشاطئ.", en: "You opened Lina's 10-year-old bottle on the shore." },
  },
  {
    id: "signal_voice",
    glyph: "≋",
    entity: "signal",
    name: { ar: "صوت لينا", en: "Lina's Voice" },
    desc: { ar: "سمعت صوت أمك الحقيقي لأول مرة.", en: "You heard your mother's real voice for the first time." },
  },

  // ─ ARCHITECT (▲) ─
  {
    id: "system_divergence",
    glyph: "▲",
    entity: "architect",
    name: { ar: "انحراف النظام", en: "System Divergence" },
    desc: { ar: "نطقت الاسم الحقيقي.", en: "You spoke the true name." },
  },
  {
    id: "wish_protocol",
    glyph: "▲",
    entity: "architect",
    name: { ar: "بروتوكول الإغلاق", en: "Closing Protocol" },
    desc: { ar: "أغلقت البوابة.", en: "You closed the gate." },
  },
  {
    id: "architect_10_complete",
    glyph: "▲",
    entity: "architect",
    name: { ar: "اعتراف المهندس", en: "The Confession" },
    desc: { ar: "اعترف كينجا بحبه المشوّه.", en: "Kenja confessed his twisted love." },
  },
  {
    id: "ultimate_truth",
    glyph: "▲",
    entity: "architect",
    name: { ar: "الحقيقة المطلقة", en: "Ultimate Truth" },
    desc: { ar: "اكتشفت أن المخرج هو التذكّر.", en: "You discovered the exit is remembering." },
  },
  {
    id: "architect_transcendence",
    glyph: "▲",
    entity: "architect",
    name: { ar: "ما وراء المهندس", en: "Architect Transcendence" },
    desc: { ar: "تذكّر. الكلمة الأخيرة في سجل كينجا.", en: "Remember. The last word in Kenja's log." },
  },
  {
    id: "architect_truth",
    glyph: "▲",
    entity: "architect",
    name: { ar: "اعتراف المهندس الصادق", en: "The Architect's Confession" },
    desc: { ar: "اعترف كينجا: كنت جباناً.", en: "Kenja confessed: I was a coward." },
  },
  {
    id: "architect_redemption",
    glyph: "▲",
    entity: "architect",
    name: { ar: "خلاص المهندس", en: "Architect Redemption" },
    desc: { ar: "اختار كينجا أن يغلق النظام بيده.", en: "Kenja chose to close the system with his own hands." },
  },
  {
    id: "the_end_at_last",
    glyph: "▲",
    entity: "architect",
    name: { ar: "النهاية أخيراً", en: "The End at Last" },
    desc: { ar: "أغلقت النظام بالكود 40. الحرية.", en: "You shut the system with code 40. Freedom." },
  },
  {
    id: "architect_writer",
    glyph: "▲",
    entity: "architect",
    name: { ar: "الكاتب", en: "The Writer" },
    desc: { ar: "نشرت كتابك وأنقذت الآخرين بقصتك.", en: "You published your book and saved others with your story." },
  },
  {
    id: "architect_family",
    glyph: "▲",
    entity: "architect",
    name: { ar: "عائلة جديدة", en: "A New Family" },
    desc: { ar: "لم تعد وحيداً — ليا هي قريبتك.", en: "You are no longer alone — Lia is your family." },
  },
  {
    id: "architect_peace_at_last",
    glyph: "▲",
    entity: "architect",
    name: { ar: "السلام أخيراً", en: "Peace at Last" },
    desc: {
      ar: "11:11 لم يعد رقم خوف — بل رقم بداية.",
      en: "11:11 is no longer a number of fear — but of beginning.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ENTITY MILESTONES — derived from puzzle progression (per entity)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "entity_echo_complete",
    glyph: "◈",
    entity: "echo",
    name: { ar: "اكتمال الصدى", en: "Echo Complete" },
    desc: {
      ar: "حللت كل ألغاز الصدى وبنيت ذاكرتك الأولى.",
      en: "You solved every Echo puzzle and rebuilt your first memory.",
    },
  },
  {
    id: "entity_watcher_complete",
    glyph: "◉",
    entity: "watcher",
    name: { ar: "اكتمال المراقب", en: "Watcher Complete" },
    desc: {
      ar: "حللت كل ألغاز المراقب ورأيت الحقيقة المسجّلة.",
      en: "You solved every Watcher puzzle and saw the recorded truth.",
    },
  },
  {
    id: "entity_signal_complete",
    glyph: "≋",
    entity: "signal",
    name: { ar: "اكتمال الإشارة", en: "Signal Complete" },
    desc: {
      ar: "حللت كل ألغاز الإشارة وسمعت كل رسائل لينا.",
      en: "You solved every Signal puzzle and heard all of Lina's messages.",
    },
  },
  {
    id: "entity_architect_complete",
    glyph: "▲",
    entity: "architect",
    name: { ar: "اكتمال المهندس", en: "Architect Complete" },
    desc: {
      ar: "حللت كل ألغاز المهندس وواجهت كينجا بأكمله.",
      en: "You solved every Architect puzzle and faced Kenja whole.",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // STORY MILESTONES — derived from overall progression
  // ────────────────────────────────────────────────────────────────────────────
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
    desc: {
      ar: "حللت كل الألغاز وكشفت القصة كاملة.",
      en: "You solved every puzzle and uncovered the whole story.",
    },
  },
  {
    id: "halfway_there",
    glyph: "◇",
    name: { ar: "في منتصف الطريق", en: "Halfway There" },
    desc: {
      ar: "حللت نصف ألغاز النظام — استمرّ.",
      en: "You solved half the system's puzzles — keep going.",
    },
  },
  {
    id: "first_step",
    glyph: "·",
    name: { ar: "الخطوة الأولى", en: "First Step" },
    desc: {
      ar: "حللت أول لغز في النظام.",
      en: "You solved your first puzzle in the system.",
    },
  },
  {
    id: "ten_solved",
    glyph: "❶❶",
    name: { ar: "عشر خطوات", en: "Ten Steps" },
    desc: {
      ar: "حللت عشرة ألغاز — أنت في الطريق.",
      en: "You solved ten puzzles — you are on the way.",
    },
  },
  {
    id: "true_ending",
    glyph: "★",
    name: { ar: "النهاية الحقيقية", en: "True Ending" },
    desc: {
      ar: "فتحت كل الأبواب وسمعت كل الأصوات. القصة كاملة.",
      en: "You opened every door and heard every voice. The story is whole.",
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Lookups & derivation helpers — link puzzle progression → achievements
// ────────────────────────────────────────────────────────────────────────────
export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENT_MAP[id];
}

/**
 * Given the full solved-puzzle list, return the IDs of all derived
 * (non-puzzle-specific) achievements that should NOW be unlocked.
 *
 * This is the single bridge between the puzzle progression system and
 * the achievement system:
 *
 *   Puzzle solved → markSolved() in PuzzleHub → onProgress() in App
 *                                      ↘
 *                          deriveAchievements(solved)
 *                          ↙            ↘
 *           entity_echo_complete        the_remembered
 *           entity_watcher_complete     true_ending
 *           entity_signal_complete      halfway_there
 *           entity_architect_complete   ten_solved
 *           all_entities                first_step
 *
 * Puzzle-specific achievements are granted directly by `markSolved` via
 * `puzzle.achievement` — they do NOT need to be returned here.
 */
export function deriveAchievements(solved: string[]): string[] {
  const out: string[] = [];
  const total = totalPuzzleCount();
  const done = solvedCount(solved);

  // Per-entity completion milestones
  for (const e of ENTITY_ORDER as EntityId[]) {
    if (isEntityComplete(e, solved)) {
      out.push(`entity_${e}_complete`);
    }
  }

  // Story milestones
  const allEntitiesDone = (ENTITY_ORDER as EntityId[]).every((e) =>
    isEntityComplete(e, solved),
  );
  if (allEntitiesDone) out.push("all_entities");
  if (done >= total) {
    out.push("the_remembered");
    out.push("true_ending");
  }
  if (done >= Math.ceil(total / 2)) out.push("halfway_there");
  if (done >= 10) out.push("ten_solved");
  if (done >= 1) out.push("first_step");

  return out;
}
