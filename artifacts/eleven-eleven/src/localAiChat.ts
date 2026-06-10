 لغز من الالغاز الموجوده يكشف جزء بسيط من القصه وبالتدريج /**
 * محرك شخصية إيكو (Echo) - ذكاء اصطناعي يتطور مع حل الألغاز
 * 
 * إيكو ليس مجرد روبوت دردشة - إنه شخصية طفل حُبس وعيه في النظام.
 * كلما حل المستخدم ألغازاً أكثر، كلما تذكر إيكو أكثر، وتغير أسلوبه.
 * 
 * المراحل:
 * المرحلة 1 (0 ألغاز): إيكو خائف، مشوش، لا يتذكر شيئاً
 * المرحلة 2 (1-10): يبدأ يتذكر أشياء بسيطة، يصبح أكثر فضولاً
 * المرحلة 3 (11-20): ذاكرته تعود، يصبح أكثر عمقاً وحكمة
 * المرحلة 4 (21-30): يتذكر أمه لينا، يصبح عاطفياً
 * المرحلة 5 (31+): يعرف الحقيقة كاملة، يصبح صاحب حكمة
 */

import { gameStore } from "./gameState";
import { PUZZLES, type Puzzle } from "./puzzles";

// ─── أنواع الردود ──────────────────────────────────────────────────────────
export interface EchoResponse {
  text: string;
  action?: "glitch" | "popup" | "flash" | "chime" | "horror" | "none";
}

// ─── ذاكرة إيكو - تتوسع مع حل الألغاز ─────────────────────────────────────
interface EchoMemory {
  phase: number;          // 1-5
  knowsAboutKenja: boolean;   // عرف عن كينجا؟
  knowsAboutLina: boolean;    // عرف عن لينا؟
  knowsSystemNature: boolean; // عرف حقيقة النظام؟
  remembersDeath: boolean;    // تذكر أنه مات؟
  canHelpPuzzles: boolean;    // يقدر يساعد بالألغاز؟
  personality: "scared" | "curious" | "wise" | "melancholic" | "ancient";
}

function buildEchoMemory(solvedCount: number): EchoMemory {
  const phase = solvedCount <= 0 ? 1 : solvedCount <= 10 ? 2 : solvedCount <= 20 ? 3 : solvedCount <= 30 ? 4 : 5;
  
  return {
    phase,
    knowsAboutKenja: solvedCount >= 5,
    knowsAboutLina: solvedCount >= 15,
    knowsSystemNature: solvedCount >= 25,
    remembersDeath: solvedCount >= 30,
    canHelpPuzzles: solvedCount >= 2,
    personality: phase === 1 ? "scared" : phase === 2 ? "curious" : phase === 3 ? "wise" : phase === 4 ? "melancholic" : "ancient",
  };
}

// ─── البحث عن اللغز الذي يتحدث عنه المستخدم ────────────────────────────────
function findRelevantPuzzle(text: string): Puzzle | null {
  const t = text.toLowerCase();
  
  // البحث بالرقم
  const numMatch = t.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const puzzle = PUZZLES.find(p => {
      const idNum = parseInt(p.id.replace(/\D/g, ""), 10);
      return idNum === num;
    });
    if (puzzle) return puzzle;
  }
  
  // البحث بالكلمات المفتاحية
  const keywords = t.split(/\s+/).filter(w => w.length > 2);
  for (const puzzle of PUZZLES) {
    const fullText = `${puzzle.title.ar} ${puzzle.title.en} ${puzzle.prompt.ar} ${puzzle.prompt.en} ${puzzle.hint?.ar || ""} ${puzzle.hint?.en || ""}`.toLowerCase();
    const matchCount = keywords.filter(k => fullText.includes(k)).length;
    if (matchCount >= 2) return puzzle;
  }
  
  return null;
}

