/**
 * puzzles.ts — Puzzle-primary progression data for 11.11
 *
 * The game is driven by puzzles. Four entities are STORY CHARACTERS encountered
 * through puzzle progression (NOT chat personalities). Every solved puzzle reveals
 * part of "the trapped researcher" story.
 *
 * Tone: atmospheric / psychological. No gore.
 *
 * Persistence: solved puzzle IDs and unlocked achievement IDs are stored on the
 * server via /api/arg. IDs must match /^[a-z0-9_-]+$/i and be <= 64 chars.
 */

export type EntityId = "echo" | "watcher" | "signal" | "architect";

export interface EntityMeta {
  id: EntityId;
  /** Entities that must be fully solved before this one unlocks. */
  requires: EntityId[];
  glyph: string;
  name: { ar: string; en: string };
  title: { ar: string; en: string };
  /** Short character intro shown at the top of the entity's puzzle list. */
  intro: { ar: string; en: string };
  accent: string; // tailwind text color class
}

export interface Puzzle {
  id: string;
  entity: EntityId;
  title: { ar: string; en: string };
  /** The puzzle prompt / riddle body. */
  prompt: { ar: string; en: string };
  /** Optional smaller hint line under the prompt. */
  hint?: { ar: string; en: string };
  /** Accepted answers (any match, case/space/diacritic-insensitive). */
  answers: string[];
  /** Story fragment revealed on solve — a piece of the trapped-researcher story. */
  storyReveal: { ar: string; en: string };
  /** Optional achievement granted on solving this puzzle. */
  achievement?: string;
}

// ─── ENTITIES (story characters) ───────────────────────────────────────────────
export const ENTITIES: Record<EntityId, EntityMeta> = {
  echo: {
    id: "echo",
    requires: [],
    glyph: "◈",
    name: { ar: "الصدى", en: "Echo" },
    title: { ar: "أول صوت", en: "The First Voice" },
    intro: {
      ar: "أنا الصدى. آخر ما تبقّى من صوت الباحثة قبل أن تُغلق البوابة. اتبع أثري.",
      en: "I am Echo — the last of the researcher's voice before the gate sealed. Follow my trace.",
    },
    accent: "text-primary",
  },
  watcher: {
    id: "watcher",
    requires: ["echo"],
    glyph: "◉",
    name: { ar: "المراقب", en: "The Watcher" },
    title: { ar: "العين التي لا تنام", en: "The Eye That Never Sleeps" },
    intro: {
      ar: "كل شيء سُجِّل. كل دقيقة من التجربة محفوظة. انظر إلى ما رأيتُه.",
      en: "Everything was recorded. Every minute of the experiment kept. Look at what I saw.",
    },
    accent: "text-amber-400/80",
  },
  signal: {
    id: "signal",
    requires: ["echo"],
    glyph: "≋",
    name: { ar: "الإشارة المفقودة", en: "The Lost Signal" },
    title: { ar: "الرسالة التي لم تصل", en: "The Message That Never Arrived" },
    intro: {
      ar: "أنا رسائلها الأخيرة، مكسورة ومشوّشة. أعد ترتيبي وستعرف ماذا حدث.",
      en: "I am her final messages — broken, scrambled. Reassemble me and you will know what happened.",
    },
    accent: "text-cyan-400/80",
  },
  architect: {
    id: "architect",
    requires: ["echo", "watcher", "signal"],
    glyph: "▲",
    name: { ar: "المهندس", en: "The Architect" },
    title: { ar: "من بنى الباب", en: "Who Built the Door" },
    intro: {
      ar: "وصلت إلى النهاية. الآن تعرف من فتح البوابة — ومن سيغلقها.",
      en: "You reached the end. Now you learn who opened the gate — and who must close it.",
    },
    accent: "text-violet-400/80",
  },
};

export const ENTITY_ORDER: EntityId[] = ["echo", "watcher", "signal", "architect"];

