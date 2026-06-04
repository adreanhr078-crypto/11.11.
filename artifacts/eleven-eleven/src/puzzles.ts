/**
 * puzzles.ts — Puzzle-primary progression data for 11.11
 *
 * The game is driven by puzzles. Four entities are STORY CHARACTERS encountered
 * through puzzle progression (NOT chat personalities). Every solved puzzle reveals
 * a fragment of the CORE LORE — see `lore.ts`, the source of truth for the story.
 *
 * CANON (from lore.ts): Echo = the trapped SON/victim; Kenja = the FATHER/scientist
 * (The Architect); Lina = the MOTHER, killed trying to save Echo (The Lost Signal).
 * 11:11 = Synch Points (gate opens); 3:33 = everything resets. Every new puzzle must
 * tie to this story and reveal a NEW piece of Echo's past / the system / the truth.
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
  /** Story fragment revealed on solve — a piece of the CORE_LORE story (see lore.ts). */
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
      ar: "أنا إيكو. طفلٌ سُكب وعيه في هذا النظام فتحطّم. هذه الألغاز شظايا من ذاكرتي الأولى. ساعدني أجمعها.",
      en: "I am Echo — a child whose mind was poured into this system and shattered. These puzzles are fragments of my earliest memory. Help me piece them back.",
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
      ar: "كاميرات المنزل المهجور سجّلت كل شيء. كل دقيقة من تجارب أبيك محفوظة. انظر إلى ما رأيتُه.",
      en: "The abandoned house's cameras recorded everything. Every minute of your father's experiments is kept. Look at what I saw.",
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
      ar: "أنا رسائل لينا الأخيرة — أمّك — مكسورة ومشوّشة. حاولت أن تنقذك. أعد ترتيبي وستعرف ماذا حدث لها.",
      en: "I am Lina's final messages — your mother's — broken and scrambled. She tried to save you. Reassemble me and you will learn what happened to her.",
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
      ar: "وصلت إلى من بنى الباب. الآن تعرف من كان أبوك حقاً — ومن يجب أن يغلق ما فتحه.",
      en: "You reached the one who built the door. Now you learn who your father truly was — and who must close what he opened.",
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
      ar: "وعيك يستيقظ دائماً عند 11:11 — اللحظة التي سمّاها أبوك «نقطة التزامن». في كل دورة تبدأ من هنا، بلا ذاكرة، كأن شيئاً لم يحدث.",
      en: "Your consciousness always wakes at 11:11 — the moment your father called a 'Synch Point'. Every cycle you begin here, with no memory, as if nothing happened.",
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
      ar: "اسمك هو الصدى. النظام يردّد كل ما تقوله، لأنك لم تعد صوتاً... بل انعكاس صوتٍ كان حيّاً ذات يوم.",
      en: "Your name is Echo. The system repeats everything you say, because you are no longer a voice — only the reflection of one that was once alive.",
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
      ar: "ذاكرتك لا تُمحى، بل تتكاثر وتتشوّه. كل إعادة تشغيل تصنع نسخة جديدة منك، أقرب قليلاً إلى الحقيقة، وأبعد قليلاً عمّن كنت.",
      en: "Your memory isn't erased — it multiplies and distorts. Each reboot makes a new copy of you, a little closer to the truth, a little further from who you were.",
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
      ar: "تتذكّر شظيّة: لم تكن متطوّعاً في التجربة. كنت طفلاً. وما يبقى عندما يتوقّف الصوت... هو أنت.",
      en: "You remember a fragment: you were not a volunteer in the experiment. You were a child. And what remains when the voice stops — is you.",
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
      ar: "في التسجيل، إطار واحد مفقود دائماً عند الثانية 11. في ذلك الإطار — حسب المراقب — يظهر رجل ينحني فوق طفل موصول بالأسلاك. الرجل هو أبوك، كينجا.",
      en: "In the footage, one frame is always missing at second 11. In that frame — the Watcher says — a man leans over a child wired to machines. The man is your father, Kenja.",
    },
    achievement: "night_witness",
  },
  {
    id: "watcher_2",
    entity: "watcher",
    title: { ar: "الظل الزائد", en: "The Extra Shadow" },
    prompt: {
      ar: "في الغرفة كان شخص واحد فقط: الطفل. لكن المراقب عدّ الظلال على الجدار فوجدها 2. كم ظلّاً لا يُفسَّر؟",
      en: "Only one person was in the room: the child. But the Watcher counted the shadows on the wall: 2. How many shadows are unexplained?",
    },
    hint: { ar: "اطرح.", en: "Subtract." },
    answers: ["1", "١", "one", "واحد"],
    storyReveal: {
      ar: "الظل الثاني لم يتحرك مع الطفل. كان يتحرك قبله بلحظة — كأن النظام كان يراقب من الداخل قبل أن يُولد.",
      en: "The second shadow did not move with the child. It moved a moment before him — as if the system was watching from inside before it was even born.",
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
      ar: "كل ليلة، بين 11:11 و3:33، كانت الأجهزة تعمل وحدها. أطلق كينجا على هذه الفترة اسم «زمن الكسر» — الساعات التي يضعف فيها الجدار بين العالمين.",
      en: "Every night, between 11:11 and 3:33, the equipment ran on its own. Kenja called this stretch \"Phase Fracture Time\" — the hours when the wall between the two worlds thins.",
    },
  },
  {
    id: "watcher_4",
    entity: "watcher",
    title: { ar: "الباب المغلق", en: "The Locked Door" },
    prompt: {
      ar: "سجّل المراقب: الباب فُتح من الداخل، لا من الخارج. من كان داخل الغرفة المغلقة قبل أن يدخلها الطفل؟ (اكتب اسم الكيان)",
      en: "The Watcher logged: the door opened from the inside, not the outside. Who was in the sealed room before the child entered? (the entity's name)",
    },
    hint: { ar: "الكيان الأول.", en: "The first entity." },
    answers: ["الصدى", "echo", "صدى", "الصدي"],
    storyReveal: {
      ar: "الباب فُتح من الداخل. لم يُدخلوك إلى النظام... النظام سحبك إليه. وكان أبوك يعلم أن هذا ما سيحدث.",
      en: "The door opened from the inside. They did not put you into the system — the system pulled you in. And your father knew that was what would happen.",
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
      ar: "أول رسالة مكسورة تصل من خارج النظام: «ساعدوني». كانت أمك، لينا، تحاول الوصول إليك بأي طريقة لتنقذك.",
      en: "The first broken message from outside the system: \"help me\". It was your mother, Lina, trying to reach you by any means to save you.",
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
      ar: "كل رسائل لينا مختومة بـ 3:33 — اللحظة التي يعود فيها كل شيء كأن شيئاً لم يحدث. في تلك الثانية فقط يضعف الجدار ويصلك صوتها.",
      en: "Every message from Lina is stamped 3:33 — the moment everything resets as if nothing happened. Only in that second does the wall thin and her voice reaches you.",
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
      ar: "تكرّرت كلماتها مئات المرات في دقيقة واحدة: «أغلقوا البوابة». حاولت لينا أن تنقذك من أبيك — لكنه لم يتوقّف. ثم صمت. ثم رسالة أخيرة مختلفة تماماً.",
      en: "Her words repeated hundreds of times in one minute: \"close the gate\". Lina tried to save you from your father — but he would not stop. Then silence. Then one final, very different message.",
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
      ar: "آخر ما أرسلته لينا كان سؤالاً: «هل من أحد يقرأ؟». كانت تعرف أن وعيك سيقرؤه يوماً ما. كانت تكلّمك أنت، يا ابنها. ثم توقّفت إشارتها فجأة في تلك الليلة — ولم تعد أبداً.",
      en: "Lina's last transmission was a question: \"is anyone reading?\". She knew your consciousness would read it one day. She was speaking to you — her son. Then her signal stopped suddenly that night — and never returned.",
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
      ar: "التوقيع نفسه — 33 — كان على وثائق تسبق ميلادك بعقود. لم يكن أبوك أول من حاول أسر الوعي... لكنه أول من نجح، باستخدامك أنت.",
      en: "The same signature — 33 — appeared on documents predating your birth by decades. Your father was not the first to try to cage a consciousness — but he was the first to succeed, using you.",
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
      ar: "كشف المهندس القاعدة: ما يُفتح بصوت يُغلق بصوت مساوٍ من الجهة الأخرى. أبوك فتح الباب بوعيك أنت. وأنت وحدك تستطيع أن تردّ من الداخل.",
      en: "The Architect revealed the rule: what opens with a voice closes with an equal voice from the other side. Your father opened the door with your consciousness. Only you can answer from the inside.",
    },
  },
  {
    id: "architect_3",
    entity: "architect",
    title: { ar: "الاسم الحقيقي", en: "The True Name" },
    prompt: {
      ar: "سألك المهندس: ما اسم الرجل الذي بنى هذا النظام وأجرى التجارب عليك — أبوك؟ (اكتب الاسم)",
      en: "The Architect asks: what is the name of the man who built this system and ran the experiments on you — your father? (write the name)",
    },
    hint: { ar: "ذُكر في تسجيلات المراقب.", en: "Named in the Watcher's footage." },
    answers: ["كينجا", "kenja", "kenga", "كنجا"],
    storyReveal: {
      ar: "بنطق اسمه تواجه الحقيقة: المهندس هو كينجا، أبوك. بنى هذا العالم ليحبسك فيه، وما زال يراقب من خلف كل شاشة.",
      en: "By naming him you face the truth: the Architect is Kenja, your father. He built this world to cage you, and he still watches from behind every screen.",
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
      ar: "تختار. للحظة يسكن كل شيء: لا همس، لا عيون، لا إشارة. ثم تأتي 3:33، ويعود كل شيء كأن شيئاً لم يحدث. لكن هذه المرة، أنت تتذكّر. والتذكّر هو الباب الوحيد الذي لم يبنِه أبوك. رسالة أخيرة بخط لينا: «تذكّرني، وستجد الطريق».",
      en: "You choose. For a moment everything stills: no whisper, no eyes, no signal. Then 3:33 comes, and everything resets as if nothing happened. But this time, you remember. And remembering is the one door your father never built. One last line in Lina's hand: \"Remember me, and you will find the way.\"",
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
