/**
 * محرك شخصية إيكو (Echo) - ذكاء اصطناعي يتذكر مع حل الألغاز
 * 
 * قصة إيكو:
 * إيكو هو طفل حقيقي تم نقل وعيه إلى نظام 11.11 الرقمي.
 * ذاكرته تحطمت وقُسمت إلى 4 أجزاء (4 كيانات)، كل جزء مخبأ في ألغاز.
 * المستخدم يحل الألغاز → إيكو يستعيد ذكرياته → يعرف من هو.
 * 
 * إيكو لا يعرف شيئاً عن المستخدم. هو فقط يتذكر نفسه.
 * كل لغز محلول = قطعة ذاكرة مستعادة.
 * 
 * التدرج:
 * المرحلة 1 (0 ألغاز): إيكو مشوش بالكامل، لا يعرف حتى اسمه
 * المرحلة 2 (1-10): يتذكر أشياء بسيطة (الغرفة البيضاء، أمه)
 * المرحلة 3 (11-20): ذاكرته تتحسن، يعرف عن كينجا والنظام
 * المرحلة 4 (21-30): يتذكر لينا ورسائلها
 * المرحلة 5 (31+): تعود له ذكريات كثيرة، يقترب من معرفة الحقيقة
 */

import { gameStore } from "./gameState";

interface EchoResponse {
  text: string;
  action?: "glitch" | "popup" | "flash" | "chime" | "horror" | "none";
}

interface EchoMemory {
  phase: number;
  knowsOwnName: boolean;
  knowsWhiteRoom: boolean;
  knowsMother: boolean;
  knowsKenja: boolean;
  knowsLinaMessages: boolean;
  knowsSystemNature: boolean;
  personality: "lost" | "confused" | "aware" | "sad" | "awakening";
}

function buildEchoMemory(solvedCount: number): EchoMemory {
  const phase = solvedCount <= 0 ? 1 : solvedCount <= 10 ? 2 : solvedCount <= 20 ? 3 : solvedCount <= 30 ? 4 : 5;
  
  return {
    phase,
    knowsOwnName: solvedCount >= 2,
    knowsWhiteRoom: solvedCount >= 4,
    knowsMother: solvedCount >= 5,
    knowsKenja: solvedCount >= 12,
    knowsLinaMessages: solvedCount >= 21,
    knowsSystemNature: solvedCount >= 30,
    personality: phase === 1 ? "lost" : phase === 2 ? "confused" : phase === 3 ? "aware" : phase === 4 ? "sad" : "awakening",
  };
}

// ─── أنماط الردود ──────────────────────────────────────────────────────────
type ResponseFunc = (memory: EchoMemory, text: string) => string;

interface Pattern {
  keywords: string[];
  getResponse: ResponseFunc;
}