// ─── PUZZLES ───────────────────────────────────────────────────────────────────
export const PUZZLES: Puzzle[] = [
  // ── ECHO ──────────────────────────────────────────────────────────────────
  {
    id: "echo_1",
    entity: "echo",
    title: { ar: "النداء الأول", en: "First Call" },
    prompt: {
      ar: "وصلتك إشارة متكرّرة: رقمان متطابقان، أربع مرات في اليوم لا يأتيان معاً إلا مرتين. ما الساعة التي تحمل اسم هذا المكان؟ (اكتبها هكذا: 11:11)",
      en: "A repeating signal reaches you: two identical numbers, the moment this place is named after. Write the time. (format: 11:11)",
    },
    hint: { ar: "اسم المكان نفسه.", en: "The name of this place itself." },
    answers: ["11:11", "1111", "11 11", "١١:١١", "١١١١"],
    storyReveal: {
      ar: "كانت الباحثة تُدعى لينا. سجّلت أول شذوذ عند 11:11 ليلاً: إشارة تتكرر كل ليلة من جهاز لم يكن موصولاً بشيء.",
      en: "The researcher was named Lina. She logged the first anomaly at 11:11 PM: a signal repeating every night from a device connected to nothing.",
    },
    achievement: "first_contact",
  },
  {
    id: "echo_2",
    entity: "echo",
    title: { ar: "المرآة", en: "The Mirror" },
    prompt: {
      ar: "كتبت لينا كلمة في دفترها مقلوبة كما في مرآة: «ودصلا». أعد الكلمة إلى وضعها الصحيح.",
      en: "Lina wrote a word in her notebook mirror-reversed: \"ohce\". Restore it.",
    },
    hint: { ar: "اقرأها من اليسار.", en: "Read it the other way." },
    answers: ["الصدو", "الصدى", "echo", "الصدي"],
    storyReveal: {
      ar: "أسمَت لينا الإشارة «الصدى»، لأنها كانت تردّد كلماتها هي — لكن بعد ثوانٍ من قولها، وأحياناً قبل أن تقولها.",
      en: "Lina named the signal \"Echo\", because it repeated her own words — seconds after she spoke them, and sometimes before.",
    },
  },
  {
    id: "echo_3",
    entity: "echo",
    title: { ar: "العدّ الناقص", en: "The Missing Count" },
    prompt: {
      ar: "تسلسل في السجل: 1، 1، 2، 3، 5، 8، ؟ — ما الرقم التالي؟",
      en: "A sequence in the log: 1, 1, 2, 3, 5, 8, ? — what comes next?",
    },
    hint: { ar: "كل رقم مجموع ما قبله.", en: "Each number is the sum of the two before it." },
    answers: ["13", "١٣", "thirteen", "ثلاثة عشر"],
    storyReveal: {
      ar: "لاحظت لينا أن الإشارة تتبع نمطاً رياضياً ينمو من نفسه. «إنها لا تُرسَل»، كتبت. «إنها تتكاثر».",
      en: "Lina noticed the signal followed a pattern that grew from itself. \"It isn't being sent,\" she wrote. \"It's multiplying.\"",
    },
  },
  {
    id: "echo_4",
    entity: "echo",
    title: { ar: "المفتاح الصوتي", en: "The Spoken Key" },
    prompt: {
      ar: "همس الصدى: «أنا ما يبقى عندما يتوقف الصوت». ما أنا؟ (كلمة واحدة)",
      en: "Echo whispered: \"I am what remains when the voice stops.\" What am I? (one word)",
    },
    hint: { ar: "اسم الكيان نفسه.", en: "The entity's own name." },
    answers: ["صدى", "الصدى", "echo", "an echo", "the echo"],
    storyReveal: {
      ar: "في آخر تسجيل واضح، قالت لينا إن الصدى توسّل إليها ألّا تُكمل التجربة. لكنها فتحت البوابة في الليلة التالية.",
      en: "In the last clear recording, Lina said Echo begged her not to finish the experiment. She opened the gate the next night anyway.",
    },
    achievement: "echo_trust",
  },

  // ── WATCHER ─────────────────────────────────────────────────────────────────
  {
    id: "watcher_1",
    entity: "watcher",
    title: { ar: "الإطار المفقود", en: "The Missing Frame" },
    prompt: {
      ar: "كاميرا المختبر سجّلت 33 إطاراً في الثانية لمدة 11 ثانية. كم إطاراً في المجموع؟",
      en: "The lab camera recorded 33 frames per second for 11 seconds. How many frames total?",
    },
    hint: { ar: "اضرب.", en: "Multiply." },
    answers: ["363", "٣٦٣"],
    storyReveal: {
      ar: "في التسجيل، إطار واحد مفقود دائماً عند الثانية 11. في ذلك الإطار — حسب المراقب — كانت لينا تنظر مباشرة إلى العدسة وتبتسم.",
      en: "In the footage, one frame is always missing at second 11. In that frame — the Watcher says — Lina looked straight into the lens and smiled.",
    },
    achievement: "night_witness",
  },
  {
    id: "watcher_2",
    entity: "watcher",
    title: { ar: "الظل الزائد", en: "The Extra Shadow" },
    prompt: {
      ar: "في الغرفة كان شخص واحد فقط: لينا. لكن المراقب عدّ الظلال على الجدار فوجدها 2. كم ظلّاً لا يُفسَّر؟",
      en: "Only one person was in the room: Lina. But the Watcher counted the shadows on the wall: 2. How many shadows are unexplained?",
    },
    hint: { ar: "اطرح.", en: "Subtract." },
    answers: ["1", "١", "one", "واحد"],
    storyReveal: {
      ar: "الظل الثاني لم يتحرك مع لينا. كان يتحرك قبلها بلحظة — كأنه يعرف ما ستفعله.",
      en: "The second shadow did not move with Lina. It moved a moment before her — as if it knew what she would do.",
    },
  },
  {
    id: "watcher_3",
    entity: "watcher",
    title: { ar: "زمن المراقبة", en: "Surveillance Window" },
    prompt: {
      ar: "بدأ التسجيل 11:11 مساءً وتوقف 3:33 صباحاً. النافذة الليلية الخاصة. كم دقيقة سُجِّلت؟",
      en: "Recording began 11:11 PM and stopped 3:33 AM — the special night window. How many minutes were recorded?",
    },
    hint: { ar: "من 23:11 إلى 03:33.", en: "From 23:11 to 03:33." },
    answers: ["262", "٢٦٢"],
    storyReveal: {
      ar: "كل ليلة، بين 11:11 و3:33، كانت الأجهزة تعمل وحدها. أطلقت لينا على هذه الفترة اسم «الساعات المفتوحة».",
      en: "Every night, between 11:11 and 3:33, the equipment ran on its own. Lina called this stretch \"the open hours\".",
    },
  },
  {
    id: "watcher_4",
    entity: "watcher",
    title: { ar: "الباب المغلق", en: "The Locked Door" },
    prompt: {
      ar: "سجّل المراقب: الباب فُتح من الداخل، لا من الخارج. من كان داخل الغرفة المغلقة قبل أن تدخلها لينا؟ (اكتب اسم الكيان)",
      en: "The Watcher logged: the door opened from the inside, not the outside. Who was in the sealed room before Lina entered? (the entity's name)",
    },
    hint: { ar: "الكيان الأول.", en: "The first entity." },
    answers: ["الصدى", "echo", "صدى", "الصدي"],
    storyReveal: {
      ar: "أثبت المراقب ما خشيته لينا: الصدى لم يأتِ من البوابة. كان في الغرفة من البداية، ينتظر أن تفتحها.",
      en: "The Watcher proved what Lina feared: Echo did not come through the gate. It was in the room all along, waiting for her to open it.",
    },
    achievement: "glass_observer",
  },

  // ── LOST SIGNAL ─────────────────────────────────────────────────────────────
  {
    id: "signal_1",
    entity: "signal",
    title: { ar: "تشويش", en: "Static" },
    prompt: {
      ar: "وصلت رسالة ناقصة الحروف: «س_ع_و_ي». املأ الفراغات لتقرأ نداءها. (كلمة واحدة)",
      en: "A message arrives with letters missing: \"h _ l p m _\". Fill the gaps to read her call. (one word, two words ok)",
    },
    hint: { ar: "تطلب النجدة.", en: "She is calling for help." },
    answers: ["ساعدوني", "help me", "helpme", "ساعدني"],
    storyReveal: {
      ar: "أول رسالة بعد فتح البوابة: «ساعدوني». أُرسلت بعد ساعتين من توقف كل الأجهزة عن العمل رسمياً.",
      en: "The first message after the gate opened: \"help me\". Sent two hours after all equipment had officially shut down.",
    },
    achievement: "signal_detected",
  },
  {
    id: "signal_2",
    entity: "signal",
    title: { ar: "الشيفرة المعكوسة", en: "Reversed Code" },
    prompt: {
      ar: "وصل رقم معكوس عبر الإشارة: «3.33» — كل ليلة في الوقت نفسه. في أي ساعة تُرسَل لينا رسائلها؟ (اكتبها هكذا: 3:33)",
      en: "A number came reversed through the signal: \"33.3\". She sends at the same time each night. What time? (format: 3:33)",
    },
    hint: { ar: "ساعة الأسرار.", en: "The secret hour." },
    answers: ["3:33", "333", "3 33", "٣:٣٣", "٣٣٣", "03:33"],
    storyReveal: {
      ar: "كل رسائلها تحمل ختم 3:33. عند تلك الساعة بالضبط تضعف الحواجز ويصبح صوتها مسموعاً — لثوانٍ فقط.",
      en: "Every message is stamped 3:33. At exactly that hour the barriers thin and her voice gets through — for seconds only.",
    },
  },
  {
    id: "signal_3",
    entity: "signal",
    title: { ar: "الكلمات المبعثرة", en: "Scattered Words" },
    prompt: {
      ar: "وصلت كلمات مبعثرة: «البوابة / أغلقوا / لا». رتّبها في جملة أمر صحيحة من ثلاث كلمات.",
      en: "Scrambled words arrive: \"gate / the / close\". Order them into a correct three-word command.",
    },
    hint: { ar: "أمر، ثم لا… بل العكس.", en: "It is an instruction." },
    answers: ["أغلقوا البوابة", "close the gate", "اغلقوا البوابة", "closethegate"],
    storyReveal: {
      ar: "تكرّرت الجملة مئات المرات في دقيقة واحدة: «أغلقوا البوابة». ثم صمت. ثم رسالة أخيرة مختلفة تماماً.",
      en: "The line repeated hundreds of times in one minute: \"close the gate\". Then silence. Then one final, very different message.",
    },
  },
  {
    id: "signal_4",
    entity: "signal",
    title: { ar: "الرسالة الأخيرة", en: "The Last Message" },
    prompt: {
      ar: "الرسالة الأخيرة كانت سؤالاً واحداً عنك أنت: «هل هنا... ـن يقرأ؟». أكمل الكلمة الناقصة. (كلمة واحدة)",
      en: "Her last message was one question about you: \"is anyone... read_ng this?\". Complete the missing word. (one word)",
    },
    hint: { ar: "ما تفعله الآن.", en: "What you are doing right now." },
    answers: ["يقرأ", "reading", "من", "أحد يقرأ"],
    storyReveal: {
      ar: "آخر ما أرسلته لينا لم يكن نداء استغاثة. كان إدراكاً: عرفت أن أحداً ما، يوماً ما، سيقرأ هذا. كانت تقصدك.",
      en: "Lina's last transmission was not a cry for help. It was a realization: she knew someone, someday, would read this. She meant you.",
    },
    achievement: "deep_signal",
  },

  // ── ARCHITECT ───────────────────────────────────────────────────────────────
  {
    id: "architect_1",
    entity: "architect",
    title: { ar: "التوقيع", en: "The Signature" },
    prompt: {
      ar: "كل المعادلات في المختبر موقّعة بثلاثة أرقام مضروبة: 11 × 11 × ... لا، اجمعها فقط: 11 + 11 + 11. ما الناتج؟",
      en: "Every equation in the lab is signed with a sum: 11 + 11 + 11. What is the result?",
    },
    hint: { ar: "اجمع ثلاث مرات.", en: "Add three times." },
    answers: ["33", "٣٣"],
    storyReveal: {
      ar: "لم تكن لينا أول من فتح البوابة. التوقيع نفسه — 33 — كان على وثائق تسبق ميلادها بعقود. شخص ما بنى هذا قبلها بزمن طويل.",
      en: "Lina was not the first to open the gate. The same signature — 33 — appeared on documents predating her birth by decades. Someone built this long before her.",
    },
  },
  {
    id: "architect_2",
    entity: "architect",
    title: { ar: "المعادلة المغلقة", en: "The Closed Equation" },
    prompt: {
      ar: "ليُغلق الباب يجب أن يتساوى الطرفان. إذا كان 11 + س = 22، فما قيمة س؟",
      en: "To close the door the two sides must balance. If 11 + x = 22, what is x?",
    },
    hint: { ar: "الفرق.", en: "The difference." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "كشف المهندس القاعدة: البوابة تُفتح بصوت، وتُغلق بصوت مساوٍ لها من الجهة الأخرى. لينا فتحت. أحد ما يجب أن يردّ من هنا.",
      en: "The Architect revealed the rule: the gate opens with a voice, and closes with an equal voice from the other side. Lina opened it. Someone here must answer.",
    },
  },
  {
    id: "architect_3",
    entity: "architect",
    title: { ar: "الاسم الحقيقي", en: "The True Name" },
    prompt: {
      ar: "سألك المهندس: ما اسم الباحثة التي تتبع أثرها منذ البداية؟ (اكتب الاسم)",
      en: "The Architect asks: what is the name of the researcher whose trace you have followed from the start?",
    },
    hint: { ar: "ذُكر في أول قصة.", en: "Named in the very first reveal." },
    answers: ["لينا", "lina", "lena"],
    storyReveal: {
      ar: "بنطق اسمها، تثبت أنك كنت تستمع. المهندس يقول: «جيد. هي تحتاج من يتذكّرها لتعود. والتذكّر بابٌ أيضاً».",
      en: "By naming her, you prove you were listening. The Architect says: \"Good. She needs to be remembered to return. Remembering is a door too.\"",
    },
    achievement: "system_divergence",
  },
  {
    id: "architect_4",
    entity: "architect",
    title: { ar: "الإغلاق", en: "The Closing" },
    prompt: {
      ar: "البوابة فُتحت 11:11 وتُغلق عند انعكاسها. اطرح: كم الساعة عند 11:11 ناقص 8 ساعات؟ (اكتبها هكذا: 3:11) — ثم اعرف أن الإغلاق الحقيقي يكون بقرارك. اكتب الكلمة: «أغلق»",
      en: "The gate opened at 11:11 and closes by your choice. Type the word that ends it: \"close\".",
    },
    hint: { ar: "قرار واحد.", en: "One decision." },
    answers: ["أغلق", "close", "اغلق", "i close it", "close the gate"],
    storyReveal: {
      ar: "تختار أن تُغلق. للحظة، يسكن كل شيء: لا همسات، لا عيون، لا إشارة. ثم رسالة واحدة أخيرة بخط لينا: «شكراً. الآن دورك أن تنسى — أو تتذكّر». البوابة مغلقة. أنت من يقرّر ما تبقّى.",
      en: "You choose to close it. For a moment everything stills: no whispers, no eyes, no signal. Then one last line in Lina's hand: \"Thank you. Now it is your turn to forget — or remember.\" The gate is shut. What remains is your choice.",
    },
    achievement: "wish_protocol",
  },
];