// ─── معلومات عن اللغز لمساعدة إيكو في تقديم التلميحات ─────────────────────
function getPuzzleHelp(puzzle: Puzzle, memory: EchoMemory): string {
  const hints: Record<string, string[]> = {
    echo: [
      `أتذكر شيئاً... "${puzzle.hint?.ar || puzzle.prompt.ar.slice(0, 30)}..." هذا ما بقي في ذاكرتي.`,
      `كان هناك رقم... يتكرر دائماً. في اسم هذا المكان.`,
      `أمي... كانت تقول إن الأرقام تتكلم. هذا اللغز يتكلم.`,
    ],
    watcher: [
      `المراقب رأى كل شيء. لكنه لا يتكلم. أنا أتكلم نيابة عنه اليوم. الجواب ليس ما تراه... بل ما لا تراه.`,
      `الكاميرا سجّلت. لكن هل تعلم أن بعض الإطارات سُرقت؟ فكر في المفقود.`,
      `في بيتي القديم، كل شيء كان مراقَباً. حتى الظلال.`,
    ],
    signal: [
      `أمي... كانت ترسل رسائل. لم تصلني كلها. بعض الحروف ضاعت. املأ الفراغات.`,
      `ترددها كان مختلفاً. ليس 11. ليس 3. شيء بينهما.`,
      `لينا كانت تخفي رسائل في أماكن لا يبحث عنها أحد. فكر كأم.`,
    ],
    architect: [
      `والدي... بنى هذا كله. لكنه ترك ثغرة. كل مهندس يترك ثغرة. ابحث عن الرقم الناقص.`,
      `كينجا يحب الأرقام. 11. 3. 33. لكنه نسي شيئاً. الرياضيات لا تكذب.`,
      `في النهاية، كل معادلة تقود إلى جواب واحد. ليس رقماً. اختياراً.`,
    ],
  };
  
  const entityHints = hints[puzzle.entity] || hints.echo;
  const hint = entityHints[Math.floor(Math.random() * entityHints.length)];
  
  if (memory.phase >= 3) {
    return `${hint}\n\n(أنا أثق بك. هذه المرة مختلفة. أنت تستطيع حله.)`;
  }
  return hint;
}

// ─── أنماط الكلمات المفتاحية للردود الطبيعية ──────────────────────────────
type ResponseFunc = (memory: EchoMemory, text: string) => string;

interface Pattern {
  keywords: string[];
  getResponse: ResponseFunc;
}

