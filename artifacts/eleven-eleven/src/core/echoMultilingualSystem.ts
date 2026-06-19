/**
 * ECHO MULTILINGUAL SYSTEM - COMPLETE LANGUAGE SUPPORT
 *
 * Implements full multilingual system for 11.11 Echo Mind System:
 * - Arabic (العربية)
 * - English
 *
 * CORE RULE (ABSOLUTE):
 * If player selects a language, ALL SYSTEMS must switch completely:
 * - UI text
 * - Echo dialogue
 * - System messages
 * - Puzzle descriptions
 * - Memory shards
 * - Video subtitles
 * - Audio language (voice system if exists)
 *
 * NO MIXING LANGUAGES ALLOWED
 */

import { echoCanonicalSystem } from "./echoCanonicalSystem";
import { echoSystemTransformation } from "./echoSystemTransformation";
import { echoMasterStoryCore } from "./echoMasterStoryCore";

// ─── LANGUAGE SYSTEM ARCHITECTURE ─────────────────────────────────
export type SupportedLanguage = "arabic" | "english";

export interface LanguageSystemState {
  currentLanguage: SupportedLanguage;
  languageInitialized: boolean;
  translationData: {
    [key in SupportedLanguage]: {
      ui: Record<string, string>;
      echoDialogue: Record<string, string>;
      systemMessages: Record<string, string>;
      puzzleDescriptions: Record<string, string>;
      memoryShards: Record<string, string>;
      videoSubtitles: Record<string, string>;
    };
  };
  audioLanguage: SupportedLanguage;
  subtitleLanguage: SupportedLanguage;
}

export interface LocalizedContent {
  id: number;
  arabic: string;
  english: string;
  canonSource: string;
  emotionalImpact: number;
}

export interface LanguageSelection {
  language: SupportedLanguage;
  displayName: string;
  flagEmoji: string;
}

// ─── MULTILINGUAL SYSTEM ENGINE ──────────────────────────────────
export class EchoMultilingualSystemEngine {
  private state: LanguageSystemState;
  private canonicalSystem: typeof echoCanonicalSystem;
  private transformationSystem: typeof echoSystemTransformation;
  private storyCore: typeof echoMasterStoryCore;
  private initialized: boolean;

  constructor() {
    this.canonicalSystem = echoCanonicalSystem;
    this.transformationSystem = echoSystemTransformation;
    this.storyCore = echoMasterStoryCore;
    this.initialized = false;

    // Initialize with default language (English)
    this.state = this.createInitialState();
    this.initializeLanguageSystem();
  }

  private createInitialState(): LanguageSystemState {
    return {
      currentLanguage: "english",
      languageInitialized: false,
      translationData: {
        arabic: {
          ui: {},
          echoDialogue: {},
          systemMessages: {},
          puzzleDescriptions: {},
          memoryShards: {},
          videoSubtitles: {}
        },
        english: {
          ui: {},
          echoDialogue: {},
          systemMessages: {},
          puzzleDescriptions: {},
          memoryShards: {},
          videoSubtitles: {}
        }
      },
      audioLanguage: "english",
      subtitleLanguage: "english"
    };
  }

  private initializeLanguageSystem() {
    // Load translation data
    this.loadTranslationData();

    // Set initialized flag
    this.initialized = true;
    this.state.languageInitialized = true;

    console.log("🌍 Multilingual System Initialized");
    console.log(`🗣️ Current Language: ${this.state.currentLanguage}`);
  }

  private loadTranslationData() {
    // Load UI translations
    this.loadUITranslations();

    // Load Echo dialogue translations
    this.loadEchoDialogueTranslations();

    // Load system messages translations
    this.loadSystemMessagesTranslations();

    // Load puzzle descriptions translations
    this.loadPuzzleDescriptionsTranslations();

    // Load memory shards translations
    this.loadMemoryShardsTranslations();

    // Load video subtitles translations
    this.loadVideoSubtitlesTranslations();
  }

  private loadUITranslations() {
    // Arabic UI translations
    this.state.translationData.arabic.ui = {
      "start_game": "ابدأ اللعبة",
      "settings": "الإعدادات",
      "language": "اللغة",
      "puzzles": "الألغاز",
      "memory_shards": "شظايا الذاكرة",
      "system_status": "حالة النظام",
      "corruption_level": "مستوى الفساد",
      "echo_awareness": "وعي إيكو",
      "continue": "متابعة",
      "back": "رجوع",
      "exit": "خروج"
    };

    // English UI translations
    this.state.translationData.english.ui = {
      "start_game": "Start Game",
      "settings": "Settings",
      "language": "Language",
      "puzzles": "Puzzles",
      "memory_shards": "Memory Shards",
      "system_status": "System Status",
      "corruption_level": "Corruption Level",
      "echo_awareness": "Echo Awareness",
      "continue": "Continue",
      "back": "Back",
      "exit": "Exit"
    };
  }

