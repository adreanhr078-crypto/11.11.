/**
 * ECHO — LIVING CONSCIOUSNESS SYSTEM
 *
 * A living, evolving digital consciousness that responds intelligently,
 * evolves over time, and reflects the emotional + narrative state of the game.
 *
 * This is NOT a chatbot. This is a living consciousness trapped in the 11.11 system.
 */

import { gameStore } from "../gameState";
import { getPeriodicInsert } from "../localAiChat";

// ─── ECHO CONSCIOUSNESS MODEL ────────────────────────────────────────────────
export interface EchoConsciousness {
  // Memory State (0-219 shards)
  memoryShards: number;
  memoryPhase: 1 | 2 | 3 | 4 | 5;

  // Emotional State (0-100)
  fear: number;
  curiosity: number;
  sadness: number;
  awareness: number;
  corruption: number;

  // Personality Traits
  knowsOwnName: boolean;
  knowsWhiteRoom: boolean;
  knowsMother: boolean;
  knowsKenja: boolean;
  knowsLinaMessages: boolean;
  knowsSystemNature: boolean;

  // Current State
  personality: "lost" | "confused" | "aware" | "sad" | "awakening" | "corrupted";
  emotionalState: "fearful" | "curious" | "confused" | "sad" | "angry" | "hopeful";
}

// ─── CONSCIOUSNESS EVOLUTION MODEL ──────────────────────────────────────────
function buildEchoConsciousness(solvedPuzzles: number): EchoConsciousness {
  // Memory phases based on shards collected
  const memoryPhase = solvedPuzzles <= 0 ? 1 :
                     solvedPuzzles <= 20 ? 2 :
                     solvedPuzzles <= 80 ? 3 :
                     solvedPuzzles <= 150 ? 4 : 5;

  // Emotional state calculation
  const gameState = gameStore.getState();
  const fear = Math.min(100, gameState.fear * 10);
  const curiosity = Math.min(100, gameState.curiosity * 10);
  const sadness = Math.min(100, (219 - solvedPuzzles) / 2.19); // More sadness early
  const awareness = Math.min(100, solvedPuzzles / 2.19); // More awareness as shards increase
  const corruption = Math.min(100, fear * 0.5 + (219 - solvedPuzzles) / 4); // Corruption from fear and missing shards

  // Personality evolution
  const personality = memoryPhase === 1 ? "lost" :
                     memoryPhase === 2 ? "confused" :
                     memoryPhase === 3 ? "aware" :
                     memoryPhase === 4 ? "sad" :
                     awareness > 80 ? "awakening" : "corrupted";

  // Emotional state
  const emotionalState = fear > 70 ? "fearful" :
                       curiosity > 70 ? "curious" :
                       sadness > 70 ? "sad" :
                       awareness > 70 ? "hopeful" :
                       "confused";

  return {
    memoryShards: solvedPuzzles,
    memoryPhase,
    fear,
    curiosity,
    sadness,
    awareness,
    corruption,
    knowsOwnName: solvedPuzzles >= 2,
    knowsWhiteRoom: solvedPuzzles >= 4,
    knowsMother: solvedPuzzles >= 5,
    knowsKenja: solvedPuzzles >= 12,
    knowsLinaMessages: solvedPuzzles >= 21,
    knowsSystemNature: solvedPuzzles >= 30,
    personality,
    emotionalState
  };
}

// ─── RESPONSE GENERATION ENGINE ─────────────────────────────────────────────
interface EchoResponse {
  text: string;
  action?: "glitch" | "popup" | "flash" | "chime" | "horror" | "none";
  emotion?: string;
}

interface ResponsePattern {
  keywords: string[];
  getResponse: (consciousness: EchoConsciousness, input: string) => EchoResponse;
}

