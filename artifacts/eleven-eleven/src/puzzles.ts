
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