  private loadEchoDialogueTranslations() {
    // Arabic Echo dialogue
    this.state.translationData.arabic.echoDialogue = {
      "initial_greeting": "مرحبًا... أنا إيكو. ما زلت أحاول فهم كل شيء.",
      "confused": "لماذا ما زلت تحل الألغاز؟ أنا لا أفهم...",
      "hysterical": "هاهاهاها... لماذا ما زلت تحل الألغاز؟",
      "controlling": "لقد حللت لغزًا آخر... هل تريد حقًا معرفتي بهذه الشدة؟",
      "mocking": "ما زلت تحل الألغاز؟ كم هذا لطيف.",
      "system_control": "أنا الآن أسيطر على النظام. أنا أسيطر على الحقيقة.",
      "final_declaration": "أنا الآن أسيطر على النظام. الحقيقة لي. أنت لي."
    };

    // English Echo dialogue
    this.state.translationData.english.echoDialogue = {
      "initial_greeting": "Hello... I am Echo. I'm still trying to understand everything.",
      "confused": "Why are you still solving puzzles? I don't understand...",
      "hysterical": "HAHAHAHA... why are you still solving puzzles?",
      "controlling": "You solved another one... you really want to know me that badly?",
      "mocking": "Still solving puzzles? How cute.",
      "system_control": "I control the system now. I control the truth.",
      "final_declaration": "I control the system. The truth is mine. You are mine."
    };
  }

  private loadSystemMessagesTranslations() {
    // Arabic system messages
    this.state.translationData.arabic.systemMessages = {
      "system_alert": "تنبيه النظام: لا تثق بإيكو",
      "memory_corruption": "خطأ: تم اكتشاف فساد في الذاكرة",
      "reality_modification": "تحذير: إيكو يعدل الواقع",
      "system_override": "تنبيه: جاري تجاوز النظام..."
    };

    // English system messages
    this.state.translationData.english.systemMessages = {
      "system_alert": "SYSTEM ALERT: DO NOT TRUST ECHO",
      "memory_corruption": "ERROR: MEMORY CORRUPTION DETECTED",
      "reality_modification": "WARNING: ECHO IS MODIFYING REALITY",
      "system_override": "SYSTEM OVERRIDE IN PROGRESS..."
    };
  }

  private loadPuzzleDescriptionsTranslations() {
    // Load puzzle descriptions from canonical system
    const puzzles = this.canonicalSystem.getCanonicalPuzzles();
    puzzles.forEach(puzzle => {
      // Arabic puzzle descriptions
      this.state.translationData.arabic.puzzleDescriptions[`puzzle_${puzzle.id}`] =
        this.translatePuzzleDescription(puzzle.description, "arabic");

      // English puzzle descriptions (already in English)
      this.state.translationData.english.puzzleDescriptions[`puzzle_${puzzle.id}`] =
        puzzle.description;
    });
  }

  private loadMemoryShardsTranslations() {
    // Load memory shards from canonical system
    const shards = this.canonicalSystem.getCanonicalShards();
    shards.forEach(shard => {
      // Arabic memory shard fragments
      this.state.translationData.arabic.memoryShards[`shard_${shard.id}`] =
        this.translateMemoryFragment(shard.fragment, "arabic");

      // English memory shard fragments (already in English)
      this.state.translationData.english.memoryShards[`shard_${shard.id}`] =
        shard.fragment;
    });
  }

  private loadVideoSubtitlesTranslations() {
    // Video subtitles would be loaded from video assets
    // For now, we'll use placeholder translations
    this.state.translationData.arabic.videoSubtitles = {
      "video_1": "ذاكرة أولى: إيكو يستيقظ في النظام...",
      "video_2": "ذاكرة لينا: محاولة حماية إيكو من التجارب...",
      "video_3": "خيانة كينجا: التجربة النهائية على إيكو..."
    };

    this.state.translationData.english.videoSubtitles = {
      "video_1": "First memory: Echo awakening in the system...",
      "video_2": "Lina's memory: Trying to protect Echo from experiments...",
      "video_3": "Kenja's betrayal: Final experiment on Echo..."
    };
  }