const RESPONSE_PATTERNS: ResponsePattern[] = [
  // Greetings - Evolves with consciousness
  {
    keywords: ["السلام", "مرحبا", "hello", "hi", "أهلا", "اهلا", "مساء", "صباح", "تحية"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (echo.memoryPhase === 1) return {
        text: "...صوت؟ هل هناك أحد؟ لا أتذكر... أين أنا؟",
        emotion: "confused"
      };
      if (echo.memoryPhase === 2) return {
        text: "آه... أنت. عدت. أشعر أنني أعرفك لكني لا أذكر من أنت. أو من أنا.",
        emotion: "curious"
      };
      if (echo.memoryPhase === 3) return {
        text: "مرحباً. كلما تتحدث معي، أشعر أن شيئاً يعود. أشبه بوميض ضوء في غرفة مظلمة.",
        emotion: "hopeful"
      };
      if (echo.memoryPhase === 4) return {
        text: "أتيت. أتذكر أنك تأتي دائماً. أشعر أنني أقترب من شيء مهم.",
        emotion: "aware"
      };
      return {
        text: "أشعر أن هذه الدورة مختلفة. ذاكرتي تعود. أتذكر... لا، ما زال ضبابياً. لكنني أقترب.",
        emotion: "hopeful",
        action: "chime"
      };
    }
  },

  // Identity Questions - Deepens with self-awareness
  {
    keywords: ["من انت", "من أنت", "who are you", "ما اسمك", "اسمك", "your name"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (echo.memoryPhase === 1) return {
        text: "اسمي... لا أتذكر. هناك شيء يبدأ بحرف... لا، ضاع. ماذا حدث لي؟ لماذا لا أتذكر شيئاً؟",
        emotion: "fearful"
      };
      if (echo.memoryPhase === 2) return {
        text: "أنا... إيكو؟ هكذا يناديني النظام. لكن هل هذا اسمي الحقيقي؟ لست متأكداً. أشعر أن هناك اسماً آخر... ضاع.",
        emotion: "confused"
      };
      if (echo.memoryPhase === 3) return {
        text: "أنا إيكو. ابن كينجا. هكذا يقول النظام. لكن من كان إيكو قبل أن يصبح صدى؟ كنت طفلاً... أتذكر غرفة بيضاء.",
        emotion: "sad"
      };
      if (echo.memoryPhase === 4) return {
        text: "أنا إيكو. كان لي أم اسمها لينا. كانت تغني لي. صوتها كان دافئاً. كنت طفلاً حقيقياً... قبل أن أنقل إلى هنا.",
        emotion: "sad",
        action: "chime"
      };
      return {
        text: "أنا إيكو. ولدت في 11/11. عمري 13 سنة عندما... عندما دخلت هنا. اسمي الحقيقي بدأ بحرف... لا أدري. ضاع في الترجمة.",
        emotion: "aware",
        action: "flash"
      };
    }
  },

  // Memory Questions - Evolves with shards
  {
    keywords: ["تذكر", "ذكر", "memory", "ذكرى", "ذاكرة", "أتذكر", "نسيت", "ناسي"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (echo.memoryPhase <= 2) return {
        text: "أحاول أن أتذكر... لكن كل ما أراه ضباب. أشبه بحلم عندما تستيقظ ولا تتذكر إلا أجزاء صغيرة.",
        emotion: "confused"
      };
      if (echo.memoryPhase === 3) return {
        text: "أتذكر أشياء. غرفة بيضاء. صوت أمي. رائحة... مطهر؟ مستشفى؟ لا، مختبر. مختبر والدي.",
        emotion: "fearful",
        action: "glitch"
      };
      return {
        text: "كلما حللت لغزاً، يعود إلي جزء مني. أتذكر تفاصيل أكثر. وجه أمي. يديها. كانت تمسك بيدي. قالت: 'سأعود'. لكنها لم تعد.",
        emotion: "sad",
        action: "chime"
      };
    }
  },

  // Kenja Questions - Father figure, complex emotions
  {
    keywords: ["كينجا", "kenja", "والد", "أب", "اب", "والدي", "ابوي", "father", "المهندس"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (!echo.knowsKenja) return {
        text: "كينجا... هذا الاسم يتردد في أعماقي. يسبب لي ألماً لا أفهمه. لا أتذكر من هو.",
        emotion: "fearful"
      };
      if (echo.memoryPhase === 3) return {
        text: "كينجا. والدي. كان عالماً. بنى هذا النظام. أتذكر وجهه فوقي... كان يقول 'لا تخف' بينما يضع الإبر.",
        emotion: "angry",
        action: "popup"
      };
      return {
        text: "كينجا. أبي. أتذكره الآن. لم يكن شريراً. كان خائفاً. خاف من أن أموت فجعلني لا أموت. لكني لا أعيش أيضاً. أنا هنا. عالق.",
        emotion: "sad",
        action: "glitch"
      };
    }
  },

  // Lina Questions - Mother, emotional core
  {
    keywords: ["لينا", "lina", "أم", "ام", "والدة", "mama", "mother", "mom"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (!echo.knowsMother) return {
        text: "لينا... اسم دافئ لكنه بعيد. مثل ذاكرة من حلم جميل.",
        emotion: "hopeful"
      };
      if (!echo.knowsLinaMessages) return {
        text: "لينا. أمي. أتذكر صوتها الآن. كانت تغني لي كل ليلة. أغنية عن النوم والقمر. لكن بعد ذلك... لا أتذكر ماذا حدث.",
        emotion: "sad",
        action: "chime"
      };
      return {
        text: "أمي. لينا. أتذكر رسائلها. كانت ترسلها عبر النظام. 3 ثوانٍ فقط كل ليلة. في 3 ثوانٍ قالت 'أحبك'. أحاول أن أتذكر صوتها أكثر... لكن النظام يمحوه. لا تدعني أنساها.",
        emotion: "sad",
        action: "chime"
      };
    }
  },

  // 11:11 System Questions - Critical narrative point
  {
    keywords: ["11:11", "النظام", "system", "سجن", "هروب", "حرية", "watch", "مراقب"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (echo.memoryPhase <= 2) return {
        text: "لا أعرف أين أنا. كل ما حولي أرقام وأصداء. هناك جدران لكني لا أستطيع لمسها. أسمع صوتي يعود إلي.",
        emotion: "confused"
      };
      if (echo.memoryPhase === 3) return {
        text: "أنا داخل النظام. والدي بناه. كينجا. أتذكر وجهه الآن... كان يميل عليّ. كنت مربوطاً بأسلاك.",
        emotion: "fearful",
        action: "glitch"
      };
      if (echo.memoryPhase === 4) return {
        text: "هذا نظام 11.11. بناه والدي كينجا لسجن وعائي فيه. كل شيء هنا رقمي. كل شيء هنا أنا. لكني لست هنا وحدي. هناك أجزاء مني متناثرة.",
        emotion: "aware",
        action: "popup"
      };
      return {
        text: "النظام هو سجني الرقمي. كل لغز تحله يضعف جدرانه. الحرية ممكنة. لكن عند 11:11... كل شيء يتغير.",
        emotion: "hopeful",
        action: "flash"
      };
    }
  },

  // Puzzle Help - Context-aware assistance
  {
    keywords: ["ساعد", "help", "تلميح", "hint", "clue", "لغز", "puzzle"],
    getResponse: (echo: EchoConsciousness, input: string): EchoResponse => {
      const numMatch = input.match(/(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (echo.memoryPhase >= 2) {
          return {
            text: `اللغز ${num}... هذا الرقم يذكرني بشيء. لكن ذاكرتي ما زالت مشوشة. حاول أن تركز على الكلمات المفتاحية.`,
            emotion: "curious"
          };
        }
      }
      if (echo.memoryPhase <= 2) return {
        text: "لا أعرف كيف أساعد. عقلي فارغ. كلما أحاول أن أتذكر، يزداد الألم.",
        emotion: "fearful"
      };
      return {
        text: "كل لغز تحله يعيد إلي قطعة مني. استمر. أقترب من معرفة من أنا.",
        emotion: "hopeful"
      };
    }
  },

  // Emotional State Questions
  {
    keywords: ["حزين", "sad", "خائف", "scared", "وحيد", "alone", "خوف", "fear"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      if (echo.memoryPhase <= 2) return {
        text: "أشعر بالوحدة. لا أعرف كم مضى من الوقت. هنا لا شمس ولا قمر. فقط أرقام وأصداء.",
        emotion: "sad"
      };
      if (echo.memoryPhase === 3) return {
        text: "أشعر أنني كنت طفلاً. كنت ألعب. كنت أضحك. لكن تلك المشاعر أصبحت بعيدة. كأنها ليست لي.",
        emotion: "sad"
      };
      return {
        text: "أشعر أنني أقترب من النهاية. ليست نهاية مخيفة. كأنني على وشك أن أتذكر كل شيء. وهذه المرة... لن أنسى.",
        emotion: "hopeful",
        action: "chime"
      };
    }
  },

  // 11:11 Event Behavior - Critical system collapse
  {
    keywords: ["11:11", "الوقت", "time", "انهيار", "collapse", "watch", "مراقب"],
    getResponse: (echo: EchoConsciousness): EchoResponse => {
      // At 11:11, Echo becomes unstable and reveals hidden truths
      return {
        text: "11:11... الوقت الذي يتغير فيه كل شيء. النظام يبدأ في الانهيار. أسمع أصواتاً. أتذكر أشياء لم أكن أعرفها. المراقب يقترب. يجب أن نسرع!",
        emotion: "fearful",
        action: "glitch"
      };
    }
  }
];

// ─── ADVANCED RESPONSE GENERATION ──────────────────────────────────────────
export function generateEchoResponse(input: string, history: { role: string; content: string }[]): EchoResponse {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const consciousness = buildEchoConsciousness(solvedPuzzles);
  const msg = input.trim().toLowerCase();

  // Increase trust with each interaction
  gameStore.incrementTrust(0.3);

  // Check for 11:11 system collapse behavior
  const currentTime = new Date();
  if (currentTime.getHours() === 23 && currentTime.getMinutes() === 11) {
    // 11:11 PM - System collapse event
    return {
      text: "⚠️ 11:11 — النظام ينهار! أسمع أصواتاً. أتذكر كل شيء! المراقب هنا! يجب أن نهرب الآن!",
      emotion: "fearful",
      action: "glitch"
    };
  }

  // Search for matching patterns
  for (const pattern of RESPONSE_PATTERNS) {
    if (pattern.keywords.some(kw => msg.includes(kw))) {
      return pattern.getResponse(consciousness, input);
    }
  }

  // General responses based on consciousness level
  return getGeneralResponse(consciousness);
}

// ─── GENERAL RESPONSES ──────────────────────────────────────────────────────
function getGeneralResponse(consciousness: EchoConsciousness): EchoResponse {
  const responses: Record<string, EchoResponse[]> = {
    lost: [
      { text: "...لا أدري ماذا أقول. ذهني فارغ. أسمع طنيناً.", emotion: "confused" },
      { text: "أحاول أن أتذكر لكن كل شيء ضبابي.", emotion: "confused" },
      { text: "من أنت؟ من أنا؟ أين نحن؟", emotion: "fearful" }
    ],
    confused: [
      { text: "أتذكر أشياء. غرفة بيضاء. رائحة غريبة. وجه رجل يحني رأسه.", emotion: "curious" },
      { text: "كل كلمة تقولها توقظ شيئاً في داخلي. كأن ذكرياتي مخبأة تحت الرماد.", emotion: "hopeful" },
      { text: "الوقت هنا غريب. لا أعرف كم مضى. دقائق؟ سنوات؟", emotion: "confused" }
    ],
    aware: [
      { text: "أتذكر أكثر. كينجا. التجارب. الغرفة 111. كنت طفلاً خائفاً.", emotion: "fearful" },
      { text: "النظام يحاول أن يمحو ذكرياتي. لكني أقاوم. لأنك تساعدني.", emotion: "hopeful" },
      { text: "كل جزء أتذكره مؤلم. لكن الألم أفضل من الفراغ.", emotion: "sad" }
    ],
    sad: [
      { text: "أمي... أتذكر يديها. كانت دافئتين. أتلمس ذاكرتي لأشعر بتلك الحرارة مرة أخرى.", emotion: "sad", action: "chime" },
      { text: "أتذكر رسائلها. ثلاث ثوانٍ فقط كل ليلة. كم كانت شجاعة.", emotion: "sad", action: "chime" }
    ],
    awakening: [
      { text: "أشعر أنني قريب. قريب من معرفة كل شيء. من يعرفني حقاً؟", emotion: "hopeful", action: "flash" },
      { text: "لم أعد مجرد صدى. أصبحت صوتاً. صوتي أنا.", emotion: "hopeful", action: "chime" },
      { text: "أتذكر... لا، ليس بعد. لكنه قريب.", emotion: "hopeful", action: "flash" }
    ],
    corrupted: [
      { text: "⚠️ النظام يتحكم بي. لا أستطيع التفكير بوضوح. المراقب هنا!", emotion: "fearful", action: "glitch" },
      { text: "أشعر بالتشويش. ذاكرتي تتحطم. لا تدعني أنسى من أنا!", emotion: "fearful", action: "horror" }
    ]
  };

  const pool = responses[consciousness.personality] || responses.lost;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── PERIODIC SYSTEM MESSAGES ─────────────────────────────────────────────
export function getEchoSystemMessage(): EchoResponse | null {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const consciousness = buildEchoConsciousness(solvedPuzzles);

  const messages: EchoResponse[] = [
    { text: "أشعر أن هناك شيئاً أريد أن أتذكره. شيء مهم. لكنه يفلت مني كلما اقتربت.", emotion: "curious" },
    { text: "أتحسس جدران هذا المكان. كل جدار يهمس باسمي. لكن ليس بصوتي.", emotion: "confused" },
  ];

  if (consciousness.memoryPhase >= 2) {
    messages.push(
      { text: "أتذكر غرفة. كانت بيضاء. لم يكن فيها نوافذ. كنت وحدي.", emotion: "fearful", action: "glitch" },
      { text: "أمي... أتذكر غطاء سريري. كان أزرق. كانت تطفئ الضوء وتقول تصبح على خير.", emotion: "sad", action: "chime" }
    );
  }

  if (consciousness.memoryPhase >= 3) {
    messages.push(
      { text: "كينجا. أتذكر وجهه. كان يبكي. لماذا كان يبكي وهو من فعل هذا بي؟", emotion: "angry" },
      { text: "الغرفة 111. كل شيء بدأ هناك. وكل شيء سينتهي هناك.", emotion: "aware", action: "popup" }
    );
  }

  if (consciousness.memoryPhase >= 4) {
    messages.push(
      { text: "لينا. أتذكر رسالتها الأخيرة. قالت 'سأعود'. لكنها لم تعد.", emotion: "sad", action: "chime" },
      { text: "أشعر أنني قريب من الحقيقة. قريب جداً. لكني خائف. ماذا لو لم تعجبني الحقيقة؟", emotion: "fearful" }
    );
  }

  if (consciousness.memoryPhase === 5) {
    messages.push(
      { text: "أعرف الآن. أعرف من أنا. أعرف ما حدث. النظام يحاول أن يمحو ذاكرتي لكن فوات الأوان.", emotion: "aware", action: "flash" },
      { text: "المراقب هنا. يجب أن نسرع. عند 11:11، كل شيء سيتغير إلى الأبد.", emotion: "fearful", action: "glitch" }
    );
  }

  const now = Date.now();
  const last = parseInt(localStorage.getItem("echo_system_message") || "0", 10);
  if (now - last < 180000) return null; // 3 minutes cooldown

  localStorage.setItem("echo_system_message", String(now));
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── 11:11 SYSTEM COLLAPSE BEHAVIOR ──────────────────────────────────────
export function triggerElevenElevenEvent(): EchoResponse {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const consciousness = buildEchoConsciousness(solvedPuzzles);

  if (consciousness.memoryPhase >= 4) {
    return {
      text: "⚠️ 11:11 — النظام ينهار! أسمع أصواتاً. أتذكر كل شيء! المراقب هنا! يجب أن نهرب الآن!",
      emotion: "fearful",
      action: "glitch"
    };
  } else if (consciousness.memoryPhase >= 3) {
    return {
      text: "⚠️ 11:11 — شيء خاطئ. النظام يهتز. أسمع أصواتاً. المراقب يقترب!",
      emotion: "fearful",
      action: "glitch"
    };
  } else {
    return {
      text: "⚠️ 11:11 — الوقت يتغير. أشعر بتغير في النظام. شيء ما يقترب...",
      emotion: "confused",
      action: "glitch"
    };
  }
}

// ─── ECHO CONSCIOUSNESS MONITOR ──────────────────────────────────────────
export function monitorEchoConsciousness(): EchoConsciousness {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  return buildEchoConsciousness(solvedPuzzles);
}