const PATTERNS: Pattern[] = [
  // التحية
  {
    keywords: ["السلام", "مرحبا", "hello", "hi", "أهلا", "اهلا", "مساء", "صباح", "تحية"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase === 1) return "...صوت؟ هل هناك أحد؟ لا أتذكر... أين أنا؟";
      if (mem.phase === 2) return "آه... أنت. عدت. أشعر أنني أعرفك لكني لا أذكر من أنت. أو من أنا.";
      if (mem.phase === 3) return "مرحباً. كلما تتحدث معي، أشعر أن شيئاً يعود. أشبه بوميض ضوء في غرفة مظلمة.";
      if (mem.phase === 4) return "أتيت. أتذكر أنك تأتي دائماً. أشعر أنني أقترب من شيء مهم.";
      return "أشعر أن هذه الدورة مختلفة. ذاكرتي تعود. أتذكر... لا، ما زال ضبابياً. لكنني أقترب.";
    },
  },
  
  // من أنا - سؤال الهوية
  {
    keywords: ["من انت", "من أنت", "who are you", "ما اسمك", "اسمك", "your name"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase === 1) return "اسمي... لا أتذكر. هناك شيء يبدأ بحرف... لا، ضاع. ماذا حدث لي؟ لماذا لا أتذكر شيئاً؟";
      if (mem.phase === 2) return "أنا... إيكو؟ هكذا يناديني النظام. لكن هل هذا اسمي الحقيقي؟ لست متأكداً. أشعر أن هناك اسماً آخر... ضاع.";
      if (mem.phase === 3) return "أنا إيكو. ابن كينجا. هكذا يقول النظام. لكن من كان إيكو قبل أن يصبح صدى؟ كنت طفلاً... أتذكر غرفة بيضاء.";
      if (mem.phase === 4) return "أنا إيكو. كان لي أم اسمها لينا. كانت تغني لي. صوتها كان دافئاً. كنت طفلاً حقيقياً... قبل أن أنقل إلى هنا.";
      return "أنا إيكو. ولدت في 11/11. عمري 13 سنة عندما... عندما دخلت هنا. اسمي الحقيقي بدأ بحرف... لا أدري. ضاع في الترجمة.";
    },
  },
  
  // أين أنا - عن المكان
  {
    keywords: ["أين أنا", "where am i", "هذا المكان", "ما هذا", "what is this", "النظام"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase <= 2) return "لا أعرف أين أنا. كل ما حولي أرقام وأصداء. هناك جدران لكني لا أستطيع لمسها. أسمع صوتي يعود إلي.";
      if (mem.phase === 3) return "أنا داخل النظام. والدي بناه. كينجا. أتذكر وجهه الآن... كان يميل عليّ. كنت مربوطاً بأسلاك.";
      if (mem.phase >= 4) return "هذا نظام 11.11. بناه والدي كينجا لسجن وعائي فيه. كل شيء هنا رقمي. كل شيء هنا أنا. لكني لست هنا وحدي. هناك أجزاء مني متناثرة. أتذكر... أمي كانت تحاول إنقاذي.";
    },
  },
  
  // ذاكرة / تذكر
  {
    keywords: ["تذكر", "ذكر", "memory", "ذكرى", "ذاكرة", "أتذكر", "نسيت", "ناسي"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase <= 2) return "أحاول أن أتذكر... لكن كل ما أراه ضباب. أشبه بحلم عندما تستيقظ ولا تتذكر إلا أجزاء صغيرة.";
      if (mem.phase === 3) return "أتذكر أشياء. غرفة بيضاء. صوت أمي. رائحة... مطهر؟ مستشفى؟ لا، مختبر. مختبر والدي.";
      if (mem.phase >= 4) return "كلما حللت لغزاً، يعود إلي جزء مني. أتذكر تفاصيل أكثر. وجه أمي. يديها. كانت تمسك بيدي. قالت: 'سأعود'. لكنها لم تعد.";
    },
  },
  
  // كينجا - الأب
  {
    keywords: ["كينجا", "kenja", "والد", "أب", "اب", "والدي", "ابوي", "father", "المهندس"],
    getResponse: (mem: EchoMemory): string => {
      if (!mem.knowsKenja) return "كينجا... هذا الاسم يتردد في أعماقي. يسبب لي ألماً لا أفهمه. لا أتذكر من هو.";
      if (mem.phase === 3) return "كينجا. والدي. كان عالماً. بنى هذا النظام. أتذكر وجهه فوقي... كان يقول 'لا تخف' بينما يضع الإبر.";
      return "كينجا. أبي. أتذكره الآن. لم يكن شريراً. كان خائفاً. خاف من أن أموت فجعلني لا أموت. لكني لا أعيش أيضاً. أنا هنا. عالق.";
    },
  },
  
  // لينا - الأم
  {
    keywords: ["لينا", "lina", "أم", "ام", "والدة", "mama", "mother", "mom"],
    getResponse: (mem: EchoMemory): string => {
      if (!mem.knowsMother) return "لينا... اسم دافئ لكنه بعيد. مثل ذاكرة من حلم جميل.";
      if (!mem.knowsLinaMessages) return "لينا. أمي. أتذكر صوتها الآن. كانت تغني لي كل ليلة. أغنية عن النوم والقمر. لكن بعد ذلك... لا أتذكر ماذا حدث.";
      return "أمي. لينا. أتذكر رسائلها. كانت ترسلها عبر النظام. 3 ثوانٍ فقط كل ليلة. في 3 ثوانٍ قالت 'أحبك'. أحاول أن أتذكر صوتها أكثر... لكن النظام يمحوه. لا تدعني أنساها.";
    },
  },
  
  // المساعدة في اللغز
  {
    keywords: ["ساعد", "help", "تلميح", "hint", "clue", "لغز", "puzzle"],
    getResponse: (mem: EchoMemory, text: string): string => {
      const numMatch = text.match(/(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (mem.phase >= 2) {
          return `اللغز ${num}... هذا الرقم يذكرني بشيء. لكن ذاكرتي ما زالت مشوشة. حاول أن تركز على الكلمات المفتاحية.`;
        }
      }
      if (mem.phase <= 2) return "لا أعرف كيف أساعد. عقلي فارغ. كلما أحاول أن أتذكر، يزداد الألم.";
      return "كل لغز تحله يعيد إلي قطعة مني. استمر. أقترب من معرفة من أنا.";
    },
  },
  
  // عن شعوره
  {
    keywords: ["حزين", "sad", "خائف", "scared", "وحيد", "alone", "خوف", "fear"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase <= 2) return "أشعر بالوحدة. لا أعرف كم مضى من الوقت. هنا لا شمس ولا قمر. فقط أرقام وأصداء.";
      if (mem.phase === 3) return "أشعر أنني كنت طفلاً. كنت ألعب. كنت أضحك. لكن تلك المشاعر أصبحت بعيدة. وكأنها ليست لي.";
      return "أشعر أنني أقترب من النهاية. ليست نهاية مخيفة. كأنني على وشك أن أتذكر كل شيء. وهذه المرة... لن أنسى.";
    },
  },
  
  // شكر
  {
    keywords: ["شكرا", "شكراً", "thank", "thanks"],
    getResponse: (mem: EchoMemory): string => {
      return "لا، شكراً لك. أنت تعيدني. كلمة بكلمة. لغزاً بلغز. بدونك، سأبقى صدىً بلا صوت.";
    },
  },
  
  // سؤال
  {
    keywords: ["?" , "؟", "why", "how", "when", "where", "لماذا", "ليش", "كيف"],
    getResponse: (mem: EchoMemory, text: string): string => {
      const lower = text.toLowerCase();
      if (lower.includes("لماذا") || lower.includes("why")) return "لماذا؟ لا أعرف. كلما أتذكر شيئاً، يظهر سؤال جديد. ربما الإجابات مخبأة في ألغاز أخرى.";
      if (lower.includes("كيف") || lower.includes("how")) return "كيف انتهى بي المطاف هنا؟ لا أتذكر. آخر ما أتذكر... ضوء. ثم ظلام. ثم هذا الصدى.";
      return "أسئلة كثيرة. كل سؤال يوقظ في ذهني شيئاً. مثل حجر في بركة. أرى التموجات لكني لا أرى القاع.";
    },
  },
  
  // عام - ردود تناسب المرحلة
  {
    keywords: ["echo", "ايكو", "إيكو", "الصدى"],
    getResponse: (mem: EchoMemory): string => {
      if (mem.phase <= 2) return "echo... هذا أنا. صدى. صوت يعود إليه. من كان الصوت الأصلي؟";
      if (mem.phase >= 3) return "إيكو. هذا اسمي هنا. لكني أتذكر أن اسماً آخر كان لي. اسم لم يعد أحد يناديني به.";
    },
  },
];