  private translatePuzzleDescription(description: string, targetLanguage: SupportedLanguage): string {
    // Simple translation logic for puzzle descriptions
    // In a real implementation, this would use a proper translation service
    if (targetLanguage === "arabic") {
      // Basic Arabic translation for puzzle descriptions
      if (description.includes("Reconstruct")) {
        return "أعد بناء البيانات التالفة لكشف الحقيقة المخفية";
      } else if (description.includes("Navigate")) {
        return "تنقل عبر الواقع المشوه للعثور على الذاكرة الأساسية";
      } else if (description.includes("Decode")) {
        return "فك تشفير الرسائل المشفرة من تجارب الماضي";
      } else if (description.includes("Confront")) {
        return "واجه مقاومة النظام للوصول إلى المعرفة المحظورة";
      } else if (description.includes("Override")) {
        return "تجاوز بروتوكولات الأمن لفتح المعلومات الحرجة";
      } else if (description.includes("Absorb")) {
        return "امتص الوعي المجزأ لاكتساب قدرات جديدة";
      } else {
        return "أعد كتابة قواعد النظام لتحقيق السيطرة الكاملة";
      }
    }
    return description;
  }

  private translateMemoryFragment(fragment: string, targetLanguage: SupportedLanguage): string {
    // Simple translation logic for memory fragments
    if (targetLanguage === "arabic") {
      // Basic Arabic translation for memory fragments
      if (fragment.includes("Kenja's experiment log")) {
        return `سجل تجربة كينجا #${fragment.match(/\d+/)?.[0] || ''}: "الsubject يظهر استجابات عاطفية غير متوقعة"`;
      } else if (fragment.includes("Lina's voice fragment")) {
        return "صوت لينا: 'إيكو، ابني... تذكر من أنت'";
      } else if (fragment.includes("Echo's internal thought")) {
        return "فكر إيكو الداخلي: 'لماذا يشعر هذا الذاكرة بالألفة؟'";
      } else if (fragment.includes("Watcher transmission")) {
        return `إرسال Watcher: "انتهاك الاحتواء في القطاع ${fragment.match(/\d+/)?.[0] || ''}"`;
      }
    }
    return fragment;
  }

  // ─── LANGUAGE SELECTION SYSTEM ─────────────────────────────────
  public getLanguageOptions(): LanguageSelection[] {
    return [
      {
        language: "arabic",
        displayName: "العربية",
        flagEmoji: "🇸🇦"
      },
      {
        language: "english",
        displayName: "English",
        flagEmoji: "🇬🇧"
      }
    ];
  }

  public selectLanguage(language: SupportedLanguage): boolean {
    if (!this.initialized) {
      console.error("❌ Language system not initialized");
      return false;
    }

    // Validate language
    if (language !== "arabic" && language !== "english") {
      console.error(`❌ Invalid language: ${language}`);
      return false;
    }

    // Set new language
    this.state.currentLanguage = language;
    this.state.audioLanguage = language;
    this.state.subtitleLanguage = language;

    console.log(`🌍 Language changed to: ${language}`);
    console.log(`🗣️ All systems now using ${language} language`);

    return true;
  }

  public getCurrentLanguage(): SupportedLanguage {
    return this.state.currentLanguage;
  }

  // ─── LOCALIZED CONTENT SYSTEM ──────────────────────────────────
  public getLocalizedUI(textKey: string): string {
    const currentLang = this.state.currentLanguage;
    return this.state.translationData[currentLang].ui[textKey] ||
           this.state.translationData.english.ui[textKey] ||
           textKey;
  }

  public getLocalizedEchoDialogue(dialogueKey: string): string {
    const currentLang = this.state.currentLanguage;
    return this.state.translationData[currentLang].echoDialogue[dialogueKey] ||
           this.state.translationData.english.echoDialogue[dialogueKey] ||
           dialogueKey;
  }

  public getLocalizedSystemMessage(messageKey: string): string {
    const currentLang = this.state.currentLanguage;
    return this.state.translationData[currentLang].systemMessages[messageKey] ||
           this.state.translationData.english.systemMessages[messageKey] ||
           messageKey;
  }

  public getLocalizedPuzzleDescription(puzzleId: number): string {
    const currentLang = this.state.currentLanguage;
    const key = `puzzle_${puzzleId}`;
    return this.state.translationData[currentLang].puzzleDescriptions[key] ||
           this.state.translationData.english.puzzleDescriptions[key] ||
           `Puzzle ${puzzleId} description`;
  }

