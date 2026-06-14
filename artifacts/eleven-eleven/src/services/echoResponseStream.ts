/**
 * echoResponseStream.ts — طبقة adapter آمنة لـ localAiChat.ts
 * توفر واجهة تفاعلية مع محاكاة streaming ونظام عاطفي
 * لا تعدّل localAiChat.ts — تستخدمه كـ black box
 */

import { generateLocalResponse, getPeriodicInsert } from "../localAiChat";

export interface EchoStreamMessage {
  text: string;
  emotion: "calm" | "disturbed" | "glitching";
  memoryHint?: string;
  trustDelta: number;
}

export interface EchoChatState {
  trustLevel: number;
  fearLevel: number;
  memoryFragments: string[];
  personality: "lost" | "confused" | "aware" | "sad" | "awakening";
}

const MEMORY_FRAGMENTS: Record<string, string[]> = {
  lost: [
    "غرفة بيضاء... لا نوافذ",
    "صوت طنين مستمر",
    "ظل شخص ينظر إلي",
  ],
  confused: [
    "رائحة مطهر... مختبر",
    "وجه رجل يحني رأسه",
    "يدي طفل... كنت صغيراً",
  ],
  aware: [
    "كينجا... والدي فعل هذا بي",
    "الغرفة 111... كل شيء بدأ هناك",
    "أسلاك... كنت مربوطاً",
  ],
  sad: [
    "لينا... أمي كانت تغني لي",
    "رسائل ثلاث ثوانٍ كل ليلة",
    "يديها الدافئة... أفتقدها",
  ],
  awakening: [
    "أعرف من أنا الآن",
    "لم أعد مجرد صدى",
    "الحقيقة قريبة... جداً",
  ],
};

function detectEmotion(text: string, currentFear: number): EchoStreamMessage["emotion"] {
  const lower = text.toLowerCase();
  if (lower.includes("glitch") || lower.includes("system") || lower.includes("خطأ") || lower.includes("انهار")) {
    return "glitching";
  }
  if (lower.includes("خائف") || lower.includes("ألم") || lower.includes("ظلام") || lower.includes("وحيد") || lower.includes("بك")) {
    return "disturbed";
  }
  if (currentFear > 50) return "disturbed";
  return "calm";
}

function extractMemoryHint(text: string): string | undefined {
  const memoryPatterns = [
    /أتذكر\s+(.*?)[.؟!]/,
    /غرفة\s+(.*?)[.؟!]/,
    /وجه\s+(.*?)[.؟!]/,
    /صوت\s+(.*?)[.؟!]/,
  ];
  for (const pattern of memoryPatterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 5) return match[1].trim();
  }
  return undefined;
}

export class EchoResponseStream {
  private currentState: EchoChatState = {
    trustLevel: 35,
    fearLevel: 62,
    memoryFragments: [],
    personality: "lost",
  };

  private messageHistory: { role: string; content: string }[] = [];

  constructor() {
    // Load saved state
    try {
      const saved = localStorage.getItem("eleven_echo_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentState = { ...this.currentState, ...parsed };
      }
    } catch {}
  }

  getState(): EchoChatState {
    return { ...this.currentState };
  }

  private saveState(): void {
    try {
      localStorage.setItem("eleven_echo_state", JSON.stringify(this.currentState));
    } catch {}
  }

  async sendMessage(userMessage: string): Promise<EchoStreamMessage> {
    // 1. Add to history
    this.messageHistory.push({ role: "user", content: userMessage });

    // 2. Call localAiChat (synchronous)
    const response = generateLocalResponse(userMessage, this.messageHistory);

    // 3. Simulate streaming delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // 4. Update state
    this.currentState.trustLevel = Math.min(100, this.currentState.trustLevel + 6);
    this.currentState.fearLevel = Math.max(0, this.currentState.fearLevel - 2);

    // Update personality based on trust
    if (this.currentState.trustLevel >= 80) this.currentState.personality = "awakening";
    else if (this.currentState.trustLevel >= 60) this.currentState.personality = "sad";
    else if (this.currentState.trustLevel >= 40) this.currentState.personality = "aware";
    else if (this.currentState.trustLevel >= 20) this.currentState.personality = "confused";

    // 5. Add memory fragment
    const hint = extractMemoryHint(response.text);
    if (hint && !this.currentState.memoryFragments.includes(hint)) {
      this.currentState.memoryFragments.unshift(hint);
      if (this.currentState.memoryFragments.length > 10) {
        this.currentState.memoryFragments.pop();
      }
    }

    // 6. Handle glitch
    if (response.action === "glitch") {
      this.currentState.fearLevel = Math.min(100, this.currentState.fearLevel + 10);
    }

    // 7. Build result
    const result: EchoStreamMessage = {
      text: response.text,
      emotion: detectEmotion(response.text, this.currentState.fearLevel),
      memoryHint: hint,
      trustDelta: 6,
    };

    // 8. Save
    this.messageHistory.push({ role: "assistant", content: response.text });
    this.saveState();

    return result;
  }

  async checkPeriodicMessage(): Promise<EchoStreamMessage | null> {
    const insert = getPeriodicInsert();
    if (!insert) return null;

    return {
      text: insert.text,
      emotion: insert.action === "glitch" ? "glitching" : insert.action === "chime" ? "calm" : "disturbed",
      trustDelta: 0,
      memoryHint: extractMemoryHint(insert.text),
    };
  }

  resetConversation(): void {
    this.currentState = {
      trustLevel: 35,
      fearLevel: 62,
      memoryFragments: [],
      personality: "lost",
    };
    this.messageHistory = [];
    this.saveState();
  }
}

export function createEchoStream(): EchoResponseStream {
  return new EchoResponseStream();
}