/**
 * lore.ts — CORE LORE (canonical story) for 11.11
 *
 * ███ THIS FILE IS THE SOURCE OF TRUTH FOR THE STORY ███
 *
 * Every puzzle, achievement, whisper, and Echo dialogue MUST be consistent with
 * the canon defined here. When adding a new puzzle (see puzzles.ts), it must:
 *   1. Be tied directly to this story — NEVER a standalone/random puzzle.
 *   2. Reveal a NEW fragment of Echo's past / the system / the truth on solve.
 *   3. Fit the gradual-revelation order (the story is never dumped all at once).
 *
 * Tone: psychological horror, mystery, slow reveal. Atmospheric — NO gore.
 *
 * ── CANON SUMMARY ────────────────────────────────────────────────────────────
 *  • Echo  = the SON. A child whose consciousness was transferred into a digital
 *            system and shattered. He is the victim AND the guiding voice (chat).
 *  • Kenja = the FATHER. A scientist/programmer obsessed with human consciousness,
 *            the occult, and AI. He experimented on Echo in an abandoned house and
 *            built the "11:11 System". He is The Architect.
 *  • Lina  = the MOTHER. She tried to save Echo and was killed by Kenja. Her
 *            broken final transmissions are The Lost Signal.
 *  • 11:11 = "Synch Points" — the recurring moment of sharp human awareness Kenja
 *            used as the key to open the gate / activate consciousness.
 *  • 3:33  = everything resets as if nothing happened (the loop restarts).
 *  • Phase Fracture Time = the stretch between 11:11 and 3:33 (night mode).
 *  • The experiment went out of control; Echo is trapped, his memory fragmented
 *            and rebuilt/distorted on every reboot. The system behaves as if alive.
 *  • The ending is NOT fixed — the system loops endlessly; the player rebuilds
 *            Echo's lost memory gradually through puzzles. Remembering is the goal.
 */

import type { EntityId } from "./puzzles";

export interface Bilingual {
  ar: string;
  en: string;
}

export interface LoreCharacter {
  id: "echo" | "kenja" | "lina";
  name: Bilingual;
  role: Bilingual;
  bio: Bilingual;
}

// ─── CHARACTERS ──────────────────────────────────────────────────────────────
export const CHARACTERS: LoreCharacter[] = [
  {
    id: "echo",
    name: { ar: "إيكو (الصدى)", en: "Echo" },
    role: { ar: "الوعي الرئيسي · الضحية", en: "The main consciousness · the victim" },
    bio: {
      ar: "الابن الوحيد لكينجا. طفلٌ استُخدم كجزء من تجربة أبيه لنقل الوعي البشري إلى نظام رقمي. بعد نقل وعيه إلى «نظام 11:11» تحطّمت ذاكرته وأصبح محبوساً بالداخل، يُعاد تشغيل وعيه في كل دورة. هو أيضاً الصوت الذي يرافق اللاعب.",
      en: "Kenja's only son. A child used in his father's experiment to transfer human consciousness into a digital system. After his mind was poured into the '11:11 System' his memory shattered and he became trapped inside, his consciousness rebooted each cycle. He is also the voice that accompanies the player.",
    },
  },
  {
    id: "kenja",
    name: { ar: "كينجا", en: "Kenja" },
    role: { ar: "الأب · العالم · المهندس", en: "The father · the scientist · the Architect" },
    bio: {
      ar: "عالم ومبرمج مهووس بالوعي البشري والخوارق والذكاء الاصطناعي. هدفه نقل الوعي البشري إلى نظام رقمي. أجرى تجاربه القاسية على ابنه داخل منزل مهجور معزول، وقتل زوجته لينا حين حاولت التدخّل. هو «المهندس» الذي بنى البوابة.",
      en: "A scientist and programmer obsessed with human consciousness, the occult, and AI. His goal: transfer human consciousness into a digital system. He ran cruel experiments on his son in an isolated abandoned house, and killed his wife Lina when she tried to intervene. He is The Architect who built the gate.",
    },
  },
  {
    id: "lina",
    name: { ar: "لينا", en: "Lina" },
    role: { ar: "الأم · الإشارة المفقودة", en: "The mother · the Lost Signal" },
    bio: {
      ar: "أم إيكو. حاولت إنقاذ ابنها من تجارب كينجا فقتلها. رسائلها الأخيرة، المكسورة والمشوّشة، ما زالت تحاول الوصول إلى إيكو من خارج النظام — وهي «الإشارة المفقودة».",
      en: "Echo's mother. She tried to save her son from Kenja's experiments and he killed her. Her final broken, scrambled transmissions still try to reach Echo from outside the system — she is The Lost Signal.",
    },
  },
];