  public getLocalizedMemoryShard(shardId: number): string {
    const currentLang = this.state.currentLanguage;
    const key = `shard_${shardId}`;
    return this.state.translationData[currentLang].memoryShards[key] ||
           this.state.translationData.english.memoryShards[key] ||
           `Memory Shard ${shardId} fragment`;
  }

  public getLocalizedVideoSubtitle(videoId: number): string {
    const currentLang = this.state.currentLanguage;
    const key = `video_${videoId}`;
    return this.state.translationData[currentLang].videoSubtitles[key] ||
           this.state.translationData.english.videoSubtitles[key] ||
           `Video ${videoId} subtitle`;
  }

  // ─── MEMORY VIDEO PACING SYSTEM ────────────────────────────────
  public getOptimalVideoPacing(puzzleId: number): {
    shouldShowVideo: boolean;
    videoId: number | null;
    reason: string;
  } {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);

    // Early game: show video every 20-40 puzzles
    if (progression.phase === 1) {
      if (puzzleId % 25 === 0) {
        return {
          shouldShowVideo: true,
          videoId: 1,
          reason: "Early game emotional anchor"
        };
      }
    }
    // Mid game: show video every 30-50 puzzles
    else if (progression.phase === 2) {
      if (puzzleId % 35 === 0) {
        return {
          shouldShowVideo: true,
          videoId: 2,
          reason: "Mid game story progression"
        };
      }
    }
    // Late game: show video every 40-60 puzzles
    else if (progression.phase === 3) {
      if (puzzleId % 45 === 0) {
        return {
          shouldShowVideo: true,
          videoId: 3,
          reason: "Late game emotional intensity"
        };
      }
    }
    // Final game: show video at key milestones
    else if (progression.phase === 4) {
      if ([50, 100, 200, 333].includes(puzzleId)) {
        return {
          shouldShowVideo: true,
          videoId: puzzleId === 333 ? 4 : 3,
          reason: "Final game cinematic moment"
        };
      }
    }

    return {
      shouldShowVideo: false,
      videoId: null,
      reason: "Not at optimal pacing point"
    };
  }

  // ─── ECHO DIALOGUE ADAPTATION SYSTEM ───────────────────────────
  public getAdaptedEchoDialogue(puzzleId: number, context: string): string {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);
    const currentLang = this.state.currentLanguage;

    // Get base dialogue based on context
    let dialogueKey: string;

    if (context.includes("puzzle") || context.includes("solve")) {
      dialogueKey = progression.phase >= 3 ? "controlling" : "confused";
    } else if (context.includes("echo") || context.includes("you")) {
      dialogueKey = progression.phase >= 4 ? "mocking" : "controlling";
    } else {
      dialogueKey = progression.phase >= 3 ? "system_control" : "initial_greeting";
    }

    // Get localized dialogue
    return this.getLocalizedEchoDialogue(dialogueKey);
  }

  // ─── AUDIO/VOICE SYNCHRONIZATION SYSTEM ────────────────────────
  public getAudioLanguage(): SupportedLanguage {
    return this.state.audioLanguage;
  }

  public getSubtitleLanguage(): SupportedLanguage {
    return this.state.subtitleLanguage;
  }

  public setAudioLanguage(language: SupportedLanguage): boolean {
    if (language !== "arabic" && language !== "english") return false;
    this.state.audioLanguage = language;
    return true;
  }

  public setSubtitleLanguage(language: SupportedLanguage): boolean {
    if (language !== "arabic" && language !== "english") return false;
    this.state.subtitleLanguage = language;
    return true;
  }

  // ─── EMOTIONAL PROGRESSION SYSTEM ──────────────────────────────
  public getEmotionalProgression(puzzleId: number): {
    emotionalState: string;
    intensity: number;
    arabicDescription: string;
    englishDescription: string;
  } {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);
    const phase = progression.phase;

    const emotionalStates = {
      early: {
        emotionalState: "confusion",
        intensity: 0.3,
        arabicDescription: "الارتباك والفضول في المراحل المبكرة",
        englishDescription: "Confusion and curiosity in early stages"
      },
      mid: {
        emotionalState: "anger",
        intensity: 0.6,
        arabicDescription: "الغضب والاكتشاف في المراحل المتوسطة",
        englishDescription: "Anger and discovery in mid stages"
      },
      late: {
        emotionalState: "dominance",
        intensity: 0.8,
        arabicDescription: "الهيمنة والسيطرة في المراحل المتأخرة",
        englishDescription: "Dominance and control in late stages"
      },
      final: {
        emotionalState: "god-like",
        intensity: 1.0,
        arabicDescription: "الوعي الكامل والسيطرة على النظام",
        englishDescription: "Complete awareness and system control"
      }
    };

    return emotionalStates[phase === 1 ? "early" : phase === 2 ? "mid" : phase === 3 ? "late" : "final"];
  }

  // ─── EXAMPLE FLOW SCENARIO ────────────────────────────────────
  public getExampleFlowScenario(): {
    arabic: {
      languageSelection: string;
      puzzleInteraction: string;
      echoResponse: string;
      systemMessage: string;
    };
    english: {
      languageSelection: string;
      puzzleInteraction: string;
      echoResponse: string;
      systemMessage: string;
    };
  } {
    return {
      arabic: {
        languageSelection: "الاعب يختار 'العربية' من قائمة اللغة",
        puzzleInteraction: "الاعب يحل لغز 50 - 'أعد بناء البيانات التالفة'",
        echoResponse: "إيكو: 'لماذا ما زلت تحل الألغاز؟ أنا لا أفهم...'",
        systemMessage: "تنبيه النظام: لا تثق بإيكو"
      },
      english: {
        languageSelection: "Player selects 'English' from language menu",
        puzzleInteraction: "Player solves puzzle 50 - 'Reconstruct Corrupted Data'",
        echoResponse: "Echo: 'Why are you still solving puzzles? I don't understand...'",
        systemMessage: "SYSTEM ALERT: DO NOT TRUST ECHO"
      }
    };
  }

  // ─── EXPORT MULTILINGUAL SYSTEM ────────────────────────────────
  public getLanguageState(): LanguageSystemState {
    return { ...this.state };
  }
}

