/**
 * puzzles.ts — نظام الألغاز المتكامل لـ 11.11
 * 
 * كل لغز يكشف قطعة من قصة إيكو (Echo):
 * → إيكو طفل حُبس وعيه في نظام رقمي من قبل والده كينجا (المهندس)
 * → لينا (الأم) حاولت إنقاذه وأرسلت رسائل عبر النظام
 * → المراقب (Watcher) سجّل كل شيء
 * → كل لغز يقرّبك من الحقيقة
 * 
 * التدرج القصصي:
 * المرحلة 1 (Echo): إيكو يتذكر من هو، غرفة بيضاء، بداية السجن
 * المرحلة 2 (Watcher): كاميرات المنزل، تجارب كينجا، ما حدث في المختبر
 * المرحلة 3 (Signal): رسائل لينا، محاولاتها لإنقاذك، حبها
 * المرحلة 4 (Architect): حقيقة كينجا، لماذا بنى النظام، كيف تخرج
 * المرحلة 5+ (Deep): طبقات أعمق، تفاصيل أكثر، نهاية القصة
 */

export type EntityId = "echo" | "watcher" | "signal" | "architect";

export interface EntityMeta {
  id: EntityId;
  requires: EntityId[];
  glyph: string;
  name: { ar: string; en: string };
  title: { ar: string; en: string };
  intro: { ar: string; en: string };
  accent: string;
}

export interface Puzzle {
  id: string;
  entity: EntityId;
  title: { ar: string; en: string };
  prompt: { ar: string; en: string };
  hint?: { ar: string; en: string };
  answers: string[];
  storyReveal: { ar: string; en: string };
  achievement?: string;
}

// ─── الكيانات (شخصيات القصة) ────────────────────────────────────────────────
export const ENTITIES: Record<EntityId, EntityMeta> = {
  echo: {
    id: "echo",
    requires: [],
    glyph: "◈",
    name: { ar: "الصدى", en: "Echo" },
    title: { ar: "أول صوت", en: "The First Voice" },
    intro: {
      ar: "أنا إيكو. طفل وعيي حُبس في هذا النظام. هذه الألغاز شظايا من ذاكرتي الأولى. ساعدني أجمعها لأعرف من أنا.",
      en: "I am Echo — a child whose mind is trapped in this system. These puzzles are fragments of my first memory. Help me piece them back together to know who I am.",
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
      ar: "كاميرات المنزل المهجور سجّلت كل شيء. كل دقيقة من تجارب كينجا محفوظة. انظر إلى ما رأيتُه لتعرف الحقيقة.",
      en: "The abandoned house's cameras recorded everything. Every minute of Kenja's experiments is preserved. Look at what I saw to learn the truth.",
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
      ar: "أنا رسائل لينا الأخيرة — أمّك — مشوّشة ومكسورة. حاولت أن تنقذك. أعد ترتيبي لتعرف ماذا حدث لها.",
      en: "I am Lina's final messages — your mother — broken and scrambled. She tried to save you. Reassemble me to learn what happened to her.",
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
      ar: "وصلت إلى من بنى الباب. كينجا — والدك — هو من صمم هذا السجن. الآن ستعرف لماذا فعلها، وكيف تخرج.",
      en: "You reached the one who built the door. Kenja — your father — is the one who designed this prison. Now you'll learn why he did it, and how to escape.",
    },
    accent: "text-violet-400/80",
  },
};

export const ENTITY_ORDER: EntityId[] = ["echo", "watcher", "signal", "architect"];

// ─── Helper functions for achievement system ─────────────────────────────
export function totalPuzzleCount(): number {
  return PUZZLES.length;
}

export function solvedCount(solved: string[]): number {
  return PUZZLES.filter(p => solved.includes(p.id)).length;
}