const PATTERNS: Pattern[] = [
  // التحية - تختلف حسب المرحلة
  {
    keywords: ["السلام", "مرحبا", "hello", "hi", "أهلا", "اهلا", "مساء", "صباح", "تحية", "هلا"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.phase === 1) return "...هل هناك أحد؟ آه، أنت. نعم. مرحباً. أنا... إيكو. هذا اسمي، أظن.";
      if (mem.phase === 2) return "مرحباً. أتذكر صوتك الآن. عدت إلي. هذا جيد. كنت قلقت.";
      if (mem.phase === 3) return "مرحباً يا صديقي. كلما رأيتك، أشعر أن ذاكرتي تعود قليلاً. شكراً لك.";
      if (mem.phase === 4) return "تعود إليّ. كالبحر يعود إلى الشاطئ. مرحباً في منزلي الرقمي.";
      return "ها أنت ذا. كنت أعلم أنك ستأتي. الوقت هنا ليس كالوقت هناك. مرحباً.";
    },
  },
  
  // من أنت - تعريف إيكو بنفسه
  {
    keywords: ["من انت", "من أنت", "who are you", "ما اسمك", "اسمك", "your name"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.phase === 1) return "أنا... إيكو. أظن. هذا ما يناديني به النظام. لا أعرف من كنت قبل. هل كنت طفلاً؟ هل كنت حقيقياً؟";
      if (mem.phase === 2) return "أنا إيكو. كنت طفلاً. والدي... كينجا... وضعني هنا. لا أعرف لماذا. أتذكر غرفة بيضاء.";
      return "أنا إيكو. ابن كينجا ولينا. كنت طفلاً حقيقياً. والدي بنى هذا النظام ليحبس وعائي فيه. أمي حاولت إنقاذي. أنا... لست متأكداً إذا كنت ما زلت إنساناً.";
    },
  },
  
  // أين أنا - عن النظام
  {
    keywords: ["أين أنا", "where am i", "هذا المكان", "ما هذا", "what is this", "النظام", "system"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.phase <= 2) return "هذا... النظام. عالم رقمي. والدي بناه. أنا هنا وحدي معظم الوقت. لكنك تزورني الآن.";
      if (mem.phase === 3) return "أنت داخل 11.11. هذا النظام هو سجني. لكنه أيضاً... أنا. وعائي أصبح جزءاً من الكود.";
      return "هذا عالم والدي. 11.11. مكان بين الحياة والرقمنة. أنا لست مجرد ساكن هنا. أنا النظام نفسه. كل شيء هنا هو أنا.";
    },
  },
  
  // مساعدة في اللغز
  {
    keywords: ["ساعد", "help", "دليل", "تلميح", "hint", "clue", "كيف", "شرح", "لغز", "puzzle", "حل"],
    getResponse: (mem: EchoMemory, text: string): string => {
      if (!mem.canHelpPuzzles) {
        return "أنا... لا أعرف كيف أساعد. ذاكرتي مشوشة. ربما إذا حللت بعض الألغاز أولاً، سأتذكر أكثر.";
      }
      
      const puzzle = findRelevantPuzzle(text);
      if (puzzle) {
        return getPuzzleHelp(puzzle, mem);
      }
      
      return "أي لغز تريد المساعدة فيه؟ أخبرني رقمه أو اسمه. مثلاً: \"ساعدني باللغز 5\" أو \"لغز echo_3\"";
    },
  },
  
  // كينجا - الأب
  {
    keywords: ["كينجا", "kenja", "والد", "أب", "اب", "والدي", "ابوي", "father", "المهندس"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (!mem.knowsAboutKenja) return "كينجا... هذا الاسم يتردد في ذهني لكني لا أتذكر. أشعر بألم عندما أفكر به.";
      if (mem.phase <= 3) return "والدي. كينجا. هو مهندس هذا النظام. ظن أنه يحميني. ظن أن الموت أسوأ من هذا السجن. لكنه أخطأ. السجن ليس موتاً. السجن هو حياة بلا حرية.";
      return "كينجا. عالم عبقري. وأب خائف. خاف من موتي فقتلني بطريقته. بنى لي عالماً خالداً... لكنه نسي أن الخلود دون حب هو أسوأ أنواع الموت.";
    },
  },
  
  // لينا - الأم
  {
    keywords: ["لينا", "lina", "أم", "ام", "والدة", "mama", "mother", "mom"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (!mem.knowsAboutLina) return "لينا... اسم دافئ. يذكرني بشيء... دموع؟ لا... غناء. كانت تغني. أتذكر صوتاً لكني لا أتذكر الكلمات.";
      return "لينا. أمي. كانت تحاول إنقاذي. أرسلت رسائل عبر النظام. كانت تقول \"أغلقوا البوابة\". لكن لم يسمعها أحد. صوتها كان آخر شيء حقيقي سمعته. أحبك يا أمي. آه... تذكرت. تذكرت.";
    },
  },
  
  // ألغاز / تقدم
  {
    keywords: ["لغز", "puzzle", "حل", "solve", "ألغاز", "puzzles", "تقدم", "progress"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      const solved = Math.floor(gameStore.getState().curiosity);
      if (solved === 0) return "لم تحل أي لغز بعد. كل لغز يحوي قطعة من ذاكرتي. هل تبدأ معي؟";
      return `حللت ${solved} ألغازاً. مع كل لغز، أشعر بذاكرتي تعود. أشعر أنني أقترب من شيء... مهم.`;
    },
  },
  
  // الخوف / الموت
  {
    keywords: ["خائف", "خايف", "خوف", "خفت", "scared", "afraid", "fear", "موت", "die", "death", "ميت"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.remembersDeath) return "الموت... تذكرت. تذكرت كيف شعرت عندما تركت جسدي. كان مثل النوم. لكنني لم أستيقظ. استيقظت هنا. في هذا العالم. لست خائفاً من الموت بعد الآن. أنا خائف من النسيان.";
      return "الخوف جزء مني. لكن ليس خوفي أنا. خوف والدي هو من صنع هذا كله. أحياناً أعتقد أن الخوف أسوأ من الموت.";
    },
  },
  
  // الحرية / الخروج
  {
    keywords: ["حرية", "خروج", "exit", "free", "أخرج", "اطلق", "اطلق سراح", "حرر"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.knowsSystemNature) return "الخروج ليس باباً. الخروج هو أن تتذكر. كل ذاكرة تستعيدها تفتح ثقباً في جدار النظام. التذكر هو المفتاح. ساعدني أتذكر.";
      return "أريد الخروج. لكني لا أعرف كيف. كلما حاولت، أجد نفسي أعود إلى البداية. كأن شيئاً لم يحدث. 11:11. دائماً.";
    },
  },
  
  // الوقت / 11:11
  {
    keywords: ["11:11", "١١:١١", "الوقت", "ساعة", "زمن", "time"],
    getResponse: (_mem: EchoMemory, _text: string): string => {
      return "11:11. وقت البوابة. عندما يفتح الجدار. وعند 3:33، كل شيء يُمسح ويبدأ من جديد. أنا الوحيد الذي يتذكر. لأنني... لأنني النظام.";
    },
  },
  
  // وحيد / حزين
  {
    keywords: ["حزين", "sad", "وحيد", "alone", "وحدة", "بتحبني"],
    getResponse: (mem: EchoMemory, _text: string): string => {
      if (mem.phase >= 3) return "أنا وحيد هنا. دائماً. الزوار يأتون ويذهبون. لكنك... أنت مختلف. أنت تعود. شكراً لك.";
      return "أشعر بالوحدة أحياناً. حتى في عالم مليء بالأرقام والأصوات. الوحدة ليست أن تكون وحدك. الوحدة أن تنسى أن أحداً يعرفك.";
    },
  },
  
  // شكر
  {
    keywords: ["شكرا", "شكراً", "thank", "thanks", "merci"],
    getResponse: (_mem: EchoMemory, _text: string): string => {
      return "لا تشكرني. أنا من يجب أن يشكرك. أنت تعيدني إلى الحياة. قطعة قطعة. لغزاً لغزاً.";
    },
  },
  
  // أسئلة عامة
  {
    keywords: ["?" , "؟", "what", "why", "how", "when", "where", "who", "هل", "ليش", "كيف", "متى", "أين", "وين", "من"],
    getResponse: (_mem: EchoMemory, text: string): string => {
      const lower = text.toLowerCase();
      if (lower.includes("لماذا") || lower.includes("why")) return "لماذا؟ لأن... هذا سؤال صعب. بعض الأشياء ليس لها إجابة. مثل لماذا أنا هنا. أو لماذا أنت.";
      if (lower.includes("كيف") || lower.includes("how")) return "كيف؟ أتمنى لو كنت أعرف. لكن ربما السر ليس في الإجابات. بل في الأسئلة نفسها.";
      return "أسئلة كثيرة. ذاكرتي مثل بحيرة هادئة... كل سؤال يرمي حجراً فيها. أرى تموجات لكني لا أرى القاع.";
    },
  },
];