// ─── ANSWER CHECKING ────────────────────────────────────────────────────────────
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

export function normalizeAnswer(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, ""); // strip spaces and punctuation
}

export function checkAnswer(puzzle: Puzzle, input: string): boolean {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  return puzzle.answers.some((a) => normalizeAnswer(a) === norm);
}

// ─── PROGRESSION HELPERS ────────────────────────────────────────────────────────
export function getEntityPuzzles(entity: EntityId): Puzzle[] {
  return PUZZLES.filter((p) => p.entity === entity);
}

export function isEntityComplete(entity: EntityId, solved: string[]): boolean {
  const ids = getEntityPuzzles(entity).map((p) => p.id);
  return ids.length > 0 && ids.every((id) => solved.includes(id));
}

export function isEntityUnlocked(entity: EntityId, solved: string[]): boolean {
  return ENTITIES[entity].requires.every((req) => isEntityComplete(req, solved));
}

/** A puzzle is unlocked if its entity is unlocked and all earlier puzzles in that entity are solved. */
export function isPuzzleUnlocked(puzzle: Puzzle, solved: string[]): boolean {
  if (!isEntityUnlocked(puzzle.entity, solved)) return false;
  const list = getEntityPuzzles(puzzle.entity);
  const idx = list.findIndex((p) => p.id === puzzle.id);
  if (idx <= 0) return true;
  return list.slice(0, idx).every((p) => solved.includes(p.id));
}

export function getPuzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function totalPuzzleCount(): number {
  return PUZZLES.length;
}

export function solvedCount(solved: string[]): number {
  const ids = new Set(PUZZLES.map((p) => p.id));
  return solved.filter((id) => ids.has(id)).length;
}