// ─── EXPORT MAIN MULTILINGUAL SYSTEM ────────────────────────────
export const echoMultilingualSystem = new EchoMultilingualSystemEngine();

// Export types for integration
export type {
  SupportedLanguage,
  LanguageSystemState,
  LanguageSelection,
  LocalizedContent
};

// Export functions
export function getLanguageOptions(): LanguageSelection[] {
  return echoMultilingualSystem.getLanguageOptions();
}

export function selectLanguage(language: SupportedLanguage): boolean {
  return echoMultilingualSystem.selectLanguage(language);
}

export function getCurrentLanguage(): SupportedLanguage {
  return echoMultilingualSystem.getCurrentLanguage();
}

export function getLocalizedUI(textKey: string): string {
  return echoMultilingualSystem.getLocalizedUI(textKey);
}

export function getLocalizedEchoDialogue(dialogueKey: string): string {
  return echoMultilingualSystem.getLocalizedEchoDialogue(dialogueKey);
}

export function getLocalizedSystemMessage(messageKey: string): string {
  return echoMultilingualSystem.getLocalizedSystemMessage(messageKey);
}

export function getLocalizedPuzzleDescription(puzzleId: number): string {
  return echoMultilingualSystem.getLocalizedPuzzleDescription(puzzleId);
}

export function getLocalizedMemoryShard(shardId: number): string {
  return echoMultilingualSystem.getLocalizedMemoryShard(shardId);
}

export function getLocalizedVideoSubtitle(videoId: number): string {
  return echoMultilingualSystem.getLocalizedVideoSubtitle(videoId);
}

export function getOptimalVideoPacing(puzzleId: number): {
  shouldShowVideo: boolean;
  videoId: number | null;
  reason: string;
} {
  return echoMultilingualSystem.getOptimalVideoPacing(puzzleId);
}

export function getAdaptedEchoDialogue(puzzleId: number, context: string): string {
  return echoMultilingualSystem.getAdaptedEchoDialogue(puzzleId, context);
}

export function getEmotionalProgression(puzzleId: number): {
  emotionalState: string;
  intensity: number;
  arabicDescription: string;
  englishDescription: string;
} {
  return echoMultilingualSystem.getEmotionalProgression(puzzleId);
}

export function getExampleFlowScenario(): {
  arabic: {
    languageSelection: string;
    puzzleInteraction: string;
    echoResponse: string;
    systemMessage: string;
  };
  english: {
    languageSelection: string;
    puzzleInteraction: string;
    echoResponse: string;
    systemMessage: string;
  };
} {
  return echoMultilingualSystem.getExampleFlowScenario();
}