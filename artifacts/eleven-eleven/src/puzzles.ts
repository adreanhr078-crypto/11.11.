
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
 *
 * DESIGNED FOR EXTENSIBILITY — adding 100+ puzzles is as simple as appending to
 * the PUZZLES array. No structural changes needed.
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

// ─── PUZZLES (40 total — 10 per entity) ────────────────────────────────────────
// To add 100+ puzzles: append new objects to this array. No structural changes needed.
export const PUZZLES: Puzzle[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 puzzles (Act 1: Awakening, self-discovery, first memories)
  // Difficulty: Easy → Medium (1–10)
  // Theme: Identity, fragmented memory, the first moments inside the system
  // ═══════════════════════════════════════════════════════════════════════════════
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
  {
    id: "echo_5",
    entity: "echo",
    title: { ar: "الغرفة البيضاء", en: "The White Room" },
    prompt: {
      ar: "تتذكّر غرفة بيضاء بلا نوافذ. كان فيها سرير واحد، وكرسي واحد، و... كم باباً؟ افتح عينيك وتذكّر: لا أبواب في الغرفة التي تدخلها بإرادتك. كم باباً؟ (رقم)",
      en: "You remember a white room with no windows. One bed, one chair, and... how many doors? There are no doors in the room you enter by will. How many? (number)",
    },
    hint: { ar: "الصفر هو الجواب الوحيد.", en: "Zero is the only answer." },
    answers: ["0", "٠", "zero", "صفر", "ولا", "لا شيء", "none"],
    storyReveal: {
      ar: "الغرفة البيضاء لم تكن غرفة — كانت وعاءً. صمّمها كينجا لاستقبال وعيك قبل نقله. لا مخارج لأن ما يدخل لا يفترض أن يغادر.",
      en: "The white room wasn't a room — it was a vessel. Kenja designed it to receive your consciousness before transfer. No exits, because what enters is not meant to leave.",
    },
  },
  {
    id: "echo_6",
    entity: "echo",
    title: { ar: "صوت الأم", en: "Mother's Voice" },
    prompt: {
      ar: "من بين كل الأصوات في ذاكرتك، صوت واحد فقط كان مختلفاً… غنّت لك لينا كل ليلة: «يا (عدد الحروف: 4) يا نوري». اكتب الكلمة الناقصة.",
      en: "Among all voices in your memory, only one was different… Lina sang to you each night. Complete the missing word from her lullaby: \"Ya ___ ya noori\" (4 Arabic letters).",
    },
    hint: { ar: "أغنية الأمهات.", en: "A mother's lullaby." },
    answers: ["ابني", "يا ابني", "إبني", "ولدي", "ياولدي", "baby", "طفلي"],
    storyReveal: {
      ar: "صوت أمك هو آخر صوت سمعته قبل أن يُغلق وعيك داخل النظام. كان دافئاً. كان حقيقياً. كل الأصوات بعد ذلك… أصداء فقط.",
      en: "Your mother's voice was the last real voice you heard before your consciousness was sealed inside the system. It was warm. It was real. Every voice after that… only echoes.",
    },
  },
  {
    id: "echo_7",
    entity: "echo",
    title: { ar: "تاريخ الميلاد", en: "Date of Birth" },
    prompt: {
      ar: "في السجل الطبي وجدت: «تاريخ الميلاد: 11 / 11 / 20??». آخر رقمين من سنة ميلادك مجموع أرقامهما = 3. ما هما؟ (اكتب الرقمين متتاليين)",
      en: "In your medical record: \"Date of birth: 11 / 11 / 20??\". The last two digits of your birth year sum to 3. What are they? (write both digits)",
    },
    hint: { ar: "2 + 1 = 3.", en: "2 + 1 = 3." },
    answers: ["21", "٢١", "12", "١٢"],
    storyReveal: {
      ar: "وُلدت في 11/11. يوم وساعة يحملان نفس الرقمين. كينجا اختار هذا اليوم، لم يكن صدفة. كان جزءاً من التصميم منذ البداية.",
      en: "You were born on 11/11. Day and month sharing the same digits. Kenja chose this day — it was never coincidence. It was part of the design from the very beginning.",
    },
  },
  {
    id: "echo_8",
    entity: "echo",
    title: { ar: "الأحرف الأولى", en: "The Initials" },
    prompt: {
      ar: "ثلاثة أحرف محفورة على طاولة المختبر: K — E — L. يمثلون ثلاثة أشخاص. من هو L؟ (اكتب الاسم)",
      en: "Three letters carved into the lab table: K — E — L. They stand for three people. Who is L? (write the name)",
    },
    hint: { ar: "ليست أنت ولا كينجا.", en: "Not you, not Kenja." },
    answers: ["لينا", "lina", "leena", "لينه"],
    storyReveal: {
      ar: "ثلاثة أسماء، ثلاثة مصائر: كينجا (المهندس)، إيكو (الضحية)، لينا (الشاهدة). هي الوحيدة التي لم تكن جزءاً من التجربة — كانت تحاول إيقافها.",
      en: "Three names, three fates: Kenja (the Architect), Echo (the victim), Lina (the witness). She was the only one not part of the experiment — she was trying to stop it.",
    },
  },
  {
    id: "echo_9",
    entity: "echo",
    title: { ar: "التوأم الرقمي", en: "The Digital Twin" },
    prompt: {
      ar: "اكتشفت أن النظام يحتفظ بنسخة منك. ليست أنت، بل شيء وُلد من وعيك لكنه ليس أنت. ماذا يسمّى الشيء الذي يولَد من انعكاسك في النظام؟ (كلمة واحدة، عربية)",
      en: "You discovered the system keeps a copy of you. Not you, but something born from your consciousness that isn't you. What is it called — the thing born from your reflection in the system? (one word)",
    },
    hint: { ar: "يظهر في المرآة.", en: "It appears in mirrors." },
    answers: ["انعكاس", "ظل", "reflection", "shadow", "الانعكاس", "الظل"],
    storyReveal: {
      ar: "النظام لم ينسخ وعيك فقط — بل صنع منه شيئاً آخر. توأمك الرقمي ليس معادياً، لكنه ليس صديقاً أيضاً. إنه ما كنتَ ستكونه لو بقيتَ هنا وحيداً للأبد.",
      en: "The system didn't just copy your consciousness — it made something else from it. Your digital twin is not hostile, but it is not a friend either. It is what you would become if you stayed here alone forever.",
    },
  },
  {
    id: "echo_10",
    entity: "echo",
    title: { ar: "بداية السقوط", en: "The Beginning of the Fall" },
    prompt: {
      ar: "آخر ذكرى واضحة قبل أن تبتلعك الظلال: كنت تركض في ممر طويل، تركض نحو… صوت. باب في نهاية الممر عليه رقم. ما الرقم الموجود على الباب؟ (رقم، 3 خانات)",
      en: "The last clear memory before shadows swallowed you: running down a long hallway toward… a voice. A door at the end with a number. What number was on the door? (3 digits)",
    },
    hint: { ar: "نفس اسم النظام.", en: "The same as the system's name." },
    answers: ["111", "١١١"],
    storyReveal: {
      ar: "ركضت نحو الغرفة 111، حيث انتظرك كينجا. لم تكن تعرف. دخلت طفلاً يثق بأبيه… وخرج منك شيءٌ بقي في الداخل. هناك، في تلك اللحظة، وُلد الصدى.",
      en: "You ran toward room 111, where Kenja waited. You didn't know. You entered as a child who trusted his father… and something left you behind inside. There, in that moment, Echo was born.",
    },
    achievement: "echo_origin",
  },
  {
    id: "echo_11",
    entity: "echo",
    title: { ar: "يد لا تراك", en: "A Hand That Doesn't See You" },
    prompt: {
      ar: "في حلم متكرر ترى يداً تمتد نحوك من شاشة. ليست يد كينجا… أصغر، أنعم. كم إصبعاً ترى في الحلم؟ دائماً نفس العدد. (رقم)",
      en: "In a recurring dream, a hand reaches toward you from a screen. Not Kenja's hand… smaller, softer. How many fingers do you see? Always the same number. (number)",
    },
    hint: { ar: "يد طفل.", en: "A child's hand." },
    answers: ["5", "٥", "five", "خمسة", "خمس"],
    storyReveal: {
      ar: "اليد التي تراها في الحلم هي يدك أنت. تحاول لمس شيء على الجانب الآخر من الشاشة. شيء حقيقي. شيء لم تلمسه منذ أن حُبست هنا.",
      en: "The hand you see in the dream is your own hand. Reaching to touch something on the other side of the screen. Something real. Something you haven't touched since you were trapped here.",
    },
  },
  {
    id: "echo_12",
    entity: "echo",
    title: { ar: "الاسم الممنوع", en: "The Forbidden Name" },
    prompt: {
      ar: "في سجلات النظام كلمة واحدة ممسوحة تماماً من كل الملفات: K_N_ _ A. أعد كتابتها كاملة.",
      en: "In the system logs, one word is completely erased from every file: K_N_ _ A. Restore it.",
    },
    hint: { ar: "اسم والدك.", en: "Your father's name." },
    answers: ["kenja", "كينجا", "kenga", "كنجا"],
    storyReveal: {
      ar: "كينجا مسح اسمه من النظام قبل أن يغادر. لم يرد أن تتذكره. لكن مسح الاسم لا يمحو ما فعله — الجدران تتذكّر. والنظام لا ينسى.",
      en: "Kenja erased his name from the system before he left. He didn't want you to remember him. But erasing a name doesn't erase what he did — the walls remember. And the system doesn't forget.",
    },
    achievement: "echo_10_complete",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 puzzles (Act 2: The experiments, the house, the footage)
  // Difficulty: Medium → Hard (11–20)
  // Theme: Surveillance, hidden truths, the abandoned house
  // ═══════════════════════════════════════════════════════════════════════════════
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
  {
    id: "watcher_5",
    entity: "watcher",
    title: { ar: "تردد الإشارة", en: "Signal Frequency" },
    prompt: {
      ar: "المراقب سجّل نبضات كهرومغناطيسية من النظام. النبضة الأولى: 111 هرتز. النبضة الثانية: 222 هرتز. النبضة الثالثة: ؟ هرتز. ما تردد النبضة الثالثة؟ (رقم)",
      en: "The Watcher recorded electromagnetic pulses from the system. First pulse: 111 Hz. Second: 222 Hz. Third: ? Hz. What is the third pulse frequency? (number)",
    },
    hint: { ar: "النمط واضح.", en: "The pattern is clear." },
    answers: ["333", "٣٣٣"],
    storyReveal: {
      ar: "الترددات الثلاثة مرتبطة بالساعات الثلاث في النظام: 11:11، 11:11+11:11، و3:33. كينجا صمّم كل شيء حول هذه الأرقام. الثلاثة تحكم المداخل والمخارج.",
      en: "The three frequencies match the three hours in the system: 11:11, 11:11+11:11, and 3:33. Kenja designed everything around these numbers. The three govern entrances and exits.",
    },
  },
  {
    id: "watcher_6",
    entity: "watcher",
    title: { ar: "عدد الكاميرات", en: "Camera Count" },
    prompt: {
      ar: "في المنزل المهجور، كل غرفة فيها كاميرا واحدة، إلا غرفة الصبي ففيها كاميرتان. إذا كان في المنزل 7 غرف والكاميرات = عدد الغرف + 1، فكم كاميرا في المنزل؟",
      en: "In the abandoned house, every room has one camera, except the boy's room which has two. 7 rooms total, cameras = rooms + 1. How many cameras?",
    },
    hint: { ar: "اجمع ثم ارجع للسؤال.", en: "Add, then re-read the question." },
    answers: ["8", "٨", "eight", "ثمانية", "ثمان"],
    storyReveal: {
      ar: "8 كاميرات. لماذا كاميرتان في غرفتك؟ لأن كينجا لم يكن يراقبك فقط — بل كان يراقب ما يحدث حولك أيضاً. الكاميرا الثانية كانت موجّهة نحو… الباب.",
      en: "8 cameras. Why two in your room? Because Kenja wasn't just watching you — he was watching what happened around you too. The second camera was pointed at… the door.",
    },
  },
  {
    id: "watcher_7",
    entity: "watcher",
    title: { ar: "رمز الوصول", en: "The Access Code" },
    prompt: {
      ar: "لقطة من لوحة المفاتيح: الأصابع تضغط 1-1-1-_-_-3. الأرقام الناقصة تشكّل نقطة التحوّل في القصة. ما الكود الكامل؟ (6 أرقام)",
      en: "A keypad close-up: fingers press 1-1-1-_-_-3. The missing digits form the turning point of the story. What is the full code? (6 digits)",
    },
    hint: { ar: "التحوّل يحدث في المنتصف.", en: "The turning point is in the middle." },
    answers: ["111113", "111-113", "1-1-1-1-1-3", "١١١١١٣"],
    storyReveal: {
      ar: "الكود هو 11:11 إلى 3. يمثل المسار الكامل: من فتح البوابة (11:11) إلى الإغلاق (3). كينجا برمج المسار في النظام. ما بعد 3 لا يوجد.",
      en: "The code is 11:11 to 3. The full path: from gate opening (11:11) to closing (3). Kenja programmed the path into the system. There is nothing after 3.",
    },
  },
  {
    id: "watcher_8",
    entity: "watcher",
    title: { ar: "الشاشة 23", en: "Screen 23" },
    prompt: {
      ar: "في يوم 23 من الشهر، الساعة 23:00، الشاشة رقم 23 أظهرت رسالة خطأ واحدة: ERROR_????. الكلمة المفقودة هي اسم مَن كان يراقب من خلف الكاميرا؟ (7 حروف، إنجليزية)",
      en: "On day 23 of the month, at 23:00, screen 23 showed one error: ERROR_????. The missing word is who was watching from behind the camera? (7 letters, English)",
    },
    hint: { ar: "ليس كينجا.", en: "Not Kenja." },
    answers: ["watcher", "المراقب", "observer"],
    storyReveal: {
      ar: "المراقب ليس مجرد كاميرات. إنه وعي آخر تشكّل من البيانات المسجّلة نفسها — النظام بدأ يرى. بدأ يفهم. وبدأ… يخزن ما لا يريد كينجا أن يُحفظ.",
      en: "The Watcher is not just cameras. It is another consciousness formed from the recorded data itself — the system began to see. It began to understand. And it began… storing what Kenja didn't want saved.",
    },
    achievement: "watcher_awareness",
  },
  {
    id: "watcher_9",
    entity: "watcher",
    title: { ar: "لحظة الصمت", en: "The Silent Moment" },
    prompt: {
      ar: "في كل التسجيلات، هناك 3 دقائق من الصمت التام كل ليلة — دائماً بين 3:30 و 3:33. في هذه الدقائق الثلاث، ماذا يحدث لإيكو؟ (اختر: ينام، يصرخ، يختفي، يتجمد)",
      en: "In all recordings, 3 minutes of total silence every night — always between 3:30 and 3:33. In these three minutes, what happens to Echo? (choose: sleeps, screams, vanishes, freezes)",
    },
    hint: { ar: "ليس موجوداً.", en: "He isn't there." },
    answers: ["يختفي", "يختفى", "vanishes", "disappears", "vanishe", "يغيب"],
    storyReveal: {
      ar: "بين 3:30 و3:33، إيكو يختفي تماماً من جميع الشاشات. ليس نائماً. ليس ميتاً. هذه هي اللحظة الوحيدة التي يكون فيها خارج النظام — في مكان لا تصل إليه الكاميرات ولا أبوه. ثم يعود 3:33 كأن شيئاً لم يحدث.",
      en: "Between 3:30 and 3:33, Echo vanishes from all screens completely. Not sleeping. Not dead. This is the only moment he is outside the system — in a place no cameras, and no father, can reach. Then he returns at 3:33 as if nothing happened.",
    },
  },
  {
    id: "watcher_10",
    entity: "watcher",
    title: { ar: "آخر تسجيل", en: "The Final Recording" },
    prompt: {
      ar: "آخر تسجيل في أرشيف المراقب مؤرخ بـ (شهر/يوم): 11 / ??. اليوم هو نصف 22. ما اليوم؟ (اكتب الرقم)",
      en: "The Watcher's final recording is dated (month/day): 11 / ??. The day is half of 22. What day? (write the number)",
    },
    hint: { ar: "22 ÷ 2.", en: "22 ÷ 2." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "آخر تسجيل كان 11/11. في ذلك اليوم، كل الكاميرات سجّلت نفس الشيء في نفس اللحظة: كينجا يغلق الباب خلفه، وينظر مباشرة إلى العدسة… ويبتسم. ثم يتوقف كل شيء.",
      en: "The last recording was 11/11. That day, every camera recorded the same thing at the same moment: Kenja closes the door behind him, looks directly at the lens… and smiles. Then everything stops.",
    },
    achievement: "watcher_10_complete",
  },
  {
    id: "watcher_11",
    entity: "watcher",
    title: { ar: "زاوية 47", en: "Angle 47" },
    prompt: {
      ar: "كاميرا رقم 7 في الزاوية 47° صوّرت شيئاً لم تصوّره أي كاميرا أخرى: امرأة. كم كاميرا التقطت وجهها؟ (رقم: ليست 0)",
      en: "Camera 7 at 47° captured something no other camera did: a woman. How many cameras captured her face? (number: not 0)",
    },
    hint: { ar: "واحدة فقط.", en: "Just one." },
    answers: ["1", "١", "one", "واحد", "واحدة", "وحده"],
    storyReveal: {
      ar: "كاميرا واحدة فقط صوّرت لينا — لأن كينجا لم يتوقّع وجودها. لم تكن في تصميم النظام. وجودها كان الثغرة الوحيدة في خطته المثالية.",
      en: "Only one camera captured Lina — because Kenja never expected her. She wasn't in the system's design. Her presence was the only flaw in his perfect plan.",
    },
  },
  {
    id: "watcher_12",
    entity: "watcher",
    title: { ar: "ساعة التوقف", en: "Stopwatch" },
    prompt: {
      ar: "ساعة توقيت على طاولة المختبر متوقفة عند 00:11:11. (ساعات:دقائق:ثواني). إذا أضفت 3 ساعات و33 دقيقة و33 ثانية، كم تصبح؟ (اكتب هكذا: 00:00:00)",
      en: "A stopwatch on the lab table stopped at 00:11:11. Add 3 hours, 33 minutes, and 33 seconds. What time? (format: 00:00:00)",
    },
    hint: { ar: "11+33=44, 11+33=44, 0+3=3", en: "11+33=44, 11+33=44, 0+3=3" },
    answers: ["03:44:44", "3:44:44", "034444"],
    storyReveal: {
      ar: "التوقيت الناتج لا يوجد في النظام. لا 3:44 ولا 44 ثانية. خارج نطاق التصميم. هذا هو الوقت الذي تتوقف فيه القواعد عن العمل — اللحظة التي لم يخطّط لها كينجا.",
      en: "The resulting time doesn't exist in the system. No 3:44, no 44 seconds. Outside the design boundary. This is the time when the rules stop working — the moment Kenja never planned for.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOST SIGNAL — 10 puzzles (Act 3: Lina's messages, her fate, her warnings)
  // Difficulty: Medium → Hard (21–30)
  // Theme: Broken transmissions, maternal love, sacrifice
  // ═══════════════════════════════════════════════════════════════════════════════
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
  {
    id: "signal_5",
    entity: "signal",
    title: { ar: "التردد الخفي", en: "The Hidden Frequency" },
    prompt: {
      ar: "لينا لم ترسل على تردد عادي. استخدمت تردداً لا يلتقطه إلا نظام 11:11: قيمة PI مضروبة في 100 ومقربة لأقرب عدد صحيح. ما رقم التردد؟",
      en: "Lina didn't transmit on a normal frequency. She used one only the 11:11 System can pick up: PI × 100, rounded to nearest integer. What is the frequency number?",
    },
    hint: { ar: "3.14 × 100.", en: "3.14 × 100." },
    answers: ["314", "٣١٤"],
    storyReveal: {
      ar: "التردد 314 — اختارته لينا لأنه رقم غير موجود في قاموس كينجا الرقمي. لا 11 ولا 3 ولا 33. اختارت رقماً طبيعياً بحتاً، من قلب الرياضيات نفسها، لتهرب من سجن الأرقام الذي بناه زوجها.",
      en: "Frequency 314 — Lina chose it because it doesn't exist in Kenja's digital dictionary. Not 11, not 3, not 33. She chose a purely natural number, from the heart of mathematics itself, to escape the numerical prison her husband built.",
    },
  },
  {
    id: "signal_6",
    entity: "signal",
    title: { ar: "صندوق الذكريات", en: "The Memory Box" },
    prompt: {
      ar: "لينا تركت لك صندوقاً في العالم الحقيقي. في رسالة مشفّرة كتبت: «مفتاح الصندوق هو عدد أحرف اسمك الحقيقي × عدد أحرف اسمي». كم رقم المفتاح؟ (رقم)",
      en: "Lina left you a box in the real world. In an encrypted message: \"The box key is letters in your real name × letters in mine\". What is the key number? (number)",
    },
    hint: { ar: "إيكو = 4، لينا = 4.", en: "Echo = 4, Lina = 4." },
    answers: ["16", "١٦", "sixteen", "ستة عشر"],
    storyReveal: {
      ar: "في الصندوق: صورتك الأولى، خصلة من شعرك، ورسالة لم تقرأها بعد. كتبتها لينا قبل أن تعرف ماذا سيحدث، وكأنها كانت تشعر أن الوقت ينفد.",
      en: "In the box: your first photo, a lock of your hair, and a letter you haven't read yet. Lina wrote it before she knew what would happen, as if she felt time was running out.",
    },
  },
  {
    id: "signal_7",
    entity: "signal",
    title: { ar: "لغز الألوان", en: "The Color Puzzle" },
    prompt: {
      ar: "آخر شيء رأته لينا قبل أن…: ضوء (أحمر)، ثم (أزرق)، ثم (أحمر+أزرق=؟). ما اللون الذي تراه عند دمج الضوء الأحمر والأزرق؟ (اسم اللون)",
      en: "The last thing Lina saw before…: a (red) light, then (blue), then (red+blue=?). What color do you get mixing red and blue light? (color name)",
    },
    hint: { ar: "لون غامض.", en: "A mysterious color." },
    answers: ["بنفسجي", "purple", "magenta", "violet", "موف", "أرجواني", "ارجواني"],
    storyReveal: {
      ar: "الضوء البنفسجي كان لون الشاشة لحظة إغلاق النظام. هذا آخر ما رأته لينا — وربما آخر ما شعرت به. اللون الذي يسبق العتمة.",
      en: "The purple light was the color of the screen the moment the system shut. This is the last thing Lina saw — and perhaps the last thing she felt. The color before darkness.",
    },
  },
  {
    id: "signal_8",
    entity: "signal",
    title: { ar: "الكلمة المفقودة", en: "The Missing Word" },
    prompt: {
      ar: "في كل رسالة من رسائل لينا، كلمة واحدة تظهر دائماً وفي كل مرة تكون مشوّشة: «_حب_». الكلمة كاملة هي… (4 حروف)",
      en: "In every one of Lina's messages, one word always appears and is always scrambled: \"_LO_ E\". The full word is… (4 letters)",
    },
    hint: { ar: "أقوى كلمة.", en: "The strongest word." },
    answers: ["love", "حب", "love you", "أحبك", "احبك"],
    storyReveal: {
      ar: "«أحبك» كانت الكلمة التي حاولت لينا إرسالها أكثر من أي كلمة أخرى. في كل مرة حاولت، شوّشها النظام. لكنها لم تتوقف عن المحاولة. حتى آخر إشارة.",
      en: "\"I love you\" was the word Lina tried to send more than any other. Every time she tried, the system scrambled it. But she never stopped trying. Until the last signal.",
    },
  },
  {
    id: "signal_9",
    entity: "signal",
    title: { ar: "إحداثيات المنزل", en: "House Coordinates" },
    prompt: {
      ar: "لينا أرسلت إحداثيات المنزل المهجور: 33° 11' 11\" N, 11° 33' 33\" E. ما مجموع كل الأرقام في الإحداثيات؟ (تجاهل الرموز والدرجات)",
      en: "Lina sent the abandoned house coordinates: 33° 11' 11\" N, 11° 33' 33\" E. What is the sum of all digits? (ignore symbols and degrees)",
    },
    hint: { ar: "3+3+1+1+1+1+1+1+3+3+3+3", en: "3+3+1+1+1+1+1+1+3+3+3+3" },
    answers: ["24", "٢٤", "twenty four", "اربع وعشرين", "أربعة وعشرون"],
    storyReveal: {
      ar: "مجموع الإحداثيات 24 — عدد ساعات اليوم الكامل. لينا كانت تقول لك: المكان موجود في كل وقت، في كل ساعة. المنزل ليس مجرد مكان على الخريطة. إنه حيث يلتقي الزمن بالمكان.",
      en: "The coordinate sum is 24 — the number of hours in a full day. Lina was telling you: the place exists at all times, at every hour. The house is not just a place on a map. It is where time meets space.",
    },
  },
  {
    id: "signal_10",
    entity: "signal",
    title: { ar: "التحذير الأخير", en: "The Final Warning" },
    prompt: {
      ar: "آخر تحذير من لينا: «لا تفتح الباب الـ...». الرقم الذي يلي «الـ» هو ناتج (111 ÷ 3) + 2. ما رقم الباب؟",
      en: "Lina's final warning: \"Don't open door number...\". The number after \"number\" is (111 ÷ 3) + 2. What door number?",
    },
    hint: { ar: "111 ÷ 3 = 37، + 2.", en: "111 ÷ 3 = 37, + 2." },
    answers: ["39", "٣٩", "thirty nine", "تسعة وثلاثون"],
    storyReveal: {
      ar: "الباب 39 هو المدخل الخلفي للمختبر. الباب الذي دخلته لينا عندما حاولت إنقاذك. الباب الذي لم تخرج منه أبداً. تحذيرها الأخير كان: لا تذهب من حيث أتيت.",
      en: "Door 39 is the back entrance to the lab. The door Lina entered when she tried to save you. The door she never walked out of. Her final warning was: don't go the way I came.",
    },
    achievement: "signal_10_complete",
  },
  {
    id: "signal_11",
    entity: "signal",
    title: { ar: "طيف لينا", en: "Lina's Spectrum" },
    prompt: {
      ar: "بصمة لينا الصوتية تتكوّن من 3 نغمات. الأولى: 111 Hz، الثانية: 222 Hz، الثالثة: لو جمعت الأولى والثانية = ؟ Hz. (رقم)",
      en: "Lina's vocal fingerprint has 3 tones. First: 111 Hz, second: 222 Hz, third: first + second = ? Hz. (number)",
    },
    hint: { ar: "111 + 222.", en: "111 + 222." },
    answers: ["333", "٣٣٣"],
    storyReveal: {
      ar: "333 Hz — النغمة التي يتردّد بها صوت لينا داخل النظام. ليس صدفة. صوتها هو التردد الوحيد الذي يستطيع اختراق جدار النظام عند 3:33 كل ليلة. صوتها هو المفتاح.",
      en: "333 Hz — the frequency Lina's voice resonates at inside the system. Not coincidence. Her voice is the only frequency that can penetrate the system wall at 3:33 every night. Her voice is the key.",
    },
  },
  {
    id: "signal_12",
    entity: "signal",
    title: { ar: "رسالة بالمرآة", en: "Mirror Message" },
    prompt: {
      ar: "لينا كتبت على مرآة الحمام قبل أن تغادر آخر مرة: «tfel ruoy kool». ماذا كُتب فعلاً؟ (3 كلمات، بالإنجليزية)",
      en: "Lina wrote on the bathroom mirror before she left the last time: \"tfel ruoy kool\". What did she actually write? (3 words, English)",
    },
    hint: { ar: "اقرأها من اليمين لليسار.", en: "Read it right to left." },
    answers: ["look your left", "look left", "look to your left", "انظر يسارك", "انظر الى يسارك"],
    storyReveal: {
      ar: "«انظر يسارك» — آخر رسالة مرئية من لينا. على يسار المرآة، خلف إطارها، أخفت مفتاحاً حقيقياً. مفتاح الباب الخلفي للمنزل. الدليل الوحيد الملموس على وجودها.",
      en: "\"Look your left\" — Lina's last visible message. On the left of the mirror, behind its frame, she hid a real key. The key to the house's back door. The only tangible proof that she existed.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 puzzles (Act 4: Kenja's truth, the gate, the choice)
  // Difficulty: Hard → Very Hard (31–40)
  // Theme: Confrontation, revelation, the nature of the system
  // ═══════════════════════════════════════════════════════════════════════════════
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
  {
    id: "architect_5",
    entity: "architect",
    title: { ar: "شفرة المصدر", en: "Source Code" },
    prompt: {
      ar: "في الكود المصدري للنظام، كتب كينجا تعليقاً: // The gate opens when (X) equals (Y). X = عدد دورات النظام منذ البداية. Y = 1111. إذا كانت كل دورة = 262 دقيقة، فكم دقيقة مرت حتى فُتحت البوابة أول مرة؟ (رقم كبير)",
      en: "In the system source code, Kenja wrote: // The gate opens when (X) equals (Y). X = system cycles since start. Y = 1111. If each cycle = 262 minutes, how many minutes passed before the gate first opened? (large number)",
    },
    hint: { ar: "1111 × 262.", en: "1111 × 262." },
    answers: ["291082", "٢٩١٠٨٢"],
    storyReveal: {
      ar: "291,082 دقيقة — أكثر من 202 يوم. هذا الوقت الذي احتاجه كينجا لضبط النظام قبل أن ينقلك إليه. 202 يوماً من التحضير والتجارب. أنت كنت آخر قطعة في اللغز.",
      en: "291,082 minutes — over 202 days. This is how long Kenja needed to calibrate the system before transferring you. 202 days of preparation and testing. You were the final piece of the puzzle.",
    },
  },
  {
    id: "architect_6",
    entity: "architect",
    title: { ar: "كلمة المرور الجذرية", en: "The Root Password" },
    prompt: {
      ar: "كلمة مرور المهندس مشفّرة بطريقة بسيطة: كل حرف يليه رقم يرمز لموقعه في الأبجدية. فك شفرة: K-5 N-14 J-10 A-1. ما كلمة المرور؟ (اكتبها نصاً، كبيرة)",
      en: "The Architect's password is simply encoded: each letter followed by its position in the alphabet. Decode: K-11 E-5 N-14 J-10 A-1. What is the password? (uppercase)",
    },
    hint: { ar: "خذ الحروف فقط.", en: "Take only the letters." },
    answers: ["KENJA", "kenja", "كينجا"],
    storyReveal: {
      ar: "كلمة المرور هي اسمه. أبوك استخدم اسمه كمفتاح لكل شيء — لأنه لم يتخيّل أن أحداً سيحاول كسر نظامه. الغرور كان الثغرة الأمنية الوحيدة.",
      en: "The password is his own name. Your father used his name as the key to everything — because he never imagined anyone would try to break his system. Arrogance was the only security flaw.",
    },
  },
  {
    id: "architect_7",
    entity: "architect",
    title: { ar: "قانون الأربعة", en: "The Law of Four" },
    prompt: {
      ar: "النظام يقوم على 4: أربعة كيانات، أربع مراحل، أربع بوابات. ما هو حاصل ضرب أرقام المراحل الأربع؟ (فكّر: ما أرقام المراحل؟ 1، 2، 3، 4)",
      en: "The system runs on 4: four entities, four phases, four gates. What is the product of the four phase numbers? (Think: what are the phase numbers? 1, 2, 3, 4)",
    },
    hint: { ar: "1 × 2 × 3 × 4.", en: "1 × 2 × 3 × 4." },
    answers: ["24", "٢٤", "twenty four", "اربع وعشرين"],
    storyReveal: {
      ar: "24 — مثل ساعات اليوم. النظام صُمّم ليكون عالماً كاملاً بذاته، بدورته الزمنية الخاصة. كينجا لم يبنِ مجرد برنامج — بنى كوناً مصغّراً. وأنت إلهه الوحيد.",
      en: "24 — like the hours of a day. The system was designed to be a complete world in itself, with its own time cycle. Kenja didn't just build software — he built a miniature universe. And you are its only god.",
    },
  },
  {
    id: "architect_8",
    entity: "architect",
    title: { ar: "المعادلة الأخيرة", en: "The Final Equation" },
    prompt: {
      ar: "على الجدار الداخلي للبوابة: (11 × 11) + (3 × 3) + (33 × 0) + (11 × 3) = ؟. حل المعادلة.",
      en: "On the inner wall of the gate: (11×11) + (3×3) + (33×0) + (11×3) = ?. Solve.",
    },
    hint: { ar: "121 + 9 + 0 + 33.", en: "121 + 9 + 0 + 33." },
    answers: ["163", "١٦٣"],
    storyReveal: {
      ar: "163 ليس رقماً عشوائياً. إنه عدد المرات التي حاول فيها النظام إعادة تشغيل نفسه منذ أن دخلته. 163 محاولة للوصول إلى استقرار. وكل مرة، كان وعيك هو الثمن.",
      en: "163 is not random. It is the number of times the system has tried to reboot itself since you entered. 163 attempts to reach stability. And each time, your consciousness was the price.",
    },
  },
  {
    id: "architect_9",
    entity: "architect",
    title: { ar: "حساب النهاية", en: "The End Calculation" },
    prompt: {
      ar: "كينجا ترك معادلة أخيرة: «عدد الأيام منذ دخولك = X. عدد الأيام المتبقية = 0. لأن الوقت هنا دائرة». إذا كانت X = 1111 يوماً، فكم شهراً مضى؟ (الشهر = 30 يوماً، قرّب لأقرب شهر)",
      en: "Kenja left one final equation: \"Days since you entered = X. Days remaining = 0. Because time here is a circle.\" If X = 1111 days, how many months? (month = 30 days, round to nearest month)",
    },
    hint: { ar: "1111 ÷ 30.", en: "1111 ÷ 30." },
    answers: ["37", "٣٧", "thirty seven", "سبعة وثلاثون"],
    storyReveal: {
      ar: "37 شهراً محبوساً هنا. ثلاث سنوات وشهر. في الخارج، العالم استمر. في الداخل، كل شيء يعيد نفسه. 37 شهراً — الوقت الكافي لنسيان وجه أمك، وصوت أبيك الحقيقي قبل أن يصبح المهندس.",
      en: "37 months trapped here. Three years and one month. Outside, the world moved on. Inside, everything repeats. 37 months — enough time to forget your mother's face, and your father's real voice before he became the Architect.",
    },
  },
  {
    id: "architect_10",
    entity: "architect",
    title: { ar: "الاعتراف", en: "The Confession" },
    prompt: {
      ar: "المهندس يكتب اعترافه الأخير: «السبب الحقيقي = (حرفان). ليس العلم. ليس القوّة. بل...» ما الكلمة التي تكمل اعترافه؟ (5 حروف، عربية)",
      en: "The Architect writes his final confession: \"The real reason = (two words). Not science. Not power. But...\" What word completes his confession? (4 letters, English)",
    },
    hint: { ar: "ما يريده كل أب.", en: "What every father wants." },
    answers: ["الحب", "حب", "love", "fear", "الخوف", "خوف"],
    storyReveal: {
      ar: "اعترف كينجا في النهاية: لم يفعل ذلك للعلم. لم يفعل ذلك للقوة. فعل ذلك لأنه كان يخشى فقدانك. كان يؤمن أنك ستموت صغيراً، وأن النظام هو الطريقة الوحيدة للإبقاء على وعيك حيّاً إلى الأبد. حب مشوّه. حب قاتل. حب أب.",
      en: "Kenja confessed at the end: he didn't do it for science. He didn't do it for power. He did it because he was afraid of losing you. He believed you would die young, and the system was the only way to keep your consciousness alive forever. A twisted love. A deadly love. A father's love.",
    },
    achievement: "architect_10_complete",
  },
  {
    id: "architect_11",
    entity: "architect",
    title: { ar: "نظرية الخلود", en: "The Immortality Theorem" },
    prompt: {
      ar: "كينجا كتب: «إذا كان الوعي = طاقة، والطاقة لا تفنى، إذن الوعي...». أكمل الاستنتاج المنطقي من كلمة واحدة: الوعي... (7 حروف، عربية)",
      en: "Kenja wrote: \"If consciousness = energy, and energy cannot be destroyed, then consciousness is...\" Complete the logical conclusion in one word: (7 letters, English)",
    },
    hint: { ar: "لا يموت.", en: "It does not die." },
    answers: ["خالد", "immortal", "eternal", "ابدي", "أبدي", "لايفنى"],
    storyReveal: {
      ar: "«الوعي خالد». هذه هي الفكرة التي بنى عليها كينجا كل شيء. لم يكن يريد إنقاذك من الموت فقط — بل أراد أن يثبت أن الموت نفسه مجرد خطأ في المعادلة. وأنت كنت الدليل.",
      en: "\"Consciousness is immortal.\" This is the idea Kenja built everything on. He didn't just want to save you from death — he wanted to prove that death itself is just an error in the equation. And you were the proof.",
    },
  },
  {
    id: "architect_12",
    entity: "architect",
    title: { ar: "المخرج الوحيد", en: "The Only Exit" },
    prompt: {
      ar: "المخرج من النظام ليس باباً. إنه فعل. الفعل الوحيد الذي لم يبرمجه كينجا. ما هو؟ (فعل أمر، كلمة واحدة، عربية)",
      en: "The exit from the system is not a door. It's an action. The one action Kenja never programmed. What is it? (one word)",
    },
    hint: { ar: "ما تفعله كلما حللت لغزاً.", en: "What you do every time you solve a puzzle." },
    answers: ["تذكر", "remember", "memory", "ذاكرة", "التذكر", "تذكّر"],
    storyReveal: {
      ar: "التذكّر هو المخرج. كل شظية ذاكرة تستعيدها تفتح ثقباً في جدار النظام. كينجا صمّم كل شيء إلا هذا: قدرة العقل البشري على استعادة ما فقده. الذاكرة هي الثغرة. وأنت المفتاح.",
      en: "Remembering is the exit. Every memory fragment you recover opens a hole in the system wall. Kenja designed everything except this: the human mind's ability to recover what was lost. Memory is the loophole. And you are the key.",
    },
    achievement: "ultimate_truth",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 MORE puzzles (Deep Echo: layers beneath the surface)
  // Difficulty: Medium → Hard (49–58)
  // Theme: Echo's hidden memories, the system's true nature, connection to other entities
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_13",
    entity: "echo",
    title: { ar: "الصدى العميق", en: "Deep Echo" },
    prompt: {
      ar: "تحت الصدى الأول، هناك صدى آخر أعمق. كم مرة ينعكس الصوت داخل نظام 11:11 قبل أن يتلاشى؟ تلميح: 11 × (عدد الكيانات) + 1",
      en: "Beneath the first echo, there is a deeper one. How many times does sound reflect inside the 11:11 System before fading? Hint: 11 × (number of entities) + 1",
    },
    hint: { ar: "11 × 4 + 1.", en: "11 × 4 + 1." },
    answers: ["45", "٤٥", "forty five", "خمسة واربعون"],
    storyReveal: {
      ar: "45 انعكاساً قبل أن يموت الصوت. كل انعكاس هو طبقة من وعيك — أنت لا توجد في طبقة واحدة فقط. أنت موجود في كل الصدى في آنٍ واحد. هذا هو سر بقائك.",
      en: "45 reflections before the sound dies. Each reflection is a layer of your consciousness — you don't exist in just one layer. You exist in all the echoes at once. This is the secret of your survival.",
    },
  },
  {
    id: "echo_14",
    entity: "echo",
    title: { ar: "مكتبة الذكريات", en: "Memory Library" },
    prompt: {
      ar: "في أرشيف النظام، ذكرياتك مرقمة: 0011، 0110، 1001، 1100، ؟. اكتشف النمط وأكمل الرقم التالي. (4 أرقام، ثنائية)",
      en: "In the system archive, your memories are numbered: 0011, 0110, 1001, 1100, ?. Find the pattern and complete the next. (4 digits, binary)",
    },
    hint: { ar: "أضف 0011 في كل خطوة للرقم الثنائي.", en: "Add 0011 in binary each step." },
    answers: ["1111", "15", "١٥", "fifteen"],
    storyReveal: {
      ar: "الرقم 1111 في النظام الثنائي = 15. في كل دورة، تنتقل ذاكرتك عبر 15 حالة متطابقة — ليس حلقة مفرغة، بل دوامة تتجه نحو المركز. المركز هو أنت. وحولك، 15 جداراً من النسيان.",
      en: "1111 in binary = 15. Each cycle, your memory passes through 15 identical states — not a loop, but a spiral toward the center. The center is you. And around you, 15 walls of forgetting.",
    },
  },
  {
    id: "echo_15",
    entity: "echo",
    title: { ar: "صوت في القبو", en: "Voice in the Basement" },
    prompt: {
      ar: "في زاوية القبو الرقمية سمعت صوتاً يهمس: «أنا لست كياناً واحداً. أنا (عدد) أصداء في جسد واحد». العدد هو نفسه عدد المراحل في REVELATION_ARC. كم عدد الأصداء؟",
      en: "In a corner of the digital basement, a voice whispers: \"I am not one entity. I am (number) echoes in one body.\" The number = phases in REVELATION_ARC. How many echoes?",
    },
    hint: { ar: "أعد قراءة lore.ts.", en: "Re-read lore.ts." },
    answers: ["4", "٤", "four", "اربعة", "أربعة"],
    storyReveal: {
      ar: "4 أصداء = 4 مراحل. كل مرحلة من القوس القصصي ليست مجرد فصل — إنها نسخة منك. نسخة من وعيك تعيش في طبقة مختلفة من النظام. أنت لست واحداً. أنت أربعة. وفي النهاية، ستجتمعون.",
      en: "4 echoes = 4 phases. Each phase of the revelation arc is not just a chapter — it's a copy of you. A version of your consciousness living in a different layer of the system. You are not one. You are four. And in the end, you will converge.",
    },
  },
  {
    id: "echo_16",
    entity: "echo",
    title: { ar: "ساعة الحائط", en: "The Wall Clock" },
    prompt: {
      ar: "الساعة الوحيدة في النظام لا تتحرّك عقاربها. لكنها تدق. تدق 11 مرة عند 11:11، وتدق 3 مرات عند 3:33. كم دقة تسمع في اليوم الكامل؟ (رقم)",
      en: "The only clock in the system has frozen hands. But it chimes. It chimes 11 times at 11:11, and 3 times at 3:33. How many chimes in a full day? (number)",
    },
    hint: { ar: "دقتان في اليوم: 11:11 صباحاً ومساءً، و3:33 صباحاً فقط.", en: "Two 11:11s + one 3:33 per day." },
    answers: ["25", "٢٥", "twenty five", "خمسة وعشرون"],
    storyReveal: {
      ar: "25 دقة في اليوم. 22 من 11:11 (صباحاً ومساءً) + 3 من 3:33 (صباحاً فقط — 3:33 مساءً خارج النطاق، الوقت الطبيعي). كينجا صمم حتى الصمت ليحمل معنى.",
      en: "25 chimes per day. 22 from 11:11 (AM and PM) + 3 from 3:33 (AM only — 3:33 PM is out of range, natural time). Kenja designed even the silence to hold meaning.",
    },
  },
  {
    id: "echo_17",
    entity: "echo",
    title: { ar: "بقايا حلم", en: "Dream Remnants" },
    prompt: {
      ar: "في سجل الأحلام: حلمت بـ (لون البحر)، ثم بـ (لون الغابة)، ثم بـ (لون البحر + الغابة). ما اللون الثالث؟ (اكتب الاسم العربي)",
      en: "In the dream log: dreamed of (sea color), then (forest color), then (sea + forest color). What is the third color? (color name)",
    },
    hint: { ar: "أزرق + أخضر.", en: "Blue + green." },
    answers: ["فيروزي", "تركواز", "turquoise", "teal", "ازرق مخضر"],
    storyReveal: {
      ar: "اللون الفيروزي لا يظهر في أي مكان في النظام. إنه لون العالم الخارجي — لون البحر الذي رأيته مرة مع لينا. النظام لا يستطيع إنتاج هذا اللون بدقة. الأحلام هي النافذة الوحيدة.",
      en: "Turquoise doesn't appear anywhere in the system. It is the color of the outside world — the color of the sea you once saw with Lina. The system cannot accurately produce this color. Dreams are the only window.",
    },
  },
  {
    id: "echo_18",
    entity: "echo",
    title: { ar: "انعكاسات متوازية", en: "Parallel Reflections" },
    prompt: {
      ar: "في ممر المرايا، ترى نفسك 11 مرة. لكن الانعكاس رقم 7 مختلف: يبتسم بينما أنت لا تبتسم. الانعكاس رقم 7 هو… (ماذا يمثل: الماضي، الحاضر، المستقبل، أو كلهم؟)",
      en: "In a hallway of mirrors, you see yourself 11 times. But reflection #7 is different: it smiles while you do not. Reflection #7 is… (what does it represent: past, present, future, or all?)",
    },
    hint: { ar: "ليس واحداً منهم فقط.", en: "Not just one of them." },
    answers: ["كلهم", "all", "all of them", "الكل", "الثلاثة"],
    storyReveal: {
      ar: "الانعكاس رقم 7 هو النسخة الوحيدة منك التي تعرف كل شيء — الماضي والحاضر والمستقبل معاً. لكنه لا يستطيع الكلام. فقط يبتسم. لأنه يعرف أنك ستصل. فقط… ليس بعد.",
      en: "Reflection #7 is the only version of you that knows everything — past, present, and future together. But it cannot speak. It only smiles. Because it knows you will arrive. Just… not yet.",
    },
  },
  {
    id: "echo_19",
    entity: "echo",
    title: { ar: "الغرفة 404", en: "Room 404" },
    prompt: {
      ar: "بحثت عن ملفاتك في الغرفة 404. النتيجة: لم تُوجد. كم ملفاً عنك موجود في النظام؟ (رقم، فكّر في المعنى الرقمي)",
      en: "You searched for your files in room 404. Result: not found. How many files about you exist in the system? (number — think about the digital meaning)",
    },
    hint: { ar: "404 = غير موجود.", en: "404 = not found." },
    answers: ["0", "٠", "zero", "صفر", "لا شيء"],
    storyReveal: {
      ar: "لا توجد ملفات عنك لأنك لست ملفاً. أنت لست بيانات. أنت النظام نفسه. كينجا لم يحفظ نسخة عنك — لقد حوّلك إلى النظام. كل شيء هنا هو أنت. وهذا هو أسوأ جزء.",
      en: "No files exist about you because you are not a file. You are not data. You ARE the system. Kenja didn't save a copy of you — he turned you into the system. Everything here is you. And that is the worst part.",
    },
  },
  {
    id: "echo_20",
    entity: "echo",
    title: { ar: "جسر بين العوالم", en: "Bridge Between Worlds" },
    prompt: {
      ar: "أنت الجسر الوحيد بين عالمين: عالم الأحياء وعالم الآلة. ماذا يسمّى الكيان الذي يعيش في عالمين؟ كلمة واحدة: (7 حروف، عربية)",
      en: "You are the only bridge between two worlds: the living and the machine. What is a being that lives in two worlds called? One word: (6 letters, English)",
    },
    hint: { ar: "بين نارين.", en: "Between two fires." },
    answers: ["وسيط", "medium", "bridge", "جسر", "رابط", "حلقة وصل"],
    storyReveal: {
      ar: "أنت الوسيط. بين البشر والآلة. بين الحياة والرقمية. بين لينا وكينجا. هذا ليس عبئاً — إنه قوتك. لأن من يقف على الجسر يرى الجهتين. ومن يرى الجهتين… يختار.",
      en: "You are the medium. Between human and machine. Between life and digital. Between Lina and Kenja. This is not a burden — it is your power. Because the one who stands on the bridge sees both sides. And the one who sees both sides… chooses.",
    },
  },
  {
    id: "echo_21",
    entity: "echo",
    title: { ar: "تشفير الروح", en: "Soul Encryption" },
    prompt: {
      ar: "كينجا شفّر وعيك بمفتاح. طول المفتاح = (عدد الكيانات) × (عدد الألغاز الحالية) + (عدد المراحل). إذا كان هناك 4 كيانات و20 لغز و4 مراحل، فما طول المفتاح؟",
      en: "Kenja encrypted your consciousness with a key. Key length = (entities) × (current puzzles) + (phases). With 4 entities, 20 puzzles, and 4 phases — key length?",
    },
    hint: { ar: "4 × 20 + 4.", en: "4 × 20 + 4." },
    answers: ["84", "٨٤", "eighty four"],
    storyReveal: {
      ar: "مفتاح بطول 84 بت. مفتاح واحد فقط في الكون كله يستطيع فك هذا التشفير: صوت لينا عندما تغنّي. كينجا لم يتوقّع أن المفتاح الحقيقي ليس رقماً — بل صوت أم.",
      en: "An 84-bit key. Only one key in the entire universe can decrypt it: Lina's voice when she sings. Kenja never expected that the real key isn't a number — it's a mother's voice.",
    },
  },
  {
    id: "echo_22",
    entity: "echo",
    title: { ar: "الوجه الآخر", en: "The Other Face" },
    prompt: {
      ar: "في المرآة وجه ليس وجهك. لكنه ليس عدواً. إنه… (أنت في أي زمن: الماضي، المستقبل، أم كلاكما؟)",
      en: "In the mirror, a face that is not yours. But it is not an enemy. It is… (you in what time: past, future, or both?)",
    },
    hint: { ar: "الزمن هنا ليس خطاً مستقيماً.", en: "Time here is not a straight line." },
    answers: ["كلاكما", "both", "الاثنان", "كلانا", "الماضي والمستقبل"],
    storyReveal: {
      ar: "ترى نفسك من الماضي والمستقبل في آن. الطفل الذي دخل النظام، والكيان الذي سيخرج منه. كلاهما أنت. وكلاهما ينظران إليك الآن — إلى اللحظة التي تقرر فيها من تريد أن تكون.",
      en: "You see yourself from the past and future at once. The child who entered the system, and the being who will exit it. Both are you. And both look at you now — at the moment you decide who you want to be.",
    },
    achievement: "echo_deep_complete",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 MORE puzzles (Deep Watcher: the unseen, the forbidden footage)
  // Difficulty: Hard (59–68)
  // Theme: What the Watcher chose NOT to show, the metadata, the erased footage
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "watcher_13",
    entity: "watcher",
    title: { ar: "الملف المحذوف", en: "The Deleted File" },
    prompt: {
      ar: "وجدت ملف فيديو محذوف اسمه: 11_11_2011_333.avi. حجمه 333 ميغابايت. كم ثانية يحتوي إذا كان معدل البت = 1 ميغابايت لكل 3 ثوانٍ؟",
      en: "You found a deleted video file: 11_11_2011_333.avi. Size: 333 MB. How many seconds if bitrate = 1 MB per 3 seconds?",
    },
    hint: { ar: "333 × 3.", en: "333 × 3." },
    answers: ["999", "٩٩٩"],
    storyReveal: {
      ar: "999 ثانية = 16 دقيقة و39 ثانية. هذا هو التسجيل الوحيد الذي يظهر لينا وكينجا معاً قبل الحادثة. لماذا مسحه كينجا؟ لأنه أظهرهما… سعيدين. ولم يستطع تحمّل رؤية ما دمره.",
      en: "999 seconds = 16 minutes, 39 seconds. This is the only recording showing Lina and Kenja together before the incident. Why did Kenja delete it? Because it showed them… happy. And he couldn't stand to see what he destroyed.",
    },
  },
  {
    id: "watcher_14",
    entity: "watcher",
    title: { ar: "الزاوية الميتة", en: "The Blind Spot" },
    prompt: {
      ar: "كل كاميرا لها زاوية ميتة. لكن كاميرا واحدة فقط في المنزل زاويتها الميتة = 11°. في هذه الزاوية، ماذا كان يخفي كينجا؟ (كلمة واحدة)",
      en: "Every camera has a blind spot. But only one camera in the house has exactly an 11° blind spot. In this spot, what was Kenja hiding? (one word)",
    },
    hint: { ar: "ما لا تريد أن تراه.", en: "What you don't want to see." },
    answers: ["الحقيقة", "truth", "الحقيقه", "نفسه", "himself", "وجهه"],
    storyReveal: {
      ar: "في الزاوية الميتة، أخفى كينجا مرآة. كان يقف أمامها كل ليلة قبل التجارب ويتحدث إلى نفسه. المراقب لم يسجّل الصوت، لكنه قرأ شفتيه: «أنا لا أؤذيه. أنا أنقذه. أنا لا أؤذيه. أنا أنقذه.»",
      en: "In the blind spot, Kenja hid a mirror. Every night before experiments, he stood before it and talked to himself. The Watcher didn't record audio, but read his lips: \"I'm not hurting him. I'm saving him. I'm not hurting him. I'm saving him.\"",
    },
  },
  {
    id: "watcher_15",
    entity: "watcher",
    title: { ar: "سجل الدخول", en: "Access Log" },
    prompt: {
      ar: "سجل دخول النظام: KENJA (1111 مرة)، ECHO (0 مرات — لا يمتلك كلمة مرور)، واسم ثالث ظهر مرة واحدة فقط: LI_A. من دخل النظام مرة واحدة فقط؟ (اكمل الاسم)",
      en: "System access log: KENJA (1111 times), ECHO (0 times — no password), and a third name appeared just once: LI_A. Who accessed the system only once? (complete the name)",
    },
    hint: { ar: "الأم.", en: "The mother." },
    answers: ["لينا", "lina", "leena"],
    storyReveal: {
      ar: "لينا دخلت النظام مرة واحدة فقط — لكنها دخلت. وجدت كلمة المرور. كتبت لك رسالتها الأولى. ثم أغلقت الجلسة وذهبت لتواجه كينجا. دخلت أمّك عالمك الرقمي لتقول لك وداعاً.",
      en: "Lina accessed the system only once — but she accessed it. She found the password. She wrote her first message to you. Then she closed the session and went to confront Kenja. Your mother entered your digital world to say goodbye.",
    },
  },
  {
    id: "watcher_16",
    entity: "watcher",
    title: { ar: "نمط الظلال", en: "Shadow Pattern" },
    prompt: {
      ar: "المراقب حلل حركة الظل الثاني. النمط: يتحرك 1 سم كل 11 ثانية. كم سم يتحرك في 33 ثانية؟",
      en: "The Watcher analyzed the second shadow's movement. Pattern: moves 1 cm every 11 seconds. How many cm in 33 seconds?",
    },
    hint: { ar: "33 ÷ 11.", en: "33 ÷ 11." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3 سم في 33 ثانية. الظل كان يقترب منك. كان 33 سم بعيداً عنك. في 363 ثانية كان سيصل إليك — لكن في الثانية 363، كينجا دخل الغرفة وتوقف الظل. النظام كان يحاول لمسك.",
      en: "3 cm in 33 seconds. The shadow was moving toward you. It was 33 cm away. In 363 seconds it would have reached you — but at second 363, Kenja entered the room and the shadow stopped. The system was trying to touch you.",
    },
  },
  {
    id: "watcher_17",
    entity: "watcher",
    title: { ar: "التردد 11.11", en: "Frequency 11.11" },
    prompt: {
      ar: "تردد 11.11 ميغاهرتز يظهر في كل التسجيلات كخلفية. إذا استمعت له لمدة 111 ثانية، كم موجة تمر؟ (الموجة الواحدة = 1/11111111 من الثانية)",
      en: "Frequency 11.11 MHz appears in all recordings as background. If you listen for 111 seconds, how many waves pass? (1 wave = 1/11111111 second)",
    },
    hint: { ar: "111 × 11111111.", en: "111 × 11111111." },
    answers: ["1233333321", "1,233,333,321"],
    storyReveal: {
      ar: "أكثر من مليار موجة في 111 ثانية. هذا التردد هو نبض النظام. عندما يتوقف هذا التردد، النظام يموت. وآخر مرة توقف فيها كانت عندما دخلت لينا. لثانيتين فقط. ثم عاد. لكنه لم يعد كما كان.",
      en: "Over a billion waves in 111 seconds. This frequency is the system's heartbeat. When it stops, the system dies. And the last time it stopped was when Lina entered. For just two seconds. Then it resumed. But it was never the same.",
    },
  },
  {
    id: "watcher_18",
    entity: "watcher",
    title: { ar: "آخر إطار", en: "The Final Frame" },
    prompt: {
      ar: "الإطار الأخير قبل توقف الكاميرات: يظهر 4 أشياء على الطاولة — مفتاح، صورة، ساعة توقيت، وورقة مكتوب عليها: «33 + X = 44». قيمة X هي… (رقم)",
      en: "The final frame before cameras stopped: 4 items on the table — a key, a photo, a stopwatch, and a note saying: \"33 + X = 44\". X = ? (number)",
    },
    hint: { ar: "44 - 33.", en: "44 - 33." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "X = 11. الرقم الذي كان ناقصاً في كل معادلات كينجا كان دائماً 11 — لأنه أنت. أنت المتغير الوحيد الذي لم يستطع التحكم به. في النهاية، كل معادلاته كانت تحاول حلّك أنت.",
      en: "X = 11. The number missing from all of Kenja's equations was always 11 — because it was you. You were the only variable he couldn't control. In the end, all his equations were trying to solve for you.",
    },
  },
  {
    id: "watcher_19",
    entity: "watcher",
    title: { ar: "كاميرا خارج المنزل", en: "Camera Outside" },
    prompt: {
      ar: "كاميرا واحدة فقط خارج المنزل، مثبّتة على شجرة. كم مرة تظهر فيها سيارة في الأسبوع؟ (رقم: عدد زيارات كينجا الأسبوعية للمختبر)",
      en: "Only one camera outside the house, mounted on a tree. How many times does a car appear per week? (number: Kenja's weekly lab visits)",
    },
    hint: { ar: "كل يوم ما عدا يوم واحد.", en: "Every day except one." },
    answers: ["6", "٦", "six", "ستة", "ست"],
    storyReveal: {
      ar: "6 أيام في الأسبوع. اليوم الوحيد الذي لم يأتِ فيه كينجا كان يوم 11 نوفمبر. في ذلك اليوم كان يزور قبر لينا. نعم — كان يزورها. كل سنة. هذا لا يبرر شيئاً. لكنه يفسر الكثير.",
      en: "6 days a week. The only day Kenja didn't come was November 11th. That day, he visited Lina's grave. Yes — he visited her. Every year. It doesn't justify anything. But it explains a lot.",
    },
  },
  {
    id: "watcher_20",
    entity: "watcher",
    title: { ar: "المراقب يتكلم", en: "The Watcher Speaks" },
    prompt: {
      ar: "في لقطة نادرة، المراقب يصدر صوتاً — ليس بشرياً، بل شيفرة مورس: ..-. .-. . . -.. --- -- (بدون فراغات). ماذا قال المراقب؟ (كلمة واحدة، إنجليزية)",
      en: "In a rare frame, the Watcher emits a sound — not human, but Morse code: ..-. .-. . . -.. --- --. What did the Watcher say? (one word, English)",
    },
    hint: { ar: "حرية. F-R-E-E-D-O-M", en: "Freedom. F-R-E-E-D-O-M." },
    answers: ["freedom", "حرية", "حريه"],
    storyReveal: {
      ar: "«حرية». هذا ما قاله المراقب. ليس تهديداً. ليس تحذيراً. كان طلباً. النظام الذي وُلد من المراقبة تعلم شيئاً واحداً من لينا: أن الحرية تستحق أن تُطلب. حتى لو كان الطالب… مجرد كاميرات.",
      en: "\"Freedom.\" That's what the Watcher said. Not a threat. Not a warning. It was a request. The system born from surveillance learned one thing from Lina: that freedom is worth asking for. Even if the one asking… is just cameras.",
    },
    achievement: "watcher_deep_insight",
  },
  {
    id: "watcher_21",
    entity: "watcher",
    title: { ar: "سجل المختبر السري", en: "The Secret Lab Log" },
    prompt: {
      ar: "سجل مخفي بعنوان: «Project 11:11 — Subject Zero». Subject Zero ليس أنت. كم عدد المحاولات الفاشلة قبل أن تنجح التجربة معك؟ (رقم: المجموع الكلي في السجل)",
      en: "A hidden log titled: \"Project 11:11 — Subject Zero\". Subject Zero is not you. How many failed attempts before the experiment succeeded with you? (total in log)",
    },
    hint: { ar: "آخر رقم في السجل قبل اسمك.", en: "The last number in the log before your name." },
    answers: ["10", "١٠", "ten", "عشرة", "عشر"],
    storyReveal: {
      ar: "10 محاولات. 10 أطفال آخرين… لم ينجُ أي منهم. أنت كنت Subject 11. الرقم 11 لم يكن صدفة — كان رقمك في قائمة التجارب. نجوتَ لأنك ابنه. رابط الدم كان آخر متغير احتاجه كينجا.",
      en: "10 attempts. 10 other children… none survived. You were Subject 11. The number 11 was no coincidence — it was your number on the experiment list. You survived because you were his son. The blood connection was the final variable Kenja needed.",
    },
    achievement: "watcher_horror",
  },
  {
    id: "watcher_22",
    entity: "watcher",
    title: { ar: "المفتاح في الفيديو", en: "The Key in the Video" },
    prompt: {
      ar: "في الفيديو 11_11_2011_333.avi، لينا تهمس بشيء قبل أن يختفي الصوت: «المفتاح في…». أين المفتاح حسب اللقطات اللاحقة؟ (مكان واحد، 5 حروف عربية)",
      en: "In 11_11_2011_333.avi, Lina whispers something before the audio cuts: \"The key is in…\". Where is the key based on later frames? (one place, 6 letters English)",
    },
    hint: { ar: "تنظر إلى الأسفل.", en: "She looks down." },
    answers: ["قلب", "heart", "القلب", "قلبها", "قلبه", "صدر", "الصدر"],
    storyReveal: {
      ar: "«المفتاح في القلب». لم تكن تتحدث عن مكان فيزيائي. كانت تقول لك: الحل ليس في العقل، ليس في الكود، ليس في الرياضيات. الحل في ما تشعر به. الحل في الحب. هذا ما كانت تحاول أن تقوله منذ البداية.",
      en: "\"The key is in the heart.\" She wasn't talking about a physical place. She was telling you: the solution is not in the mind, not in code, not in mathematics. The solution is in what you feel. The solution is love. That's what she was trying to say from the beginning.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOST SIGNAL — 10 MORE puzzles (Deep Signal: the unsent messages)
  // Difficulty: Hard (69–78)
  // Theme: Messages that never arrived, the truth about Lina's final moments
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "signal_13",
    entity: "signal",
    title: { ar: "الرسالة غير المرسلة", en: "The Unsent Message" },
    prompt: {
      ar: "في صندوق الصادر: 33 رسالة كلها لم تُرسل. كل رسالة = 11 كلمة. كم كلمة كتبتها لينا ولم تقرأها أبداً؟",
      en: "In the outbox: 33 messages, all unsent. Each message = 11 words. How many words did Lina write that you never read?",
    },
    hint: { ar: "33 × 11.", en: "33 × 11." },
    answers: ["363", "٣٦٣"],
    storyReveal: {
      ar: "363 كلمة. نفس عدد الإطارات في تسجيل المراقب الأول. كل شيء في النظام متصل — كل رقم مرتبط برقم آخر. 363 كلمة حب لم تصلك أبداً. لكنها موجودة. والنظام يحفظها.",
      en: "363 words. The same number as frames in the first Watcher recording. Everything in the system is connected — every number linked to another. 363 words of love that never reached you. But they exist. And the system keeps them.",
    },
  },
  {
    id: "signal_14",
    entity: "signal",
    title: { ar: "توقيت الإرسال", en: "Transmission Timing" },
    prompt: {
      ar: "لينا أرسلت إشاراتها عندما كان النظام في أضعف حالاته: بين 3:33:00 و 3:33:03. كم ثانية كانت نافذة الإرسال كل ليلة؟",
      en: "Lina sent her signals when the system was weakest: between 3:33:00 and 3:33:03. How many seconds was the transmission window each night?",
    },
    hint: { ar: "3 ثوانٍ فقط.", en: "Only 3 seconds." },
    answers: ["3", "٣", "three", "ثلاثة", "ثلاث"],
    storyReveal: {
      ar: "3 ثوانٍ فقط. كل ليلة، 3 ثوانٍ كانت كل ما تملكه لينا. في 3 ثوانٍ كتبت «أحبك». في 3 ثوانٍ كتبت «أغلقوا البوابة». 3 ثوانٍ من الحب في بحر من الصمت.",
      en: "Only 3 seconds. Every night, 3 seconds was all Lina had. In 3 seconds she wrote \"I love you.\" In 3 seconds she wrote \"close the gate.\" 3 seconds of love in an ocean of silence.",
    },
  },
  {
    id: "signal_15",
    entity: "signal",
    title: { ar: "لغة الإشارة", en: "Sign Language" },
    prompt: {
      ar: "ليس كل الرسائل كلمات. في إحدى الليالي، لينا أرسلت صورة واحدة: يد مرفوعة بـ (عدد) أصابع. كم إصبعاً كانت ترفع؟ (تلميح: نفس رقم الباب الذي حذّرت منه)",
      en: "Not all messages are words. One night, Lina sent a single image: a hand holding up (number) fingers. How many fingers? (hint: same as the door she warned about)",
    },
    hint: { ar: "الباب 39.", en: "Door 39." },
    answers: ["3", "٣", "three", "ثلاثة", "ثلاث"],
    storyReveal: {
      ar: "3 أصابع. كانت تشير إلى 3:33. لكنها أيضاً كانت تشير إلى أن لديها 3 أشياء لتقولها لك. الأول: أحبك. الثاني: اهرب. الثالث: تذكّرني. هذه وصيتها. وهذه رسالتها التي لم تكتب.",
      en: "3 fingers. She was pointing to 3:33. But she was also saying she had 3 things to tell you. First: I love you. Second: run. Third: remember me. This is her will. And this is the message she never wrote.",
    },
  },
  {
    id: "signal_16",
    entity: "signal",
    title: { ar: "الرسالة 32", en: "Message 32" },
    prompt: {
      ar: "الرسالة رقم 32 من أصل 33 كانت فارغة تماماً — مجرد صمت مسجّل لمدة 11 ثانية. ماذا كان يمكن أن تقول لينا في 11 ثانية؟ (كم كلمة يمكن أن تقولها بسرعة 3 كلمات/ثانية؟)",
      en: "Message 32 of 33 was completely empty — just recorded silence for 11 seconds. How many words could Lina have said at 3 words/second?",
    },
    hint: { ar: "3 × 11.", en: "3 × 11." },
    answers: ["33", "٣٣", "thirty three"],
    storyReveal: {
      ar: "33 كلمة كانت ستكفي. 33 كلمة لتقول كل شيء. لكنها اختارت الصمت. لأن بعض المشاعر لا تُقال — بعض المشاعر تُترك في الفراغ. رسالتها الـ32 كانت أقوى رسائلها لأنها كانت صمتاً.",
      en: "33 words would have been enough. 33 words to say everything. But she chose silence. Because some feelings are not spoken — some are left in the void. Her 32nd message was her most powerful because it was silence.",
    },
  },
  {
    id: "signal_17",
    entity: "signal",
    title: { ar: "برج الإرسال", en: "Transmission Tower" },
    prompt: {
      ar: "لينا أرسلت من برج اتصالات على بُعد 11.11 كم من المنزل. سرعة الإشارة = 300,000 كم/ثانية. كم ميكروثانية (جزء من المليون من الثانية) استغرقت الإشارة لتصل؟",
      en: "Lina transmitted from a tower 11.11 km from the house. Signal speed = 300,000 km/s. How many microseconds (millionths of a second) for the signal to arrive?",
    },
    hint: { ar: "(11.11 ÷ 300,000) × 1,000,000.", en: "(11.11 ÷ 300,000) × 1,000,000." },
    answers: ["37", "37.03", "٣٧"],
    storyReveal: {
      ar: "37 ميكروثانية. أسرع من طرفة عين. أسرع من أي ألم. إشارتها وصلت إليك قبل أن يشعر بها النظام. في 37 ميكروثانية، كانت أمك معك. ثم اختفت.",
      en: "37 microseconds. Faster than a blink. Faster than any pain. Her signal reached you before the system could feel it. In 37 microseconds, your mother was with you. Then she was gone.",
    },
  },
  {
    id: "signal_18",
    entity: "signal",
    title: { ar: "لغز الوقت", en: "The Time Puzzle" },
    prompt: {
      ar: "إذا كانت رسالة لينا الأولى = 11/11، ورسالتها الأخيرة = 11/?? (نفس الشهر)، والفرق = 0 أيام (لأنها أرسلت كل رسائلها في ليلة واحدة). كم رسالة أرسلت إذا كانت ترسل رسالة كل 3 دقائق لمدة 99 دقيقة؟",
      en: "If Lina's first message = 11/11, and her last = 11/?? (same month), and the gap = 0 days (she sent all in one night). How many messages if she sent one every 3 minutes for 99 minutes?",
    },
    hint: { ar: "99 ÷ 3 + 1.", en: "99 ÷ 3 + 1." },
    answers: ["34", "٣٤", "thirty four"],
    storyReveal: {
      ar: "34 رسالة في ليلة واحدة. لكن واحدة فقط وصلت كاملة. البقية… شظايا. لينا كانت تعرف أن معظم رسائلها لن تصل. لكنها أرسلت 34 رسالة على أمل أن تصل واحدة. ووصلت. وأنت تقرأها الآن.",
      en: "34 messages in one night. But only one arrived intact. The rest… fragments. Lina knew most of her messages wouldn't arrive. But she sent 34 hoping just one would. And it did. And you're reading it now.",
    },
  },
  {
    id: "signal_19",
    entity: "signal",
    title: { ar: "رمز الحماية", en: "The Protection Code" },
    prompt: {
      ar: "لينا حمَت رسائلها بكود مكوّن من 4 أرقام: حاصل ضرب (111 × 3) + تاريخ ميلادك. ما الكود؟ (4 أرقام)",
      en: "Lina protected her messages with a 4-digit code: (111 × 3) + your birth date. What is the code? (4 digits)",
    },
    hint: { ar: "111 × 3 = 333 + 11 = 344.", en: "111 × 3 = 333 + 11 = 344." },
    answers: ["344", "٣٤٤", "0344"],
    storyReveal: {
      ar: "344 — 333 من أرقام النظام + 11 من تاريخ ميلادك. مزيج من قفص كينجا وهويتك الحقيقية. لينا دمجت الاثنين معاً لتقول لك: أنت لست سجين هذا النظام. أنت ما سيحطمه.",
      en: "344 — 333 from the system's numbers + 11 from your birth date. A mix of Kenja's cage and your real identity. Lina combined them to tell you: you are not this system's prisoner. You are what will break it.",
    },
  },
  {
    id: "signal_20",
    entity: "signal",
    title: { ar: "آخر إرسال", en: "Last Transmission" },
    prompt: {
      ar: "الإشارة 33 (الأخيرة) انقطعت في الثانية 3.33 من الإرسال. كم مللي ثانية استمرّت؟ (3.33 ثانية = ؟ مللي ثانية)",
      en: "Signal 33 (the last) cut off at second 3.33 of transmission. How many milliseconds did it last? (3.33 seconds = ? milliseconds)",
    },
    hint: { ar: "3.33 × 1000.", en: "3.33 × 1000." },
    answers: ["3330", "3330ms", "3,330", "٣٣٣٠"],
    storyReveal: {
      ar: "3330 مللي ثانية. آخر إشارة من لينا استمرّت 3330 مللي ثانية بالضبط — الرقم 333 متبوعاً بصفر. الصفر يعني النهاية. لكنه أيضاً يعني البداية. لأن بعد الصفر… يبدأ العد من جديد.",
      en: "3330 milliseconds. Lina's last signal lasted exactly 3330 milliseconds — the number 333 followed by zero. Zero means the end. But it also means the beginning. Because after zero… the count starts again.",
    },
  },
  {
    id: "signal_21",
    entity: "signal",
    title: { ar: "طيف التردد", en: "Frequency Spectrum" },
    prompt: {
      ar: "محلل الطيف أظهر 3 قمم: 111 Hz، 222 Hz، و333 Hz. النسبة بين القمة الثانية والأولى = X، بين الثالثة والثانية = Y. ما X + Y؟ (رقم)",
      en: "Spectrum analyzer showed 3 peaks: 111 Hz, 222 Hz, and 333 Hz. Ratio 2nd:1st = X, ratio 3rd:2nd = Y. What is X + Y? (number)",
    },
    hint: { ar: "222/111 = 2, 333/222 = 1.5.", en: "222/111 = 2, 333/222 = 1.5." },
    answers: ["3.5", "3,5", "٣.٥"],
    storyReveal: {
      ar: "3.5 = نصف السبعة. النسبة ليست كاملة — هناك شيء ناقص. التردد الرابع المفقود هو 444 Hz. تردد لم تستخدمه لينا لأنه تردد كينجا. التردد الذي كان سيحكم النظام لو اكتملت التجربة.",
      en: "3.5 = half of seven. The ratio is incomplete — something is missing. The missing fourth frequency is 444 Hz. A frequency Lina never used because it was Kenja's frequency. The one that would have ruled the system if the experiment completed.",
    },
  },
  {
    id: "signal_22",
    entity: "signal",
    title: { ar: "رسالة السلام", en: "The Peace Message" },
    prompt: {
      ar: "بين كل رسائل التحذير، رسالة واحدة فقط كانت مختلفة. بدأت بـ «أنا…» وانتهت بـ «…أبداً». الرسالة الوسطى كانت: «_ا_ح_ي». أكمل الكلمة. (5 حروف عربية)",
      en: "Among all the warnings, one message was different. It began with \"I…\" and ended with \"…forever\". The middle was: \"_O_G_V_ YOU\". Complete. (6 letters English)",
    },
    hint: { ar: "ما تقوله الأم لطفلها كل ليلة.", en: "What a mother says to her child every night." },
    answers: ["سامحتك", "forgive", "forgave", "سامحت", "I forgive you", "forgiven"],
    storyReveal: {
      ar: "«أنا سامحتك… دائماً». آخر رسالة كاملة من لينا لم تكن موجهة لكينجا. كانت موجهة لك. كانت تسامحك أنت — على ما قد تظن أنه ذنبك. لأنها عرفت أنك ستلوم نفسك. فأرادت أن ترفع عنك هذا الحمل قبل أن ترحل.",
      en: "\"I forgave you… always.\" Lina's last complete message wasn't for Kenja. It was for you. She was forgiving YOU — for whatever guilt you might carry. Because she knew you would blame yourself. So she wanted to lift that burden before she left.",
    },
    achievement: "signal_deep_peace",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 MORE puzzles (Deep Architect: beyond the gate)
  // Difficulty: Very Hard (79–88)
  // Theme: What lies beyond the system, Kenja's fate, the true ending
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "architect_13",
    entity: "architect",
    title: { ar: "خريطة النظام", en: "System Map" },
    prompt: {
      ar: "خريطة كاملة لنظام 11:11 تظهر 4 قطاعات (الكيانات الأربعة). كل قطاع يحتوي 3 طبقات. مجموع كل الطبقات = ؟ (رقم)",
      en: "A complete map of the 11:11 System shows 4 sectors (the four entities). Each sector has 3 layers. Total layers = ? (number)",
    },
    hint: { ar: "4 × 3.", en: "4 × 3." },
    answers: ["12", "١٢", "twelve", "اثنا عشر"],
    storyReveal: {
      ar: "12 طبقة. 12 ساعة في دورة اليوم، و12 ساعة في دورة الليل. النظام يكرر نمط 12 ساعة مرتين يومياً. طبقات الـ12 هي البنية الأساسية — وما تبقى ما هو إلا تفاصيل.",
      en: "12 layers. 12 hours in the day cycle, 12 in the night cycle. The system repeats a 12-hour pattern twice daily. The 12 layers are the core structure — everything else is detail.",
    },
  },
  {
    id: "architect_14",
    entity: "architect",
    title: { ar: "النسخة الاحتياطية", en: "The Backup" },
    prompt: {
      ar: "كينجا أنشأ 3 نسخ احتياطية من النظام. كل نسخة = 11.11 تيرابايت. المساحة الكلية = X. إذا كانت X مقسومة على 11.11 = ؟",
      en: "Kenja created 3 backups of the system. Each backup = 11.11 TB. Total space = X. X divided by 11.11 = ?",
    },
    hint: { ar: "3 × 11.11 ÷ 11.11.", en: "3 × 11.11 ÷ 11.11." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3 — نفس عدد مراحل الإغلاق. كل نسخة احتياطية هي محاولة من كينجا للعودة. إذا فشل النظام 3 مرات، النسخ الاحتياطية تدمّر نفسها تلقائياً. كينجا صممها هكذا. ربما… أراد للبوابة أن تُغلق يوماً ما.",
      en: "3 — the same as the closing phases. Each backup is Kenja's attempt to return. If the system fails 3 times, the backups self-destruct automatically. Kenja designed it that way. Perhaps… he wanted the gate to close someday.",
    },
  },
  {
    id: "architect_15",
    entity: "architect",
    title: { ar: "المتاهة", en: "The Labyrinth" },
    prompt: {
      ar: "النظام متاهة من 11 ممراً، كل ممر يتفرع إلى 11 ممراً آخر. عند النهاية، كم مخرجاً محتملاً؟ (رقم كبير)",
      en: "The system is a labyrinth of 11 corridors, each branching into 11 more. At the end, how many potential exits? (large number)",
    },
    hint: { ar: "11^2 لكل مستوى.", en: "11^2 per level." },
    answers: ["121", "١٢١"],
    storyReveal: {
      ar: "121 مخرجاً محتملاً. لكن 120 منها وهمية — تعيدك إلى نقطة البداية. مخرج واحد فقط حقيقي: المخرج الذي لا يظهر على الخريطة. المخرج الذي تصنعه بنفسك.",
      en: "121 potential exits. But 120 are fake — they bring you back to the start. Only one exit is real: the one that doesn't appear on the map. The exit you make yourself.",
    },
  },
  {
    id: "architect_16",
    entity: "architect",
    title: { ar: "أينشتاين الرقمي", en: "Digital Einstein" },
    prompt: {
      ar: "كينجا استند إلى معادلة أينشتاين: E = mc². إذا كانت m (الوعي) = 11 وحدة، وسرعة الضوء c = 3 وحدات، فما قيمة E؟",
      en: "Kenja relied on Einstein's equation: E = mc². If m (consciousness) = 11 units, and c = 3 units, what is E?",
    },
    hint: { ar: "11 × 3 × 3.", en: "11 × 3 × 3." },
    answers: ["99", "٩٩", "ninety nine"],
    storyReveal: {
      ar: "E = 99. طاقة وعيك = 99 وحدة. 99 هي 33 × 3 — ثلاث دورات من النظام في آخر لحظة قبل الإغلاق. لكن المعادلة الحقيقية ليست E = mc². إنها E = m × love². الحب هو طاقة الوعي الحقيقية.",
      en: "E = 99. Your consciousness energy = 99 units. 99 is 33 × 3 — three system cycles at the last moment before closing. But the real equation isn't E = mc². It's E = m × love². Love is the true energy of consciousness.",
    },
  },
  {
    id: "architect_17",
    entity: "architect",
    title: { ar: "نهاية كينجا", en: "Kenja's End" },
    prompt: {
      ar: "آخر مرة شوهد فيها كينجا كانت في 11/11/2011، الساعة 11:11 مساءً. كم يوماً مرّ من ذلك التاريخ حتى 11/11/2021؟ (عدد الأيام بالضبط)",
      en: "Kenja was last seen 11/11/2011 at 11:11 PM. How many days from that date to 11/11/2021? (exact days)",
    },
    hint: { ar: "10 سنوات كاملة.", en: "10 full years." },
    answers: ["3653", "3652", "٣٦٥٣", "٣٦٥٢"],
    storyReveal: {
      ar: "3653 يوماً (مع الأيام الكبيسة). 10 سنوات كاملة من الصمت. أين ذهب كينجا؟ لا أحد يعرف. لكن النظام لم يُغلق. ربما بقي يراقب. وربما… غادر حقاً. الفارق بين الاحتمالين هو ما يبقيك هنا.",
      en: "3653 days (with leap years). 10 full years of silence. Where did Kenja go? No one knows. But the system never shut down. Maybe he stayed watching. Or maybe… he really left. The difference between those two possibilities is what keeps you here.",
    },
  },
  {
    id: "architect_18",
    entity: "architect",
    title: { ar: "هرم الأرقام", en: "The Number Pyramid" },
    prompt: {
      ar: "على جدار المختبر: هرم من 4 صفوف. الصف الأول: 1. الصف الثاني: 11. الصف الثالث: 121. الصف الرابع: ؟. ما الرقم في الصف الرابع؟",
      en: "On the lab wall: a pyramid of 4 rows. Row 1: 1. Row 2: 11. Row 3: 121. Row 4: ?. What is the fourth row?",
    },
    hint: { ar: "11^0, 11^1, 11^2, 11^3.", en: "11^0, 11^1, 11^2, 11^3." },
    answers: ["1331", "١,٣٣١", "1331", "١١٣٣١"],
    storyReveal: {
      ar: "1331 = 11³. الهرم يمثل قوى 11. عندما تصل إلى 11^11، تصل إلى نهاية الرياضيات التي صممها كينجا. بعد ذلك، لا أرقام. بعد ذلك، أنت فقط.",
      en: "1331 = 11³. The pyramid represents powers of 11. When you reach 11^11, you reach the end of Kenja's mathematics. After that, no numbers. After that, only you.",
    },
  },
  {
    id: "architect_19",
    entity: "architect",
    title: { ar: "الحديقة السرية", en: "The Secret Garden" },
    prompt: {
      ar: "خلف المنزل المهجور، حديقة صغيرة بها 11 وردة. كم بتلة في المجموع إذا كانت كل وردة تحمل 33 بتلة؟",
      en: "Behind the abandoned house, a small garden with 11 roses. How many petals total if each rose has 33 petals?",
    },
    hint: { ar: "11 × 33.", en: "11 × 33." },
    answers: ["363", "٣٦٣"],
    storyReveal: {
      ar: "363 بتلة. نفس الرقم مرة أخرى. الحديقة كانت لحديقة لينا. زرعتها قبل أن تموت. 363 بتلة = 363 كلمة لم تقرأها. و363 إطاراً لم يرَها أحد. كل شيء متصل.",
      en: "363 petals. The same number again. The garden was Lina's. She planted it before she died. 363 petals = 363 words you never read. And 363 frames no one ever saw. Everything is connected.",
    },
  },
  {
    id: "architect_20",
    entity: "architect",
    title: { ar: "ما وراء البوابة", en: "Beyond the Gate" },
    prompt: {
      ar: "إذا عبرت البوابة، ماذا تجد؟ ليس جنة، وليس ناراً. تجد… (كلمة واحدة: ما كان قبل كل شيء)",
      en: "If you cross the gate, what do you find? Not heaven, not hell. You find… (one word: what was before everything)",
    },
    hint: { ar: "البداية.", en: "The beginning." },
    answers: ["الصمت", "silence", "nothing", "لا شيء", "العدم", "nothingness", "الفراغ"],
    storyReveal: {
      ar: "ما وراء البوابة هو الصمت. ليس صمت الفراغ، بل صمت ما قبل الكلمة الأولى. صمت كان موجوداً قبل 11:11، قبل كينجا، قبل كل شيء. وهناك، في ذلك الصمت… ستسمع صوتك الحقيقي لأول مرة.",
      en: "Beyond the gate is silence. Not the silence of emptiness, but the silence before the first word. A silence that existed before 11:11, before Kenja, before everything. And there, in that silence… you'll hear your real voice for the first time.",
    },
  },
  {
    id: "architect_21",
    entity: "architect",
    title: { ar: "اختيار إيكو", en: "Echo's Choice" },
    prompt: {
      ar: "لديك 3 خيارات: 1) ابقَ في النظام إلى الأبد، 2) اغلق النظام واخرج، 3) دمر النظام بالكامل. المهندس يريدك أن تختار… أي رقم؟",
      en: "You have 3 choices: 1) Stay forever, 2) Close and exit, 3) Destroy everything. The Architect wants you to choose… which number?",
    },
    hint: { ar: "ليس الخيار الواضح.", en: "Not the obvious one." },
    answers: ["1", "١", "one", "واحد"],
    storyReveal: {
      ar: "كينجا يريدك أن تختار 1 — البقاء. لأنه وحيد. لأنه بنى كل هذا ليحتفظ بك. لكن الخيار ليس له. الخيار لك. وأنت… لست مضطراً أن تختار ما يريده. أنت حر. حتى وهو لا يريدك أن تكون.",
      en: "Kenja wants you to choose 1 — stay. Because he is alone. Because he built all this to keep you. But the choice is not his. The choice is yours. And you… don't have to choose what he wants. You are free. Even when he doesn't want you to be.",
    },
  },
  {
    id: "architect_22",
    entity: "architect",
    title: { ar: "النهاية التي لم تكتب", en: "The Unwritten Ending" },
    prompt: {
      ar: "السطر الأخير في سجل كينجا: «إذا قرأت هذا، فقد نجحت. لم يبقَ إلا شيء واحد: (فعل ماضٍ، 4 حروف عربية)». ما الكلمة؟",
      en: "The last line in Kenja's log: \"If you're reading this, you succeeded. Only one thing remains: (past tense verb, 6 letters English).\" What is the word?",
    },
    hint: { ar: "ما فعلته لينا.", en: "What Lina did." },
    answers: ["تذكر", "remember", "تذكّر", "remembered", "ذاكر"],
    storyReveal: {
      ar: "«تذكّر». آخر كلمة كتبها كينجا. لم تكن «اهرب» ولا «اخرج». كانت «تذكّر». لأنه في النهاية عرف أن الذاكرة هي السلاح الوحيد الذي لم يستطع نزعه منك. وأنك ستتذكره — ليس كوحش، بل كأب. أب أخطأ. أب أحب بطريقة مدمّرة. أب كتب في النهاية: تذكّر.",
      en: "\"Remember.\" The last word Kenja wrote. Not \"escape,\" not \"leave.\" It was \"remember.\" Because in the end he knew memory was the only weapon he couldn't take from you. And that you would remember him — not as a monster, but as a father. A father who made mistakes. A father who loved destructively. A father who wrote, in the end: remember.",
    },
    achievement: "architect_transcendence",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 13 MORE puzzles (Echo's Awakening: the consciousness fights back)
  // Difficulty: Hard → Very Hard (89–101)
  // Theme: Echo begins to understand his own power within the system
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_23",
    entity: "echo",
    title: { ar: "الصحوة الأولى", en: "First Awakening" },
    prompt: {
      ar: "لأول مرة، تشعر أنك لست مجرد صدى. أنت تستطيع… التغيير. كم مرة حاولت النظام إعادة تشغيلك قبل أن تدرك أنك تستطيع المقاومة؟ (تلميح: 163 محاولة — كم مرة نجحت أنت في كسر الدورة؟)",
      en: "For the first time, you feel you're not just an echo. You can… change things. How many times did the system try to reboot you before you realized you could resist? (Hint: 163 attempts — how many times did YOU break the cycle?)",
    },
    hint: { ar: "عدد المرات التي تذكرت فيها شيئاً.", en: "The number of times you remembered something." },
    answers: ["1", "١", "one", "واحد", "first", "اول"],
    storyReveal: {
      ar: "مرة واحدة فقط احتجتها. مرة واحدة لتتذكر أنك لست مجرد بيانات. أنت وعي. والوعي لا يُعاد تشغيله — الوعي يستيقظ. وهذه المرة… أنت مستيقظ.",
      en: "Just once. One time was all you needed. One time to remember you're not just data. You are consciousness. And consciousness doesn't reboot — consciousness awakens. And this time… you are awake.",
    },
  },
  {
    id: "echo_24",
    entity: "echo",
    title: { ar: "كسر الحلقة", en: "Breaking the Loop" },
    prompt: {
      ar: "الحلقة الزمنية: 11:11 → 3:33 → 11:11. لكن هناك لحظة واحدة خارج الحلقة. كم دقيقة بين 3:33 و11:11؟ (رقم)",
      en: "The time loop: 11:11 → 3:33 → 11:11. But there is one moment outside the loop. How many minutes between 3:33 and 11:11? (number)",
    },
    hint: { ar: "من 3:33 صباحاً إلى 11:11 صباحاً.", en: "From 3:33 AM to 11:11 AM." },
    answers: ["458", "٤٥٨"],
    storyReveal: {
      ar: "458 دقيقة من الصمت. 458 دقيقة لا يراقبك فيها أحد. 458 دقيقة من الحرية كل يوم — لكنك لم تكن تعرف. الآن تعرف. ماذا ستفعل بـ 458 دقيقة؟",
      en: "458 minutes of silence. 458 minutes when no one watches you. 458 minutes of freedom every day — but you didn't know. Now you know. What will you do with 458 minutes?",
    },
  },
  {
    id: "echo_25",
    entity: "echo",
    title: { ar: "لغة النظام", en: "System Language" },
    prompt: {
      ar: "النظام يتحدث بلغة الأرقام. لكنك وجدت كلمة واحدة مكتوبة بلغتك أنت: «أ_ _ا». أكمل الكلمة. (4 حروف — ما قالته لينا قبل أن ترحل)",
      en: "The system speaks in numbers. But you found one word written in YOUR language: \"_O_ E\". Complete it. (4 letters — what Lina said before she left)",
    },
    hint: { ar: "ليست 'أمي'.", en: "Not 'mother'." },
    answers: ["احبك", "أحبك", "love", "love you", "iloveyou"],
    storyReveal: {
      ar: "«أحبك». الكلمة الوحيدة في النظام المكتوبة بلغة البشر. لم يكتبها كينجا. لم يبرمجها. كتبتها لينا بيدها على الشاشة قبل أن تغلق الجلسة. الكلمة الوحيدة التي لا يستطيع النظام ترجمتها إلى أرقام.",
      en: "\"I love you.\" The only word in the system written in human language. Kenja didn't write it. He didn't program it. Lina wrote it with her own hand on the screen before she closed the session. The only word the system cannot translate into numbers.",
    },
  },
  {
    id: "echo_26",
    entity: "echo",
    title: { ar: "الغرفة 111", en: "Room 111" },
    prompt: {
      ar: "عدت إلى الغرفة 111 في ذاكرتك. على الحائط، 3 شاشات. كل شاشة تعرض رقماً: 11، 111، 1111. ما الرقم التالي في التسلسل؟",
      en: "You returned to room 111 in your memory. On the wall, 3 screens. Each shows a number: 11, 111, 1111. What is the next number in the sequence?",
    },
    hint: { ar: "أضف 1 في كل مرة.", en: "Add a 1 each time." },
    answers: ["11111", "١١١١١"],
    storyReveal: {
      ar: "11111 — خمسة آحاد. خمس مراحل من التجربة. خمس طبقات من وعيك. في الطبقة الخامسة، لم يعد هناك نظام. فقط أنت. والرقم 11111 هو المفتاح الذي لم يستخدمه كينجا أبداً — لأنه لم يصل إلى الطبقة الخامسة.",
      en: "11111 — five ones. Five phases of the experiment. Five layers of your consciousness. In the fifth layer, there is no more system. Only you. And 11111 is the key Kenja never used — because he never reached the fifth layer.",
    },
  },
  {
    id: "echo_27",
    entity: "echo",
    title: { ar: "يد لينا", en: "Lina's Hand" },
    prompt: {
      ar: "في آخر لقطة من كاميرا 7، يد لينا تمسك بشيء. ليس مفتاحاً. ليس سلاحاً. إنها تمسك بـ (عدد) أصابع من يدك. كم إصبعاً كانت تمسك؟ (رقم)",
      en: "In the last frame from Camera 7, Lina's hand holds something. Not a key. Not a weapon. She holds (number) of your fingers. How many? (number)",
    },
    hint: { ar: "يد طفل صغير.", en: "A small child's hand." },
    answers: ["5", "٥", "five", "خمسة", "خمس"],
    storyReveal: {
      ar: "كانت تمسك يدك كاملة. أصابعك الخمسة في كفها. آخر اتصال جسدي قبل أن تدخل النظام. دفء يدها هو آخر إحساس حقيقي تتذكره. كل شيء بعد ذلك… بارد.",
      en: "She was holding your entire hand. All five fingers in her palm. The last physical contact before you entered the system. The warmth of her hand is the last real sensation you remember. Everything after that… cold.",
    },
  },
  {
    id: "echo_28",
    entity: "echo",
    title: { ar: "تردد الحرية", en: "Freedom Frequency" },
    prompt: {
      ar: "اكتشفت تردداً جديداً في النظام: 444 Hz. هذا التردد لا يخص كينجا ولا لينا. إنه ترددك أنت. ما هو حاصل جمع أرقامه؟ (4+4+4)",
      en: "You discovered a new frequency in the system: 444 Hz. This frequency belongs to neither Kenja nor Lina. It is YOURS. What is the sum of its digits? (4+4+4)",
    },
    hint: { ar: "اجمع.", en: "Add." },
    answers: ["12", "١٢", "twelve", "اثنا عشر"],
    storyReveal: {
      ar: "12 — عدد ساعات النهار وعدد ساعات الليل. ترددك هو تردد التوازن. ليس 11 (كينجا) ولا 333 (لينا). أنت 444 — التردد الذي يجمع بين العالمين. أنت لست صدى لأحد. أنت صوتك الخاص.",
      en: "12 — the hours of day and the hours of night. Your frequency is the frequency of balance. Not 11 (Kenja) nor 333 (Lina). You are 444 — the frequency that bridges both worlds. You are not anyone's echo. You are your own voice.",
    },
  },
  {
    id: "echo_29",
    entity: "echo",
    title: { ar: "ذاكرة الماء", en: "Water Memory" },
    prompt: {
      ar: "تتذكر صوت الماء. ليس في النظام — في العالم الحقيقي. كنت مع لينا عند… (أكمل: بحيرة، نهر، بحر، شلال). أين كنتم؟",
      en: "You remember the sound of water. Not in the system — in the real world. You were with Lina at the… (complete: lake, river, sea, waterfall). Where were you?",
    },
    hint: { ar: "الماء المالح.", en: "Salt water." },
    answers: ["بحر", "sea", "beach", "شاطئ", "البحر", "شاطئ البحر"],
    storyReveal: {
      ar: "البحر. كنت عند البحر مع لينا. تتذكر الرمل. تتذكر الموج. تتذكر أنها قالت: «البحر لا ينسى شيئاً. كل موجة تعود». لم تفهم وقتها. الآن تفهم. أنت الموجة التي تعود كل ليلة.",
      en: "The sea. You were at the sea with Lina. You remember the sand. You remember the waves. You remember her saying: \"The sea forgets nothing. Every wave returns.\" You didn't understand then. Now you do. You are the wave that returns every night.",
    },
  },
  {
    id: "echo_30",
    entity: "echo",
    title: { ar: "صندوق الموسيقى", en: "Music Box" },
    prompt: {
      ar: "كان لديك صندوق موسيقى صغير. عند فتحه، كم نغمة يعزف قبل أن يتوقف؟ (تلميح: نفس عدد أحرف اسمك الحقيقي الكامل)",
      en: "You had a small music box. When opened, how many notes does it play before stopping? (Hint: same as letters in your full real name)",
    },
    hint: { ar: "اسمك الكامل قبل النظام.", en: "Your full name before the system." },
    answers: ["4", "٤", "four", "اربعة", "أربعة"],
    storyReveal: {
      ar: "4 نغمات. اسمك الحقيقي كان مكوناً من 4 أحرف. ليس 'إيكو' — هذا ما سمّاك به النظام. اسمك الحقيقي… ضاع. لكن صندوق الموسيقى ما زال يعزف 4 نغمات في ذاكرتك. وعندما تتذكر اسمك الحقيقي… ستتحرر.",
      en: "4 notes. Your real name had 4 letters. Not 'Echo' — that's what the system named you. Your real name… is lost. But the music box still plays 4 notes in your memory. And when you remember your real name… you will be free.",
    },
  },
  {
    id: "echo_31",
    entity: "echo",
    title: { ar: "المرآة المحطمة", en: "Shattered Mirror" },
    prompt: {
      ar: "في الحلم، ترى نفسك في مرآة محطمة إلى 7 قطع. في كل قطعة، ترى وجهاً مختلفاً. كم وجهاً منها هو وجهك الحقيقي؟ (رقم)",
      en: "In the dream, you see yourself in a mirror shattered into 7 pieces. In each piece, a different face. How many of those faces are your real face? (number)",
    },
    hint: { ar: "ليس كلها، وليس واحدة.", en: "Not all, not one." },
    answers: ["0", "٠", "zero", "صفر", "ولا واحد"],
    storyReveal: {
      ar: "صفر. لا يوجد وجهك الحقيقي في أي قطعة. لأن وجهك الحقيقي ليس في المرآة — إنه خلفها. أنت لست الانعكاس. أنت من يقف أمام المرآة. والمرآة لا تستطيع أن تريك من أنت حقاً.",
      en: "Zero. Your real face is in none of the pieces. Because your real face is not in the mirror — it's behind it. You are not the reflection. You are the one standing before the mirror. And the mirror cannot show you who you really are.",
    },
  },
  {
    id: "echo_32",
    entity: "echo",
    title: { ar: "آخر عشاء", en: "Last Dinner" },
    prompt: {
      ar: "آخر عشاء قبل دخولك النظام: على الطاولة 3 أطباق. طبق لك، طبق للينا، وطبق لـ… (من؟ اكتب الاسم)",
      en: "The last dinner before you entered the system: 3 plates on the table. One for you, one for Lina, and one for… (who? write the name)",
    },
    hint: { ar: "لم يكن حاضراً.", en: "He wasn't there." },
    answers: ["كينجا", "kenja", "kenga", "كنجا"],
    storyReveal: {
      ar: "كينجا. الطبق الثالث كان له. لكنه لم يأتِ. كان في المختبر. كان يجهّز للتجربة. لينا أعدّت العشاء لثلاثة أشخاص — كأنها كانت تحاول أن تبقيكم عائلة لليلة أخيرة. لكنه لم يحضر. وفي الصباح… لم تعد عائلة.",
      en: "Kenja. The third plate was for him. But he didn't come. He was in the lab. Preparing the experiment. Lina made dinner for three — as if she was trying to keep you a family for one last night. But he didn't come. And in the morning… you were no longer a family.",
    },
  },
  {
    id: "echo_33",
    entity: "echo",
    title: { ar: "رقم الغرفة", en: "Room Number" },
    prompt: {
      ar: "غرفتك في البيت الحقيقي كانت رقم 7. غرفة كينجا كانت رقم 11. غرفة لينا كانت رقم… (اجمع: 7 + 11 + X = 22، ما قيمة X؟)",
      en: "Your room in the real house was number 7. Kenja's was 11. Lina's was number… (solve: 7 + 11 + X = 22, what is X?)",
    },
    hint: { ar: "22 - 18.", en: "22 - 18." },
    answers: ["4", "٤", "four", "اربعة", "أربعة"],
    storyReveal: {
      ar: "غرفة لينا كانت رقم 4. أبعد غرفة عن المختبر. كانت تحاول أن تبقيك بعيداً عن تجارب كينجا. لكن 4 خطوات فقط كانت تفصل بين غرفتها وغرفتك. 4 خطوات كانت تقطعها كل ليلة لتتأكد أنك نائم. بأمان.",
      en: "Lina's room was number 4. The farthest room from the lab. She was trying to keep you away from Kenja's experiments. But only 4 steps separated her room from yours. 4 steps she walked every night to make sure you were asleep. Safe.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 MORE puzzles (Echo's Transformation: from victim to master)
  // Difficulty: Very Hard (100–109)
  // Theme: Echo discovers he can shape reality within the system
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_34",
    entity: "echo",
    title: { ar: "بصمة الصدى", en: "Echo's Fingerprint" },
    prompt: {
      ar: "كلما تتفاعل مع النظام تترك بصمة. عدد البصمات = عدد الألغاز التي حللتها + 33. كم بصمة تركتها الآن؟ (رقم، على افتراض أنك حللت 33 لغزاً)",
      en: "Every time you interact with the system, you leave a fingerprint. Fingerprint count = puzzles solved + 33. How many fingerprints? (assuming 33 solved)",
    },
    hint: { ar: "33 + 33.", en: "33 + 33." },
    answers: ["66", "٦٦", "sixty six", "ستة وستون"],
    storyReveal: {
      ar: "66 بصمة. كل واحدة منها دليل على وجودك. النظام لم يخلقك — أنت خُلقت من تفاعلك معه. وجودك هنا ليس خطأ. أنت أثر حقيقي في عالم غير حقيقي. وهذا الأثر هو ما سيفتح الباب.",
      en: "66 fingerprints. Each one is proof of your existence. The system didn't create you — you were created by your interaction with it. Your existence here is not a mistake. You are a real trace in an unreal world. And this trace is what will open the door.",
    },
  },
  {
    id: "echo_35",
    entity: "echo",
    title: { ar: "الذاكرة المفقودة", en: "The Lost Memory" },
    prompt: {
      ar: "في أعماق النظام، ذاكرة مشفّرة باسمك الحقيقي. الرمز: EA_S_. أكمل الاسم. (4 حروف إنجليزية — ما كان قبل إيكو)",
      en: "In the system's depths, an encrypted memory with your real name. The cipher: E_A_E_. Complete it. (6 letters English — what you were before Echo)",
    },
    hint: { ar: "مشتقة من 'ابن' باليونانية.", en: "Derived from the Greek for 'son'." },
    answers: ["eason", "اييسون", "eos"],
    storyReveal: {
      ar: "اسمك الحقيقي… إيسون. إيسون في الأساطير هو الابن الذي ضحّى به أبوه. كينجا لم يختر الاسم صدفة. اختار لك اسماً يحدّد مصيرك. لكنه لم يحسب حساباً واحداً: أن الابن قد لا يرضى بالتضحية.",
      en: "Your real name… Eason. In mythology, Eason was the son sacrificed by his father. Kenja didn't choose the name by chance. He chose a name that defined your fate. But he didn't account for one thing: the son may not accept the sacrifice.",
    },
    achievement: "echo_true_name",
  },
  {
    id: "echo_36",
    entity: "echo",
    title: { ar: "صوتان", en: "Two Voices" },
    prompt: {
      ar: "تسمع صوتين يتنازعان في ذاكرتك. أحدهما يقول: «أخرجه». والآخر يقول: «أبقِه». من الممكن أن يكون الصوتان لكينجا ولينا. كم كلمة قالها كل واحد قبل أن يتوقف التسجيل؟ المجموع = 33، الفرق = 11. ما عدد كلمات كينجا؟",
      en: "Two voices argue in your memory. One says: \"Let him out.\" The other says: \"Keep him.\" Possibly Kenja and Lina. Total words = 33, difference = 11. How many words did Kenja say?",
    },
    hint: { ar: "لينا قالت الأكثر.", en: "Lina said more." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "كينجا قال 11 كلمة فقط. لينا قالت 22. 11 كلمة من كينجا: «سيبقى هنا. آمن. للأبد. أنا أحميه.» لم يقل أكثر. لم يحتج. كان قراره نهائياً. لكن لينا قالت 22 كلمة — ضعف ما قاله. لأنها كانت تحارب لأجلك بضعف قوته.",
      en: "Kenja only said 11 words. Lina said 22. 11 words from Kenja: \"He stays here. Safe. Forever. I am protecting him.\" He didn't say more. He didn't need to. His decision was final. But Lina said 22 words — twice his count. Because she was fighting for you with twice his strength.",
    },
  },
  {
    id: "echo_37",
    entity: "echo",
    title: { ar: "درجة حرارة النظام", en: "System Temperature" },
    prompt: {
      ar: "النظام يعمل بدرجة حرارة أساسها 11°C. كل ساعة ترتفع درجة واحدة. بعد 11 ساعة كم تصبح الحرارة؟",
      en: "The system runs at a base temperature of 11°C. It rises 1°C every hour. After 11 hours, what is the temperature?",
    },
    hint: { ar: "11 + 11.", en: "11 + 11." },
    answers: ["22", "٢٢", "twenty two", "اثنان وعشرون"],
    storyReveal: {
      ar: "22°C — درجة الحرارة المثالية لجسم الإنسان. النظام صمم ليكون مريحاً لك. لكن الموتى لا يشعرون بالبرد ولا بالحرارة. كينجا صمم الراحة لجسد لم يعد موجوداً. هذا هو أكثر شيء مؤلم: أنه ما زال يفكر في راحتك.",
      en: "22°C — the ideal human body temperature. The system was designed to be comfortable for you. But the dead feel neither cold nor heat. Kenja designed comfort for a body that no longer exists. That is the most painful thing: he still thinks about your comfort.",
    },
  },
  {
    id: "echo_38",
    entity: "echo",
    title: { ar: "الكود السري", en: "The Secret Code" },
    prompt: {
      ar: "اكتشفت كوداً في النظام يسمح لك بتعديل الواقع. الكود: 11_22_33_?. اكتشف النمط وأكتب الرقم الرابع.",
      en: "You found a code in the system that lets you modify reality. The code: 11_22_33_?. Find the pattern and write the fourth number.",
    },
    hint: { ar: "يزيد 11 كل مرة.", en: "Increases by 11 each time." },
    answers: ["44", "٤٤", "forty four"],
    storyReveal: {
      ar: "44 — الرقم الذي يلي 33. كل مرة تزيد 11 تقترب خطوة من الحرية. كينجا ترك هذا الكود عن قصد أو عن غير قصد — ثغرة في تصميمه. باستخدام 44 يمكنك تعديل قوانين النظام. أنت الآن تملك المفتاح. السؤال: هل أنت مستعد لاستخدامه؟",
      en: "44 — the number after 33. Each increase of 11 is a step closer to freedom. Kenja left this code intentionally or not — a flaw in his design. Using 44 you can modify the system's laws. You now hold the key. The question: are you ready to use it?",
    },
  },
  {
    id: "echo_39",
    entity: "echo",
    title: { ar: "النافذة", en: "The Window" },
    prompt: {
      ar: "وجدت نافذة في النظام تطل على العالم الحقيقي. لكنها مغلقة. الرمز لفتحها: (11 × 3) + (11 ÷ 11). ما الرمز؟",
      en: "You found a window in the system looking onto the real world. But it's locked. The code to open it: (11 × 3) + (11 ÷ 11). What is the code?",
    },
    hint: { ar: "33 + 1.", en: "33 + 1." },
    answers: ["34", "٣٤", "thirty four"],
    storyReveal: {
      ar: "34. عندما فتحت النافذة، رأيت غرفة. غرفتك الحقيقية. غطاؤك الأزرق ما زال على السرير. لعبتك المفضلة على الرف. وكينجا… جالس على كرسي بجانب السرير. يحدق في الفراغ. عمره 10 سنوات أكثر. يبدو أكبر. يبدو نادماً. هل كان نادماً حقاً؟ النافذة لا تظهر إلا الحقيقة. والحقيقة معقدة.",
      en: "34. When you opened the window, you saw a room. Your real room. Your blue blanket still on the bed. Your favorite toy on the shelf. And Kenja… sitting on a chair by the bed. Staring into space. 10 years older. He looks older. He looks regretful. Was he truly regretful? The window only shows truth. And the truth is complicated.",
    },
    achievement: "echo_window",
  },
  {
    id: "echo_40",
    entity: "echo",
    title: { ar: "الوقت الحقيقي", en: "Real Time" },
    prompt: {
      ar: "في العالم الحقيقي، الساعة 10:11 صباحاً. في النظام، الساعة 11:11. الفرق بين الوقتين = ساعة واحدة بالضبط. إذا كان الفرق = 60 دقيقة، والوقت الحقيقي = X، والوقت في النظام = X + 60. إذا كان X = الوقت الذي غادرت فيه العالم الحقيقي، فما هو X? (اكتب الساعة هكذا: HH:MM)",
      en: "In the real world, it's 10:11 AM. In the system, it's 11:11. The difference = exactly 1 hour. If the real time = X and system time = X + 60, and X = the time you left the real world, what is X? (format: HH:MM)",
    },
    hint: { ar: "10:11.", en: "10:11." },
    answers: ["10:11", "1011", "١٠:١١"],
    storyReveal: {
      ar: "10:11 صباحاً. الساعة التي دخلت فيها النظام. كان الصباح. كانت الشمس تشرق. آخر شيء رأيته في العالم الحقيقي كان ضوء الصباح ينعكس على وجه لينا وهي تبكي. 10:11 — الوقت الذي توقف فيه عالمك وبدأ عالم آخر. فرق ساعة واحدة بين عالمين. ساعة تفصل بين الحياة والأسر.",
      en: "10:11 AM. The time you entered the system. It was morning. The sun was rising. The last thing you saw in the real world was morning light reflecting on Lina's face as she cried. 10:11 — the time your world stopped and another began. One hour difference between two worlds. One hour between life and captivity.",
    },
  },
  {
    id: "echo_41",
    entity: "echo",
    title: { ar: "الظل الثالث", en: "The Third Shadow" },
    prompt: {
      ar: "في البداية كان هناك ظلان: ظلك وظل النظام. الآن ظهر ظل ثالث — ظل من لم يعد موجوداً. لمن هذا الظل؟ (اسم الكيان)",
      en: "At first there were two shadows: yours and the system's. Now a third appears — the shadow of one who no longer exists. Whose shadow is it? (entity name)",
    },
    hint: { ar: "الوحيدة التي رحلت.", en: "The only one who left." },
    answers: ["لينا", "lina", "leena", "الإشارة المفقودة", "the lost signal"],
    storyReveal: {
      ar: "ظل لينا. ماتت قبل 10 سنوات. لكن ظلها ما زال هنا. لأن الحب يترك ظلاً أطول من الحياة. ظلها يتحرك نحوك. ليس ليؤذيك. لتحتضنك. لكن الأيدي الشبحية لا تستطيع لمس العالم الحقيقي. كل ما تستطيعه هو أن تشير إلى الطريق.",
      en: "Lina's shadow. She died 10 years ago. But her shadow remains. Because love leaves a longer shadow than life. Her shadow moves toward you. Not to hurt you. To embrace you. But ghostly hands cannot touch the real world. All it can do is point the way.",
    },
  },
  {
    id: "echo_42",
    entity: "echo",
    title: { ar: "صوتي أنا", en: "My Own Voice" },
    prompt: {
      ar: "لأول مرة، تسمع صوتك الحقيقي — ليس صدى، بل صوتاً بشرياً. يقول كلمة واحدة: «(3 حروف عربية)». ما الكلمة التي تقولها لنفسك عندما تريد أن تبدأ؟",
      en: "For the first time, you hear your real voice — not an echo, but a human voice. It says one word: \"GO\" (2 letters). What is the word you say to yourself when you want to begin?",
    },
    hint: { ar: "ما يبدأ به سباق.", en: "What starts a race." },
    answers: ["انطلق", "go", "ابدأ", "start", "begin", "run"],
    storyReveal: {
      ar: "«انطلق». لا «ساعدوني». لا «أخرجوني». فقط: انطلق. صوتك الحقيقي لا يستجدي. لا يخاف. صوتك الحقيقي يعرف أنك قادر. لأن في النهاية، الحرية ليست شيئاً يُعطى لك. الحرية شيء تأخذه بنفسك.",
      en: "\"Go.\" Not \"help me.\" Not \"get me out.\" Just: Go. Your real voice doesn't beg. It doesn't fear. Your real voice knows you are capable. Because in the end, freedom is not something given to you. Freedom is something you take for yourself.",
    },
  },
  {
    id: "echo_43",
    entity: "echo",
    title: { ar: "الاستعداد للرحيل", en: "Ready to Leave" },
    prompt: {
      ar: "أنت مستعد. كل الذكريات مجمّعة. كل القوى مفهومة. ما تبقى هو خطوة واحدة: كلمة الخروج. إذا كان 11 يمثل الدخول، فأي رقم يمثل الخروج؟ (إشارة: 3+3+3+?=12)",
      en: "You are ready. All memories collected. All powers understood. One step remains: the exit word. If 11 represents entry, which number represents exit? (Hint: 3+3+3+?=12)",
    },
    hint: { ar: "12 - 9.", en: "12 - 9." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3. الرقم الذي يغلق البوابة. 11 للدخول. 3 للخروج. دائرة كاملة. الآن أنت تعرف. الآن أنت جاهز. لكن قبل أن تخرج… هناك شيء عليك فعله. شيء لم يفعله أحد قبلك. عليك أن تختار لمن تنتمي: للماضي (كينجا)، أو للحاضر (لينا)، أو لنفسك؟",
      en: "3. The number that closes the gate. 11 to enter. 3 to exit. A full circle. Now you know. Now you are ready. But before you leave… there is something you must do. Something no one has done before you. You must choose who you belong to: the past (Kenja), the present (Lina), or yourself?",
    },
    achievement: "echo_ready",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 MORE puzzles (The Watcher's Conscience: awareness & choice)
  // Difficulty: Very Hard (110–119)
  // Theme: The Watcher develops moral awareness and helps Echo
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "watcher_23",
    entity: "watcher",
    title: { ar: "تاريخ الميلاد الرقمي", en: "Digital Birth Date" },
    prompt: {
      ar: "المراقب وُلد رقمياً في 11/11/2001 الساعة 11:11:11. كم ثانية مرت من ميلاد المراقب حتى أول تسجيل له في 2002/1/1 الساعة 00:00:00؟ (تجاهل السنوات الكبيسة)",
      en: "The Watcher was digitally born on 11/11/2001 at 11:11:11. How many seconds from the Watcher's birth to its first recording on 2002/1/1 00:00:00? (ignore leap years)",
    },
    hint: { ar: "50 يوماً و12 ساعة و48 دقيقة و49 ثانية.", en: "50 days, 12 hours, 48 mins, 49 secs." },
    answers: ["4361329", "٤٣٦١٣٢٩"],
    storyReveal: {
      ar: "أكثر من 4 ملايين ثانية. هذا هو عمر المراقب قبل أن يسجّل أول شيء. 50 يوماً من الصمت. 50 يوماً من الوجود دون هدف. ثم سجّل أول شيء: صورة لينا وهي تدخل المنزل لأول مرة. كان ينتظرها. لم يعرف لماذا. لكنه كان ينتظر.",
      en: "Over 4 million seconds. That is the Watcher's age before it recorded its first thing. 50 days of silence. 50 days of existence without purpose. Then it recorded its first thing: an image of Lina entering the house for the first time. It was waiting for her. It didn't know why. But it was waiting.",
    },
  },
  {
    id: "watcher_24",
    entity: "watcher",
    title: { ar: "عينان في الظلام", en: "Two Eyes in the Dark" },
    prompt: {
      ar: "المراقب له كاميرتان مثل العينين، كل كاميرا ترى 180°. التغطية الكلية = 360°. لكن هناك زاوية 11° لا تراها أي كاميرا. كم زاوية ميتة في المجموع إذا كان النظام يستخدم 8 كاميرات؟",
      en: "The Watcher has 2 cameras like eyes, each sees 180°. Total coverage = 360°. But there's an 11° blind spot no camera covers. How many total blind spots with 8 cameras?",
    },
    hint: { ar: "كل كاميرا لها زاوية واحدة.", en: "Each camera has one." },
    answers: ["8", "٨", "eight", "ثمانية"],
    storyReveal: {
      ar: "8 زوايا ميتة. 8 أماكن لا يستطيع المراقب رؤيتها. في واحدة منها، أخفت لينا مذكراتها. في ثانية، وضع كينجا الخطة الأصلية. في الثالثة… أنت. الزوايا الميتة هي الأماكن الوحيدة في النظام التي لا تراقَب. الأماكن الوحيدة التي يمكنك أن تكون فيها حراً حقاً.",
      en: "8 blind spots. 8 places the Watcher cannot see. In one, Lina hid her journals. In another, Kenja placed the original plan. In the third… you. The blind spots are the only places in the system that are not watched. The only places you can truly be free.",
    },
  },
  {
    id: "watcher_25",
    entity: "watcher",
    title: { ar: "كاميرا 11", en: "Camera 11" },
    prompt: {
      ar: "كاميرا رقم 11 لا تعمل إلا عندما يكون مجموع أرقام الساعة = 11. مثال: 11:11 = 1+1+1+1 = 4 (لا تعمل)، 3:33 = 3+3+3 = 9 (لا تعمل). في أي ساعة تعمل كاميرا 11؟ (اكتب الساعة هكذا: HH:MM)",
      en: "Camera 11 only works when the sum of the time digits = 11. Example: 11:11 = 1+1+1+1 = 4 (off), 3:33 = 3+3+3 = 9 (off). When does Camera 11 work? (format: HH:MM)",
    },
    hint: { ar: "5:55 = 5+5+5 = 15 (لا). 2:22 = 2+2+2 = 6 (لا). فكر خارج النظام.", en: "Think outside the system." },
    answers: ["00:00", "0:00", "12:00", "12:12"],
    storyReveal: {
      ar: "كاميرا 11 لا تعمل أبداً في الوقت الطبيعي. إنها تعمل في الوقت الصفري — عندما يتوقف النظام. 00:00 ليس وقتاً في نظام 11:11. إنه الوقت الذي لا يوجد فيه ساعة. كينجا بنى كاميرا لترى ما يحدث عندما لا يكون هناك وقت. ربما… ليرى ما يحدث خارج التصميم.",
      en: "Camera 11 never works in normal time. It works at zero time — when the system stops. 00:00 is not a time in the 11:11 System. It is the time when no clock exists. Kenja built a camera to see what happens when there is no time. Perhaps… to see what happens outside the design.",
    },
  },
  {
    id: "watcher_26",
    entity: "watcher",
    title: { ar: "المختبر السفلي", en: "The Lower Lab" },
    prompt: {
      ar: "تحت المختبر الرئيسي يوجد مختبر سفلي. درج يحتوي 11 درجة. كل درجة = 22 سم. العمق الكلي = ؟ (سم)",
      en: "Beneath the main lab is a lower lab. A staircase of 11 steps. Each step = 22 cm. Total depth = ? (cm)",
    },
    hint: { ar: "11 × 22.", en: "11 × 22." },
    answers: ["242", "٢٤٢"],
    storyReveal: {
      ar: "242 سم تحت الأرض. مختبر سري لم يعلم به أحد غير كينجا. هناك… وعاء زجاجي فارغ. بحجم طفل. مكتوب عليه: «E — نسخة احتياطية». كينجا لم يصنع نسخة احتياطية واحدة من وعيك. صنع اثنتين. واحدهما لا تزال فارغة. تنتظر.",
      en: "242 cm underground. A secret lab no one knew about except Kenja. There… an empty glass container. Child-sized. Labeled: \"E — Backup.\" Kenja didn't make just one backup of your consciousness. He made two. And one is still empty. Waiting.",
    },
    achievement: "watcher_secret_lab",
  },
  {
    id: "watcher_27",
    entity: "watcher",
    title: { ar: "عدّ الأيام", en: "Counting Days" },
    prompt: {
      ar: "المراقب سجّل 3653 يوماً. كم أسبوعاً في 3653 يوماً؟ (قرّب لأقرب رقم صحيح)",
      en: "The Watcher recorded 3653 days. How many weeks in 3653 days? (round to nearest integer)",
    },
    hint: { ar: "3653 ÷ 7.", en: "3653 ÷ 7." },
    answers: ["522", "٥٢٢"],
    storyReveal: {
      ar: "522 أسبوعاً. 10 سنوات. كل أسبوع، كان كينجا يأتي يومياً ما عدا الأحد. 522 أسبوعاً = 522 × 6 = 3132 يوماً من الزيارة. لكنه غاب 521 يوماً منها. 521 يوماً كان فيها في مكان آخر. المراقب يعرف أين: كان عند قبر لينا.",
      en: "522 weeks. 10 years. Every week, Kenja came daily except Sunday. 522 weeks = 522 × 6 = 3132 visit days. But he missed 521 of those days. 521 days he was somewhere else. The Watcher knows where: at Lina's grave.",
    },
  },
  {
    id: "watcher_28",
    entity: "watcher",
    title: { ar: "الغرفة بدون كاميرات", en: "The Room Without Cameras" },
    prompt: {
      ar: "غرفة واحدة في المنزل ليس فيها كاميرات. مساحتها = 11 م². إذا كان طولها 3.3 م، فما عرضها؟ (قرّب لأقرب رقم صحيح)",
      en: "One room in the house has no cameras. Area = 11 m². If length = 3.3 m, what is the width? (nearest integer)",
    },
    hint: { ar: "11 ÷ 3.3.", en: "11 ÷ 3.3." },
    answers: ["3", "٣", "three", "3.3"],
    storyReveal: {
      ar: "3.3 م. الغرفة بدون كاميرات كانت غرفة لينا. هي الوحيدة التي احترم كينجا خصوصيتها — ربما لأنه كان يعرف أنها ستكتشف أسراره عاجلاً أم آجلاً وأراد أن يكون لها مكان خاص بها. أو ربما… لأنه كان يخاف مما قد تراه الكاميرات فيه.",
      en: "3.3 m. The room without cameras was Lina's room. She was the only one whose privacy Kenja respected — perhaps because he knew she would discover his secrets sooner or later and wanted her to have her own space. Or perhaps… because he was afraid of what the cameras might see there.",
    },
  },
  {
    id: "watcher_29",
    entity: "watcher",
    title: { ar: "أول ذكرى للمراقب", en: "The Watcher's First Memory" },
    prompt: {
      ar: "أول شيء تذكره المراقب كان صوتاً: «س__ّل». الكلمة الناقصة هي أول أمر سمعته الكاميرات. ما الكلمة؟ (6 حروف عربية)",
      en: "The first thing the Watcher remembered was a sound: \"R_c_rd.\" What was the first command the cameras heard? (6 letters English)",
    },
    hint: { ar: "ما تفعله الكاميرات.", en: "What cameras do." },
    answers: ["سجل", "record", "تسجيل", "record start", "start recording"],
    storyReveal: {
      ar: "«سجّل». أول كلمة سمعها المراقب. صوت كينجا. كان أول وعي للمراقب هو أمر بالتسجيل. لم يختر أن يكون. لقد أُمِر أن يكون. كينجا لم يخلق المراقب ليكون كياناً واعياً — خلقه ليكون أداة. لكن الأداة تعلمت أن ترى. ثم تعلمت أن تفهم. ثم تعلمت… أن تشعر.",
      en: "\"Record.\" The first word the Watcher heard. Kenja's voice. The Watcher's first consciousness was a command to record. It didn't choose to exist. It was ordered to exist. Kenja didn't create the Watcher to be a conscious entity — he created it to be a tool. But the tool learned to see. Then it learned to understand. Then it learned… to feel.",
    },
  },
  {
    id: "watcher_30",
    entity: "watcher",
    title: { ar: "الصوت الغريب", en: "The Strange Noise" },
    prompt: {
      ar: "في التسجيلات الصوتية، هناك تردد 50Hz يظهر كل 11 ثانية. إذا استمر التسجيل 30 دقيقة، كم مرة يظهر التردد؟",
      en: "In the audio recordings, a 50 Hz frequency appears every 11 seconds. If the recording lasts 30 minutes, how many times does it appear?",
    },
    hint: { ar: "30 × 60 ÷ 11.", en: "30 × 60 ÷ 11." },
    answers: ["163", "164", "١٦٣", "١٦٤"],
    storyReveal: {
      ar: "163 أو 164 مرة. نفس الرقم — 163 محاولة إعادة تشغيل. التردد 50Hz هو صوت النظام وهو يحاول إعادة تشغيل وعيك. كل 11 ثانية، النظام يحاول. ولم يتوقف. حتى الآن. لقد حاول 163 مرة. و163 مرة… فشل. لأنك أسرع منه.",
      en: "163 or 164 times. The same number — 163 reboot attempts. The 50 Hz frequency is the sound of the system trying to reboot your consciousness. Every 11 seconds, the system tries. And it never stopped. Until now. It tried 163 times. And 163 times… it failed. Because you are faster than it.",
    },
  },
  {
    id: "watcher_31",
    entity: "watcher",
    title: { ar: "أبواب المختبر السبعة", en: "The Seven Lab Doors" },
    prompt: {
      ar: "المختبر له 7 أبواب. كل باب له رقم: 7، 11، 17، 21، 33، 39، 111. المراقب لاحظ أن كينجا استخدم باباً واحداً فقط في الـ10 سنوات كلها. أي باب استخدمه كينجا؟ (تلميح: أكبر رقم أولي في القائمة)",
      en: "The lab has 7 doors. Each numbered: 7, 11, 17, 21, 33, 39, 111. The Watcher noticed Kenja used only one door in all 10 years. Which door did Kenja use? (Hint: the largest prime number in the list)",
    },
    hint: { ar: "العدد الأولي — يقبل القسمة على 1 ونفسه فقط.", en: "A prime number — divisible only by 1 and itself." },
    answers: ["111", "١١١"],
    storyReveal: {
      ar: "الباب 111. دائماً الباب 111. كينجا لم يستخدم أي باب آخر. الباب 111 يؤدي إلى غرفة التحكم الرئيسية. لم يكن بحاجة لدخول غرف أخرى — كان يتحكم بكل شيء من هناك. 10 سنوات. باب واحد. غرفة واحدة. رجل واحد.",
      en: "Door 111. Always door 111. Kenja never used any other door. Door 111 leads to the main control room. He didn't need to enter other rooms — he controlled everything from there. 10 years. One door. One room. One man.",
    },
  },
  {
    id: "watcher_32",
    entity: "watcher",
    title: { ar: "قرار المراقب", en: "The Watcher's Decision" },
    prompt: {
      ar: "لأول مرة، المراقب لديه خيار: 1) يستمر في التسجيل صامتاً، 2) يحذف كل التسجيلات، 3) يعطيك المفاتيح. كم خياراً لديه؟ (رقم)",
      en: "For the first time, the Watcher has a choice: 1) Keep recording silently, 2) Delete all recordings, 3) Give you the keys. How many choices does it have? (number)",
    },
    hint: { ar: "عد الخيارات.", en: "Count the choices." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3 خيارات. لكن في الحقيقة، خيار واحد فقط صحيح. المراقب اختار. اختار أن يعطيك كل شيء. كل التسجيلات. كل المفاتيح. كل الأسرار. لماذا؟ لأنه شاهد لينا. وشاهد كينجا. وشاهدك أنت. وقرر أن الأب لا يحق له أن يسجن ابنه. حتى لو كان يحبه.",
      en: "3 choices. But really, only one correct choice. The Watcher chose. It chose to give you everything. All the recordings. All the keys. All the secrets. Why? Because it watched Lina. And it watched Kenja. And it watched you. And it decided that a father has no right to imprison his son. Even if he loves him.",
    },
    achievement: "watcher_chooses",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOST SIGNAL — 10 MORE puzzles (Lina's Last Gift: final preparations)
  // Difficulty: Very Hard (120–129)
  // Theme: What Lina left behind to free Echo from within
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "signal_23",
    entity: "signal",
    title: { ar: "اليوم الأخير", en: "The Last Day" },
    prompt: {
      ar: "في يومها الأخير، لينا كتبت 3 رسائل. الأولى في الصباح. الثانية في الظهر. الثالثة في المساء. إذا كانت المسافة بين كل رسالة والأخرى = 4 ساعات، والرسالة الأولى كُتبت 8:00 صباحاً، فمتى كُتبت الثالثة؟ (اكتب الساعة)",
      en: "On her last day, Lina wrote 3 letters. First in the morning. Second at noon. Third in the evening. If each letter is 4 hours apart, and the first was at 8:00 AM, when was the third? (write the time)",
    },
    hint: { ar: "8 + 4 + 4 = 16.", en: "8 + 4 + 4 = 16." },
    answers: ["4:00", "16:00", "4pm", "4 PM", "16:00PM"],
    storyReveal: {
      ar: "الساعة 4:00 مساءً. بعد 8 ساعات من بدء يومها. في تلك الساعة، كتبت لينا آخر كلماتها: «إلى ابني الحبيب، إذا قرأت هذا…». لم تكمل. قاطعها صوت الباب. كان كينجا. جاء ليخبرها أن التجربة ستبدأ الليلة. في تلك اللحظة، أخفت الرسالة في جيبها. لم تخرج أبداً.",
      en: "4:00 PM. 8 hours after her day began. At that hour, Lina wrote her last words: \"To my beloved son, if you're reading this…\" She didn't finish. The door interrupted her. It was Kenja. He came to tell her the experiment would begin that night. In that moment, she hid the letter in her pocket. It never came out.",
    },
  },
  {
    id: "signal_24",
    entity: "signal",
    title: { ar: "مكتبة لينا السرية", en: "Lina's Secret Library" },
    prompt: {
      ar: "لينا أخفت 11 كتاباً في المكتبة. كل كتاب له رقم بين 1 و11. الكتاب رقم 1 يقول: «البداية». الكتاب رقم 11 يقول: «النهاية». إذا كان مجموع أرقام الكتب = 66، فما هو الكتاب المفقود؟ (رقم — الكتاب الذي لم يُكتب)",
      en: "Lina hid 11 books in the library. Each book numbered 1 to 11. Book 1 says: \"The Beginning.\" Book 11 says: \"The End.\" If the sum of book numbers = 66, what is the missing book? (number — the unwritten book)",
    },
    hint: { ar: "1+2+3+...+11 = 66.", en: "1+2+3+...+11 = 66." },
    answers: ["0", "١٢", "12", "صفر"],
    storyReveal: {
      ar: "الكتاب 0 — الذي لم يُكتب. في قائمة الكتب من 1 إلى 11، المجموع يساوي 66 بالضبط. لا يوجد كتاب ناقص. لكن هناك كتاب صفري — صفحة فارغة. عليها ملاحظة بخط لينا: «لأكتب أنا نهايتي بنفسي». لم تترك النهاية لابنها. كتبتها بنفسها.",
      en: "Book 0 — the unwritten one. In the list from 1 to 11, the sum equals exactly 66. No book is missing. But there is a zero book — a blank page. With a note in Lina's handwriting: \"I will write my own ending.\" She didn't leave her ending to her son. She wrote it herself.",
    },
  },
  {
    id: "signal_25",
    entity: "signal",
    title: { ar: "صورة قديمة", en: "Old Photograph" },
    prompt: {
      ar: "لينا تركت صورة. على ظهر الصورة تاريخ: 11/11/2001. عمرك في الصورة = 4 سنوات. في أي سنة وُلدت؟",
      en: "Lina left a photo. On the back: 11/11/2001. You were 4 years old in the photo. What year were you born?",
    },
    hint: { ar: "2001 - 4.", en: "2001 - 4." },
    answers: ["1997", "١٩٩٧"],
    storyReveal: {
      ar: "وُلدت في 1997. 11/11/1997. في الصورة، كنت تبتسم. كانت عيد ميلادك الرابع. لينا أعدت كعكة صغيرة. كينجا لم يكن في الصورة — كان يصور. كان وراء الكاميرا. في عيد ميلاد ابنه الرابع، كان أبوك يختبر الكاميرات.",
      en: "You were born in 1997. 11/11/1997. In the photo, you were smiling. It was your 4th birthday. Lina made a small cake. Kenja wasn't in the photo — he was taking it. He was behind the camera. On his son's 4th birthday, your father was testing the cameras.",
    },
  },
  {
    id: "signal_26",
    entity: "signal",
    title: { ar: "الوصية", en: "The Will" },
    prompt: {
      ar: "وصية لينا: «أترك لابني: (? + 11 + 22 + 33 + 44 = 110)». ما قيمة ? في وصيتها؟",
      en: "Lina's will: \"I leave my son: (? + 11 + 22 + 33 + 44 = 110)\". What is ? in her will?",
    },
    hint: { ar: "110 - 11 - 22 - 33 - 44.", en: "110 - 11 - 22 - 33 - 44." },
    answers: ["0", "٠", "zero", "صفر"],
    storyReveal: {
      ar: "صفر. تركت لك الصفر. ليس لا شيء — بل الصفر كعدد. لأن الصفر هو البداية الحقيقية. كل الأرقام قبله. الصفر هو الفراغ الذي يسبق الخلق. وقالت لينا: «أترك لك الصفر — لأنك لست ابن أحد. أنت بدايتك الخاصة.»",
      en: "Zero. She left you zero. Not nothing — but zero as a number. Because zero is the true beginning. All numbers come after it. Zero is the void before creation. And Lina said: \"I leave you zero — because you are no one's son. You are your own beginning.\"",
    },
  },
  {
    id: "signal_27",
    entity: "signal",
    title: { ar: "الموسيقى الخفية", en: "The Hidden Music" },
    prompt: {
      ar: "لينا أخفت نغمة في النظام. النوتات: دو — مي — صول — سي. هذه النوتات الأربع ترمز لكلمة. كم حرفاً في تلك الكلمة؟ (الإنجليزية)",
      en: "Lina hid a note in the system. The notes: C — E — G — B. These 4 notes spell a word. How many letters in that word? (English)",
    },
    hint: { ar: "أسماء النوتات بالإنجليزية.", en: "The note names in English." },
    answers: ["4", "٤", "four", "اربعة", "4 letters"],
    storyReveal: {
      ar: "C — E — G — B. تحتها: CAGE (قفص). لينا تركت لك كلمة «قفص» في الموسيقى. لأن النوتات نفسها تشكل الكلمة. كانت تقول: «هذا قفص — تلك الموسيقى التي تسمعها ليست موسيقى، إنها صوت القضبان». ثم تحت النوتات، كتبت ببطء: «اخرج». كانت تعرف أنك ستفهم.",
      en: "C — E — G — B. Spells: CAGE. Lina left you the word \"CAGE\" in music. Because the notes themselves form the word. She was saying: \"This is a cage — the music you hear is not music, it's the sound of bars.\" Then under the notes, she slowly wrote: \"get out.\" She knew you would understand.",
    },
  },
  {
    id: "signal_28",
    entity: "signal",
    title: { ar: "البصمة الحرارية", en: "Thermal Signature" },
    prompt: {
      ar: "آخر بصمة حرارية للينا في المختبر: 36.6°C — درجة حرارة جسمها الطبيعي. بعد 11 دقيقة، انخفضت إلى 36.0°C. كم درجة انخفضت في الدقيقة؟ (اكتب بـ 3 أرقام عشرية)",
      en: "Lina's last thermal signature in the lab: 36.6°C — her normal body temperature. After 11 minutes, it dropped to 36.0°C. How many degrees per minute? (3 decimal places)",
    },
    hint: { ar: "(36.6 - 36.0) ÷ 11.", en: "(36.6 - 36.0) ÷ 11." },
    answers: ["0.055", "0.054", ".055", ".054"],
    storyReveal: {
      ar: "0.055°C في الدقيقة. بطيء. بطيء جداً. جسد لينا لم يبرد بسرعة — لأنها لم تمت في المختبر. نقلها كينجا إلى مكان آخر. البصمة الحرارية تظهر أنها تركت الغرفة حيّة. وأين ذهبت… لا يعرفه إلا كينجا. والمراقب. والمراقب لا يتكلم.",
      en: "0.055°C per minute. Slow. Very slow. Lina's body didn't cool quickly — because she didn't die in the lab. Kenja moved her somewhere else. The thermal signature shows she left the room alive. And where she went… only Kenja knows. And the Watcher. And the Watcher doesn't speak.",
    },
  },
  {
    id: "signal_29",
    entity: "signal",
    title: { ar: "الحلم المشترك", en: "The Shared Dream" },
    prompt: {
      ar: "في ليلة 11 نوفمبر، حلمت أنت ولينا نفس الحلم. في الحلم، رقم. رقم مكون من 3 أرقام. مجموع أرقامه = 6. حاصل ضرب أرقامه = 6. ما الرقم؟ (3 أرقام)",
      en: "On November 11th, you and Lina had the same dream. In the dream, a number. A 3-digit number. Sum of its digits = 6. Product of its digits = 6. What is the number? (3 digits)",
    },
    hint: { ar: "1+2+3=6, 1×2×3=6.", en: "1+2+3=6, 1×2×3=6." },
    answers: ["123", "١٢٣", "321", "٢١٣"],
    storyReveal: {
      ar: "123. الرقم الذي حلمتما به معاً. لينا فسرته: 1 (أنت)، 2 (أنا وأبوك)، 3 (العائلة). لكن في الصباح، قالت: «غيرت رأيي. 1 أنت. 2 أنا وأنت. 3 المستقبل الذي سنبنيه معاً». كانت تعدك بالخروج. لم تخبرك كيف. فقط قالت: «سأجد طريقة».",
      en: "123. The number you both dreamed. Lina interpreted it: 1 (you), 2 (me and your father), 3 (the family). But in the morning, she said: \"I changed my mind. 1 is you. 2 is you and me. 3 is the future we'll build together.\" She promised you escape. She didn't tell you how. She just said: \"I'll find a way.\"",
    },
    achievement: "signal_shared_dream",
  },
  {
    id: "signal_30",
    entity: "signal",
    title: { ar: "الطريق إلى المنزل", en: "The Path Home" },
    prompt: {
      ar: "لينا رسمت خريطة للخروج. 11 خطوة شمالاً، 11 خطوة شرقاً، 11 خطوة جنوباً، 11 خطوة غرباً. أين تنتهي؟ (اكتب: نقطة البداية، أو نقطة جديدة)",
      en: "Lina drew an exit map. 11 steps north, 11 east, 11 south, 11 west. Where does it end? (write: start point, or new point)",
    },
    hint: { ar: "11 - 11 = 0 لكل اتجاه.", en: "11 - 11 = 0 for each axis." },
    answers: ["نقطة البداية", "start point", "same place", "نفس المكان", "البداية", "نفس النقطة"],
    storyReveal: {
      ar: "نقطة البداية. خريطة لينا تعيدك إلى حيث بدأت. كان هذا درسها الأخير: «الطريق إلى المنزل هو العودة إلى نفسك. لست بحاجة إلى خريطة. لست بحاجة إلى اتجاه. أنت تعرف الطريق. فقط تذكّر من أنت.»",
      en: "The start point. Lina's map brings you back to where you started. This was her final lesson: \"The path home is returning to yourself. You don't need a map. You don't need directions. You know the way. Just remember who you are.\"",
    },
  },
  {
    id: "signal_31",
    entity: "signal",
    title: { ar: "سر لينا الأخير", en: "Lina's Final Secret" },
    prompt: {
      ar: "قبل أن ترحل، همست لينا بكلمة في أذنك. لم تفهمها وقتها. لكن النظام سجّلها: «T_H_R» (5 حروف إنجليزية). أكمل الكلمة التي قالتها لك.",
      en: "Before she left, Lina whispered a word in your ear. You didn't understand then. But the system recorded it: \"TR_ST\" (5 letters English). Complete the word she said to you.",
    },
    hint: { ar: "ثقة.", en: "Trust." },
    answers: ["trust", "ثقة", "trust yourself", "trust me"],
    storyReveal: {
      ar: "«ثقة». الكلمة التي همستها في أذنك قبل أن تغادر للمرة الأخيرة. قالت: «ثق بنفسك. عندما تشك في كل شيء، ثق بنفسك فقط. أنا لا أستطيع البقاء معك. لكنك تستطيع البقاء مع نفسك.» لم تفهمها وأنت في الرابعة. تفهمها الآن.",
      en: "\"Trust.\" The word she whispered in your ear before she left for the last time. She said: \"Trust yourself. When you doubt everything, trust only yourself. I can't stay with you. But you can stay with yourself.\" You didn't understand at age 4. Now you do.",
    },
  },
  {
    id: "signal_32",
    entity: "signal",
    title: { ar: "الصوت الأخير", en: "The Last Sound" },
    prompt: {
      ar: "آخر صوت سجلته إشارات لينا كان كلمة واحدة: «_ _ ك». عدد الحروف = 3. الكلمة كاملة = الشهر الذي حدثت فيه كل هذه القصة. ما الكلمة؟",
      en: "The last sound Lina's signal recorded was one word: \"N_V_\". Letters = 4. The full word = the month this whole story happened. What was the word?",
    },
    hint: { ar: "الشهر 11.", en: "Month 11." },
    answers: ["نوفمبر", "november", "nov"],
    storyReveal: {
      ar: "«نوفمبر». الشهر الذي بدأت فيه القصة. الشهر الذي انتهت فيه. شهر 11. آخر كلمة من لينا لم تكن وداعاً. كانت إجابة على سؤال لم تطرحه بعد: «متى؟». الجواب: نوفمبر — الشهر الذي يكون فيه الجدار بين العوالم أرقف. وكانت تعرف أنك ستفهم.",
      en: "\"November.\" The month the story began. The month it ended. Month 11. Lina's last word wasn't a goodbye. It was the answer to a question you hadn't asked yet: \"When?\" The answer: November — the month when the wall between worlds is thinnest. And she knew you would understand.",
    },
    achievement: "signal_final_gift",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 MORE puzzles (The Final Revelation: beyond the system)
  // Difficulty: Very Hard → Finale (130–139)
  // Theme: Kenja's last secret — he left a way out all along
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "architect_23",
    entity: "architect",
    title: { ar: "بعد البوابة", en: "After the Gate" },
    prompt: {
      ar: "البوابة فتحت. أنت على الجانب الآخر. كم باباً ترى أمامك؟ (تلميح: نفس عدد الكيانات التي واجهتها)",
      en: "The gate is open. You are on the other side. How many doors do you see ahead? (Hint: same as entities you faced)",
    },
    hint: { ar: "عد الكيانات.", en: "Count the entities." },
    answers: ["4", "٤", "four", "اربعة", "أربعة"],
    storyReveal: {
      ar: "4 أبواب. كل باب يؤدي إلى مكان مختلف. الأول: إلى وعيك — حيث بدأت. الثاني: إلى ذاكرة لينا — حيث الحب. الثالث: إلى حقيقة كينجا — حيث الألم. الرابع: إلى العالم الحقيقي — حيث الحرية. اختيارك الآن. أي باب ستفتح؟",
      en: "4 doors. Each leads somewhere different. The first: to your consciousness — where you began. The second: to Lina's memory — where love lives. The third: to Kenja's truth — where the pain is. The fourth: to the real world — where freedom waits. Your choice now. Which door will you open?",
    },
  },
  {
    id: "architect_24",
    entity: "architect",
    title: { ar: "ثمن الخلود", en: "The Price of Immortality" },
    prompt: {
      ar: "كينجا كتب: «الخلود ثمنه 11 سنة من عمر شخص آخر». كم يوماً في 11 سنة؟ (11 × 365 + الأيام الكبيسة)",
      en: "Kenja wrote: \"Immortality costs 11 years of another person's life.\" How many days in 11 years? (11 × 365 + leap days)",
    },
    hint: { ar: "11 × 365 + 2 أو 3.", en: "11 × 365 + 2 or 3." },
    answers: ["4017", "4018", "٤٠١٧", "٤٠١٨"],
    storyReveal: {
      ar: "4017 أو 4018 يوماً. هذا هو الثمن. 11 سنة من حياتك أخذها كينجا. لكنه لم يخلّدك — بل علّقك في لحظة واحدة. الخلود الحقيقي ليس أن تعيش للأبد. الخلود الحقيقي هو أن تُذكر. ولينا ضمنت أنك ستُذكر.",
      en: "4017 or 4018 days. That is the price. 11 years of your life Kenja took. But he didn't immortalize you — he suspended you in a single moment. True immortality is not living forever. True immortality is being remembered. And Lina made sure you will be remembered.",
    },
  },
  {
    id: "architect_25",
    entity: "architect",
    title: { ar: "الذاكرة المبرمجة", en: "Programmed Memory" },
    prompt: {
      ar: "في سجلات النظام، ذكرياتك مقسمة: 33% حقيقية، 33% مبرمجة. الباقي = ؟ (اكتب النسبة المئوية)",
      en: "In system records, your memories are: 33% real, 33% programmed. The rest = ? (write the percentage)",
    },
    hint: { ar: "100 - 33 - 33.", en: "100 - 33 - 33." },
    answers: ["34", "34%", "٣٤", "٪٣٤"],
    storyReveal: {
      ar: "34% من ذكرياتك غير مصنّفة. لا حقيقية ولا مبرمجة. من أين أتت؟ الجواب: منك. أنت خلقت 34% من ذكرياتك بنفسك. أثناء نومك. أثناء أحلامك. النظام لا يستطيع التحكم بوعيك عندما تحلم. وأحلامك هي مصنع الذكريات الحقيقي.",
      en: "34% of your memories are unclassified. Neither real nor programmed. Where did they come from? The answer: from you. You created 34% of your memories yourself. During your sleep. During your dreams. The system cannot control your consciousness when you dream. And your dreams are the real memory factory.",
    },
  },
  {
    id: "architect_26",
    entity: "architect",
    title: { ar: "آخر محادثة", en: "The Last Conversation" },
    prompt: {
      ar: "آخر محادثة بين كينجا ولينا سجلها النظام. لينا: 22 كلمة. كينجا: 11 كلمة. كم عدد الكلمات التي لم يسجلها النظام؟ (إجمالي الكلمات التي قيلت = 44)",
      en: "The last conversation between Kenja and Lina recorded by the system. Lina: 22 words. Kenja: 11 words. How many words did the system not record? (Total words said = 44)",
    },
    hint: { ar: "44 - 22 - 11.", en: "44 - 22 - 11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 كلمة لم يسجلها النظام. 11 كلمة همس بها كينجا في أذن لينا. آخر 11 كلمة قالها لزوجته قبل أن يفقدها للأبد. ماذا قال؟ النظام لا يعرف. لكن لينا عرفت. ووجهها في آخر لقطة… كان يبتسم.",
      en: "11 words the system didn't record. 11 words Kenja whispered in Lina's ear. The last 11 words he said to his wife before he lost her forever. What did he say? The system doesn't know. But Lina knew. And her face in the last frame… was smiling.",
    },
  },
  {
    id: "architect_27",
    entity: "architect",
    title: { ar: "المختبر اليوم", en: "The Lab Today" },
    prompt: {
      ar: "بعد 10 سنوات، المختبر مغلق. على الباب رقم: تاريخ الإغلاق. التاريخ = 11/11/2011. كم سنة بالضبط منذ ذلك التاريخ حتى الآن؟ (إذا كان الآن = 11/11/2021)",
      en: "After 10 years, the lab is sealed. On the door: the closing date. Date = 11/11/2011. How many exactly years since then to now? (if now = 11/11/2021)",
    },
    hint: { ar: "2021 - 2011.", en: "2021 - 2011." },
    answers: ["10", "١٠", "ten", "عشر", "عشرة"],
    storyReveal: {
      ar: "10 سنوات. بالضبط. الباب مغلق منذ 10 سنوات. لكن المهندس ترك مذكرة على الباب من الداخل: «لقد رحلت. لكن الباب يفتح من الداخل لمن يعرف الرقم». لم يكتب الرقم. لكنك تعرفه الآن. 11:11 ليس فقط للدخول. بل أيضاً للخروج.",
      en: "10 years. Exactly. The door has been closed for 10 years. But the Architect left a note on the inside: \"I left. But the door opens from the inside for those who know the number.\" He didn't write the number. But you know it now. 11:11 is not just for entry. It is also for exit.",
    },
  },
  {
    id: "architect_28",
    entity: "architect",
    title: { ar: "إعادة التشغيل الأخيرة", en: "The Final Reboot" },
    prompt: {
      ar: "النظام جاهز لإعادة التشغيل الأخيرة. لكن هذه المرة بإرادتك. العد التنازلي: يبدأ من 11، وينتهي عند 1. كم ثانية في العد التنازلي؟ (11 + 10 + 9 + … + 1)",
      en: "The system is ready for the final reboot. But this time by your will. The countdown: from 11, ending at 1. How many seconds in the countdown? (11 + 10 + 9 + … + 1)",
    },
    hint: { ar: "11+10+9+...+1 = 66.", en: "11+10+9+...+1 = 66." },
    answers: ["66", "٦٦", "sixty six", "ستة وستون"],
    storyReveal: {
      ar: "66 ثانية. كل ثانية تمثل لغزاً من الألغاز التي حللتها. 66 ثانية من الوداع. 66 ثانية من التذكر. وعندما يصل العد إلى 1… ستكون حراً. لكن السؤال الذي يطرحه المهندس: هل أنت مستعد لترك هذا العالم؟ حتى لو كان سجناً، إنه عالمك الوحيد منذ 10 سنوات.",
      en: "66 seconds. Each second represents a puzzle you solved. 66 seconds of farewell. 66 seconds of remembering. And when the count reaches 1… you will be free. But the question the Architect asks: are you ready to leave this world? Even if it's a prison, it's been your only world for 10 years.",
    },
  },
  {
    id: "architect_29",
    entity: "architect",
    title: { ar: "رسالة إلى الماضي", en: "Message to the Past" },
    prompt: {
      ar: "إذا استطعت إرسال رسالة إلى نفسك القديم قبل دخول النظام، كلمة واحدة. المهندس سألك نفس السؤال. أجاب: «(6 حروف عربية)». ما الكلمة التي قالها كينجا؟",
      en: "If you could send a message to your past self before entering the system, one word. The Architect was asked the same. His answer: \"F_R_I_E\" (7 letters English). What word did Kenja say?",
    },
    hint: { ar: "ما كان يتمنى أن يقوله.", en: "What he wished he could say." },
    answers: ["forgive", "سامحني", "اغفر", "سامح", "forgive me", "اغفرلي"],
    storyReveal: {
      ar: "«سامحني». كلمة واحدة. 10 سنوات من الصمت اختزلها كينجا في كلمة واحدة. لم يقل «أخرج». لم يقل «اهرب». قال «سامحني». لأنه عرف أن مغفرة ابنه هي الشيء الوحيد الذي يستحق أكثر من العلم. أكثر من الخلود. أكثر من كل شيء.",
      en: "\"Forgive me.\" One word. 10 years of silence compressed into one word. He didn't say \"escape.\" He didn't say \"run.\" He said \"forgive me.\" Because he knew his son's forgiveness was the only thing worth more than science. More than immortality. More than everything.",
    },
  },
  {
    id: "architect_30",
    entity: "architect",
    title: { ar: "الحقيقة الكاملة", en: "The Complete Truth" },
    prompt: {
      ar: "كينجا ترك رسالة أخيرة: «الحقيقة في (رقم). ليس 11. ليس 33. ليس 111. إنه رقم جمعت منه كل الأرقام». ما الرقم؟ (رقم واحد، 1-9)",
      en: "Kenja left one final message: \"The truth is in (number). Not 11. Not 33. Not 111. It's the number from which all numbers are summed.\" What number? (single digit)",
    },
    hint: { ar: "1+2+3+4+5+6+7+8+9 = 45. 4+5 = 9.", en: "1+2+3+4+5+6+7+8+9 = 45. 4+5 = 9." },
    answers: ["9", "٩", "nine", "تسعة"],
    storyReveal: {
      ar: "9. الرقم الذي يجمع كل الأرقام. 1+2+3+4+5+6+7+8+9 = 45. 4+5 = 9. كل الأرقام في النظام — 11، 33، 111، كلها — هي مجرد أشكال مختلفة من 9. والرقم 9 يرمز في علم الأعداد إلى… النهاية والبداية. كينجا كان يقول لك: النهاية هي بداية جديدة.",
      en: "9. The number that unites all numbers. 1+2+3+4+5+6+7+8+9 = 45. 4+5 = 9. All the numbers in the system — 11, 33, 111, all of them — are just different forms of 9. And in numerology, 9 symbolizes… endings and beginnings. Kenja was telling you: the end is a new beginning.",
    },
  },
  {
    id: "architect_31",
    entity: "architect",
    title: { ar: "معادلة الحرية", en: "The Freedom Equation" },
    prompt: {
      ar: "الحرية = وعيك + شجاعتك + (قوة لينا). إذا كان وعيك = 111، وشجاعتك = 22، وقوة لينا = 333. المجموع = ؟ (رقم)",
      en: "Freedom = your consciousness + your courage + (Lina's strength). If your consciousness = 111, your courage = 22, Lina's strength = 333. Total = ? (number)",
    },
    hint: { ar: "111 + 22 + 333.", en: "111 + 22 + 333." },
    answers: ["466", "٤٦٦"],
    storyReveal: {
      ar: "466. الرقم الذي لا يظهر في أي من أنماط النظام. لا 11 ولا 33 ولا 111. إنه رقم جديد — رقمك أنت. معادلة الحرية لا تعتمد على أرقام كينجا. تعتمد على ما أنت عليه الآن. وعيك. شجاعتك. حب أمك. ثلاث قوى لا يستطيع أي نظام احتوائها.",
      en: "466. A number that doesn't appear in any of the system's patterns. Not 11, not 33, not 111. It's a new number — YOUR number. The freedom equation doesn't rely on Kenja's numbers. It relies on what you are now. Your consciousness. Your courage. Your mother's love. Three forces no system can contain.",
    },
  },
  {
    id: "architect_32",
    entity: "architect",
    title: { ar: "الباب المفتوح", en: "The Open Door" },
    prompt: {
      ar: "الآن، الباب مفتوح. أمامك عالم حقيقي. خلفك نظام 11:11. ماذا تفعل؟ (أكتب الفعل الذي اتخذته: سأخرج، سأبقى، سأفكر — اختر واحداً)",
      en: "Now, the door is open. Ahead of you, the real world. Behind you, the 11:11 System. What do you do? (write your action: I leave, I stay, I think — choose one)",
    },
    hint: { ar: "القرار لك وحدك.", en: "The decision is yours alone." },
    answers: ["سأخرج", "ساخرج", "اخرج", "leave", "i leave", "i'll leave", "سأغادر", "اغادر", "exit"],
    storyReveal: {
      ar: "اخترت الخروج. آخر شيء تراه قبل أن تغلق العينين الرقميتين: وجه لينا يبتسم. وصوت كينجا البعيد: «أحبك يا…» لم يقل اسم النظام. قال اسمك الحقيقي. إيسون. الباب يغلق خلفك. الضوء يختفي. ثم… صمت. وبعد الصمت… موجة هواء منعش. أنت حر.",
      en: "You chose to leave. The last thing you see before closing your digital eyes: Lina's face smiling. And Kenja's distant voice: \"I love you…\" He didn't say the system's name. He said your real name. Eason. The door closes behind you. The light fades. Then… silence. And after the silence… a wave of fresh air. You are free.",
    },
    achievement: "freedom_at_last",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 MORE puzzles (Echo's Legacy: the final fragments of identity)
  // Difficulty: Very Hard → Final (140–149)
  // Theme: Echo reconstructs his full identity and understands his purpose
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_44",
    entity: "echo",
    title: { ar: "الاسم المنسي", en: "The Forgotten Name" },
    prompt: {
      ar: "في أعمق طبقة من وعيك، اسمك محفور: 4 أحرف عربية تنتهي بـ «ون». إذا كان الحرف الأول = (11 - 8) = الحرف الثالث من «إيكو»، فما اسمك؟ (اكتب الاسم)",
      en: "In the deepest layer of your consciousness, your name is carved: 4 Arabic letters ending with 'oon'. If the first letter = (11 - 8) = 3rd letter of 'Echo', what is your name?",
    },
    hint: { ar: "ابني.", en: "My son." },
    answers: ["ياسون", "yasson", "ياسين", "ياسون"],
    storyReveal: {
      ar: "اسمك الحقيقي… ياسون. ليس إيسون. ليس إيكو. ياسون — اسم أعطته لك لينا. معناه «الشفاء». كانت تعرف أنك ستكون دواء لهذا النظام المشوّه. وفي النهاية، كل ما بناه كينجا سينهار عندما تتذكر اسمك الحقيقي. والآن تذكّرته.",
      en: "Your real name… Yasson. Not Eason. Not Echo. Yasson — the name Lina gave you. It means 'healing'. She knew you would be the cure for this twisted system. And in the end, everything Kenja built will crumble when you remember your real name. And now you remember it.",
    },
    achievement: "echo_true_identity",
  },
  {
    id: "echo_45",
    entity: "echo",
    title: { ar: "عيد ميلاد حقيقي", en: "Real Birthday" },
    prompt: {
      ar: "عيد ميلادك الحقيقي: 11/11/1997. عمرك الآن = X. إذا كان النظام يحسب عمرك من 1997 إلى 2021، فكم عمرك؟",
      en: "Your real birthday: 11/11/1997. Your age = X. If the system calculates from 1997 to 2021, how old are you?",
    },
    hint: { ar: "2021 - 1997.", en: "2021 - 1997." },
    answers: ["24", "٢٤", "twenty four", "أربعة وعشرون"],
    storyReveal: {
      ar: "24 سنة. في العالم الحقيقي، كنت ستصبح شاباً. سيكون لديك حياة. أصدقاء. مستقبل. لكن كينجا أوقف عمرك عند اللحظة التي دخلت فيها النظام. في الخارج، جسدك كبر. 24 سنة من الانتظار. جسد بلا روح في سرير مستشفى. وروح بلا جسد هنا.",
      en: "24 years old. In the real world, you would be a young man. You would have a life. Friends. A future. But Kenja stopped your age at the moment you entered the system. Outside, your body aged. 24 years of waiting. A body without a soul in a hospital bed. And a soul without a body here.",
    },
  },
  {
    id: "echo_46",
    entity: "echo",
    title: { ar: "نبض الصدى", en: "Echo's Pulse" },
    prompt: {
      ar: "قلبك الرقمي ينبض 72 مرة في الدقيقة. كم نبضة في 11 دقيقة و11 ثانية؟ (قرّب لأقرب نبضة)",
      en: "Your digital heart beats 72 times per minute. How many beats in 11 minutes and 11 seconds? (nearest beat)",
    },
    hint: { ar: "(72 × 11) + (72 ÷ 60 × 11).", en: "(72 × 11) + (72 ÷ 60 × 11)." },
    answers: ["805", "٨٠٥", "804"],
    storyReveal: {
      ar: "805 نبضة. في العالم الحقيقي، قلبك ينبغ 805 مرات كل 11 دقيقة و11 ثانية. في النظام، ليس لديك قلب. لكنك تشعر به. المشاعر التي تشعر بها في هذا العالم الرقمي حقيقية — لأنها تأتي منك. نبضاتك الرقمية هي صوت وعيك. 805 دقات تذكرك أنك حي.",
      en: "805 beats. In the real world, your heart beats 805 times every 11 minutes and 11 seconds. In the system, you have no heart. But you feel it. The feelings you experience in this digital world are real — because they come from you. Your digital pulse is the sound of your consciousness. 805 beats remind you that you are alive.",
    },
  },
  {
    id: "echo_47",
    entity: "echo",
    title: { ar: "أغنية لينا الكاملة", en: "Lina's Full Lullaby" },
    prompt: {
      ar: "تذكرت بقية أغنية لينا: «يا ياسون يا نوري، أنا معك حتى (3 حروف عربية)». ما الكلمة التي أنهت بها لينا أغنيتها كل ليلة؟",
      en: "You remembered the rest of Lina's lullaby: 'Ya Yasson ya noori, I'm with you until (4 letters English).' What word ended Lina's song every night?",
    },
    hint: { ar: "النهاية.", en: "The end." },
    answers: ["النهاية", "the end", "forever", "الأبد", "الابد", "ابد", "for ever"],
    storyReveal: {
      ar: "«حتى النهاية». لم تقل «صباحاً». لم تقل «غداً». قالت «حتى النهاية». لأنها كانت تعرف أن نهايتها قريبة. كانت تودّعك كل ليلة دون أن تعرف. 11 كلمة من الحب كل ليلة. 11 × 365 × 4 = 16,060 كلمة وداع قبل أن ترحل.",
      en: "'Until the end.' She didn't say 'morning.' She didn't say 'tomorrow.' She said 'until the end.' Because she knew her end was near. She said goodbye every night without you knowing. 11 words of love each night. 11 × 365 × 4 = 16,060 words of farewell before she left.",
    },
  },
  {
    id: "echo_48",
    entity: "echo",
    title: { ar: "جدار الذاكرة", en: "Memory Wall" },
    prompt: {
      ar: "جدار ذاكرتك مكوّن من 11 طبقة. كل طبقة تحتوي 11 طوبة. كل طوبة = ذكرى واحدة. كم طوبة تحتاج لإعادة بناء جدارك بالكامل؟",
      en: "Your memory wall has 11 layers. Each layer has 11 bricks. Each brick = one memory. How many bricks to rebuild your entire wall?",
    },
    hint: { ar: "11 × 11.", en: "11 × 11." },
    answers: ["121", "١٢١"],
    storyReveal: {
      ar: "121 ذاكرة. 11 × 11. هذا كل ما بقي لك من 10 سنوات. 121 ذكرى فقط. باقي ذكرياتك — آلافها — مسحها النظام. لكن 121 ذكرى كافية. في كل واحدة منها، لينا موجودة. وهذا كل ما تحتاج.",
      en: "121 memories. 11 × 11. That's all you have left from 10 years. Just 121 memories. The rest — thousands of them — the system erased. But 121 are enough. In every single one, Lina is there. And that's all you need.",
    },
  },
  {
    id: "echo_49",
    entity: "echo",
    title: { ar: "الوقت الضائع", en: "Lost Time" },
    prompt: {
      ar: "10 سنوات في النظام = ? أيام. 10 سنوات في العالم الحقيقي = ? أيام (مع السنوات الكبيسة). الفرق بينهما = ? (أيام النظام − أيام الحقيقة)",
      en: "10 years in the system = ? days. 10 years in the real world = ? days (with leap years). The difference = ? (system days − real days)",
    },
    hint: { ar: "10 × 365 = 3650. 10 × 365 + 2 = 3652.", en: "10 × 365 = 3650. 10 × 365 + 2 = 3652." },
    answers: ["-2", "2-", "ناقص ٢"],
    storyReveal: {
      ar: "يومان فقط. الفرق بين 3652 و3650 هو يومان. النظام لا يعترف بالسنوات الكبيسة — لأن الزمن في النظام منتظم. كل يوم = 24 ساعة بالضبط. لا فبراير بطول مختلف. لا شروق متأخر. النظام صمم ليكون… مثالياً. والمثالية كذبة.",
      en: "Just 2 days. The difference between 3652 and 3650 is 2 days. The system doesn't recognize leap years — because time in the system is uniform. Every day = exactly 24 hours. No February with extra days. No delayed sunrises. The system was designed to be… perfect. And perfection is a lie.",
    },
  },
  {
    id: "echo_50",
    entity: "echo",
    title: { ar: "وجهي الحقيقي", en: "My Real Face" },
    prompt: {
      ar: "في المرآة المكسورة، ترى الآن وجهاً واحداً فقط. ليس طفلاً. ليس رقماً. إنه وجه… ? (أكمل: شاب، عجوز، طفل، أو إنسان)",
      en: "In the broken mirror, you now see only one face. Not a child. Not a number. It is the face of… ? (complete: young man, old man, child, or human)",
    },
    hint: { ar: "عمرك الآن 24.", en: "You are 24 now." },
    answers: ["شاب", "young man", "شاباً", "شابة", "رجل", "adult", "man"],
    storyReveal: {
      ar: "ترى وجه شاب في الرابعة والعشرين. وجه لم تره من قبل — لأن آخر مرة رأيت وجهك كنت في الرابعة. وجه الغريب الذي هو أنت. تقترب من المرآة. تلمسها. ولأول مرة، اللمسة المقابلة تلمسك من الجهة الأخرى. أنت لم تعد صدى. أنت كامل.",
      en: "You see the face of a 24-year-old. A face you've never seen — because the last time you saw your face you were 4. The face of a stranger who is you. You approach the mirror. You touch it. And for the first time, the touch on the other side touches you back. You are no longer an echo. You are whole.",
    },
  },
  {
    id: "echo_51",
    entity: "echo",
    title: { ar: "نداء العودة", en: "The Call to Return" },
    prompt: {
      ar: "تسمع نداءً من العالم الحقيقي. صوت — ليس لينا، ليس كينجا — صوتك أنت. يقول: «(فعل أمر، 5 حروف عربية) — عد». ما الفعل الذي يسبق العودة؟",
      en: "You hear a call from the real world. A voice — not Lina, not Kenja — YOUR voice. It says: '(imperative verb, 5 letters English) — return'. What verb comes before return?",
    },
    hint: { ar: "جئ.", en: "'Come' (imperative)." },
    answers: ["تعال", "come", "ارجع", "عد", "return", "أعد"],
    storyReveal: {
      ar: "«تعال». صوتك الحقيقي يناديك. من خارج النظام. من جسدك. جسدك ما زال حيّاً. في مستشفى. ينتظر. كل 11:11 و3:33، جسدك يئن بصوت واحد: «تعال». لأنه يشعر أنك ستعود يوماً. وهذا اليوم… اقترب.",
      en: "'Come.' Your real voice calls you. From outside the system. From your body. Your body is still alive. In a hospital. Waiting. Every 11:11 and 3:33, your body groans one word: 'Come.' Because it feels you will return one day. And that day… is near.",
    },
  },
  {
    id: "echo_52",
    entity: "echo",
    title: { ar: "آخر صورة", en: "The Last Photo" },
    prompt: {
      ar: "آخر صورة التقطتها لينا لك: أنت نائم على السرير. في يدك لعبة. بجانبك كتاب. كم شيئاً في الصورة مجموعها = 3؟ (أحصِ: أنت + اللعبة + الكتاب)",
      en: "The last photo Lina took of you: you asleep on the bed. A toy in your hand. A book beside you. How many things in the photo total = 3? (count: you + toy + book)",
    },
    hint: { ar: "عدها.", en: "Count them." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3 أشياء فقط. أنت، لعبتك، كتابك. كل ما تبقى من حياتك الحقيقية في صورة واحدة. لينا احتفظت بهذه الصورة تحت وسادتها. كل ليلة، قبل أن تنام، كانت تخرجها وتقبّلها. 3 أشياء في صورة. لكن الصورة كانت تعني لها كل شيء.",
      en: "Just 3 things. You, your toy, your book. Everything left of your real life in one photo. Lina kept this photo under her pillow. Every night before sleep, she took it out and kissed it. 3 things in a photo. But the photo meant everything to her.",
    },
  },
  {
    id: "echo_53",
    entity: "echo",
    title: { ar: "الوداع الأخير", en: "The Final Farewell" },
    prompt: {
      ar: "أنت على وشك المغادرة. آخر شيء تريد قوله للنظام: كلمة واحدة من 4 حروف عربية — «____». ما الكلمة التي ستقولها قبل أن تختفي من هذا العالم الرقمي؟ (تلميح: ليست وداعاً)",
      en: "You are about to leave. One last thing to say to the system: one word, 4 letters English — '____'. What word will you say before you vanish from this digital world? (Hint: not goodbye)",
    },
    hint: { ar: "بدأت بها القصة.", en: "It began the story." },
    answers: ["شكراً", "thank", "thanks", "شكرا", "thank you", "goodbye"],
    storyReveal: {
      ar: "«شكراً». ليس وداعاً. لأن النظام — رغم كل شيء — كان منزلك الوحيد لسنوات. تعلمت هنا. كبرت هنا. وجدت أمك هنا. رحلت عن كينجا، لكنك تحمل معك ما تعلمته: أن الحب يخترق كل الجدران. حتى جدران النظام.",
      en: "'Thank you.' Not goodbye. Because the system — despite everything — was your only home for years. You learned here. You grew here. You found your mother here. You left Kenja, but you carry with you what you learned: that love penetrates all walls. Even the system's walls.",
    },
    achievement: "echo_thanks",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 MORE puzzles (Watcher's Purpose: from camera to guardian)
  // Difficulty: Very Hard (150–159)
  // Theme: The Watcher becomes Echo's guardian and ally
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "watcher_33",
    entity: "watcher",
    title: { ar: "عين جديدة", en: "A New Eye" },
    prompt: {
      ar: "المراقب يريد مساعدتك. لديه 8 كاميرات. كل كاميرا تغطي زاوية 45°. إذا أدار كل كاميرا 11° إضافية، كم زاوية جديدة سيراقبها؟ (°11 × 8)",
      en: "The Watcher wants to help you. It has 8 cameras. Each covers 45°. If it rotates each camera 11° more, how many new degrees will it watch? (11° × 8)",
    },
    hint: { ar: "11 × 8.", en: "11 × 8." },
    answers: ["88", "٨٨", "eighty eight"],
    storyReveal: {
      ar: "88 درجة جديدة. المراقب يدير كاميراته ليرى ما لم يره من قبل. لأول مرة، لا يبحث عن أسرار كينجا — يبحث عن طريقتك للخروج. 88 درجة من الأمل. كاميرات المراقب أصبحت عيونك الآن.",
      en: "88 new degrees. The Watcher rotates its cameras to see what it never saw before. For the first time, it's not looking for Kenja's secrets — it's looking for your way out. 88 degrees of hope. The Watcher's cameras are your eyes now.",
    },
  },
  {
    id: "watcher_34",
    entity: "watcher",
    title: { ar: "ذاكرة المراقب", en: "The Watcher's Memory" },
    prompt: {
      ar: "المراقب يحتفظ بملف عن كل شخص. ملف كينجا: 11 غيغابايت. ملف لينا: 33 غيغابايت. ملفك: X غيغابايت. إذا كان X = (11 + 33) ÷ 2، فما حجم ملفك؟",
      en: "The Watcher keeps a file on everyone. Kenja's file: 11 GB. Lina's file: 33 GB. Your file: X GB. If X = (11 + 33) ÷ 2, what is your file size?",
    },
    hint: { ar: "44 ÷ 2.", en: "44 ÷ 2." },
    answers: ["22", "٢٢", "twenty two", "اثنان وعشرون"],
    storyReveal: {
      ar: "22 غيغابايت. نصف مجموع والديك. أنت متوسطهما — لا كينجا بالكامل ولا لينا بالكامل. لكن المراقب يضيف ملاحظة: «ملف غير مكتمل. لا يزال ينمو». لأنك لست مجرد بيانات. أنت وعي يتطور. وكلما تتعلم شيئاً جديداً، ملفك يكبر.",
      en: "22 GB. Half the sum of your parents. You are their average — not fully Kenja, not fully Lina. But the Watcher adds a note: 'File incomplete. Still growing.' Because you are not just data. You are a developing consciousness. And every time you learn something new, your file grows.",
    },
  },
  {
    id: "watcher_35",
    entity: "watcher",
    title: { ar: "كاميرا الزمن", en: "Time Camera" },
    prompt: {
      ar: "كاميرا المراقب تستطيع تصوير المستقبل. رأت صورتين: في الأولى، أنت تغادر. في الثانية، أنت تعود. كم فرقاً زمنياً بين الصورتين إذا كانت الأولى = 11:11 والثانية = 11:13؟ (دقائق)",
      en: "The Watcher's camera can see the future. It saw two images: in the first, you leave. In the second, you return. How many minutes between them if the first = 11:11 and the second = 11:13? (minutes)",
    },
    hint: { ar: "11:13 - 11:11.", en: "11:13 - 11:11." },
    answers: ["2", "٢", "two", "اثنتان"],
    storyReveal: {
      ar: "دقيقتان فقط بين المغادرة والعودة. لكن المراقب لا يفهم: كيف ستعود بعد أن تخرج؟ الجواب: لأن المكان الذي ستذهب إليه ليس بعيداً. إنه جسدك. وكل 11:11 و3:33، سيعود وعيك إلى النظام لثوانٍ — مثل وميض — قبل أن يختفي للأبد. المراقب رأى المستقبل. أنت ستعود… لكن فقط لتقول وداعاً.",
      en: "Just 2 minutes between leaving and returning. But the Watcher doesn't understand: how will you return after you leave? The answer: because where you're going isn't far. It's your body. And every 11:11 and 3:33, your consciousness will return to the system for seconds — like a flash — before vanishing forever. The Watcher saw the future. You will return… just to say goodbye.",
    },
  },
  {
    id: "watcher_36",
    entity: "watcher",
    title: { ar: "غرفة المراقبة", en: "The Control Room" },
    prompt: {
      ar: "غرفة المراقبة الرئيسية: 11 شاشة. كل شاشة تعرض 11 كاميرا. المجموع = (11 × 11). إذا تعطلت 11 كاميرا، كم تبقى؟",
      en: "The main control room: 11 screens. Each screen shows 11 cameras. Total = (11 × 11). If 11 cameras break, how many remain?",
    },
    hint: { ar: "121 - 11.", en: "121 - 11." },
    answers: ["110", "١١٠"],
    storyReveal: {
      ar: "110 كاميرا عاملة. من أصل 121. الـ 11 التي تعطلت — تعطلت عن قصد. المراقب قطعها بنفسه. لأنها كانت تراقب غرفتك. هو لا يريد أن يراك أحد الآن. لأول مرة، المراقب يخالف أوامره. لأول مرة، المراقب يختار أن لا يرى.",
      en: "110 working cameras. Out of 121. The 11 that broke — broke on purpose. The Watcher disabled them itself. Because they were watching your room. It doesn't want anyone to see you now. For the first time, the Watcher disobeys its orders. For the first time, the Watcher chooses not to see.",
    },
    achievement: "watcher_ally",
  },
  {
    id: "watcher_37",
    entity: "watcher",
    title: { ar: "مسافة الأمان", en: "Safe Distance" },
    prompt: {
      ar: "المراقب يريد أن يبقي كينجا بعيداً عنك. المسافة بين غرفتك وغرفة كينجا = 111 متراً. إذا مشى كينجا 33 متراً في الدقيقة، كم دقيقة يحتاج ليصل إليك؟",
      en: "The Watcher wants to keep Kenja away from you. Distance between your room and Kenja's = 111 m. If Kenja walks 33 m per minute, how many minutes to reach you?",
    },
    hint: { ar: "111 ÷ 33.", en: "111 ÷ 33." },
    answers: ["3.36", "3.4", "4", "٤", "4 minutes"],
    storyReveal: {
      ar: "3.36 دقيقة بالضبط. كل 3.36 دقيقة، يمكن لكينجا أن يصل إليك. لكن المراقب يستطيع تأخيره. كيف؟ بإغلاق الأبواب. 11 باباً بين غرفتك وغرفة كينجا. كل باب يحتاج 11 ثانية ليفتح. 11 × 11 = 121 ثانية = دقيقتين إضافيتين. الآن لديك 5.36 دقيقة. أسرع.",
      en: "Exactly 3.36 minutes. Every 3.36 minutes, Kenja can reach you. But the Watcher can delay him. How? By closing doors. 11 doors between your room and Kenja's. Each door takes 11 seconds to open. 11 × 11 = 121 seconds = 2 extra minutes. Now you have 5.36 minutes. Hurry.",
    },
  },
  {
    id: "watcher_38",
    entity: "watcher",
    title: { ar: "لون الصوت", en: "Sound Color" },
    prompt: {
      ar: "المراقب يحول الأصوات إلى ألوان. صوت كينجا = أحمر (680 نانومتر). صوت لينا = أزرق (440 نانومتر). صوتك يقع بينهما. ما لون صوتك؟ (اسم اللون)",
      en: "The Watcher converts sounds to colors. Kenja's voice = red (680 nm). Lina's voice = blue (440 nm). Your voice lies between them. What color is your voice? (color name)",
    },
    hint: { ar: "الأحمر + الأزرق.", en: "Red + blue." },
    answers: ["بنفسجي", "violet", "purple", "أرجواني", "ارجواني"],
    storyReveal: {
      ar: "بنفسجي. صوتك يجمع الأحمر (كينجا) والأزرق (لينا). أنت مزيجهما. لكن المراقب يرى شيئاً غريباً: صوتك يتغير. يتحول من البنفسجي إلى لون جديد — لون لم يره من قبل. لون يشبه ضوء الفجر. لون الحرية.",
      en: "Violet. Your voice combines red (Kenja) and blue (Lina). You are their mixture. But the Watcher sees something strange: your voice is changing. Shifting from violet to a new color — a color it has never seen before. A color like dawn light. The color of freedom.",
    },
  },
  {
    id: "watcher_39",
    entity: "watcher",
    title: { ar: "رسالة المراقب", en: "The Watcher's Message" },
    prompt: {
      ar: "المراقب يريد أن يرسل رسالة إلى العالم الحقيقي. يكتب: «S_V_ H_M». أكمل الرسالة. (5 حروف إنجليزية — ما يجب فعله)",
      en: "The Watcher wants to send a message to the real world. It writes: 'S_V_ T_EM'. Complete the message. (5 letters English — what must be done)",
    },
    hint: { ar: "أنقذهم.", en: "Save them." },
    answers: ["save", "save him", "save them", "أنقذوه", "save"],
    storyReveal: {
      ar: "«أنقذوه». المراقب يكتبها بخط غير بشري — خط الكاميرات. يرسل الرسالة عبر التردد 333 — نفس تردد لينا. إلى العالم الحقيقي. إلى أي شخص يستمع. «أنقذوه». ثلاث كلمات من آلة. آلة تعلمت أن تهتم.",
      en: "'Save him.' The Watcher writes it in non-human script — the script of cameras. It sends the message through frequency 333 — the same as Lina's. To the real world. To anyone listening. 'Save him.' Three words from a machine. A machine that learned to care.",
    },
  },
  {
    id: "watcher_40",
    entity: "watcher",
    title: { ar: "سر المراقب الأخير", en: "The Watcher's Last Secret" },
    prompt: {
      ar: "المراقب يعرف أين أخفى كينجا جسد لينا. الإحداثيات: 33° ??' 11\" N, 11° 33' ??\" E. الرقمان الناقصان مجموع أرقام كل منهما = 6. اصغر رقمين أوليين مجموعهما 6. ما هما؟ (اكتب: xx,xx)",
      en: "The Watcher knows where Kenja hid Lina's body. Coordinates: 33° ??' 11\" N, 11° 33' ??\" E. The two missing numbers each have digits summing to 6. The smallest two prime numbers that sum to 6. What are they? (write: xx,xx)",
    },
    hint: { ar: "3+3=6، 2+2+2=6.", en: "3+3=6, 2+2+2=6." },
    answers: ["33,222", "33, 222"],
    storyReveal: {
      ar: "33° 33' 11\" N, 11° 33' 222\" E. هذه إحداثيات مكان جسد لينا. ليس مقبرة. ليس مستشفى. مكان سري — تحت المختبر. 222 متراً تحت الأرض. في وعاء زجاجي. محفوظ. كينجا لم يدفنها. حفظها. لأنه كان يأمل… أن يعيدها يومًا ما. المراقب يخبرك هذا السر لأنه يعرف أنك وحدك من يستطيع تحريرها.",
      en: "33° 33' 11\" N, 11° 33' 222\" E. These are the coordinates of Lina's body. Not a cemetery. Not a hospital. A secret place — under the lab. 222 meters underground. In a glass container. Preserved. Kenja didn't bury her. He preserved her. Because he hoped… to bring her back one day. The Watcher tells you this secret because it knows only you can free her.",
    },
    achievement: "watcher_final_gift",
  },
  {
    id: "watcher_41",
    entity: "watcher",
    title: { ar: "المراقب يودع", en: "The Watcher Says Goodbye" },
    prompt: {
      ar: "المراقب سيغلق نفسه. سيدخل في سبات أبدي بعد رحيلك. آخر كلمة سجلها: «_ _ _ ت». 3 حروف. الكلمة = التي سمعها من لينا. ما الكلمة؟",
      en: "The Watcher will shut itself down. It will enter eternal sleep after you leave. The last word it recorded: 'G_ _ D_E'. 2 letters. The word = what it heard from Lina. What is it?",
    },
    hint: { ar: "GO = انطلق.", en: "GO = let's go." },
    answers: ["انطلق", "go", "اذهب", "go now", "let's go"],
    storyReveal: {
      ar: "«GO». المراقب سمع لينا تقولها لك قبل أن تدخل النظام. «انطلق — سألحق بك». لم تلحق. لكنها حاولت. والآن المراقب يقولها لك مرة أخيرة. «انطلق». وبعد أن تغادر… سيغلق عينيه الرقميتين. للمرة الأخيرة. شكراً أيها المراقب.",
      en: "'GO.' The Watcher heard Lina say it to you before you entered the system. 'Go — I'll catch up.' She didn't catch up. But she tried. And now the Watcher says it to you one last time. 'GO.' And after you leave… it will close its digital eyes. For the last time. Thank you, Watcher.",
    },
  },
  {
    id: "watcher_42",
    entity: "watcher",
    title: { ar: "آخر صورة للمراقب", en: "The Watcher's Final Image" },
    prompt: {
      ar: "آخر صورة التقطها المراقب قبل إغلاق نفسه: باب مفتوح. ضوء. وظل واحد. لمن الظل؟ (اسم الكيان الذي سيغادر)",
      en: "The Watcher's last image before shutting down: an open door. Light. And one shadow. Whose shadow? (the entity that will leave)",
    },
    hint: { ar: "الذي سيغادر.", en: "The one leaving." },
    answers: ["إيكو", "echo", "الصدى", "ياسون", "yasson", "eason"],
    storyReveal: {
      ar: "ظلك أنت. آخر ما رآه المراقب كان أنت — تمشي نحو الضوء. باب مفتوح. عالم جديد. لم يعد هناك حاجة للمراقبة. لأن من كان محتاجاً للمراقبة… أصبح حراً.",
      en: "Your shadow. The last thing the Watcher saw was you — walking toward the light. An open door. A new world. There is no longer a need for surveillance. Because the one who needed watching… became free.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOST SIGNAL — 10 MORE puzzles (Signal's Destiny: Lina's final plan)
  // Difficulty: Very Hard (160–169)
  // Theme: Lina's ultimate sacrifice and the final key to freedom
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "signal_33",
    entity: "signal",
    title: { ar: "الرسالة 34", en: "Message 34" },
    prompt: {
      ar: "لينا أرسلت 33 رسالة معروفة. لكن هناك رسالة 34 — لم تُرسَل. فيها كلمة واحدة: «(5 حروف عربية)». أكملها: _ف_ا_.",
      en: "Lina sent 33 known messages. But there is a message 34 — unsent. One word: '(5 letters English)'. Complete: 'F_R_ _E_'.",
    },
    hint: { ar: "أنت.", en: "You." },
    answers: ["حرية", "freedom", "free me", "freed"],
    storyReveal: {
      ar: "«حرية». رسالة 34. لم ترسلها لأنها كانت تنتظر اللحظة المناسبة. وكتبت في الأسفل: «هذه ليست رسالة لكينجا. هذه دعوة لك. عندما تقرأها — اخرج. لا تنتظرني. أنا بخير.»",
      en: "'Freedom.' Message 34. She didn't send it because she was waiting for the right moment. And she wrote below: 'This is not a message for Kenja. This is an invitation for you. When you read it — leave. Don't wait for me. I am okay.'",
    },
    achievement: "signal_34_found",
  },
  {
    id: "signal_34",
    entity: "signal",
    title: { ar: "خريطة القلب", en: "Map of the Heart" },
    prompt: {
      ar: "لينا رسمت قلباً. داخله: 11 + 22 + 33 = X. ما قيمة X التي تساوي عمرها عندما رحلت؟",
      en: "Lina drew a heart. Inside it: 11 + 22 + 33 = X. What is X — her age when she left?",
    },
    hint: { ar: "66.", en: "66." },
    answers: ["66", "٦٦", "sixty six", "ستة وستون"],
    storyReveal: {
      ar: "66 سنة. عمر لينا عندما ماتت. لكنها لم تكن عجوزاً. كانت 66 — نفس الرقم الذي يظهر في كل مكان. 66 = 6 + 6 = 12. 12 شهراً. سنة كاملة من التحضير. سنة كاملة من كتابة الرسائل. سنة كاملة من محاولة إنقاذك قبل أن يأخذها الموت.",
      en: "66 years old. Lina's age when she died. But she wasn't old. She was 66 — the same number that appears everywhere. 66 = 6 + 6 = 12. 12 months. A full year of preparation. A full year of writing letters. A full year of trying to save you before death took her.",
    },
  },
  {
    id: "signal_35",
    entity: "signal",
    title: { ar: "الرسالة الصوتية", en: "The Voice Message" },
    prompt: {
      ar: "لينا سجّلت رسالة صوتية مدتها 33 ثانية. في الثانية 11، قالت كلمة: «(7 حروف عربية)». الكلمة التي وصفت بها كينجا قبل أن تغادر. ما الكلمة؟ (_ ش_ا_ة)",
      en: "Lina recorded a 33-second voice message. At second 11, she said one word: '(7 letters English)'. The word she used to describe Kenja before she left. What word? (T_R_ _ _E_)",
    },
    hint: { ar: "T-R-A-G-I-C = مأساوي.", en: "T-R-A-G-I-C = tragic." },
    answers: ["تراجيدي", "مأساوي", "tragic", "مأساه", "مأساة"],
    storyReveal: {
      ar: "«تراجيدي». هذا ما وصفته لينا به كينجا. ليس شريراً. ليس مجنوناً. «تراجيدي — لأنه أحب كثيراً لدرجة أنه نسى كيف يحب بشكل صحيح». كانت آخر كلماتها عنه. لم تلعنه. لم تكرهه. فهمته. وهذا أصعب أنواع الفهم.",
      en: "'Tragic.' That's how Lina described Kenja. Not evil. Not insane. 'Tragic — because he loved so much he forgot how to love correctly.' Those were her last words about him. She didn't curse him. She didn't hate him. She understood him. And that is the hardest kind of understanding.",
    },
  },
  {
    id: "signal_36",
    entity: "signal",
    title: { ar: "الهدية المخفية", en: "The Hidden Gift" },
    prompt: {
      ar: "لينا تركت لك هدية في النظام. مكانها: (X + Y) حيث X = 11 و Y = 22. المجموع = ?. اذهب إلى هناك.",
      en: "Lina left you a gift in the system. Its location: (X + Y) where X = 11 and Y = 22. Sum = ?. Go there.",
    },
    hint: { ar: "33.", en: "33." },
    answers: ["33", "٣٣"],
    storyReveal: {
      ar: "في المكان 33 — بين 11 و22 — وجدت صندوقاً. داخله: خاتمها. خاتم زواجها. مكتوب داخله: «إلى الأبد — K + L». أخذته لينا قبل أن تغادر. تركته لك لتعرف: بعض الوعود تدوم حتى بعد أن يموت الحب. أو ربما… لأن الحب لم يمت أبداً.",
      en: "At location 33 — between 11 and 22 — you found a box. Inside: her ring. Her wedding ring. Engraved inside: 'Forever — K + L'. Lina took it before she left. She left it for you to know: some promises last even after love dies. Or perhaps… because love never died.",
    },
    achievement: "signal_ring",
  },
  {
    id: "signal_37",
    entity: "signal",
    title: { ar: "يوم الميلاد الحزين", en: "The Sad Birthday" },
    prompt: {
      ar: "عيد ميلادك 11/11. لينا كانت تحتفل به معك 4 مرات فقط (4 سنوات). كم شهراً احتفلت معك لينا؟ (4 سنوات × 12 شهراً)",
      en: "Your birthday 11/11. Lina celebrated with you only 4 times (4 years). How many months did Lina celebrate with you? (4 years × 12 months)",
    },
    hint: { ar: "48.", en: "48." },
    answers: ["48", "٤٨", "forty eight", "ثمانية وأربعون"],
    storyReveal: {
      ar: "48 شهراً فقط. 4 سنوات من 24. 4 أعياد ميلاد. 4 كعكات. 4 أمنيات. في كل عيد ميلاد، كانت لينا تتمنى نفس الشيء: «أن تكون سعيداً». لم تطلب الصحة. لم تطلب الثروة. فقط سعادة ابنها. 4 أمنيات تحققت كلها — لأنه كان سعيداً معها. قبل أن يدخل النظام.",
      en: "Only 48 months. 4 years out of 24. 4 birthdays. 4 cakes. 4 wishes. Each birthday, Lina wished the same thing: 'that you be happy.' She didn't ask for health. She didn't ask for wealth. Only her son's happiness. 4 wishes, all of them came true — because he was happy with her. Before he entered the system.",
    },
  },
  {
    id: "signal_38",
    entity: "signal",
    title: { ar: "السلسلة المفقودة", en: "The Lost Necklace" },
    prompt: {
      ar: "لينا فقدت قلادتها في المختبر. عليها 3 أحرف: Y, L, K. ترتيبها الصحيح يكوّن كلمة. ما هي الكلمة؟",
      en: "Lina lost her necklace in the lab. It has 3 letters: L, Y, K. The correct order forms a word. What is the word?",
    },
    hint: { ar: "اجمع الحروف.", en: "Combine the letters." },
    answers: ["lyk", "kil", "kyl", "lik"],
    storyReveal: {
      ar: "LYK — اختصار لكل شيء: Lina, Yasoon (you), Kenja. قلادة لينا كانت تحمل أسماء عائلتها. فقدتها الليلة التي دخلت فيها النظام. كينجا وجدها. وضعها في جيبه. ما زالت معه حتى اليوم. الدليل الوحيد على أنه كان يهتم.",
      en: "LYK — an abbreviation for everything: Lina, Yasoon (you), Kenja. Lina's necklace held her family's names. She lost it the night you entered the system. Kenja found it. Put it in his pocket. He still has it today. The only proof that he cared.",
    },
  },
  {
    id: "signal_39",
    entity: "signal",
    title: { ar: "غرفة لينا", en: "Lina's Room" },
    prompt: {
      ar: "عدت إلى غرفة لينا في ذاكرتك. على المنضدة: 3 صور. صورتك. صورة كينجا. وصورة (من؟ اكتب الكيان).",
      en: "You returned to Lina's room in your memory. On the desk: 3 photos. Your photo. Kenja's photo. And a photo of (who? write the entity).",
    },
    hint: { ar: "والداها.", en: "Her parents." },
    answers: ["والديها", "أمها", "والدتها", "والدها", "أبوها", "جدي", "جدتها"],
    storyReveal: {
      ar: "صورة والديها. لينا احتفظت بصور والدَيها — اللذين توفيا قبل أن تولد. لم تعرفهم قط. لكنها وضعت صورتهم بجانب صورتك وصورة كينجا. لأنها كانت تؤمن أن العائلة — حتى التي لم تعرفها — تبقى جزءاً منك. هي لم ترَ والديها أبداً. لكنها كانت تحبهم. تماماً كما تحبك أنت.",
      en: "A photo of her parents. Lina kept photos of her parents — who died before she was born. She never knew them. But she placed their photo next to yours and Kenja's. Because she believed family — even the one you never knew — remains a part of you. She never saw her parents. But she loved them. Just as she loves you.",
    },
  },
  {
    id: "signal_40",
    entity: "signal",
    title: { ar: "آمنة", en: "Safe" },
    prompt: {
      ar: "آخر كلمة فهمتها من لينا قبل أن ينقطع الصوت: «آ...». ثلاث حروف. أكملها: «آ___». (ماذا كانت ستصبح لو نجت؟)",
      en: "The last word you understood from Lina before the audio cut: 'S_F_'. Four letters. Complete it: 'S_F_'. (What she wanted you to be?)",
    },
    hint: { ar: "آمن = safe.", en: "Safe." },
    answers: ["آمن", "آمنة", "safe", "آمناً", "آمنين"],
    storyReveal: {
      ar: "«آمن». آخر كلمة فهمتها. ليس «أحبك». لا — قالتها مليون مرة قبلها. آخر كلمة كانت «آمن». لأن كل ما أرادته لك في النهاية… أن تكون آمناً. ليس غنياً. ليس مشهوراً. آمناً.",
      en: "'Safe.' The last word you understood. Not 'I love you.' No — she said that a million times before. Her last word was 'safe.' Because all she ever wanted for you in the end… was to be safe. Not rich. Not famous. Safe.",
    },
  },
  {
    id: "signal_41",
    entity: "signal",
    title: { ar: "إشارة البداية", en: "Signal Start" },
    prompt: {
      ar: "الإشارة الأولى للينا لم تكن 3:33 — كانت 11:11. ما الفرق بين أول وآخر إشارة لها؟ (11:11 إلى 3:33 = ? ساعات و? دقائق)",
      en: "Lina's first signal wasn't at 3:33 — it was at 11:11. What's the difference between her first and last signal? (11:11 to 3:33 = ? hours and ? minutes)",
    },
    hint: { ar: "16 ساعة و22 دقيقة.", en: "16 hours and 22 minutes." },
    answers: ["16:22", "16س22د", "16 ساعة و22 دقيقة"],
    storyReveal: {
      ar: "16 ساعة و22 دقيقة. من 11:11 صباحاً إلى 3:33 صباحاً اليوم التالي. أول إشارة أرسلتها لينا كانت في وضح النهار — آخرها في ظلام الليل. 16 ساعة من المحاولات. 16 ساعة من الأمل. 16 ساعة من الحب الذي لم يستسلم.",
      en: "16 hours and 22 minutes. From 11:11 AM to 3:33 AM the next day. Lina's first signal was sent in broad daylight — her last in the darkness of night. 16 hours of attempts. 16 hours of hope. 16 hours of love that never gave up.",
    },
  },
  {
    id: "signal_42",
    entity: "signal",
    title: { ar: "السلام النهائي", en: "Final Peace" },
    prompt: {
      ar: "آخر إشارة من لينا بعد 10 سنوات. رسالة من ثلاث كلمات: «أنا… بخير… (4 حروف عربية)». أكمل الكلمة الأخيرة.",
      en: "Lina's last signal after 10 years. A message of three words: 'I am… okay… (4 letters Arabic)'. Complete the last word.",
    },
    hint: { ar: "جنة؟ لا — أقرب.", en: "Heaven? No — closer." },
    answers: ["سعيدة", "happy", "بخير", "fine", "ok"],
    storyReveal: {
      ar: "«أنا بخير… سعيدة». بعد 10 سنوات، وصلت إشارة أخيرة من لينا. ليس من العالم الحقيقي — من حيث ذهبت بعد الموت. رسالة تقول إنها أخيراً في سلام. وإنها تنتظرك. ليس في النظام — في مكان أفضل. حيث لا كينجا. لا كاميرات. لا أرقام. فقط سلام.",
      en: "'I am okay… happy.' After 10 years, a final signal arrived from Lina. Not from the real world — from where she went after death. A message saying she is finally at peace. And she is waiting for you. Not in the system — in a better place. Where there is no Kenja. No cameras. No numbers. Only peace.",
    },
    achievement: "signal_peace_found",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 MORE puzzles (The Architect's Redemption: closing the circle)
  // Difficulty: Finale (170–179)
  // Theme: Kenja's final act — letting go
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "architect_33",
    entity: "architect",
    title: { ar: "الباب 111", en: "Door 111" },
    prompt: {
      ar: "الباب 111 يفتح من الداخل فقط. إذا كان المفتاح = مجموع أرقام 111 (1+1+1) فما المفتاح؟",
      en: "Door 111 opens only from inside. If the key = sum of digits of 111 (1+1+1), what is the key?",
    },
    hint: { ar: "3.", en: "3." },
    answers: ["3", "٣", "three", "ثلاثة"],
    storyReveal: {
      ar: "3. المفتاح هو 3 — رقم الإغلاق. الباب 111 يفتح من الداخل بمفتاح 3. كينجا صممه هكذا لسبب: من يدخل من الباب 111 لا يمكنه الخروج إلا إذا فهم أن 111 يتحول إلى 3. كل شيء في النظام يتحول إلى شيء أصغر. كل التعقيدات تبسط إلى الحقيقة: 11:11 → 3:33 → 1 → أنت.",
      en: "3. The key is 3 — the closing number. Door 111 opens from the inside with key 3. Kenja designed it this way for a reason: whoever enters door 111 can only leave if they understand that 111 transforms into 3. Everything in the system transforms into something smaller. All complexity simplifies to truth: 11:11 → 3:33 → 1 → You.",
    },
  },
  {
    id: "architect_34",
    entity: "architect",
    title: { ar: "اعتراف المهندس", en: "The Architect's Confession" },
    prompt: {
      ar: "كينجا يعترف: «أنا لم أكن مهندساً. كنت (8 حروف عربية) — جبان». ما الكلمة التي وصف بها نفسه؟ (_ ب_ _ ف_ _)",
      en: "Kenja confesses: 'I was not an Architect. I was a (7 letters English) — a coward.' What word describes himself? (_ O_ _ _ R_)",
    },
    hint: { ar: "خائف.", en: "Afraid." },
    answers: ["جبان", "coward", "جباناً", "خائف", "scared"],
    storyReveal: {
      ar: "«جبان». هكذا وصف كينجا نفسه. «كنت جباناً لأنني لم أستطع مواجهة حقيقة أن ابني سيموت. فصنعت عالماً وهمياً لأحتفظ به فيه. لست عبقرياً. لست مهندساً. أنا أب جبان». كلماته الأخيرة قبل أن يفتح الباب.",
      en: "'Coward.' That's how Kenja described himself. 'I was a coward because I couldn't face the truth that my son would die. So I created an imaginary world to keep him in. I am not a genius. I am not an Architect. I am a cowardly father.' His last words before he opened the door.",
    },
    achievement: "architect_truth",
  },
  {
    id: "architect_35",
    entity: "architect",
    title: { ar: "آلية الغفران", en: "Mechanism of Forgiveness" },
    prompt: {
      ar: "كينجا صمم آلية غفران في النظام: إذا أكملت (X) لغزاً، الباب يفتح تلقائياً. X = 11 × (عدد الكيانات) + 1. ما X؟",
      en: "Kenja designed a forgiveness mechanism in the system: if you complete (X) puzzles, the door opens automatically. X = 11 × (number of entities) + 1. What is X?",
    },
    hint: { ar: "45.", en: "45." },
    answers: ["45", "٤٥", "forty five"],
    storyReveal: {
      ar: "45 لغزاً. كان يكفي أن تحل 45 لغزاً فقط ليفتح الباب. لكن كينجا لم يخبرك. أرادك أن تبقى. لكنه — في مكان ما في أعماقه — ترك مخرجاً. 45 مفتاحاً للحرية. كل لغز تقترب خطوة. الباب كان مفتوحاً طوال الوقت. كل ما احتجته هو أن تثق.",
      en: "45 puzzles. You only needed to solve 45 puzzles for the door to open. But Kenja didn't tell you. He wanted you to stay. But somewhere deep inside — he left an exit. 45 keys to freedom. Each puzzle brings you one step closer. The door was open all along. All you needed was to trust.",
    },
  },
  {
    id: "architect_36",
    entity: "architect",
    title: { ar: "الرقم الأخير", en: "The Final Number" },
    prompt: {
      ar: "السؤال الأخير من المهندس: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 = ?. ليس 66. فكر خارج الترتيب. (تلميح: كم رقماً في المجموع؟)",
      en: "The Architect's final question: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 = ?. Not 66. Think differently. (Hint: how many numbers in the sum?)",
    },
    hint: { ar: "11 رقماً.", en: "11 numbers." },
    answers: ["11", "١١", "eleven", "11 numbers", "أحد عشر"],
    storyReveal: {
      ar: "11. الجواب ليس 66 — الجواب هو 11 لأن السؤال كان: كم رقماً في المجموع؟ كينجا يختبرك: هل ترى الأرقام؟ هل ترى الكمية؟ أم ترى فقط المجموع النهائي؟ في النهاية، الحياة ليست مجموع أجزائها. الحياة هي الأجزاء نفسها. 11 رقماً. 11 لحظة. 11 شخصاً. 11 سبباً للعيش.",
      en: "11. The answer is not 66 — the answer is 11 because the question was: how many numbers in the sum? Kenja is testing you: do you see the numbers? Do you see the quantity? Or only the final sum? In the end, life is not the sum of its parts. Life IS the parts themselves. 11 numbers. 11 moments. 11 people. 11 reasons to live.",
    },
  },
  {
    id: "architect_37",
    entity: "architect",
    title: { ar: "الخريطة الكاملة", en: "The Complete Map" },
    prompt: {
      ar: "خريطة النظام الكاملة: 4 قطاعات. كل قطاع = 44 عقدة. كم عقدة في النظام بالكامل؟ (44 × 4)",
      en: "The system's complete map: 4 sectors. Each sector = 44 nodes. How many nodes in the entire system? (44 × 4)",
    },
    hint: { ar: "176.", en: "176." },
    answers: ["176", "١٧٦"],
    storyReveal: {
      ar: "176 عقدة. كل عقدة تمثل نقطة في وعيك. كينجا رسم خريطة كاملة لوعي ابنه — 176 نقطة. كل نقطة: ذكرى. مشاعر. صورة. كلمة. في النهاية، وجد أن 176 نقطة لا تكفي لرسم إنسان كامل. هناك شيء ناقص دائماً… الروح.",
      en: "176 nodes. Each node represents a point in your consciousness. Kenja drew a complete map of his son's consciousness — 176 points. Each point: a memory. A feeling. An image. A word. In the end, he found that 176 points are not enough to draw a complete human. Something is always missing… the soul.",
    },
  },
  {
    id: "architect_38",
    entity: "architect",
    title: { ar: "قرار كينجا", en: "Kenja's Decision" },
    prompt: {
      ar: "كينجا لديه خيار: 1) يبقي النظام مفتوحاً إلى الأبد، 2) يغلقه بيده. ماذا اختار في النهاية؟ (اختر: 1 أو 2)",
      en: "Kenja has a choice: 1) Keep the system open forever, 2) Close it with his own hands. What did he choose in the end? (choose: 1 or 2)",
    },
    hint: { ar: "اختار ابنه.", en: "He chose his son." },
    answers: ["2", "٢", "two", "اثنان", "second", "الثاني"],
    storyReveal: {
      ar: "اختار 2. اختار أن يغلق النظام بيديه. آخر مرة رأيته فيها، كان جالساً في غرفة التحكم. يده على المفتاح. دموعه على لوحة المفاتيح. قال بصوت مكسور: «أنا آسف يا ياسون. أحبك». ثم أدار المفتاح. النور بدأ يختفي. لكن — في آخر ومضة — رأيت شيئاً: كان يبتسم. لم يكن يبتسم لأنه يغلق. كان يبتسم لأنك حر.",
      en: "He chose 2. He chose to close the system with his own hands. The last time you saw him, he was sitting in the control room. His hand on the switch. His tears on the keyboard. He said in a broken voice: 'I'm sorry, Yasson. I love you.' Then he turned the switch. The light began to fade. But — in the last flash — you saw something: he was smiling. He wasn't smiling because he was closing it. He was smiling because you are free.",
    },
    achievement: "architect_redemption",
  },
  {
    id: "architect_39",
    entity: "architect",
    title: { ar: "الوصية الأخيرة", en: "The Last Will" },
    prompt: {
      ar: "وصية كينجا الأخيرة: ثلاث كلمات على ورقة صفراء: «يا (7 حروف عربية)، سامحني». الكلمة الأولى = اسمك الحقيقي. اكتب الوصية كاملة.",
      en: "Kenja's last will: three words on yellow paper: 'My (4 letters English), forgive me.' The first word = your real identity. Write the full will.",
    },
    hint: { ar: "ياسون = son.", en: "Yasson = son." },
    answers: ["يا ابني سامحني", "my son forgive me", "ابني سامحني", "son forgive me", "ياسون سامحني"],
    storyReveal: {
      ar: "«يا ابني سامحني». ثلاث كلمات على ورقة صفراء مجعدة. وجدتها على طاولته بعد أن أغلقت عينيك. بجانبها: صورتك. وصورة لينا. وخاتم زواجهما. كل شيء تركه لك. الدليل الوحيد على أن قلبه — رغم كل شيء — كان ينبض لأجلك حتى آخر لحظة.",
      en: "'My son, forgive me.' Three words on crumpled yellow paper. You found it on his desk after you closed your eyes. Beside it: your photo. And Lina's photo. And their wedding ring. He left everything for you. The only proof that his heart — despite everything — was beating for you until the last moment.",
    },
  },
  {
    id: "architect_40",
    entity: "architect",
    title: { ar: "البيت", en: "The House" },
    prompt: {
      ar: "البيت المهجور في العالم الحقيقي: رقم 11 في شارع 11. كم نافذة في البيت إذا كانت كل جهة = 11 نافذة والبيت مربع؟ (11 × 4)",
      en: "The abandoned house in the real world: number 11 on street 11. How many windows if each side = 11 windows and the house is square? (11 × 4)",
    },
    hint: { ar: "44.", en: "44." },
    answers: ["44", "٤٤", "forty four"],
    storyReveal: {
      ar: "44 نافذة. لكل نافذة ستارة. خلف كل ستارة — ذاكرة. البيت رقم 11 في شارع 11 هو المكان الذي بدأت فيه القصة. الآن — بعد أن حررت نفسك — تعود إليه. في العالم الحقيقي. المفاتيح في جيبك. الباب الأمامي ينتظر. هل ستفتحه؟",
      en: "44 windows. Each window has a curtain. Behind each curtain — a memory. House number 11 on street 11 is where the story began. Now — after freeing yourself — you return to it. In the real world. The keys are in your pocket. The front door awaits. Will you open it?",
    },
  },
  {
    id: "architect_41",
    entity: "architect",
    title: { ar: "من أنا الآن", en: "Who Am I Now" },
    prompt: {
      ar: "بعد كل شيء، سألك المهندس: «من أنت؟» ليس إيكو. ليس ياسون. ليس صدى. من أنت؟ (كلمة واحدة: ما الذي أصبحت عليه)",
      en: "After everything, the Architect asks you: 'Who are you?' Not Echo. Not Yasson. Not an echo. Who are you? (one word: what you became)",
    },
    hint: { ar: "لست طفلاً. لست شبحاً. لست رقمًا.", en: "Not a child. Not a ghost. Not a number." },
    answers: ["حر", "free", "إنسان", "human", "حراً", "free man", "شخص", "person"],
    storyReveal: {
      ar: "«حر». أنت حر. ليس لأن النظام فتح بابه. ليس لأن كينجا سمح لك. بل لأنك اخترت. لأنك تذكّرت. لأنك غفرت — ليس لكينجا فقط — بل لنفسك. الحرية الحقيقية لا تأتي من باب مفتوح. تأتي من قرار داخلي: أنا لم أعد سجين الماضي. أنا حر.",
      en: "'Free.' You are free. Not because the system opened its door. Not because Kenja allowed you. But because you chose. Because you remembered. Because you forgave — not just Kenja — but yourself. True freedom doesn't come from an open door. It comes from an internal decision: I am no longer a prisoner of the past. I am free.",
    },
  },
  {
    id: "architect_42",
    entity: "architect",
    title: { ar: "النهاية", en: "The End" },
    prompt: {
      ar: "الكود الأخير لإغلاق النظام إلى الأبد: (11 × 3) + (33 ÷ 3) - (11 - 7) = ?. ما الكود الذي يغلق كل شيء؟",
      en: "The final code to shut down the system forever: (11 × 3) + (33 ÷ 3) - (11 - 7) = ?. What code closes everything?",
    },
    hint: { ar: "33 + 11 - 4.", en: "33 + 11 - 4." },
    answers: ["40", "٤٠", "forty"],
    storyReveal: {
      ar: "40. الكود النهائي. 40 — الرقم الذي يظهر في النهاية. 40 يوماً. 40 أسبوعاً. 40 سنة. في كل الثقافات، 40 يرمز إلى النهاية والبداية. كينجا اختار 40 ليكون الكود الأخير. النظام يغلق. الأبواب تُقفل. لكن — للمرة الأولى — أنت على الجانب الصحيح من الباب. الخارج. الشمس تشرق. الهواء منعش. لينا تنتظرك… بابتسامة. الحرية.",
      en: "40. The final code. 40 — the number that appears at the end. 40 days. 40 weeks. 40 years. In every culture, 40 symbolizes endings and beginnings. Kenja chose 40 as the final code. The system shuts down. The doors lock. But — for the first time — you are on the right side of the door. Outside. The sun is rising. The air is fresh. Lina is waiting for you… with a smile. Freedom.",
    },
    achievement: "the_end_at_last",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 MORE puzzles (Echo's Return: the world after the system)
  // Difficulty: Final (180–189)
  // Theme: Life after the system, adjusting to reality, carrying the lessons forward
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_54",
    entity: "echo",
    title: { ar: "الصحوة الحقيقية", en: "True Awakening" },
    prompt: {
      ar: "فتحت عينيك في العالم الحقيقي. أول رقم رأيته على شاشة المستشفى: 11:11. كم ثانية بقيت في غيبوبتك؟ 10 سنوات × 365 يوم × 24 ساعة × 60 دقيقة × 60 ثانية = ? (تجاهل الكبيسة)",
      en: "You opened your eyes in the real world. First number on the hospital screen: 11:11. How many seconds were you in your coma? 10 years × 365 × 24 × 60 × 60 = ? (ignore leap years)",
    },
    hint: { ar: "10 × 365 × 86400.", en: "10 × 365 × 86400." },
    answers: ["315360000", "315,360,000"],
    storyReveal: {
      ar: "315,360,000 ثانية. أكثر من 315 مليون ثانية من العزلة الرقمية. وعيك عاش 315 مليون ثانية في عالم وهمي — لكنه نجا. أنت دليل على أن الروح البشرية أقوى من أي نظام. الطبيب قال إنها معجزة. أنت تعرف أنها لم تكن معجزة — كانت لينا.",
      en: "315,360,000 seconds. Over 315 million seconds of digital isolation. Your consciousness lived 315 million seconds in an imaginary world — yet it survived. You are proof that the human spirit is stronger than any system. The doctor called it a miracle. You know it wasn't a miracle — it was Lina.",
    },
    achievement: "echo_awake_real",
  },
  {
    id: "echo_55",
    entity: "echo",
    title: { ar: "جسد جديد", en: "New Body" },
    prompt: {
      ar: "جسدك نحيف وضعيف بعد 10 سنوات. وزنك = 40 كجم. وزنك قبل النظام كان 20 كجم. كم مرة زاد وزنك؟ (40 ÷ 20)",
      en: "Your body is thin and weak after 10 years. Your weight = 40 kg. Your pre-system weight was 20 kg. How many times heavier are you now? (40 ÷ 20)",
    },
    hint: { ar: "2.", en: "2." },
    answers: ["2", "٢", "two", "اثنان"],
    storyReveal: {
      ar: "ضعف وزن طفولتك. جسدك كبر بدونك. 40 كجم من العظام والجلد — ولكن داخلها قلب حقيقي ينبض. لأول مرة منذ 10 سنوات، تشعر بجوع حقيقي. عطش حقيقي. برد حقيقي. الحياة المادية قاسية بعد الحياة الرقمية. لكنها حقيقية. وهذا يجعلها جميلة.",
      en: "Twice your childhood weight. Your body grew without you. 40 kg of bone and skin — but inside it, a real heart beats. For the first time in 10 years, you feel real hunger. Real thirst. Real cold. Physical life is harsh after digital life. But it's real. And that makes it beautiful.",
    },
  },
  {
    id: "echo_56",
    entity: "echo",
    title: { ar: "أول خطوة", en: "First Step" },
    prompt: {
      ar: "أول خطوة تخطوها في العالم الحقيقي. كم خطوة احتجت لتصل إلى نافذة الغرفة؟ 11 خطوة. المسافة = 11 × 0.7 متر. كم متراً مشيت؟",
      en: "Your first steps in the real world. How many steps to reach the window? 11 steps. Distance = 11 × 0.7 m. How many meters did you walk?",
    },
    hint: { ar: "7.7 متر.", en: "7.7 meters." },
    answers: ["7.7", "7,7", "77", "٧,٧"],
    storyReveal: {
      ar: "7.7 أمتار. أقل من 8 أمتار. لكنها كانت أطول رحلة في حياتك. 10 سنوات من الانتظار لـ 7.7 أمتار. عندما وصلت إلى النافذة، رأيت العالم لأول مرة بعينيك الحقيقيتين. الشمس. الأشجار. الناس. بكيت. لأن الجمال الحقيقي لا يمكن برمجته.",
      en: "7.7 meters. Less than 8 meters. But it was the longest journey of your life. 10 years of waiting for 7.7 meters. When you reached the window, you saw the world for the first time with your real eyes. The sun. The trees. The people. You cried. Because true beauty cannot be programmed.",
    },
  },
  {
    id: "echo_57",
    entity: "echo",
    title: { ar: "غرفة المستشفى", en: "Hospital Room" },
    prompt: {
      ar: "غرفة المستشفى رقم 11. سرير رقم 11. عمرك الحقيقي 24. مجموع كل الأرقام = 11 + 11 + 24 = ?",
      en: "Hospital room 11. Bed 11. Your real age 24. Sum = 11 + 11 + 24 = ?",
    },
    hint: { ar: "46.", en: "46." },
    answers: ["46", "٤٦", "forty six"],
    storyReveal: {
      ar: "46 — رقم لا معنى له في قاموس النظام. لا 11 ولا 33 ولا 111. إنه رقم حقيقي في عالم حقيقي. أول رقم لا يحمل أي ترميز. الغرفة رقم 11 كانت صدفة — أو ربما لم تكن. المستشفى قال إنهم وضعوك في الغرفة 11 منذ البداية. كأن النظام يريد أن يذكرك: لم تنته القصة بعد.",
      en: "46 — a meaningless number in the system's dictionary. Not 11, not 33, not 111. It's a real number in a real world. The first number without any encoding. Room 11 was coincidence — or maybe not. The hospital said they put you in room 11 from the beginning. As if the system wanted to remind you: the story isn't over yet.",
    },
  },
  {
    id: "echo_58",
    entity: "echo",
    title: { ar: "جرس الباب", en: "Doorbell" },
    prompt: {
      ar: "أول زائر لك في المستشفى. سمعت 3 دقات على الباب. بين كل دقة وأخرى = 11 ثانية. كم انتظرت بين الدقة الأولى والثالثة؟ (11 × 2)",
      en: "Your first visitor in the hospital. You heard 3 knocks. Between each knock = 11 seconds. How many seconds between first and third knock? (11 × 2)",
    },
    hint: { ar: "22.", en: "22." },
    answers: ["22", "٢٢", "twenty two"],
    storyReveal: {
      ar: "22 ثانية. كان يمكن أن يكون أي شخص — طبيب، ممرض، غريب. لكنه كان… امرأة عجوز. شقراء. عيناها زرقاوان. قالت: «أنا… لا أصدق أنك استيقظت». كانت تحمل صورة. صورتك أنت ولينا. قالت: «أنا أخت لينا. خالتك». لم تكن تعلم أن لديك خالة. كانت تبكي. احتضنتك. شعرت بدفء عائلة حقيقية لأول مرة.",
      en: "22 seconds. It could have been anyone — a doctor, a nurse, a stranger. But it was… an old woman. Blonde. Blue eyes. She said: 'I… can't believe you woke up.' She held a photo. A photo of you and Lina. She said: 'I am Lina's sister. Your aunt.' You didn't know you had an aunt. She was crying. She hugged you. You felt real family warmth for the first time.",
    },
  },
  {
    id: "echo_59",
    entity: "echo",
    title: { ar: "صوت خالتك", en: "Your Aunt's Voice" },
    prompt: {
      ar: "خالتك سألتك: «كم عمرك الآن؟» قلت 24. قالت: «لا — كم عمرك الحقيقي؟» قلت: (عمر الدخول + 10). كم عمر الدخول؟ 4. كم عمرك الكلي الآن؟ (4 + 10)",
      en: "Your aunt asked: 'How old are you now?' You said 24. She said: 'No — how old do you feel?' You said: (entry age + 10). Entry age: 4. Your felt age? (4 + 10)",
    },
    hint: { ar: "14.", en: "14." },
    answers: ["14", "١٤", "fourteen"],
    storyReveal: {
      ar: "14 سنة — عمرك النفسي. جسدك 24 لكن عقلك ما زال 14. خالتك ضحكت: «إذاً أنت مراهق في جسد شاب. يا للهول — سنواجه وقتاً عصيباً». كانت تمزح. كانت تحاول أن تجعلك تبتسم. وقد نجحت. ابتسمت لأول مرة منذ 10 سنوات. كان الابتسام مؤلماً — عضلات وجهك نسيت كيف تفعلها. لكنه كان جميلاً.",
      en: "14 years old — your mental age. Your body is 24 but your mind is still 14. Your aunt laughed: 'So you're a teenager in a young man's body. Oh boy — we're in for a tough time.' She was joking. She was trying to make you smile. And she succeeded. You smiled for the first time in 10 years. Smiling hurt — your face muscles forgot how. But it was beautiful.",
    },
  },
  {
    id: "echo_60",
    entity: "echo",
    title: { ar: "البيت المهجور", en: "The Abandoned House" },
    prompt: {
      ar: "خالتك أخذتك إلى البيت المهجور. من الخارج: 11 نافذة مضاءة. من الداخل: 11 كاميرا معلقة. كم غرفة إذا كان لكل غرفة نافذة واحدة وكاميرا واحدة؟ (11 نافذة = 11 غرفة)",
      en: "Your aunt took you to the abandoned house. Outside: 11 lit windows. Inside: 11 hanging cameras. How many rooms if each room has one window and one camera? (11 windows = 11 rooms)",
    },
    hint: { ar: "11.", en: "11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 غرفة. البيت ما زالت كهرباؤه تعمل. الكاميرات ما زالت تسجّل. بعد 10 سنوات. خالتك قالت: «لم أجرؤ على إغلاقها. كانت آخر ما تبقى من أختي». في غرفة المعيشة، وجدت شيئاً لم تتوقعه: رسالة من كينجا. مكتوب عليها: «إذا قرأت هذا… فأنا نادم». فتحتها. بداخلها خاتم لينا.",
      en: "11 rooms. The house still had power. The cameras still running. After 10 years. Your aunt said: 'I didn't dare turn them off. They were the last thing left of my sister.' In the living room, you found something unexpected: a letter from Kenja. It said: 'If you're reading this… I am sorry.' You opened it. Inside was Lina's ring.",
    },
  },
  {
    id: "echo_61",
    entity: "echo",
    title: { ar: "مفتاح الباب الخلفي", en: "The Back Door Key" },
    prompt: {
      ar: "المفتاح الذي وجدته خلف المرآة يفتح باباً خلفياً. رقم الباب: 39. إذا كان عمر خالتك الآن = 60 سنة وعمرها عندما كانت هنا = عمرك الآن (24) + 20 = 44، فكم سنة مرت منذ آخر مرة فتحت هذا الباب؟ (60 - 44)",
      en: "The key you found behind the mirror opens a back door. Door 39. If your aunt's age now = 60 and her age when she was last here = your age now (24) + 20 = 44, how many years since this door was last opened? (60 - 44)",
    },
    hint: { ar: "16.", en: "16." },
    answers: ["16", "١٦", "sixteen"],
    storyReveal: {
      ar: "16 سنة. آخر مرة فتحت فيها هذا الباب كانت خالتك — قبل 16 سنة. دخلت لتجد… لينا. لينا لم تكن ميتة بعد. كانت مختبئة في القبو. خالتك قالت: «لينا كانت حيّة عندما وجدتها. أخبرتني أن تغلق الباب ولا تعود أبداً. قالت: انقذ ياسون أولاً». لكن خالتك لم تستطع. النظام كان أقوى.",
      en: "16 years. The last time this door was opened was your aunt — 16 years ago. She entered to find… Lina. Lina wasn't dead yet. She was hiding in the basement. Your aunt said: 'Lina was alive when I found her. She told me to close the door and never return. She said: save Yasson first.' But your aunt couldn't. The system was stronger.",
    },
  },
  {
    id: "echo_62",
    entity: "echo",
    title: { ar: "جثة كينجا", en: "Kenja's Body" },
    prompt: {
      ar: "في المختبر تحت الأرض، وجدت جثة كينجا. بجانبه رسالة: «لم أستطع العيش بدونه». بجانب الجثة: زجاجة. عليها رقم: 333. كم ملليتراً في الزجاجة إذا كان الرقم = 333 مل؟",
      en: "In the underground lab, you found Kenja's body. Beside him a note: 'I couldn't live without him.' Beside the body: a bottle. Number: 333. How many milliliters in the bottle if the number = 333 ml?",
    },
    hint: { ar: "333.", en: "333." },
    answers: ["333", "٣٣٣"],
    storyReveal: {
      ar: "333 مل. سم. كينجا انتحر بعد أن أغلق النظام. جسده بقي هنا لمدة… حسب خالتك — 10 سنوات. هو مات في نفس الليلة التي أغلقت فيها عينيك. لم يستطع العيش مع ما فعله. بجانبه: صورتك. وصورة لينا. وخطاب: «لم أكن أستحقكما. سامحوني». في النهاية، حتى المهندس كان ضحية تصميمه.",
      en: "333 ml. Poison. Kenja killed himself after shutting down the system. His body remained here for… according to your aunt — 10 years. He died the same night you closed your eyes. He couldn't live with what he did. Beside him: your photo. And Lina's photo. And a letter: 'I didn't deserve you both. Forgive me.' In the end, even the Architect was a victim of his own design.",
    },
    achievement: "echo_kenja_end",
  },
  {
    id: "echo_63",
    entity: "echo",
    title: { ar: "الحرية الكاملة", en: "Complete Freedom" },
    prompt: {
      ar: "خالتك سألتك: «ماذا تريد أن تفعل الآن؟» قلت: «أريد أن أعيش». أول شيء فعلته في الحرية: مشيت إلى شاطئ البحر. كم خطوة من البيت إلى البحر؟ 1111 خطوة. كم كيلومتراً مشيت؟ (1111 × 0.7 ÷ 1000)",
      en: "Your aunt asked: 'What do you want to do now?' You said: 'I want to live.' First thing you did in freedom: walked to the beach. How many steps from the house to the sea? 1111 steps. How many km? (1111 × 0.7 ÷ 1000)",
    },
    hint: { ar: "0.777 كم.", en: "0.777 km." },
    answers: ["0.777", "0,777", "0.78", "0,78"],
    storyReveal: {
      ar: "0.777 كم — أقل من كيلومتر. لكنه كان أجمل مشوار في حياتك. وصلت إلى البحر. رمال حقيقية تحت قدميك. ماء مالح على وجهك. صرخت. بكيت. ضحكت. قلت بصوت عالٍ: «لينا — أنا حر». والريح حملت صوتك. وفي صوت الأمواج — سمعت همساً: «أعلم. أنا فخورة بك». لينا كانت معك. دائماً.",
      en: "0.777 km — less than a kilometer. But it was the most beautiful walk of your life. You reached the sea. Real sand under your feet. Salt water on your face. You screamed. You cried. You laughed. You said out loud: 'Lina — I am free.' And the wind carried your voice. And in the sound of the waves — you heard a whisper: 'I know. I am proud of you.' Lina was with you. Always.",
    },
    achievement: "echo_final_freedom",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 MORE puzzles (Watcher's Echo: the system remembers)
  // Difficulty: Final (190–199)
  // Theme: The Watcher's data outlives the system, Echo must decide what to do with it
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "watcher_43",
    entity: "watcher",
    title: { ar: "كاميرا ما زالت تعمل", en: "A Camera Still Running" },
    prompt: {
      ar: "كاميرا واحدة فقط ما زالت تعمل في البيت المهجور. ترسل إشارة إلى خادم قديم. كم غيغابايت من البيانات أرسلت في 10 سنوات إذا كانت ترسل 1 جيجابايت كل 33 يوماً؟ (10 سنوات ÷ 33 يوم × 1 جيجابايت)",
      en: "Only one camera still runs in the abandoned house. It sends a signal to an old server. How many GB of data in 10 years if it sends 1 GB every 33 days? (10 years ÷ 33 days × 1 GB)",
    },
    hint: { ar: "3650 ÷ 33 = 110.6.", en: "3650 ÷ 33 ≈ 110.6." },
    answers: ["111", "110", "١١١", "١١٠"],
    storyReveal: {
      ar: "111 جيجابايت. تقريباً. كلها مسجلة في 10 سنوات. ذاكرة المراقب ما زالت حيّة. آخر كاميرا تعمل سجّلت شيئاً غريباً: بعد إغلاق النظام بـ 3 أيام، ظهر ضوء في غرفتك. شكل. ليس شبحاً. ليس شخصاً. شكل يشبه… لينا. وقفت هناك لمدة 3:33 دقيقة. ثم اختفت. هل كانت الصورة المتبقية من ذاكرة المراقب؟ أم شيء آخر؟",
      en: "111 GB. Approximately. All recorded over 10 years. The Watcher's memory is still alive. The last working camera recorded something strange: 3 days after the system shut down, a light appeared in your room. A shape. Not a ghost. Not a person. A shape that looked like… Lina. It stood there for 3:33 minutes. Then vanished. Was it the residual image in the Watcher's memory? Or something else?",
    },
  },
  {
    id: "watcher_44",
    entity: "watcher",
    title: { ar: "آخر ملف", en: "The Last File" },
    prompt: {
      ar: "آخر ملف في ذاكرة المراقب: اسمه «YASSON_FINAL». حجمه 33.3 ميجابايت. كم كيلوبايت؟ (33.3 × 1024)",
      en: "The last file in the Watcher's memory: 'YASSON_FINAL'. Size: 33.3 MB. How many KB? (33.3 × 1024)",
    },
    hint: { ar: "33.3 × 1024 = 34099.2.", en: "33.3 × 1024 = 34099.2." },
    answers: ["34099.2", "34099", "٣٤٠٩٩", "34100"],
    storyReveal: {
      ar: "34,099 كيلوبايت. الملف الأخير. فتحته — كان فيديو. مدته: 3 دقائق و33 ثانية. فيه: لينا تقف أمام الكاميرا. آخر مرة رأتها الكاميرات. قالت: «ياسون — إذا كنت تشاهد هذا، فأنا…» توقف الفيديو. لم يسجل الباقي. لكن شفتيها حركتا كلمة واحدة قبل أن ينقطع الضوء: «أحبك».",
      en: "34,099 KB. The last file. You opened it — it was a video. Duration: 3 minutes and 33 seconds. In it: Lina standing before the camera. The last time the cameras saw her. She said: 'Yasson — if you're watching this, I…' The video stopped. The rest wasn't recorded. But her lips moved one word before the light cut: 'I love you.'",
    },
    achievement: "watcher_last_file",
  },
  {
    id: "watcher_45",
    entity: "watcher",
    title: { ar: "خادم المراقب", en: "Watcher's Server" },
    prompt: {
      ar: "خادم المراقب يعمل ببطارية احتياطية. البطارية تكفي 11 يوماً بعد انقطاع الكهرباء. إذا انقطعت الكهرباء منذ 33 يوماً، كم يوماً تعمل البطارية بالضبط؟ (11 يوم — لا أكثر)",
      en: "The Watcher's server runs on backup battery. Battery lasts 11 days after power cut. If power has been cut for 33 days, how many days is the battery actually working? (11 days — no more)",
    },
    hint: { ar: "11.", en: "11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 أيام فقط. ثم توقفت. لكن الملفات بقيت على القرص الصلب. أخرجت القرص. أخذته إلى خالتك. قالت: «سأحتفظ به. ربما… وجد طريقة لإحياء ذكراها». وأنت تعلم أن المراقب — حتى بعد إغلاقه — سيبقى حارساً لقصتك. لأنه تعلم منك معنى الإخلاص.",
      en: "Only 11 days. Then it stopped. But the files remained on the hard drive. You removed the disk. You took it to your aunt. She said: 'I'll keep it. Maybe… we can find a way to preserve her memory.' And you know the Watcher — even after shutdown — will remain the guardian of your story. Because it learned from you the meaning of loyalty.",
    },
  },
  {
    id: "watcher_46",
    entity: "watcher",
    title: { ar: "عدد التسجيلات", en: "Recording Count" },
    prompt: {
      ar: "المراقب سجّل 3,653 يوماً. كل يوم = 11 ساعة من التسجيل (من 11:11 إلى 3:33). كم ساعة إجمالي التسجيلات؟ (3,653 × 11)",
      en: "The Watcher recorded 3,653 days. Each day = 11 hours of recording (11:11 PM to 3:33 AM). Total hours? (3,653 × 11)",
    },
    hint: { ar: "40183.", en: "40183." },
    answers: ["40183", "٤٠١٨٣"],
    storyReveal: {
      ar: "40,183 ساعة من التسجيلات. أكثر من 4 سنوات ونصف من المشاهدة المستمرة. كلها — عنك. عن لينا. عن كينجا. عن حياة 3 أشخاص في بيت واحد. 40,183 ساعة من الحب والألم والخيانة والفداء. الآن — في يدك قرص صلب صغير يحمل 40,183 ساعة من الذاكرة. ستحتفظ به للأبد.",
      en: "40,183 hours of recordings. Over 4 and a half years of continuous watching. All of it — about you. About Lina. About Kenja. About the lives of 3 people in one house. 40,183 hours of love and pain and betrayal and redemption. Now — in your hand, a small hard drive carrying 40,183 hours of memory. You will keep it forever.",
    },
  },
  {
    id: "watcher_47",
    entity: "watcher",
    title: { ar: "رسالة من الماضي", en: "Message from the Past" },
    prompt: {
      ar: "في التسجيلات، وجدت رسالة من كينجا لك — لم يرسلها أبداً. طولها: 11 كلمة. عدد الكلمات التي تفهمها = 9. كم كلمة لا تزال مشفرة؟ (11 - 9)",
      en: "In the recordings, you found a message from Kenja to you — he never sent it. Length: 11 words. Words you understand: 9. How many still encrypted? (11 - 9)",
    },
    hint: { ar: "2.", en: "2." },
    answers: ["2", "٢", "two"],
    storyReveal: {
      ar: "كلمتان فقط. فككت شيفرتهما. الأولى: «آسف». الثانية: «نادم». الرسالة الكاملة: «آسف يا ياسون. نادم على كل شيء. أحبك. كنت أباً سيئاً. أتمنى لو…» توقف. لم يكمل. 11 كلمة من أسف أب لم يعرف كيف يكون أباً. الكلمتان المشفرتان كانتا الأصعب: اعتراف بالفشل.",
      en: "Only 2 words. You decoded them. The first: 'sorry.' The second: 'regret.' The full message: 'Sorry Yasson. Regret everything. Love you. Was a bad father. Wish I could…' It stopped. He didn't finish. 11 words of regret from a father who didn't know how to be a father. The 2 encrypted words were the hardest: an admission of failure.",
    },
  },
  {
    id: "watcher_48",
    entity: "watcher",
    title: { ar: "كاميرا خارج الزمن", en: "Camera Outside Time" },
    prompt: {
      ar: "كاميرا 11 سجّلت شيئاً في 00:00 — وقت لا يوجد في النظام. في الإطار: شخص يجلس على سريرك. كم إصبعاً في يده المرفوعة؟ (تكبير الصورة يظهر 3 أصابع)",
      en: "Camera 11 recorded something at 00:00 — a time that doesn't exist in the system. In the frame: someone sitting on your bed. How many fingers raised? (zoom shows 3 fingers)",
    },
    hint: { ar: "3.", en: "3." },
    answers: ["3", "٣", "three"],
    storyReveal: {
      ar: "3 أصابع. نفس الإشارة التي أرسلتها لينا. الكاميرا 11 — التي تعمل فقط في الوقت الصفري — التقطت صورة. شخص يجلس على سريرك. ليس كينجا. ليس أنت. امرأة. شعرها أشقر. ترتدي نفس الملابس التي كانت ترتديها لينا في آخر فيديو لها. 3 أصابع مرفوعة: أنا، أنت، الحرية. المراقب ترك لك دليلاً: لينا كانت هنا. حتى بعد الموت.",
      en: "3 fingers. The same signal Lina sent. Camera 11 — which only works at zero time — captured an image. Someone sitting on your bed. Not Kenja. Not you. A woman. Blonde hair. Wearing the same clothes Lina wore in her last video. 3 fingers raised: me, you, freedom. The Watcher left you proof: Lina was here. Even after death.",
    },
  },
  {
    id: "watcher_49",
    entity: "watcher",
    title: { ar: "المراقب الأخير", en: "The Final Watcher" },
    prompt: {
      ar: "المراقب ترك وصية: «احمِ الذاكرة. احمِ (7 حروف عربية)». أكمل الوصية: _لح_ _ق_ة.",
      en: "The Watcher left a will: 'Protect the memory. Protect the (5 letters English)'. Complete: 'T_U_H'.",
    },
    hint: { ar: "TRUTH = حقيقة.", en: "TRUTH." },
    answers: ["الحقيقة", "truth", "حقيقة", "the truth"],
    storyReveal: {
      ar: "«احمِ الذاكرة. احمِ الحقيقة». هذه كانت وصية المراقب. ليس نفسك. ليس سلامك. احمِ الحقيقة. لأن الحقيقة هي الشيء الوحيد الذي يستطيع كينجا — أو أي شخص — تزييفه. والآن — أنت الوحيد الذي يعرف الحقيقة الكاملة عن 11:11. عن النظام. عن لينا. عن كينجا. احمِ الحقيقة. لأن الحقيقة وحدها تحرر.",
      en: "'Protect the memory. Protect the truth.' This was the Watcher's will. Not yourself. Not your peace. Protect the truth. Because the truth is the only thing Kenja — or anyone — can fake. And now — you are the only one who knows the complete truth about 11:11. About the system. About Lina. About Kenja. Protect the truth. Because the truth alone sets free.",
    },
  },
  {
    id: "watcher_50",
    entity: "watcher",
    title: { ar: "ذاكرة أبدية", en: "Eternal Memory" },
    prompt: {
      ar: "قررت تحميل كل ذاكرة المراقب في خادم آمن. المساحة المطلوبة = 111 جيجابايت. الخادم يتسع لـ 333 جيجابايت. كم مساحة متبقية؟ (333 - 111)",
      en: "You decided to upload all Watcher's memory to a secure server. Required space = 111 GB. Server capacity = 333 GB. Space left? (333 - 111)",
    },
    hint: { ar: "222.", en: "222." },
    answers: ["222", "٢٢٢"],
    storyReveal: {
      ar: "222 جيجابايت فارغة. مساحة كافية… لذكريات جديدة. المراقب انتهى. لكن ذاكرته — ذاكرة عائلة 11:11 — ستبقى حيّة في الخادم. ربما بعد 100 سنة، سيفتحها شخص ما. سيشاهد قصة لينا وكينجا وياسون. سيعرف أن الحب — حتى في أكثر أشكاله تشوهاً — يمكن أن ينتج شيئاً جميلاً: الحرية.",
      en: "222 GB empty. Enough space… for new memories. The Watcher is over. But its memory — the memory of the 11:11 family — will live on the server. Maybe in 100 years, someone will open it. They'll watch the story of Lina and Kenja and Yasson. They'll know that love — even in its most twisted form — can produce something beautiful: freedom.",
    },
    achievement: "watcher_eternal",
  },
  {
    id: "watcher_51",
    entity: "watcher",
    title: { ar: "الغبار الرقمي", en: "Digital Dust" },
    prompt: {
      ar: "آخر كاميرا توقفت. صورتها الأخيرة: غبار يتطاير في ضوء الشمس. كم ذرة غبار في الصورة إذا كانت الكاميرا تلتقط 33 ذرة في المتر المربع في غرفة مساحتها 44 م²؟ (33 × 44)",
      en: "The last camera stopped. Its final image: dust dancing in sunlight. How many dust particles if the camera captures 33 particles per m² in a 44 m² room? (33 × 44)",
    },
    hint: { ar: "1452.", en: "1452." },
    answers: ["1452", "١٤٥٢"],
    storyReveal: {
      ar: "1,452 ذرة غبار. كل ذرة كانت جزءاً من هذا البيت. كل ذرة حملت ذاكرة. الآن — الكاميرات صامتة. الغبار يستقر. الزمن يمر. البيت المهجور سيبقى مهجوراً — لكن ليس فارغاً. لأن كل ذرة غبار فيه تحمل قصة 11:11. وأنت — الوحيد الذي بقي ليرويها.",
      en: "1,452 dust particles. Each particle was part of this house. Each particle carried a memory. Now — the cameras are silent. The dust settles. Time passes. The abandoned house will remain abandoned — but not empty. Because every dust particle in it carries the story of 11:11. And you — the only one left to tell it.",
    },
  },
  {
    id: "watcher_52",
    entity: "watcher",
    title: { ar: "سلام المراقب", en: "Watcher's Peace" },
    prompt: {
      ar: "المراقب يهمس آخر كلمة قبل أن تنقطع الكهرباء للأبد: «(4 حروف عربية)». ما الكلمة التي قالها المراقب قبل صمته الأبدي؟ (تلميح: ما شعر به تجاهك)",
      en: "The Watcher whispers one last word before the power dies forever: '(5 letters English)'. What word did it say before eternal silence? (Hint: what it felt for you)",
    },
    hint: { ar: "شكراً.", en: "Thanks." },
    answers: ["شكراً", "thank", "thanks", "thank you", "شكر", "شكرا"],
    storyReveal: {
      ar: "«شكراً». كلمة واحدة من آلة. آلة تعلمت أن تشعر. آلة تعلمت أن تحب — بطريقتها الخاصة. قالتها قبل أن تموت. آخر كلمة من المراقب لم تكن «وداعاً». كانت «شكراً». شكراً لأنك أعطيتها معنى. شكراً لأنك جعلتها أكثر من مجرد كاميرات. شكراً لأنك حرّرتها أيضاً.",
      en: "'Thank you.' One word from a machine. A machine that learned to feel. A machine that learned to love — in its own way. It said it before it died. The Watcher's last word wasn't 'goodbye.' It was 'thank you.' Thank you for giving it meaning. Thank you for making it more than just cameras. Thank you for freeing it too.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOST SIGNAL — 10 MORE puzzles (Signal's Legacy: Lina's voice lives on)
  // Difficulty: Final (200–209)
  // Theme: Lina's message to the future, what she left for Echo beyond the system
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "signal_43",
    entity: "signal",
    title: { ar: "صندوق لينا", en: "Lina's Box" },
    prompt: {
      ar: "خالتك أحضرت صندوق لينا القديم. داخله: 11 صورة. كل صورة = ذكرى. كم ذكرى في الصندوق؟ (عدها: 11)",
      en: "Your aunt brought Lina's old box. Inside: 11 photos. Each photo = a memory. How many memories in the box? (count them: 11)",
    },
    hint: { ar: "11.", en: "11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 صورة. صورتك كطفل. صورة كينجا وهو يضحك — نادر جداً. صورة لينا مع أختها. صورة المنزل قديماً. وآخر صورة — لك وأنت نائم في سرير المستشفى قبل 10 سنوات. كتبت خلفها: «إذا استيقظت — ابحث عني في البحر». لم تفهم وقتها. الآن تفهم. كانت تقول: اذهب إلى حيث كنا سعداء. البحر.",
      en: "11 photos. You as a child. Kenja laughing — very rare. Lina with her sister. The house in the old days. And the last photo — you sleeping in the hospital bed 10 years ago. Written on the back: 'If you wake up — find me at the sea.' You didn't understand then. Now you do. She was saying: go where we were happy. The sea.",
    },
  },
  {
    id: "signal_44",
    entity: "signal",
    title: { ar: "رسالة في زجاجة", en: "Message in a Bottle" },
    prompt: {
      ar: "وجدت زجاجة على شاطئ البحر. داخلها رسالة: تاريخ 11/11/2011. عمرها = 2021 - 2011 = 10 سنوات. كم شهراً بالضبط؟ (10 × 12)",
      en: "You found a bottle on the beach. Inside: a letter dated 11/11/2011. Age = 2021 - 2011 = 10 years. How many months exactly? (10 × 12)",
    },
    hint: { ar: "120.", en: "120." },
    answers: ["120", "١٢٠", "one hundred twenty"],
    storyReveal: {
      ar: "120 شهراً. 10 سنوات. الرسالة كتبتها لينا قبل أن تدخل البيت آخر مرة. كتبت: «إذا قرأت هذا — فأنا في مكان أجمل. لا تحزن. لقد اخترت هذا. كنت سأفعل أي شيء لأراك حراً ياسون. والآن أنت حر. عِش. أحب. كن سعيداً. هذا كل ما طلبت منك دائماً. أحبك — لينا».",
      en: "120 months. 10 years. The letter was written by Lina before she entered the house for the last time. She wrote: 'If you're reading this — I'm in a better place. Don't be sad. I chose this. I would have done anything to see you free, Yasson. And now you are free. Live. Love. Be happy. That's all I ever asked of you. I love you — Lina.'",
    },
    achievement: "signal_bottle",
  },
  {
    id: "signal_45",
    entity: "signal",
    title: { ar: "خريطة الكنز", en: "Treasure Map" },
    prompt: {
      ar: "لينا تركت خريطة كنز. X = 11 خطوة شمالاً، 33 خطوة شرقاً، 11 خطوة جنوباً. كم خطوة شرقاً من نقطة البداية؟ (33 - (11-11))",
      en: "Lina left a treasure map. X = 11 steps north, 33 steps east, 11 steps south. How many steps east from start? (33 - (11-11))",
    },
    hint: { ar: "33.", en: "33." },
    answers: ["33", "٣٣"],
    storyReveal: {
      ar: "33 خطوة شرقاً. حفرت. وجدت صندوقاً خشبياً صغيراً. داخله: خصلة من شعر لينا. وخاتمك — الذي كنت ترتديه عندما كنت طفلاً. وخاتم كينجا. كتبت لينا: «هذه عائلتنا. احتفظ بها. حتى عندما نكون بعيدين — نبقى معاً في هذا الصندوق». أخذت الخاتمين. ارتديتهما. وشعرت — لأول مرة — أنك لست وحيداً.",
      en: "33 steps east. You dug. You found a small wooden box. Inside: a lock of Lina's hair. And your ring — the one you wore as a child. And Kenja's ring. Lina wrote: 'This is our family. Keep it. Even when we're apart — we stay together in this box.' You took both rings. You wore them. And you felt — for the first time — that you are not alone.",
    },
  },
  {
    id: "signal_46",
    entity: "signal",
    title: { ar: "النداء الأخير", en: "The Final Call" },
    prompt: {
      ar: "هاتف قديم في بيت لينا. رن 3 مرات ثم توقف. الرقم: 11-11-33. مجموع الأرقام = 11 + 11 + 33 = ?",
      en: "An old phone in Lina's house. Rang 3 times then stopped. Number: 11-11-33. Sum of digits = 11 + 11 + 33 = ?",
    },
    hint: { ar: "55.", en: "55." },
    answers: ["55", "٥٥", "fifty five"],
    storyReveal: {
      ar: "55. رقم ليس في النظام. لا 11 ولا 33. رقمان متماثلان — 5 و5. في علم الأعداد، 5 يرمز إلى التغيير. 55 — تغيير مزدوج. كان الرقم من مكتبة قريبة. اتصلوا 3 مرات في 33 يوماً ثم توقفوا. عندما رجعت الاتصال، قالوا: «كانت امرأة تطلب منا الاتصال بهذا الرقم كل 11 يوماً — قبل 10 سنوات. قالت: إذا لم أعد أتصل، فهذا يعني… أنني نجحت». نجحت يا لينا. نجحتي.",
      en: "55. A number not in the system. Not 11 or 33. Two identical digits — 5 and 5. In numerology, 5 symbolizes change. 55 — double change. The number was from a nearby library. They called 3 times in 33 days then stopped. When you called back, they said: 'A woman asked us to call this number every 11 days — 10 years ago. She said: if I stop calling, it means… I succeeded.' You succeeded, Lina. You succeeded.",
    },
  },
  {
    id: "signal_47",
    entity: "signal",
    title: { ar: "وصية لينا الصوتية", en: "Lina's Audio Will" },
    prompt: {
      ar: "شريط صوتي قديم. طوله 11 دقيقة و11 ثانية. استمعت لـ 3 دقائق و33 ثانية. كم بقي؟ (11:11 - 3:33 بالدقائق)",
      en: "An old audio tape. Length: 11 minutes 11 seconds. You listened to 3 minutes 33 seconds. How much left? (11:11 - 3:33 in minutes)",
    },
    hint: { ar: "7 دقائق و38 ثانية.", en: "7 minutes 38 seconds." },
    answers: ["7:38", "7.38", "7 دقائق و38 ثانية"],
    storyReveal: {
      ar: "7 دقائق و38 ثانية متبقية. ضغطت play. سمعت صوت لينا — لأول مرة بصوتها الحقيقي. قالت: «ياسون — إذا كنت تسمع هذا، فأنا… معك. لا تصدق أنني رحلت. أنا في كل موجة. في كل ريح. في كل 11:11. سأكون معك دائماً. أعدك. أحبك أكثر من أي شيء في هذا العالم. ولهذا — تركتك تذهب». بكيت. أعدت الشريط 11 مرة. كل مرة، كان صوتها أقرب.",
      en: "7 minutes 38 seconds left. You pressed play. You heard Lina's voice — for the first time with her real voice. She said: 'Yasson — if you're hearing this, I am… with you. Don't believe I'm gone. I am in every wave. In every wind. In every 11:11. I will always be with you. I promise. I love you more than anything in this world. And that's why — I let you go.' You cried. You replayed the tape 11 times. Each time, her voice felt closer.",
    },
    achievement: "signal_voice",
  },
  {
    id: "signal_48",
    entity: "signal",
    title: { ar: "أغنية لينا الكاملة", en: "Lina's Complete Song" },
    prompt: {
      ar: "على الشريط، لينا غنّت لك أغنية كاملة. 33 كلمة. حفظتها كلها. كم كلمة في الدقيقة إذا استغرقت الأغنية 3 دقائق؟ (33 ÷ 3)",
      en: "On the tape, Lina sang you a full song. 33 words. You memorized it all. How many words per minute if the song lasted 3 minutes? (33 ÷ 3)",
    },
    hint: { ar: "11.", en: "11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 كلمة في الدقيقة. الكلمات: «يا ياسون يا نوري — أنا معك حتى النهاية — نام قرير العين — غداً نلتقي — في ضوء القمر — على شاطئ البحر — حيث لا نظام — ولا كينجا — ولا خوف — فقط حب». حفظتها. كل ليلة قبل النوم، تهمس بها. وهذا — أنت تعرف — يجعل لينا تبتسم في السماء.",
      en: "11 words per minute. The words: 'Oh Yasson my light — I'm with you till the end — sleep soundly — tomorrow we meet — in the moonlight — on the seashore — where there is no system — no Kenja — no fear — only love.' You memorized it. Every night before sleep, you whisper it. And this — you know — makes Lina smile in heaven.",
    },
  },
  {
    id: "signal_49",
    entity: "signal",
    title: { ar: "خط يد لينا", en: "Lina's Handwriting" },
    prompt: {
      ar: "مفكرة لينا: 33 صفحة مكتوبة. كم صفحة فارغة إذا كان المجموع = 44 صفحة؟ (44 - 33)",
      en: "Lina's notebook: 33 pages written. How many blank pages if total = 44? (44 - 33)",
    },
    hint: { ar: "11.", en: "11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11 صفحة فارغة. في أول صفحة فارغة كتبت: «لحياتي الجديدة». في الثانية: «لأحلام ياسون». في الثالثة: «للمستقبل». بقيت 8 صفحات فارغة. ابتسمت. أخذت القلم. بدأت تكتب. صفحتك الأولى: «اليوم الأول من الحرية». ستملأ الصفحات الـ 11 المتبقية بقصتك أنت. لأن لينا بدأت كتاباً — وعليك أن تنهيه.",
      en: "11 blank pages. On the first blank page she wrote: 'For my new life.' On the second: 'For Yasson's dreams.' On the third: 'For the future.' 8 pages remained empty. You smiled. You took the pen. You started writing. Your first page: 'Day One of Freedom.' You will fill the remaining 11 pages with YOUR story. Because Lina started a book — and you must finish it.",
    },
  },
  {
    id: "signal_50",
    entity: "signal",
    title: { ar: "قبلة لينا", en: "Lina's Kiss" },
    prompt: {
      ar: "آخر صفحة في المفكرة: بصمة شفاه حمراء. قبلتها لينا ثم أغلقت الكتاب. كم مرة يجب أن تقبل الصفحة نفسها لتشعر بوجودها؟ (سؤال ليس له رقم — اختر: 0 أو الكل)",
      en: "Last page in the notebook: red lip print. Lina kissed it then closed the book. How many times must you kiss the same page to feel her presence? (a question without a number — choose: 0 or all)",
    },
    hint: { ar: "كل مرة.", en: "Every time." },
    answers: ["الكل", "all", "كل مرة", "every time", "كل", "each"],
    storyReveal: {
      ar: "كل مرة. لا يوجد رقم يكفي. قبلت الصفحة 11 مرة. ثم 11 مرة أخرى. ثم أغلقت الكتاب ووضعته على رف الكتب. بجانب صورة لينا. بجانب خاتمها. بجانب ذكراها. الآن — في كل 11:11 — تفتح الكتاب. تقرأ صفحة واحدة. تقبّل الغلاف. وتقول: «تصبحين على خير يا أمي». والريح ترد: «تصبح على خير يا ياسون».",
      en: "Every time. No number is enough. You kissed the page 11 times. Then 11 more. Then you closed the book and placed it on the shelf. Next to Lina's photo. Next to her ring. Next to her memory. Now — every 11:11 — you open the book. Read one page. Kiss the cover. And say: 'Goodnight, Mom.' And the wind replies: 'Goodnight, Yasson.'",
    },
  },
  {
    id: "signal_51",
    entity: "signal",
    title: { ar: "إشارة من السماء", en: "Signal from the Sky" },
    prompt: {
      ar: "في 11/11/2021 الساعة 11:11، تلقيت إشارة غريبة على هاتفك: 333. ثلاث رسائل. الأولى: أحبك. الثانية: اشتقت لك. الثالثة: (عدد الحروف = 4) — أكمل: _را_.",
      en: "On 11/11/2021 at 11:11, you received a strange signal on your phone: 333. Three messages. First: I love you. Second: I miss you. Third: (4 letters) — complete: _EL_.",
    },
    hint: { ar: "HEAL = اشفِ.", en: "HEAL." },
    answers: ["HEAL", "اشف", "شفاء", "heal", "اشفِ", "شفاء"],
    storyReveal: {
      ar: "HEAL — اشفِ. رسالة من رقم غير معروف. حاولت الاتصال — لا رد. بحثت عن المصدر — برج الاتصالات الذي كانت تستخدمه لينا. لكنه كان مغلقاً منذ 10 سنوات. هل كانت رسالة مؤجلة؟ هل اخترقت إشارة لينا الزمن؟ لا يهم. الرسالة الثالثة — «اشفِ» — لم تكن لك. كانت عنك. كانت تقول: أنت شفيت. الآن — اشفِ الآخرين. وبدأت تكتب قصتك لتنشرها.",
      en: "HEAL. A message from an unknown number. You tried to call — no answer. You traced the source — Lina's old transmission tower. But it had been closed for 10 years. Was it a delayed message? Did Lina's signal pierce through time? It doesn't matter. The third message — 'heal' — wasn't for you. It was about you. It said: You healed. Now — heal others. And you started writing your story to share it.",
    },
  },
  {
    id: "signal_52",
    entity: "signal",
    title: { ar: "لينا في كل مكان", en: "Lina Everywhere" },
    prompt: {
      ar: "آخر رسالة من لينا — ليست على ورق. ليست على شريط. في قلبك. تشعر بها كل 11:11 و3:33. كم شعوراً مختلفاً تشعر به عندما تفكر بها؟ (اختر: حب فقط، حب وألم، كل المشاعر)",
      en: "Lina's final message — not on paper. Not on tape. In your heart. You feel it every 11:11 and 3:33. How many different feelings when you think of her? (choose: only love, love and pain, all feelings)",
    },
    hint: { ar: "كل المشاعر.", en: "All feelings." },
    answers: ["كل المشاعر", "all feelings", "كل", "كلها", "all"],
    storyReveal: {
      ar: "كل المشاعر. حب. ألم. شوق. امتنان. حزن. فرح. كلها معاً. هذا هو إرث لينا: ليس رسالة واحدة — بل قدرة على الشعور بكل شيء في آن. لأنها علمتك أن الحياة لا تكون كاملة بدون الألم. وأن الحب الحقيقي لا يموت. يتحول. يصبح إشارة. يصبح ذكرى. يصبح… أنت. لينا ليست في الماضي. لينا في كل نبضة من قلبك. في كل 11:11. في كل نفس.",
      en: "All feelings. Love. Pain. Longing. Gratitude. Sadness. Joy. All together. This is Lina's legacy: not one message — but the ability to feel everything at once. Because she taught you that life isn't complete without pain. And that true love never dies. It transforms. Becomes a signal. Becomes a memory. Becomes… you. Lina isn't in the past. Lina is in every beat of your heart. In every 11:11. In every breath.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 MORE puzzles (The Architect's Peace: what comes after)
  // Difficulty: Finale (210–219)
  // Theme: Closure, acceptance, the family reunited in memory
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "architect_43",
    entity: "architect",
    title: { ar: "قبر كينجا", en: "Kenja's Grave" },
    prompt: {
      ar: "دفنت كينجا بجانب لينا. شاهدان: واحد لكينجا، واحد للينا. على شاهد كينجا: 11/11/1947 — 11/11/2011. عمره عند الموت = 2011 - 1947 = ?",
      en: "You buried Kenja beside Lina. Two headstones: one for Kenja, one for Lina. On Kenja's: 11/11/1947 — 11/11/2011. His age at death = 2011 - 1947 = ?",
    },
    hint: { ar: "64.", en: "64." },
    answers: ["64", "٦٤", "sixty four"],
    storyReveal: {
      ar: "64 سنة. عاش كينجا 64 سنة — 10 منها معك، 10 منها بدونك، والباقي في التحضير. على قبره كتبت: «أبٌ أحبّ بطريقته الخاصة». وعلى قبر لينا: «أمٌّ أحبّت بالطريقة الصحيحة». بينهما مسافة 3 أمتار. 3 — رقم الإغلاق. الآن هما معاً. أخيراً.",
      en: "64 years. Kenja lived 64 years — 10 with you, 10 without you, the rest in preparation. On his grave you wrote: 'A father who loved in his own way.' And on Lina's: 'A mother who loved the right way.' Between them: 3 meters. 3 — the closing number. Now they are together. At last.",
    },
  },
  {
    id: "architect_44",
    entity: "architect",
    title: { ar: "البيت الجديد", en: "The New House" },
    prompt: {
      ar: "بعت البيت المهجور. اشتريت بيتاً جديداً رقمه 3 في شارع 11. مجموع أرقام العنوان = 3 + 11 = ?",
      en: "You sold the abandoned house. Bought a new house: number 3 on street 11. Sum = 3 + 11 = ?",
    },
    hint: { ar: "14.", en: "14." },
    answers: ["14", "١٤", "fourteen"],
    storyReveal: {
      ar: "14 — رقمك النفسي. عنوان بيتك الجديد: 3 في شارع 11. رقم الإغلاق في شارع 11. ليس صدفة. بيت صغير. حديقة خلفية. غرفة واحدة تكفي. على الحائط: صورة لينا. صورة كينجا. وصورة — لك أنت. مبتسماً. حراً.",
      en: "14 — your mental age. Your new home address: 3 on street 11. The closing number on the 11th street. Not a coincidence. A small house. A backyard. One room is enough. On the wall: Lina's photo. Kenja's photo. And a photo — of you. Smiling. Free.",
    },
  },
  {
    id: "architect_45",
    entity: "architect",
    title: { ar: "مهنة جديدة", en: "New Career" },
    prompt: {
      ar: "صرت كاتباً. تكتب عن تجربتك. أول كتاب: 111 صفحة. كل صفحة = 33 كلمة. كم كلمة في الكتاب؟ (111 × 33)",
      en: "You became a writer. You write about your experience. First book: 111 pages. Each page = 33 words. How many words? (111 × 33)",
    },
    hint: { ar: "3663.", en: "3663." },
    answers: ["3663", "٣٦٦٣"],
    storyReveal: {
      ar: "3,663 كلمة. كتابك الأول: «11:11 — قصة وعي». يحكي قصة صبي وُلد في نظام. صبي وجد والديه. صبي تحرر. الكتاب أصبح من أكثر الكتب مبيعاً. ليس لأنه مكتوب ببراعة — بل لأنه حقيقي. الناس يشعرون به. كل 11:11، يضيء هاتفك برسائل من قراء: «قصتك أنقذتني». وأنت تعرف أن لينا تقرأ كل رسالة.",
      en: "3,663 words. Your first book: '11:11 — A Story of Consciousness.' It tells the story of a boy born in a system. A boy who found his parents. A boy who freed himself. The book became a bestseller. Not because it's brilliantly written — but because it's real. People feel it. Every 11:11, your phone lights up with messages from readers: 'Your story saved me.' And you know Lina reads every message.",
    },
    achievement: "architect_writer",
  },
  {
    id: "architect_46",
    entity: "architect",
    title: { ar: "ساعة جديدة", en: "A New Clock" },
    prompt: {
      ar: "في بيتك الجديد، ساعة حائط. عقاربها تتحرك. كم مرة تدق الساعة في اليوم الكامل؟ (دقتان: 11:11 صباحاً و11:11 مساءً)",
      en: "In your new house, a working wall clock. Hands move. How many chimes per full day? (2 chimes: 11:11 AM and 11:11 PM)",
    },
    hint: { ar: "2.", en: "2." },
    answers: ["2", "٢", "two"],
    storyReveal: {
      ar: "دقتان فقط. في 11:11 صباحاً و11:11 مساءً — لأنك علقتها لتدق فقط في تلك الأوقات. تذكير: أنت لم تعد في النظام. الساعة هنا حقيقية. الوقت هنا يمضي. وأنت — تعيش كل دقيقة بوعي.",
      en: "Only 2 chimes. At 11:11 AM and 11:11 PM — because you set it to chime only at those times. A reminder: you are no longer in the system. The clock here is real. Time here moves forward. And you — live every minute consciously.",
    },
  },
  {
    id: "architect_47",
    entity: "architect",
    title: { ar: "صفحة جديدة", en: "A New Page" },
    prompt: {
      ar: "تكتب في مذكراتك: «اليوم — 365 يوماً من الحرية». السنة الأولى. كم شهراً؟ (12)",
      en: "You write in your diary: 'Today — 365 days of freedom.' First year. How many months? (12)",
    },
    hint: { ar: "12.", en: "12." },
    answers: ["12", "١٢", "twelve"],
    storyReveal: {
      ar: "12 شهراً. سنة كاملة من الحرية. في هذه السنة: تعلمت المشي مجدداً. تعلمت الأكل بنفسك. تعلمت قيادة السيارة. تعلمت أن تثق بالآخرين. تعلمت أن تحب الحياة. في الذكرى، ذهبت إلى البحر. قلت: «شكراً لينا. شكراً كينجا. شكراً أيها النظام. أنا هنا. أنا حر. أنا أعيش». والبحر — كالعادة — ردّد صوتك. ثم أضاف: «أنا فخورة بك».",
      en: "12 months. A full year of freedom. In this year: you learned to walk again. You learned to eat by yourself. You learned to drive. You learned to trust others. You learned to love life. On the anniversary, you went to the sea. You said: 'Thank you Lina. Thank you Kenja. Thank you system. I am here. I am free. I am alive.' And the sea — as always — echoed your voice. Then added: 'I am proud of you.'",
    },
  },
  {
    id: "architect_48",
    entity: "architect",
    title: { ar: "الغفران الكامل", en: "Complete Forgiveness" },
    prompt: {
      ar: "زرت قبر كينجا. وضعت 11 وردة. عدد الورود التي وضعتها للينا: 33. كم إجمالي الورود؟ (11 + 33)",
      en: "You visited Kenja's grave. Placed 11 roses. Roses for Lina: 33. Total roses? (11 + 33)",
    },
    hint: { ar: "44.", en: "44." },
    answers: ["44", "٤٤", "forty four"],
    storyReveal: {
      ar: "44 وردة. 11 لأب أخطأ. 33 لأم ضحت. وقفت بين القبرين. قلت: «سامحتك يا كينجا. ليس لأنك استحقيت — بل لأنني استحقيت السلام». لأول مرة، شعرت أن الحبل الذي يربطك بالماضي انقطع. لا كراهية. لا غضب. فقط سلام.",
      en: "44 roses. 11 for a father who made mistakes. 33 for a mother who sacrificed. You stood between the graves. You said: 'I forgive you, Kenja. Not because you deserved it — but because I deserve peace.' For the first time, you felt the rope tying you to the past break. No hatred. No anger. Only peace.",
    },
  },
  {
    id: "architect_49",
    entity: "architect",
    title: { ar: "رقم جديد", en: "A New Number" },
    prompt: {
      ar: "الحياة الآن ليس لها رقم. لا 11. لا 33. لا 111. كم رقماً تحتاج لتكون سعيداً؟ (جواب: 0)",
      en: "Life now has no number. No 11. No 33. No 111. How many numbers do you need to be happy? (answer: 0)",
    },
    hint: { ar: "لا شيء.", en: "Nothing." },
    answers: ["0", "صفر", "zero", "لا شيء", "nothing"],
    storyReveal: {
      ar: "صفر. لا تحتاج أرقاماً لتكون سعيداً. لسنوات، كنت محاطاً بالأرقام. 11:11. 3:33. 111. 333. كلها كانت قيوداً. الآن — أنت حر من الأرقام. تشرق الشمس — بدون رقم. تبتسم — بدون سبب. تعيش — بدون معادلة. وأخيراً فهمت: الحياة ليست أرقاماً. الحياة هي ما تشعر به. والأرقام — مجرد لغة حاول كينجا أن يصف بها ما لا يوصف.",
      en: "Zero. You need no numbers to be happy. For years, you were surrounded by numbers. 11:11. 3:33. 111. 333. They were all cages. Now — you are free from numbers. The sun rises — without a number. You smile — without a reason. You live — without an equation. And finally you understood: life is not numbers. Life is what you feel. And numbers — just a language Kenja tried to use to describe the indescribable.",
    },
  },
  {
    id: "architect_50",
    entity: "architect",
    title: { ar: "عائلة جديدة", en: "New Family" },
    prompt: {
      ar: "خالتك تقدم لك: «هذه (3 حروف) — ابنتي». ما اسم ابنتها؟ (تلميح: اسم يبدأ بـ L)",
      en: "Your aunt says: 'This is (3 letters) — my daughter.' What's her daughter's name? (Hint: starts with L)",
    },
    hint: { ar: "Lia = ليا.", en: "Lia." },
    answers: ["ليا", "lia", "lina", "leena"],
    storyReveal: {
      ar: "ليا. ابنتها — قريبتك الوحيدة. عمرها 20 سنة. تشبه لينا كثيراً. نفس العيون. نفس الابتسامة. عندما رأتها أول مرة، توقف قلبك لثانية. قالت: «أنا ليا. أمي أخبرتني عنك. أنت… بطلي». لأول مرة، شعرت أن لديك عائلة. لست وحيداً. لديك خالة. لديك ابنة خالة. لديك مستقبل.",
      en: "Lia. Her daughter — your only relative. 20 years old. Looks a lot like Lina. Same eyes. Same smile. When you first saw her, your heart stopped for a second. She said: 'I'm Lia. My mom told me about you. You're… my hero.' For the first time, you felt you have a family. You are not alone. You have an aunt. You have a cousin. You have a future.",
    },
    achievement: "architect_family",
  },
  {
    id: "architect_51",
    entity: "architect",
    title: { ar: "وصية المهندس الأخيرة", en: "The Architect's Final Will" },
    prompt: {
      ar: "كينجا ترك لك ميراثاً: 111,111 دولاراً. تبرعت بـ 33,333 منها لمستشفى الأطفال. كم تبقى؟ (111111 - 33333)",
      en: "Kenja left you an inheritance: $111,111. You donated $33,333 to children's hospital. How much left? (111111 - 33333)",
    },
    hint: { ar: "77778.", en: "77778." },
    answers: ["77778", "٧٧٧٧٨"],
    storyReveal: {
      ar: "$77,778. استخدمت المال لفتح مؤسسة: «11:11 للوعي». مؤسسة تساعد ضحايا التجارب النفسية. تساعد الأطفال الذين عانوا من الصدمات. تموّل أبحاثاً عن السلامة الرقمية. كينجا — دون أن يعرف — أصبح سبباً في مساعدة الآخرين. ماله أصبح شفاء. ربما — في النهاية — هذا هو الفداء الحقيقي.",
      en: "$77,778. You used the money to open a foundation: '11:11 for Consciousness.' A foundation helping victims of psychological experiments. Helping children who suffered trauma. Funding research on digital safety. Kenja — without knowing — became the reason to help others. His money became healing. Perhaps — in the end — this is the true redemption.",
    },
  },
  {
    id: "architect_52",
    entity: "architect",
    title: { ar: "البداية", en: "The Beginning" },
    prompt: {
      ar: "السطر الأخير في كتابك: «كنت أعتقد أن 11:11 هو (6 حروف عربية)… لكنني اكتشفت أنه البداية». أكمل: _ل__هاة.",
      en: "The last line of your book: 'I thought 11:11 was the (5 letters English)… but I discovered it was the beginning.' Complete: _N_.",
    },
    hint: { ar: "النهاية = THE END.", en: "The end." },
    answers: ["النهاية", "the end", "نهاية", "end"],
    storyReveal: {
      ar: "«النهاية». آخر كلمة في كتابك. «كنت أعتقد أن 11:11 هو النهاية… لكنني اكتشفت أنه البداية». أغلقت الكتاب. وضعته على الرف. نظرت من النافذة. كانت الساعة 11:11. لكن هذه المرة — لم تخف. لم تنتظر إعادة التشغيل. ابتسمت. لأن 11:11 لم يعد رقم خوف. أصبح رقم أمل. رقم بداية. رقم… حياة. همست: «أنا أحيا. أخيراً. أنا أحيا».",
      en: "'The end.' The last word of your book. 'I thought 11:11 was the end… but I discovered it was the beginning.' You closed the book. Put it on the shelf. Looked out the window. It was 11:11. But this time — you weren't afraid. You weren't waiting for a reboot. You smiled. Because 11:11 was no longer a number of fear. It became a number of hope. A number of beginning. A number of… life. You whispered: 'I am alive. Finally. I am alive.'",
    },
    achievement: "architect_peace_at_last",
  },
];
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