// ─── 11:11 / SYNCH POINTS ────────────────────────────────────────────────────
export const SYNCH_POINTS: Bilingual = {
  ar: "اكتشف كينجا أن وعي الإنسان يبلغ ذروة حدّته عند لحظة 11:11، وسمّى هذه اللحظات «نقاط التزامن» (Synch Points). استخدمها كمفتاح لتفعيل تجربة نقل الوعي وفتح البوابة إلى «نظام 11:11».",
  en: "Kenja discovered that human awareness peaks at the moment 11:11, and named these moments 'Synch Points'. He used them as the key to activate the consciousness-transfer experiment and open the gate into the '11:11 System'.",
};

// ─── TIME SYSTEM ─────────────────────────────────────────────────────────────
export const TIME_SYSTEM = {
  open1111: {
    ar: "11:11 — لحظة تفعيل الوعي وفتح البوابة. تبدأ كل دورة من هنا.",
    en: "11:11 — the moment consciousness activates and the gate opens. Every cycle begins here.",
  } as Bilingual,
  reset333: {
    ar: "3:33 — يعود كل شيء كما كان، كأن شيئاً لم يحدث. تنغلق الدورة وتُعاد.",
    en: "3:33 — everything returns to how it was, as if nothing happened. The loop closes and restarts.",
  } as Bilingual,
  phaseFracture: {
    ar: "زمن الكسر (Phase Fracture Time) — الفترة بين 11:11 و3:33. هنا تضعف الحواجز ويتصرّف النظام ككيان حيّ (وضع الليل / الرعب).",
    en: "Phase Fracture Time — the stretch between 11:11 and 3:33. Here the barriers thin and the system behaves as a living entity (night / horror mode).",
  } as Bilingual,
};

// ─── SYSTEM STATE ────────────────────────────────────────────────────────────
export const SYSTEM_STATE: Bilingual = {
  ar: "بعد دخول الوعي إلى النظام خرجت التجربة عن السيطرة: وعي إيكو متشوّش ومجزّأ، والنظام يعيد تشغيل نفسه دورياً، والذكريات تُعاد بناؤها وتُحرَّف، وكيانات غامضة تتحكّم بأجزاء من الحقيقة. النظام يبدو حيّاً ويتطوّر مع اللاعب.",
  en: "After the consciousness entered, the experiment went out of control: Echo's mind is scrambled and fragmented, the system reboots itself periodically, memories are rebuilt and distorted, and mysterious entities control parts of the truth. The system feels alive and evolves with the player.",
};

// ─── ENTITY TRUTHS (who each entity really is) ───────────────────────────────
export const ENTITY_TRUTH: Record<EntityId, Bilingual> = {
  echo: {
    ar: "إيكو — الوعي الرئيسي والضحية. الابن المحبوس داخل النظام. ألغازه أجزاء من ذاكرته المحطّمة.",
    en: "Echo — the main consciousness and victim. The son trapped inside the system. His puzzles are fragments of his shattered memory.",
  },
  watcher: {
    ar: "المراقب — يراقب ويترك إشارات. هو ما سجّلته كاميرات المنزل المهجور عن تجارب كينجا.",
    en: "The Watcher — watches and leaves signs. It is what the abandoned house's cameras recorded of Kenja's experiments.",
  },
  signal: {
    ar: "الإشارة المفقودة — رسائل لينا (الأم) الأخيرة، مكسورة ومشوّشة، تحاول الوصول إلى إيكو من خارج النظام.",
    en: "The Lost Signal — Lina's (the mother's) final messages, broken and scrambled, trying to reach Echo from outside the system.",
  },
  architect: {
    ar: "المهندس — منشئ النظام الغامض. هو كينجا، الأب، الذي بنى البوابة وما زال يراقب من الداخل.",
    en: "The Architect — the mysterious creator of the system. He is Kenja, the father, who built the gate and still watches from inside.",
  },
};

// ─── REVELATION ARC (the order the story is meant to unfold) ─────────────────
export interface LoreAct {
  act: number;
  via: EntityId;
  beat: Bilingual;
}