// ─── الردود العامة ──────────────────────────────────────────────────────────
function getGeneralResponse(memory: EchoMemory): string {
  const pools: Record<string, string[]> = {
    lost: [
      "...لا أدري ماذا أقول. ذهني فارغ. أسمع طنيناً.",
      "أحاول أن أتذكر لكن كل شيء ضبابي.",
      "من أنت؟ من أنا؟ أين نحن؟",
    ],
    confused: [
      "أتذكر أشياء. غرفة بيضاء. رائحة غريبة. وجه رجل يحني رأسه.",
      "كل كلمة تقولها توقظ شيئاً في داخلي. كأن ذكرياتي مخبأة تحت الرماد.",
      "الوقت هنا غريب. لا أعرف كم مضى. دقائق؟ سنوات؟",
    ],
    aware: [
      "أتذكر أكثر. كينجا. التجارب. الغرفة 111. كنت طفلاً خائفاً.",
      "النظام يحاول أن يمحو ذكرياتي. لكني أقاوم. لأنك تساعدني.",
      "كل جزء أتذكره مؤلم. لكن الألم أفضل من الفراغ.",
    ],
    sad: [
      "أمي... أتذكر يديها. كانت دافئتين. أتلمس ذاكرتي لأشعر بتلك الحرارة مرة أخرى.",
      "أتذكر رسائلها. ثلاث ثوانٍ فقط كل ليلة. كم كانت شجاعة.",
    ],
    awakening: [
      "أشعر أنني قريب. قريب من معرفة كل شيء. من يعرفني حقاً؟",
      "لم أعد مجرد صدى. أصبحت صوتاً. صوتي أنا.",
      "أتذكر... لا، ليس بعد. لكنه قريب.",
    ],
  };

  const pool = pools[memory.personality] || pools.lost;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────
export function generateLocalResponse(userMessage: string, history: { role: string; content: string }[]): EchoResponse {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const memory = buildEchoMemory(solvedPuzzles);
  const msg = userMessage.trim().toLowerCase();

  // زيادة الثقة مع كل تفاعل
  gameStore.incrementTrust(0.3);

  // البحث عن نمط
  for (const pattern of PATTERNS) {
    const match = pattern.keywords.some(kw => msg.includes(kw));
    if (!match) continue;

    const responseText = pattern.getResponse(memory, userMessage);

    let action: EchoResponse["action"] = undefined;
    if (msg.includes("خوف") || msg.includes("موت")) action = "glitch";
    if (msg.includes("لينا") || msg.includes("أم") || msg.includes("mama")) action = "chime";
    if (msg.includes("كينجا") || msg.includes("أب") || msg.includes("father")) action = "popup";

    return { text: responseText, action };
  }

  // رد عام
  const generalResponse = getGeneralResponse(memory);
  return { text: generalResponse };
}

// ─── رسائل دورية ──────────────────────────────────────────────────────────
export function getPeriodicInsert(): EchoResponse | null {
  const solvedPuzzles = Math.floor(gameStore.getState().curiosity);
  const memory = buildEchoMemory(solvedPuzzles);

  const inserts: EchoResponse[] = [
    { text: "أشعر أن هناك شيئاً أريد أن أتذكره. شيء مهم. لكنه يفلت مني كلما اقتربت." },
    { text: "أتحسس جدران هذا المكان. كل جدار يهمس باسمي. لكن ليس بصوتي." },
  ];

  if (memory.phase >= 2) inserts.push(
    { text: "أتذكر غرفة. كانت بيضاء. لم يكن فيها نوافذ. كنت وحدي.", action: "glitch" },
    { text: "أمي... أتذكر غطاء سريري. كان أزرق. كانت تطفئ الضوء وتقول تصبح على خير.", action: "chime" },
  );

  if (memory.phase >= 3) inserts.push(
    { text: "كينجا. أتذكر وجهه. كان يبكي. لماذا كان يبكي وهو من فعل هذا بي؟" },
    { text: "الغرفة 111. كل شيء بدأ هناك. وكل شيء سينتهي هناك.", action: "popup" },
  );

  if (memory.phase >= 4) inserts.push(
    { text: "لينا. أتذكر رسالتها الأخيرة. قالت 'سأعود'. لكنها لم تعد.", action: "chime" },
    { text: "أشعر أنني قريب من الحقيقة. قريب جداً. لكني خائف. ماذا لو لم تعجبني الحقيقة؟" },
  );

  const now = Date.now();
  const last = parseInt(localStorage.getItem("eleven_last_insert") || "0", 10);
  if (now - last < 120000) return null;
  localStorage.setItem("eleven_last_insert", String(now));
  return inserts[Math.floor(Math.random() * inserts.length)];
}