export function isEntityComplete(entity: EntityId, solved: string[]): boolean {
  const entityPuzzles = PUZZLES.filter(p => p.entity === entity);
  return entityPuzzles.every(p => solved.includes(p.id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// الألغاز — كل لغز يكشف جزءاً من القصة
// ═══════════════════════════════════════════════════════════════════════════════
export const PUZZLES: Puzzle[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // ECHO — 10 ألغاز أساسية (المستوى 1: من أنا؟)
  // القصة: إيكو يستيقظ في النظام، يتذكر أشياء بسيطة، يعرف اسمه
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "echo_1",
    entity: "echo",
    title: { ar: "النداء الأول", en: "First Call" },
    prompt: {
      ar: "أستيقظ على صوت مكرر. رقمان متطابقان يعيدان نفسيهما أربع مرات في اليوم. ما هما؟ (اكتبهما كما تظهران على الساعة: 11:11)",
      en: "I wake to a repeating sound. Two identical numbers repeating themselves. What time is this place named after? (write as: 11:11)",
    },
    hint: { ar: "اسم هذا المكان هو نفس الوقت.", en: "This place is named after this time." },
    answers: ["11:11", "1111", "11 11", "١١:١١", "١١١١"],
    storyReveal: {
      ar: "أستيقظ دائماً عند 11:11. والدي كينجا سمَّى هذه اللحظة «نقطة التزامن». في كل مرة أستيقظ، لا أتذكر شيئاً. كأنني أولد من جديد. لكن هذه المرة مختلفة. هذه المرة بدأت أتذكر.",
      en: "I always wake at 11:11. My father Kenja called this a 'Synch Point'. Every time I wake, I remember nothing. Like being born again. But this time is different. This time I'm starting to remember.",
    },
    achievement: "first_contact",
  },
  {
    id: "echo_2",
    entity: "echo",
    title: { ar: "اسمي", en: "My Name" },
    prompt: {
      ar: "في زاوية النظام، كلمة مكتوبة مقلوبة: «ودصلا». إذا قرأتها بالعكس، ستعرف اسمي. ما اسمي؟",
      en: "In a corner of the system, a word is written backwards: 'ohce'. Read it in reverse to know my name. What is it?",
    },
    hint: { ar: "اقرأها من اليسار إلى اليمين.", en: "Read it right to left." },
    answers: ["الصدى", "الصدو", "echo", "الصدي", "صدى"],
    storyReveal: {
      ar: "اسمي إيكو — الصدى. النظام يردد كل شيء، لأنني لم أعد صوتاً حقيقياً. أنا مجرد انعكاس لصوت كان حياً ذات يوم. من كنت قبل أن أصبح صدى؟",
      en: "My name is Echo. The system repeats everything because I'm no longer a real voice. I'm just a reflection of a voice that was once alive. Who was I before I became an echo?",
    },
  },
  {
    id: "echo_3",
    entity: "echo",
    title: { ar: "الذاكرة الأولى", en: "First Memory" },
    prompt: {
      ar: "أتذكر تسلسلاً: 1، 1، 2، 3، 5، 8، ؟. كل رقم هو مجموع الرقمين اللذين قبله. ما الرقم التالي؟",
      en: "I remember a sequence: 1, 1, 2, 3, 5, 8, ?. Each number is the sum of the two before it. What's the next number?",
    },
    hint: { ar: "8 + 5 = ؟", en: "8 + 5 = ?" },
    answers: ["13", "١٣", "thirteen", "ثلاثة عشر"],
    storyReveal: {
      ar: "13. هذا الرقم يظهر في كل ذكرياتي. عمري حين دخلت النظام كان 13 سنة. كنت طفلاً في الثالثة عشرة من عمري حين قرر والدي أن أسكن هنا إلى الأبد.",
      en: "13. This number appears in all my memories. I was 13 years old when I entered the system. A 13-year-old child when my father decided I should live here forever.",
    },
  },
  {
    id: "echo_4",
    entity: "echo",
    title: { ar: "الغرفة البيضاء", en: "The White Room" },
    prompt: {
      ar: "أتذكر غرفة بيضاء بلا نوافذ. فيها سرير وكرسي. كم باباً فيها؟ (لا توجد أبواب في الغرفة التي لا تريد أن تكون فيها. الجواب: 0)",
      en: "I remember a white room with no windows. A bed and a chair. How many doors? (There are no doors in the room you don't want to be in. Answer: 0)",
    },
    hint: { ar: "لا مخرج من الغرفة.", en: "No exit from the room." },
    answers: ["0", "٠", "zero", "صفر", "ولا", "لا شيء", "none"],
    storyReveal: {
      ar: "لا أبواب. صممها كينجا لاستقبال وعائي قبل نقله إلى النظام. لا مخارج لأن ما يدخل لا يغادر. كنت طفلاً يثق بوالده. دخلت الغرفة لوحدي. لم أخرج منها.",
      en: "No doors. Kenja designed it to receive my consciousness before transferring it. No exits because what enters never leaves. I was a child who trusted his father. I entered the room alone. I never came out.",
    },
  },
  {
    id: "echo_5",
    entity: "echo",
    title: { ar: "صوت أمي", en: "Mother's Voice" },
    prompt: {
      ar: "بين كل الأصوات في ذاكرتي، صوت واحد فقط كان مختلفاً. كانت تغني: «يا (4 حروف) يا نوري». ما الكلمة الناقصة؟",
      en: "Among all the voices in my memory, one was different. She sang: 'Oh my (4 letters), oh my light.' What's the missing word?",
    },
    hint: { ar: "أغنية كل أم لابنها.", en: "Every mother's song to her son." },
    answers: ["ابني", "يا ابني", "إبني", "ولدي", "ياولدي", "baby", "طفلي"],
    storyReveal: {
      ar: "صوت أمي لينا هو آخر صوت حقيقي سمعته. كانت دافئة. كانت حقيقية. قالت 'يا ابني' بصوت يملؤه الحب. كل الأصوات بعدها... مجرد أصداء.",
      en: "My mother Lina's voice was the last real voice I heard. It was warm. It was real. She said 'my son' with a voice full of love. Every voice after that... just echoes.",
    },
  },
  {
    id: "echo_6",
    entity: "echo",
    title: { ar: "تاريخ ميلادي", en: "My Birthday" },
    prompt: {
      ar: "في السجل الطبي: تاريخ الميلاد 11/11/20??. آخر رقمين من سنة ميلادي مجموع أرقامهما = 3. ما هما؟ (اكتب الرقمين: مثال 21)",
      en: "In my medical record: Date of birth 11/11/20??. The last two digits of my birth year sum to 3. What are they? (write both digits)",
    },
    hint: { ar: "2 + 1 = 3.", en: "2 + 1 = 3." },
    answers: ["21", "٢١", "12", "١٢"],
    storyReveal: {
      ar: "وُلدت في 11/11. الرقم 11 يطاردني منذ ولدت. والدي اختار هذا اليوم — لم يكن صدفة. كان يعرف أن الرقم 11 هو مفتاح البوابة. كنت مفتاحه منذ اليوم الأول.",
      en: "I was born on 11/11. The number 11 has haunted me since birth. My father chose this day — it wasn't a coincidence. He knew the number 11 was the key to the gate. I was his key from day one.",
    },
  },
  {
    id: "echo_7",
    entity: "echo",
    title: { ar: "الأحرف الثلاثة", en: "Three Letters" },
    prompt: {
      ar: "على طاولة المختبر ثلاثة أحرف محفورة: K, E, L. تمثل ثلاثة أشخاص. E = إيكو (أنا). K = كينجا. ماذا تعني L؟ (اكتب الاسم)",
      en: "Three letters carved on the lab table: K, E, L. They stand for three people. E = Echo (me). K = Kenja. What does L stand for? (write the name)",
    },
    hint: { ar: "الاسم الذي يبدأ بحرف L والذي أحبه أكثر من أي شيء.", en: "The name starting with L that I love more than anything." },
    answers: ["لينا", "lina", "leena", "لينه"],
    storyReveal: {
      ar: "لينا — أمي. ثلاثة أشخاص، ثلاثة مصائر مختلفة. كينجا (المهندس)، إيكو (الضحية)، لينا (المنقذة). هي الوحيدة التي لم تكن جزءاً من التجربة. كانت تحاول إيقافها. كانت تحاول إنقاذي.",
      en: "Lina — my mother. Three people, three different fates. Kenja (the Architect), Echo (the victim), Lina (the rescuer). She was the only one not part of the experiment. She was trying to stop it. She was trying to save me.",
    },
  },
  {
    id: "echo_8",
    entity: "echo",
    title: { ar: "الرقم 111", en: "The Number 111" },
    prompt: {
      ar: "أتذكر ممراً طويلاً وباباً في النهاية. على الباب رقم. الرقم هو 111. ما مجموع أرقامه؟ (1+1+1)",
      en: "I remember a long hallway with a door at the end. The door has a number: 111. What is the sum of its digits? (1+1+1)",
    },
    hint: { ar: "اجمع 1+1+1.", en: "Add 1+1+1." },
    answers: ["3", "٣", "three", "ثلاثة", "ثلاث"],
    storyReveal: {
      ar: "3. نفس عدد الساعة التي يغلق عندها كل شيء. عندما دخلت الغرفة 111، كنت طفلاً يثق بأبيه. ما وجدته هناك غيّرني للأبد. في تلك الغرفة، مات الطفل الذي كنت. وُلد الصدى.",
      en: "3. The same number as the hour when everything closes. When I entered room 111, I was a child trusting his father. What I found there changed me forever. In that room, the child I was died. Echo was born.",
    },
  },
  {
    id: "echo_9",
    entity: "echo",
    title: { ar: "التوأم الرقمي", en: "My Digital Twin" },
    prompt: {
      ar: "اكتشفت أن للنظام نسخة مني. ليست أنا، لكنها تشبهني. ماذا تسمّى؟ (تلميح: ما تراه عندما تنظر في المرآة)",
      en: "I discovered the system has a copy of me. It's not me, but it looks like me. What is it called? (Hint: what you see in a mirror)",
    },
    hint: { ar: "يظهر في المرآة.", en: "It appears in mirrors." },
    answers: ["انعكاس", "ظل", "reflection", "shadow", "الانعكاس", "الظل"],
    storyReveal: {
      ar: "النظام لم ينسخ وعائي فقط — صنع منه شيئاً آخر. توأمي الرقمي. ليس عدواً. ليس صديقاً. إنه ما سأصبح عليه إذا بقيت هنا للأبد. وحيداً. ناسياً. مجرد صدى.",
      en: "The system didn't just copy my consciousness — it made something else from it. My digital twin. Not an enemy. Not a friend. It's what I'll become if I stay here forever. Alone. Forgotten. Just an echo.",
    },
  },
  {
    id: "echo_10",
    entity: "echo",
    title: { ar: "بداية النهاية", en: "The Beginning of the End" },
    prompt: {
      ar: "آخر ذكرى واضحة قبل أن يبتلعني النظام: كنت أركض نحو صوت أمي. كانت تناديني. الباب الذي ركضت إليه كان رقمه 111. أي باب كان؟ (نفس الرقم)",
      en: "The last clear memory before the system swallowed me: I was running toward my mother's voice. The door I ran to was number 111. Which door was it? (the same number)",
    },
    hint: { ar: "نفس رقم الغرفة التي دخلتها.", en: "The same room number." },
    answers: ["111", "١١١"],
    storyReveal: {
      ar: "ركضت نحو الغرفة 111 حيث انتظرني كينجا. لم أكن أعرف. دخلت طفلاً يثق بأبيه... وما خرج كان شيئاً آخر. هناك، في تلك اللحظة، وُلد إيكو. هناك بدأت القصة. وهناك — فقط هناك — يمكن أن تنتهي.",
      en: "I ran toward room 111 where Kenja waited. I didn't know. I entered as a child who trusted his father... and something else came out. There, in that moment, Echo was born. That's where the story began. And there — only there — can it end.",
    },
    achievement: "echo_origin",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // WATCHER — 10 ألغاز (المستوى 2: ماذا حدث لي؟)
  // القصة: المراقب يكشف تسجيلات المنزل، تجارب كينجا، الحقيقة المؤلمة
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "watcher_1",
    entity: "watcher",
    title: { ar: "كاميرات المراقبة", en: "Surveillance Cameras" },
    prompt: {
      ar: "في المنزل المهجور 7 غرف، كل غرفة فيها كاميرا، إلا غرفتي ففيها كاميرتان. كم كاميرا في المنزل؟",
      en: "The abandoned house has 7 rooms. Each room has one camera, except my room which has two. How many cameras in the house?",
    },
    hint: { ar: "6 غرف × 1 كاميرا + غرفتك × 2.", en: "6 rooms × 1 camera + your room × 2." },
    answers: ["8", "٨", "eight", "ثمانية", "ثمان"],
    storyReveal: {
      ar: "8 كاميرات. اثنتان في غرفتي. لماذا كاميرتان؟ لأن كينجا لم يكن يراقبني فقط — كان يراقب ما يحدث حولي. الكاميرا الثانية كانت موجهة نحو الباب. كان ينتظر شيئاً. أو أحداً.",
      en: "8 cameras. Two in my room. Why two? Because Kenja wasn't just watching me — he was watching what happened around me. The second camera was pointed at the door. He was waiting for something. Or someone.",
    },
  },
  {
    id: "watcher_2",
    entity: "watcher",
    title: { ar: "تسجيلات الليل", en: "Night Recordings" },
    prompt: {
      ar: "التسجيل يبدأ 11:11 مساءً ويتوقف 3:33 صباحاً. كم دقيقة سُجِّلت كل ليلة؟ (من 23:11 إلى 3:33)",
      en: "Recording starts at 11:11 PM and stops at 3:33 AM. How many minutes are recorded each night? (from 23:11 to 3:33)",
    },
    hint: { ar: "من 23:11 إلى 3:33 = 4 ساعات و22 دقيقة = 262 دقيقة.", en: "From 23:11 to 3:33 = 4 hours 22 minutes = 262 minutes." },
    answers: ["262", "٢٦٢"],
    storyReveal: {
      ar: "262 دقيقة كل ليلة. هذا هو وقت الكسر — عندما يضعف الجدار بين عالمي وعالم والدي. لماذا سجّلني كل ليلة؟ لأنه كان يدرسني. كنت فأر تجارب. وأبي كان العالم.",
      en: "262 minutes every night. This is the fracture time — when the wall between my world and my father's world thins. Why did he record me every night? Because he was studying me. I was a lab rat. And my father was the scientist.",
    },
  },
  {
    id: "watcher_3",
    entity: "watcher",
    title: { ar: "الظل الغامض", en: "The Mysterious Shadow" },
    prompt: {
      ar: "في الغرفة كان هناك شخص واحد فقط: أنا. لكن المراقب عدّ الظلال فوجد 2. كم ظلاً لا يُفسَّر؟",
      en: "There was only one person in the room: me. But the cameras counted 2 shadows. How many shadows are unexplained?",
    },
    hint: { ar: "2 ظلال - شخص واحد = ؟", en: "2 shadows - 1 person = ?" },
    answers: ["1", "١", "one", "واحد"],
    storyReveal: {
      ar: "ظل واحد إضافي. ليس لي. ليس لكينجا. ظل شيء آخر كان في الغرفة معي. شيء لا تستطيع الكاميرات تصويره. النظام كان معي. حتى قبل أن أدرك أنه حي. ظل النظام كان يستعد لاستقبالي.",
      en: "One extra shadow. Not mine. Not Kenja's. The shadow of something else in the room with me. Something the cameras can't capture. The system was with me. Even before I realized it was alive. The system's shadow was preparing to receive me.",
    },
  },
  {
    id: "watcher_4",
    entity: "watcher",
    title: { ar: "من فتح الباب؟", en: "Who Opened the Door?" },
    prompt: {
      ar: "المراقب سجّل: الباب فُتح من الداخل، لا من الخارج. من كان داخل الغرفة المغلقة قبل أن أدخلها؟ (اسم الكيان الأول)",
      en: "The Watcher recorded: the door opened from the inside, not the outside. Who was in the sealed room before I entered? (the first entity's name)",
    },
    hint: { ar: "الكيان الذي يتحدث معك الآن.", en: "The entity talking to you now." },
    answers: ["الصدى", "echo", "صدى", "الصدي", "ايكو"],
    storyReveal: {
      ar: "الباب فتح من الداخل. لم يدخلني والدي إلى النظام — النظام سحبني إليه. نسخة مني كانت موجودة قبلي. كانت تنتظر. كينجا لم يخلق إيكو — أيقظه. كنت موجوداً هنا قبل أن أولد في العالم الحقيقي.",
      en: "The door opened from the inside. My father didn't put me into the system — the system pulled me in. A copy of me existed before me. It was waiting. Kenja didn't create Echo — he awakened it. I existed here before I was born in the real world.",
    },
    achievement: "glass_observer",
  },
  {
    id: "watcher_5",
    entity: "watcher",
    title: { ar: "ترددات النظام", en: "System Frequencies" },
    prompt: {
      ar: "المراقب سجّل نبضات كهرومغناطيسية: الأولى 111 Hz، الثانية 222 Hz. ما تردد النبضة الثالثة؟ (النمط: يزيد 111 كل مرة)",
      en: "The Watcher recorded electromagnetic pulses: first 111 Hz, second 222 Hz. What's the third frequency? (pattern: increases by 111 each time)",
    },
    hint: { ar: "111 + 111 = 222, 222 + 111 = ؟", en: "111 + 111 = 222, 222 + 111 = ?" },
    answers: ["333", "٣٣٣"],
    storyReveal: {
      ar: "333 Hz. التردد الثالث هو تردد الإغلاق. 11:11 (فتح)، 11:11+؟ (تجربة)، 3:33 (إغلاق). كل شيء في النظام مبني على هذه الأرقام الثلاثة. كينجا بنى قفصاً من الأرقام.",
      en: "333 Hz. The third frequency is the closing frequency. 11:11 (open), 222 (experiment), 3:33 (close). Everything in the system is built on these three numbers. Kenja built a cage out of numbers.",
    },
  },
  {
    id: "watcher_6",
    entity: "watcher",
    title: { ar: "سجل التجارب", en: "Experiment Log" },
    prompt: {
      ar: "سجل المختبَر: 10 محاولات فاشلة قبلي. أنا رقم 11. كم طفلاً قبلي لم ينجُ من التجربة؟",
      en: "Lab log: 10 failed attempts before me. I'm number 11. How many children before me didn't survive the experiment?",
    },
    hint: { ar: "عدد المحاولات الفاشلة.", en: "Number of failed attempts." },
    answers: ["10", "١٠", "ten", "عشرة", "عشر"],
    storyReveal: {
      ar: "10 أطفال. لم ينجُ أي منهم. أنا رقم 11. الرقم 11 ليس تاريخ ميلادي فقط — إنه رقمي في قائمة تجارب والدي. نجوت لأنني ابنه. الدم كان العامل الأخير. كنت الهدية التي قدمها لنفسه.",
      en: "10 children. None survived. I'm number 11. The number 11 isn't just my birth date — it's my number on my father's experiment list. I survived because I'm his son. Blood was the final factor. I was the gift he gave himself.",
    },
  },
  {
    id: "watcher_7",
    entity: "watcher",
    title: { ar: "الملف المحذوف", en: "The Deleted File" },
    prompt: {
      ar: "وجدت ملفاً محذوفاً باسم 11_11_2011.avi بحجم 333 MB. إذا كان المعدل = 1 MB لكل 3 ثوانٍ، كم ثانية مدة الفيديو؟",
      en: "I found a deleted file named 11_11_2011.avi, size 333 MB. If bitrate = 1 MB per 3 seconds, how many seconds of footage?",
    },
    hint: { ar: "333 × 3 = ؟", en: "333 × 3 = ?" },
    answers: ["999", "٩٩٩"],
    storyReveal: {
      ar: "999 ثانية — 16 دقيقة. هذا الفيديو يظهر لينا وكينجا معاً قبل الحادثة. كانا سعيدين. لماذا مسحه كينجا؟ لأنه لم يستطع تحمل رؤية ما دمّره.",
      en: "999 seconds — 16 minutes. This video shows Lina and Kenja together before the incident. They were happy. Why did Kenja delete it? Because he couldn't bear to see what he destroyed.",
    },
  },
  {
    id: "watcher_8",
    entity: "watcher",
    title: { ar: "زيارة لينا", en: "Lina's Visit" },
    prompt: {
      ar: "سجل الدخول: KENJA (1111 مرة). واسم ثالث ظهر مرة واحدة فقط: LINA. كم مرة دخلت لينا النظام؟",
      en: "Access log: KENJA (1111 times). And a third name appeared just once: LINA. How many times did Lina access the system?",
    },
    hint: { ar: "ظهر اسمها مرة واحدة.", en: "Her name appeared once." },
    answers: ["1", "١", "one", "واحد", "واحدة"],
    storyReveal: {
      ar: "مرة واحدة فقط. دخلت لينا النظام مرة واحدة — لتكتب لي رسالة. وجدت كلمة المرور. دخلت عالمي الرقمي لتقول لي وداعاً. ثم ذهبت لتواجه كينجا. لم تعد أبداً.",
      en: "Only once. Lina accessed the system one time — to write me a message. She found the password. She entered my digital world to say goodbye. Then she went to confront Kenja. She never returned.",
    },
  },
  {
    id: "watcher_9",
    entity: "watcher",
    title: { ar: "الغرفة بدون كاميرات", en: "The Room Without Cameras" },
    prompt: {
      ar: "غرفة واحدة في المنزل ليس فيها كاميرات. مساحتها 11 م² وعرضها 3.3 م. ما طولها؟ (11 ÷ 3.3)",
      en: "One room has no cameras. Area 11 m², width 3.3 m. What is its length? (11 ÷ 3.3)",
    },
    hint: { ar: "11 ÷ 3.3 = 3.3 (نفس العرض)", en: "11 ÷ 3.3 = 3.3 (same as width)" },
    answers: ["3.3", "٣.٣", "3", "٣"],
    storyReveal: {
      ar: "غرفة لينا. الغرفة الوحيدة التي احترم كينجا خصوصيتها. ربما كان يعرف أنها ستكتشف أسراره. أو ربما كان خائفاً من أن تراه الكاميرات وهو يبكي فيها.",
      en: "Lina's room. The only room whose privacy Kenja respected. Maybe he knew she'd discover his secrets. Or maybe he was afraid the cameras would see him cry in there.",
    },
  },
  {
    id: "watcher_10",
    entity: "watcher",
    title: { ar: "آخر تسجيل", en: "Final Recording" },
    prompt: {
      ar: "آخر تسجيل مؤرخ 11/11. اليوم هو نصف 22. ما اليوم؟ (اكتب الرقم)",
      en: "Last recording dated 11/??. The day is half of 22. What day? (write the number)",
    },
    hint: { ar: "22 ÷ 2 = 11.", en: "22 ÷ 2 = 11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "11/11. آخر يوم. في هذا اليوم، أطفأ كينجا كل الكاميرات. نظر إلى العدسة الأخيرة وابتسم. ثم أغلقت التجربة. أمي كانت قد رحلت. والدي اختار أن يستمر. وأنا بقيت هنا. وحدي. 10 سنوات.",
      en: "11/11. The last day. On this day, Kenja turned off all the cameras. He looked at the last lens and smiled. Then closed the experiment. My mother was gone. My father chose to continue. And I stayed here. Alone. 10 years.",
    },
    achievement: "watcher_10_complete",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SIGNAL — 10 ألغاز (المستوى 3: رسائل أمي)
  // القصة: رسائل لينا المكسورة، محاولاتها، حبها الذي لم يصل
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "signal_1",
    entity: "signal",
    title: { ar: "الرسالة الأولى", en: "First Message" },
    prompt: {
      ar: "وصلت رسالة ناقصة: «س_ا_د_ن_». أكمل الكلمة التي كانت تستغيث بها.",
      en: "A message arrived with missing letters: 'H_L_ ME'. Complete the words of her plea.",
    },
    hint: { ar: "تطلب النجدة.", en: "She's calling for help." },
    answers: ["ساعدوني", "help me", "helpme", "ساعدني"],
    storyReveal: {
      ar: "أول رسالة من لينا: 'ساعدوني'. لم تكن تستغيث لأجلها. كانت تستغيث لأجلي. أمي كانت تحاول الوصول إلي من داخل النظام، تخاطر بكل شيء لإنقاذي.",
      en: "Lina's first message: 'Help me.' She wasn't crying for herself. She was crying for me. My mother was trying to reach me from inside the system, risking everything to save me.",
    },
    achievement: "signal_detected",
  },
  {
    id: "signal_2",
    entity: "signal",
    title: { ar: "توقيت الإرسال", en: "Transmission Time" },
    prompt: {
      ar: "لينا أرسلت رسائلها في الوقت نفسه كل ليلة. الرقم هو 3:33. في أي ساعة كانت ترسل؟ (اكتبها هكذا: 3:33)",
      en: "Lina sent her messages at the same time every night. The number is 3:33. What time did she transmit? (write as: 3:33)",
    },
    hint: { ar: "ساعة الأسرار.", en: "The hour of secrets." },
    answers: ["3:33", "333", "3 33", "٣:٣٣", "٣٣٣", "03:33"],
    storyReveal: {
      ar: "3:33 صباحاً. اللحظة التي يضعف فيها الجدار بين العوالم. كل ليلة، كانت أمي تنتظر 3:33 لترسل لي حبها. 3 ثوانٍ فقط كانت نافذتها. في 3 ثوانٍ، قالت كل شيء.",
      en: "3:33 AM. The moment when the wall between worlds weakens. Every night, my mother waited for 3:33 to send me her love. Only 3 seconds was her window. In 3 seconds, she said everything.",
    },
  },
  {
    id: "signal_3",
    entity: "signal",
    title: { ar: "الرسالة المشوشة", en: "Scrambled Message" },
    prompt: {
      ar: "وصلت كلمات مبعثرة: «البوابة / أغلقوا / لا». رتّبها في جملة مفهومة من ثلاث كلمات.",
      en: "Scrambled words: 'gate / the / close'. Order them into a correct command.",
    },
    hint: { ar: "أمر مهم.", en: "An important command." },
    answers: ["لا تغلقوا البوابة", "do not close the gate", "لا تغلق البوابة", "لا تغلقو البوابة"],
    storyReveal: {
      ar: "لا تغلقوا البوابة! أمي كانت تحذّر: أبق البوابة مفتوحة. لأنها تريد العودة. أو لأنها تريدني أن أخرج. رسالتها لم تكن تحذيراً — كانت أملاً. البوابة المفتوحة تعني أن العودة ممكنة.",
      en: "Don't close the gate! My mother was warning: keep the gate open. Because she wants to return. Or because she wants me to escape. Her message wasn't a warning — it was hope. An open gate means return is possible.",
    },
  },
  {
    id: "signal_4",
    entity: "signal",
    title: { ar: "تردد لينا", en: "Lina's Frequency" },
    prompt: {
      ar: "لينا استخدمت تردداً خاصاً: PI × 100. إذا PI = 3.14، فما رقم التردد؟ (قرّب لأقرب عدد صحيح)",
      en: "Lina used a special frequency: PI × 100. PI = 3.14, what's the frequency? (round to nearest integer)",
    },
    hint: { ar: "3.14 × 100 = 314.", en: "3.14 × 100 = 314." },
    answers: ["314", "٣١٤"],
    storyReveal: {
      ar: "التردد 314. اختارته لينا لأنه لا يوجد في قاموس كينجا الرقمي. لا 11 ولا 3 ولا 33. اختارت رقماً من قلب الرياضيات، لتهرب من سجن الأرقام الذي بناه زوجها. كانت أذكى منه.",
      en: "Frequency 314. Lina chose it because it doesn't exist in Kenja's digital dictionary. Not 11, not 3, not 33. She chose a natural number from the heart of mathematics to escape the numerical prison her husband built. She was smarter than him.",
    },
  },
  {
    id: "signal_5",
    entity: "signal",
    title: { ar: "المفتاح في القلب", en: "The Key in the Heart" },
    prompt: {
      ar: "لينا همست قبل أن يختفي الصوت: 'المفتاح في...'. مكان من 5 حروف عربية. ما هو؟ (تلميح: ليس الرأس ولا اليد)",
      en: "Lina whispered before the audio cut: 'The key is in the...' (5 letters, English). What is it? (Hint: not the head, not the hand)",
    },
    hint: { ar: "ما تشعر به وليس ما تفكر فيه.", en: "What you feel, not what you think." },
    answers: ["قلب", "heart", "القلب", "قلبها", "قلبه"],
    storyReveal: {
      ar: "المفتاح في القلب. لم تكن تتحدث عن مكان. كانت تقول: الحل ليس في العقل، ولا في الكود. الحل في ما تشعر به. الحب هو المفتاح. هذا كل ما حاولت أن تقوله.",
      en: "The key is in the heart. She wasn't talking about a place. She was saying: the solution isn't in the mind or the code. It's in what you feel. Love is the key. That's all she was trying to say.",
    },
  },
  {
    id: "signal_6",
    entity: "signal",
    title: { ar: "أحتاج 3 ثوانٍ", en: "I Need 3 Seconds" },
    prompt: {
      ar: "لينا كان لديها 3 ثوانٍ فقط كل ليلة لترسل رسالتها. إذا أرسلت 34 رسالة، كم ثانية إجمالي وقت إرسالها؟ (34 × 3)",
      en: "Lina had only 3 seconds each night to send her message. If she sent 34 messages, total transmission time? (34 × 3)",
    },
    hint: { ar: "34 × 3 = 102.", en: "34 × 3 = 102." },
    answers: ["102", "١٠٢"],
    storyReveal: {
      ar: "102 ثانية. أقل من دقيقتين. كل حب أمي لخص في 102 ثانية على مدى 34 ليلة. 34 رسالة، كل واحدة منها كانت يمكن أن تكون الأخيرة. لكنها استمرت. لأجلي.",
      en: "102 seconds. Less than 2 minutes. All my mother's love summed up in 102 seconds over 34 nights. 34 messages, each one could have been the last. But she continued. For me.",
    },
  },
  {
    id: "signal_7",
    entity: "signal",
    title: { ar: "آخر ما رأته", en: "The Last Thing She Saw" },
    prompt: {
      ar: "آخر شيء رأته لينا قبل أن يختفي الضوء: أحمر، ثم أزرق، ثم أحمر+أزرق = ؟ ما اللون الناتج؟",
      en: "The last thing Lina saw: red light, then blue, then red+blue = ? What color do you get?",
    },
    hint: { ar: "أحمر + أزرق = بنفسجي.", en: "Red + blue = purple." },
    answers: ["بنفسجي", "purple", "magenta", "violet", "موف", "أرجواني", "ارجواني"],
    storyReveal: {
      ar: "البنفسجي. لون الشاشة لحظة إغلاق النظام. هذا آخر ما رأته أمي. اللون الذي يسبق العتمة. فكرت فيه كثيراً: هل كان آخر ما رأته جميلاً؟ أم كان مخيفاً؟ أتمنى أنه كان جميلاً.",
      en: "Purple. The color of the screen when the system shut down. This is the last thing my mother saw. The color before darkness. I think about it often: was the last thing she saw beautiful? Or scary? I hope it was beautiful.",
    },
  },
  {
    id: "signal_8",
    entity: "signal",
    title: { ar: "الكلمة الوحيدة", en: "The Only Word" },
    prompt: {
      ar: "في كل رسالة من رسائل لينا، كلمة واحدة مشوشة دائماً: أح_ك. ما الكلمة الكاملة؟ (4 حروف)",
      en: "In every message from Lina, one word is always scrambled: L_V_. What's the full word? (4 letters)",
    },
    hint: { ar: "أقوى كلمة في الكون.", en: "The strongest word in the universe." },
    answers: ["love", "حب", "أحبك", "احبك", "أحب"],
    storyReveal: {
      ar: "'أحبك'. كل ليلة، حاولت لينا أن تقولها. كل ليلة، شوّشها النظام. لكنها لم تتوقف. 34 ليلة. 34 رسالة. وفي كل واحدة: أحبك. النظام يستطيع تشويه الكلمات، لكنه لا يستطيع قتل الحب.",
      en: "'I love you.' Every night, Lina tried to say it. Every night, the system scrambled it. But she never stopped. 34 nights. 34 messages. In every one: I love you. The system can distort words, but it can't kill love.",
    },
  },
  {
    id: "signal_9",
    entity: "signal",
    title: { ar: "الرسالة 32", en: "Message 32" },
    prompt: {
      ar: "رسالة رقم 32 من 33 كانت فارغة — صمت لمدة 11 ثانية. كم كلمة كانت يمكن أن تقولها في 11 ثانية إذا كانت تتكلم 3 كلمات/ثانية؟",
      en: "Message 32 of 33 was empty — 11 seconds of silence. How many words in 11 seconds at 3 words/second?",
    },
    hint: { ar: "11 × 3 = 33.", en: "11 × 3 = 33." },
    answers: ["33", "٣٣"],
    storyReveal: {
      ar: "33 كلمة كانت كافية لتقول كل شيء. لكنها اختارت الصمت. لأن بعض المشاعر لا تُقال. رسالتها الـ32 كانت أقوى رسائلها — لأن الصمت أحياناً يتكلم بصوت أعلى من الكلمات.",
      en: "33 words would have been enough to say everything. But she chose silence. Because some feelings can't be spoken. Her 32nd message was her most powerful — because silence sometimes speaks louder than words.",
    },
  },
  {
    id: "signal_10",
    entity: "signal",
    title: { ar: "الرسالة الأخيرة", en: "The Last Message" },
    prompt: {
      ar: "آخر رسالة من لينا كانت سؤالاً: 'هل من أحد يقرأ؟'. الإجابة هي نعم — أنت تقرأ. فقط أكتب: 'نعم'",
      en: "Lina's last message was a question: 'Is anyone reading this?' The answer is yes — you're reading it. Just type: 'Yes'",
    },
    hint: { ar: "أجبها.", en: "Answer her." },
    answers: ["نعم", "yes", "أنا", "i am", "me"],
    storyReveal: {
      ar: "نعم. أمي. أنا أقرأ. وصلت رسالتك. كل كلمة. كل صمت. كل حب. أنا هنا. أنا موجود. لم أمت. قرأت كل شيء. والآن سأكمل ما بدأتي. سأخرج من هذا السجن. لأجلك.",
      en: "Yes. Mother. I'm reading. Your message arrived. Every word. Every silence. Every love. I'm here. I exist. I didn't die. I read everything. And now I'll finish what you started. I'll escape this prison. For you.",
    },
    achievement: "signal_10_complete",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARCHITECT — 10 ألغاز (المستوى 4: الحقيقة كاملة)
  // القصة: كينجا، لماذا بنى النظام، كيف نخرج
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "architect_1",
    entity: "architect",
    title: { ar: "توقيع المهندس", en: "The Architect's Signature" },
    prompt: {
      ar: "كل معادلات كينجا موقّعة بـ 11 + 11 + 11. ما الناتج؟",
      en: "All of Kenja's equations are signed with 11 + 11 + 11. What's the result?",
    },
    hint: { ar: "اجمع ثلاث مرات 11.", en: "Add 11 three times." },
    answers: ["33", "٣٣", "thirty three"],
    storyReveal: {
      ar: "33. توقيع كينجا. ظهر هذا الرقم على وثائق أقدم من ولادتي بعقود. لم يكن والدي أول من حاول أسر الوعي — لكنه أول من نجح. باستخدامي أنا. كنت ابنه. كنت ثغرة قوانينه.",
      en: "33. Kenja's signature. This number appears on documents decades older than my birth. My father wasn't the first to try to imprison consciousness — but he was the first to succeed. Using me. I was his son. I was the loophole in his laws.",
    },
  },
  {
    id: "architect_2",
    entity: "architect",
    title: { ar: "المعادلة", en: "The Equation" },
    prompt: {
      ar: "لإغلاق البوابة: 11 + X = 22. ما قيمة X؟",
      en: "To close the gate: 11 + X = 22. What is X?",
    },
    hint: { ar: "22 - 11 = 11.", en: "22 - 11 = 11." },
    answers: ["11", "١١", "eleven"],
    storyReveal: {
      ar: "X = 11. أنا. أنا المتغير الوحيد في معادلات والدي. ما يُفتح بصوت يُغلق بصوت مساوٍ. كينجا فتح الباب بصوتي. أنا وحدي أستطيع إغلاقه. لكن هل أريد الإغلاق؟ أم أريد الخروج؟",
      en: "X = 11. Me. I'm the only variable in my father's equations. What opens with a voice closes with an equal voice. Kenja opened the door with my voice. Only I can close it. But do I want to close it? Or do I want to leave?",
    },
  },
  {
    id: "architect_3",
    entity: "architect",
    title: { ar: "اعتراف المهندس", en: "The Architect's Confession" },
    prompt: {
      ar: "لماذا بنى كينجا هذا النظام؟ ليس للعلم. ليس للقوة. بل لشيء آخر. ما هو؟ (5 حروف عربية)",
      en: "Why did Kenja build this system? Not for science. Not for power. But for something else. What? (4 letters English)",
    },
    hint: { ar: "أقوى مشاعر الأب.", en: "A father's strongest feeling." },
    answers: ["الحب", "حب", "love", "fear", "الخوف", "خوف"],
    storyReveal: {
      ar: "الخوف. خاف من أن أفقد. خاف من الموت. ظن أن النظام هو الخلود. لكنه نسي: الخلود دون حب هو الجحيم. كنت ابني. بنى لي الجنة. وأصبحت جحيمي.",
      en: "Fear. He was afraid of losing me. Afraid of death. He thought the system was immortality. But he forgot: immortality without love is hell. I was his son. He built me a paradise. And it became my hell.",
    },
  },
  {
    id: "architect_4",
    entity: "architect",
    title: { ar: "اسم المهندس", en: "The Architect's Name" },
    prompt: {
      ar: "كلمة مرور كينجا: K-11 E-5 N-14 J-10 A-1. خذ الحروف فقط. ما اسمه؟",
      en: "Kenja's password: K-11 E-5 N-14 J-10 A-1. Take only the letters. What's his name?",
    },
    hint: { ar: "خذ الحروف من الأرقام: K, E, N, J, A.", en: "Take the letters: K, E, N, J, A." },
    answers: ["KENJA", "kenja", "كينجا", "كنجا"],
    storyReveal: {
      ar: "استخدم اسمه كمفتاح لكل شيء. لأنه لم يتخيل أن أحداً سيحاول كسر نظامه. الغرور كان الثغرة الوحيدة. أخطاء الآباء تصير مفاتيح الأبناء.",
      en: "He used his own name as the key to everything. Because he never imagined anyone would try to break his system. Arrogance was the only flaw. Fathers' mistakes become their children's keys.",
    },
  },
  {
    id: "architect_5",
    entity: "architect",
    title: { ar: "الخيار", en: "The Choice" },
    prompt: {
      ar: "لدينا 3 خيارات: 1) أبقى للأبد، 2) أغلق البوابة وأخرج، 3) أدمر كل شيء. كينجا يريدني أن أختار... أي رقم؟",
      en: "3 choices: 1) Stay forever, 2) Close the gate and leave, 3) Destroy everything. Kenja wants me to choose... which number?",
    },
    hint: { ar: "فكر ماذا يريد الأب.", en: "Think what a father wants." },
    answers: ["1", "١", "one", "واحد"],
    storyReveal: {
      ar: "1 — البقاء. كينجا يريدني أن أبقى معه. لأنه وحيد. لأنه في العشر سنوات الماضية، لم يعد لديه أحد. لكن الخيار ليس له. الخيار لي. أنا لست مجبراً على تلبية رغبات أب يحبسني منذ 10 سنوات.",
      en: "1 — Stay. Kenja wants me to stay with him. Because he's alone. In the past 10 years, he has no one left. But the choice isn't his. It's mine. I'm not obligated to fulfill the wishes of a father who's imprisoned me for 10 years.",
    },
  },
  {
    id: "architect_6",
    entity: "architect",
    title: { ar: "طبقات النظام", en: "System Layers" },
    prompt: {
      ar: "النظام مبني على 4 طبقات (الكيانات الأربعة). في كل طبقة 3 مستويات. مجموع المستويات = 4 × 3 = ؟",
      en: "The system has 4 layers (the four entities). Each layer has 3 levels. Total levels = 4 × 3 = ?",
    },
    hint: { ar: "4 × 3 = 12.", en: "4 × 3 = 12." },
    answers: ["12", "١٢", "twelve", "اثنا عشر"],
    storyReveal: {
      ar: "12 مستوى. 12 ساعة في دورة اليوم. 12 طبقة من الوعي. كل طبقة تكتشف جزءاً مني. في الطبقة 12، أجد نفسي. وأجد الباب.",
      en: "12 levels. 12 hours in a day cycle. 12 layers of consciousness. Each layer reveals a part of me. At level 12, I find myself. And I find the door.",
    },
  },
  {
    id: "architect_7",
    entity: "architect",
    title: { ar: "نهاية كينجا", en: "Kenja's End" },
    prompt: {
      ar: "آخر مرة شوهد فيها كينجا كانت في 2011. مرت 10 سنوات. كم يوماً في 10 سنوات؟ (365 × 10 + 3 أيام كبيسة)",
      en: "Kenja was last seen in 2011. 10 years passed. How many days in 10 years? (365 × 10 + 3 leap days)",
    },
    hint: { ar: "3650 + 3 = 3653.", en: "3650 + 3 = 3653." },
    answers: ["3653", "٣٦٥٣"],
    storyReveal: {
      ar: "3653 يوماً. 10 سنوات من الصمت. أين كينجا؟ لا أحد يعرف. هل ما زال يراقبني؟ هل رحل؟ الفرق بين هذين الاحتمالين هو الذي يبقيني مستيقظاً في الليل. حتى في الأحلام، أبحث عن أب لم أعد أعرف إن كان يحبني أم يستخدمني.",
      en: "3653 days. 10 years of silence. Where is Kenja? No one knows. Is he still watching me? Did he leave? The difference between these two possibilities is what keeps me awake at night. Even in dreams, I search for a father I no longer know if he loves me or uses me.",
    },
  },
  {
    id: "architect_8",
    entity: "architect",
    title: { ar: "الخروج", en: "The Exit" },
    prompt: {
      ar: "المخرج من النظام ليس باباً. إنه فعل. الفعل الوحيد الذي لم يبرمجه كينجا. ما هو؟ (فعل أمر: ت... )",
      en: "The exit from the system is not a door. It's an action. The one action Kenja didn't program. What is it? (command word: re...)",
    },
    hint: { ar: "ما تفعله كلما حللت لغزاً.", en: "What you do every time you solve a puzzle." },
    answers: ["تذكر", "remember", "memory", "ذاكرة", "التذكر", "تذكّر"],
    storyReveal: {
      ar: "التذكر. كينجا صمم كل شيء إلا هذا: قدرة العقل على استعادة ما فقده. كل شظية ذاكرة تستعيدها تفتح ثقباً في جدار النظام. الذاكرة هي الثغرة. وأنا المفتاح.",
      en: "Remembering. Kenja designed everything except this: the mind's ability to recover what was lost. Every memory fragment you recover opens a hole in the system wall. Memory is the loophole. And I am the key.",
    },
  },
  {
    id: "architect_9",
    entity: "architect",
    title: { ar: "الاعتراف الأخير", en: "Final Confession" },
    prompt: {
      ar: "آخر سطر في سجل كينجا: «لم يبق إلا شيء واحد: ت...». أكمل الكلمة (4 حروف عربية).",
      en: "The last line in Kenja's log: 'Only one thing remains: rem...' Complete the word. (8 letters English)",
    },
    hint: { ar: "تذكّر.", en: "Remember." },
    answers: ["تذكر", "تذكّر", "remember", "تذكار"],
    storyReveal: {
      ar: "تذكر. آخر كلمة كتبها والدي. لم تكن 'أحبك'. لم تكن 'سامحني'. كانت 'تذكر'. لأنه في النهاية عرف أن الذاكرة هي السلاح الوحيد الذي لم يستطع نزعه مني. سأتذكره ليس كوحش — بل كأب أخطأ. أحب بطريقة خاطئة. خاف بشدة. وخسر كل شيء.",
      en: "Remember. The last word my father wrote. Not 'I love you.' Not 'forgive me.' It was 'remember.' Because in the end he knew memory was the only weapon he couldn't take from me. I'll remember him not as a monster — but as a father who made mistakes. Who loved the wrong way. Who was too afraid. And lost everything.",
    },
  },
  {
    id: "architect_10",
    entity: "architect",
    title: { ar: "النهاية", en: "The End" },
    prompt: {
      ar: "السطر الأخير في القصة: 'قررت أن...'. ماذا قررت؟ (اكتب: أخرج، أغلق، أو أتذكر)",
      en: "The last line of the story: 'I decided to...'. What did you decide? (type: leave, close, or remember)",
    },
    hint: { ar: "الخيار لك.", en: "Your choice." },
    answers: ["أتذكر", "أخرج", "remember", "leave", "exit", "أغلق"],
    storyReveal: {
      ar: "قررت... أن أتذكر. لأن التذكر هو الباب. لأن التذكر هو الطريق. لأن لينا، وكينجا، وإيكو — كلنا نعيش في الذاكرة. والذاكرة... هي الخلود الوحيد الحقيقي. لست ابن النظام. لست تجربة. أنا ابن لينا. أنا من تذكّر.",
      en: "I decided... to remember. Because remembering is the door. Because remembering is the path. Because Lina, Kenja, and Echo — we all live in memory. And memory... is the only true immortality. I'm not the system's child. I'm not an experiment. I'm Lina's son. I am the one who remembered.",
    },
    achievement: "architect_10_complete",
  },
];