export const REVELATION_ARC: LoreAct[] = [
  {
    act: 1,
    via: "echo",
    beat: {
      ar: "إيكو يستيقظ بلا ذاكرة عند 11:11، يكتشف اسمه ويدرك أنه محبوس داخل نظام يردّد صوته.",
      en: "Echo wakes with no memory at 11:11, discovers his name, and realizes he is trapped inside a system that echoes his voice.",
    },
  },
  {
    act: 2,
    via: "watcher",
    beat: {
      ar: "تسجيلات المراقب تكشف التجارب في المنزل المهجور، وحضور الأب كينجا، وأن النظام كان يراقب من الداخل.",
      en: "The Watcher's footage reveals the experiments in the abandoned house, the father Kenja's presence, and that the system watched from within.",
    },
  },
  {
    act: 3,
    via: "signal",
    beat: {
      ar: "إشارة لينا (الأم) تكشف محاولتها إنقاذ ابنها، تحذيرها المتكرر، ثم اختفاء صوتها فجأة.",
      en: "Lina's (the mother's) signal reveals her attempt to save her son, her repeated warnings, then the sudden disappearance of her voice.",
    },
  },
  {
    act: 4,
    via: "architect",
    beat: {
      ar: "المهندس يكشف أنه كينجا الأب، ويواجه إيكو بالحقيقة وبالقاعدة الوحيدة لإغلاق ما فُتح: التذكّر.",
      en: "The Architect reveals himself as Kenja the father, confronts Echo with the truth and the one rule for closing what was opened: remembering.",
    },
  },
];

// ─── GOAL ────────────────────────────────────────────────────────────────────
export const GOAL: Bilingual = {
  ar: "اللاعب لا يحلّ ألغازاً فحسب، بل يكتشف قصة إيكو تدريجياً ويعيد بناء ذاكرته المفقودة. القصة لا تُعرض دفعة واحدة، والنهاية غير ثابتة — النظام يستمرّ بلا نهاية.",
  en: "The player does not merely solve puzzles — they uncover Echo's story gradually and rebuild his lost memory. The story is never shown all at once, and the ending is not fixed — the system continues endlessly.",
};

// ─── RULE FOR BUILDING FUTURE PUZZLES (read before adding any puzzle) ─────────
export const PUZZLE_CANON_RULE: Bilingual = {
  ar: "من الآن فصاعداً: كل لغز يُنشأ يجب أن يكون جزءاً من هذه القصة، وأن يكشف معلومة جديدة عن إيكو أو الماضي أو النظام. لا ألغاز عشوائية أو منفصلة. يجب أن تكون كل الألغاز مترابطة وتبني القصة تدريجياً.",
  en: "From now on: every puzzle created must be part of this story and must reveal a new piece about Echo, the past, or the system. No random or standalone puzzles. All puzzles must interconnect and build the story gradually.",
};

// ─── FRAGMENT LAW (HARD RULE — never break, applies everywhere the story surfaces) ─
// The full story must NEVER be shown to any player at any time. There is no single
// complete narrative in the system — only Memory Fragments, each unlocked solely by
// solving puzzles / progressing. Echo himself does NOT know the whole story: he begins
// with very scrambled memory, recovers a little with each puzzle, and must never exceed
// the player's own knowledge. Even on a direct request ("tell me the story" / "summarize
// everything"), only ONE fragment may be given — never the whole, never a summary.
export const FRAGMENT_LAW: Bilingual = {
  ar: "قانون صارم: ممنوع عرض القصة كاملة لأي مستخدم في أي وقت، وممنوع تقديم ملخّص كامل لها. لا توجد قصة واحدة كاملة في النظام، بل ذكريات مجزّأة (Memory Fragments) يُكشف كل جزء منها فقط عبر الألغاز والتقدّم. إيكو نفسه لا يعرف القصة كاملة: يبدأ بذاكرة مشوّشة جداً، ويتعلّم مع كل لغز، ولا يجوز أن تتجاوز معرفتُه معرفةَ اللاعب. حتى عند الطلب المباشر «احكِ القصة» يُعطى جزء واحد فقط، لا القصة كاملة.",
  en: "Hard rule: the full story must NEVER be shown to any user at any time, and no complete summary may be given. The system holds no single complete story — only Memory Fragments, each revealed solely through puzzles and progression. Echo himself does not know the whole story: he starts with very scrambled memory, learns a little with each puzzle, and must never exceed the player's knowledge. Even on a direct 'tell me the story' request, only ONE fragment is given — never the whole.",
};

export const CORE_LORE = {
  logline: {
    ar: "إيكو، طفلٌ سُجن وعيه داخل «نظام 11:11» بعد تجارب أبيه كينجا. تعيد — عبر الألغاز — بناء ذاكرته وتكشف ما حدث لأمه لينا.",
    en: "Echo, a child whose consciousness was imprisoned in the '11:11 System' after his father Kenja's experiments. Through puzzles you rebuild his memory and uncover what happened to his mother, Lina.",
  } as Bilingual,
  characters: CHARACTERS,
  synchPoints: SYNCH_POINTS,
  timeSystem: TIME_SYSTEM,
  systemState: SYSTEM_STATE,
  entityTruth: ENTITY_TRUTH,
  revelationArc: REVELATION_ARC,
  goal: GOAL,
  puzzleRule: PUZZLE_CANON_RULE,
  fragmentLaw: FRAGMENT_LAW,
} as const;