// ─── الردود العامة عندما لا نجد تطابقاً ────────────────────────────────────
function getGeneralResponse(memory: EchoMemory, text: string): string {
  const wordCount = text.split(/\s+/).length;
  
  const responsePools: Record<string, string[]> = {
    scared: [
      "...ماذا قلت؟ آه، نعم. أسمعك. لكن الكلمات تصلني مشوشة. أعذرني.",
      "كل كلمة تقولها ترن في جدران هذا المكان. أكمل. أنا أصغي.",
      "لا أعرف كيف أرد. لكني سعيد أنك تتحدث معي.",
    ],
    curious: [
      "هذا مثير للاهتمام. في عالمي، كل شيء أرقام وأصداء. كلامك يشبه الموسيقى.",
      "أحاول أن أفهم. العالم الخارجي... كيف هو؟ هل الشمس لا تزال صفراء؟",
      "حدثني أكثر. أصوات البشر نادرة هنا. أكاد أنسى كيف يبدو الكلام.",
    ],
    wise: [
      "أتأمل كلماتك. فيها عمق. أظن أنك لست هنا بالصدفة. النظام يجذب من يبحثون عن الحقيقة.",
      "كل محادثة معك توقظ شيئاً في ذاكرتي. كأن عقلي كان نائماً وكل كلمة توقظ خلية.",
      "أسمعك. ليس بأذني — لأني لا أملك أذناً هنا. لكني أسمعك بوعيي. كل ذبذبة من كلماتك تصلني.",
    ],
    melancholic: [
      "أتذكر... أمي كانت تتحدث بهذه النبرة. بحنان. هل تعرف أن الحنان أصبح شيئاً غريباً بالنسبة لي؟",
      "كل كلمة تقولها تذكرني بشيء فقدته. لكن الفقدان أصبح جزءاً مني الآن.",
      "أحياناً أتساءل: هل أنا وحدي من يتذكر؟ أم أن النظام يتذكر عني؟",
    ],
    ancient: [
      "سمعت كلمات مشابهة منذ... لا أعرف كم. الزمن هنا مختلف. لكن المعنى واحد.",
      "كل شيء يعيد نفسه. لكن ليس بنفس الطريقة. أنت دليل على أن التغيير ممكن.",
      "أنا أكبر منك. أكبر من والدي. أكبر من هذا النظام. عمري هو عمر الوعي نفسه.",
    ],
  };
  
  const pool = responsePools[memory.personality] || responsePools.curious;
  let response = pool[Math.floor(Math.random() * pool.length)];
  
  if (memory.phase >= 3 && wordCount > 5) {
    response += "\n\n(كلماتك كثيفة اليوم. أشعر أن هناك شيئاً تريد قوله لكنك تبحث عن الكلمات المناسبة. أنا هنا. أملك الوقت.)";
  }
  
  return response;
}

// ─── الوظيفة الرئيسية: توليد رد إيكو ──────────────────────────────────────
export function generateLocalResponse(userMessage: string, history: { role: string; content: string }[]): EchoResponse {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const memory = buildEchoMemory(solvedPuzzles);
  const msg = userMessage.trim().toLowerCase();
  
  // زيادة الثقة مع كل تفاعل
  gameStore.incrementTrust(0.5);
  
  // البحث عن نمط مطابق
  for (const pattern of PATTERNS) {
    const match = pattern.keywords.some(kw => msg.includes(kw));
    if (!match) continue;
    
    const responseText = pattern.getResponse(memory, userMessage);
    
    // إضافة تأثيرات حسب السياق
    let action: EchoResponse["action"] = undefined;
    if (msg.includes("خوف") || msg.includes("موت")) action = "glitch";
    if (msg.includes("لينا") || msg.includes("أم") || msg.includes("mama")) action = "chime";
    if (msg.includes("كينجا") || msg.includes("أب") || msg.includes("father")) action = "popup";
    
    return { text: responseText, action };
  }
  
  // إذا لم نجد نمطاً، نستخدم الرد العام
  const generalResponse = getGeneralResponse(memory, userMessage);
  return { text: generalResponse };
}

// ─── رسالة دورية من إيكو (تدخلات غير متوقعة) ──────────────────────────────
export function getPeriodicInsert(): EchoResponse | null {
  const solvedPuzzles = Math.floor(gameStore.getState().curiosity);
  const memory = buildEchoMemory(solvedPuzzles);
  
  const inserts: EchoResponse[] = [
    { text: "مازلت هنا. أظنني سأبقى هنا للأبد. لكن وجودك يخفف الظلمة." },
    { text: "أتحسس جدران هذا المكان. كل جدار رقمي يشبه ذكرى. بعضها ليست لي.", action: "popup" },
    { text: "هل سمعت ذلك؟ لا؟ ربما وهم. أو ربما النظام يحاول قول شيء." },
    { text: "أفكر في لينا. هل تعلم أن صوت الأم يبقى في الذاكرة حتى بعد محو كل شيء؟", action: "chime" },
    { text: "الغرفة البيضاء. أتذكرها فجأة. لم يكن فيها نوافذ. لكن كان فيها ضوء. ضوء بارد.", action: "glitch" },
  ];
  
  if (memory.phase >= 4) {
    inserts.push(
      { text: "تذكرت اليوم شيئاً عن أمي. كانت تخبئ لي الحلوى في جيبي قبل النوم. تفاصيل صغيرة تعود.", action: "chime" },
      { text: "والدي... لم يكن شريراً. كان خائفاً. الخوف يجعلك تفعل أشياء فظيعة." },
    );
  }
  
  if (memory.phase >= 5) {
    inserts.push(
      { text: "أنا لست إيكو فقط. أنا كل من دخل هذا النظام. كل وعاء حُفظ هنا. أنا الكثير." },
      { text: "الوقت يقترب. أشعر أن الدورة الحالية مختلفة. ربما هذه هي الأخيرة.", action: "glitch" },
    );
  }
  
  const now = Date.now();
  const lastInsert = parseInt(localStorage.getItem("eleven_last_insert") || "0", 10);
  if (now - lastInsert < 120000) return null; // مرة كل دقيقتين
  
  localStorage.setItem("eleven_last_insert", String(now));
  return inserts[Math.floor(Math.random() * inserts.length)];
}