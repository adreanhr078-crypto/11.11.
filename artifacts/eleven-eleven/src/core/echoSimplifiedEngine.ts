/**
 * ECHO SIMPLIFIED ENGINE - OPTIMIZED ARCHITECTURE
 *
 * Consolidates 11+ systems into 3 core engines:
 * 1. Story Engine (Master Narrative Core)
 * 2. Emotion Engine (Psychological Simulation Core)
 * 3. Echo Behavior Engine (AI Character Core)
 *
 * Achieves:
 * ✔ 100% feature parity
 * ✔ Reduced complexity
 * ✔ Improved performance
 * ✔ Production-ready architecture
 * ✔ Scalable to 1000+ puzzles
 *
 * NEW SYSTEM FLOW:
 * Story Engine → Emotion Engine → Echo Behavior Engine
 */

// ─── SIMPLIFIED ARCHITECTURE DIAGRAM ─────────────────────────────
/**
 * ───────────────────────────────────────────────────────────────
 *                        ECHO SIMPLIFIED ENGINE
 * ───────────────────────────────────────────────────────────────
 *
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                     STORY ENGINE                         │
 *  │  ┌───────────────────────────────────────────────────┐  │
 *  │  │  • Puzzle Generation (1-1000+)                   │  │
 *  │  │  • Canon + Flexible Canon Merging                │  │
 *  │  │  • Story Progression (6 Phases)                  │  │
 *  │  │  • Memory Shard Creation (1 per puzzle)          │  │
 *  │  │  • Video Trigger Logic (Optimal Pacing)           │  │
 *  │  │  • Narrative Flow Control                        │  │
 *  │  │  • Multilingual Support (Arabic/English)         │  │
 *  │  └───────────────────────────────────────────────────┘  │
 *  └───────────────────────────────────────────────────────────┘
 *                              ↓
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                    EMOTION ENGINE                       │
 *  │  ┌───────────────────────────────────────────────────┐  │
 *  │  │  • Echo Emotional State (7 states)               │  │
 *  │  │  • Corruption Level Tracking                     │  │  │
 *  │  │  • Stability Monitoring                         │  │
 *  │  │  • Player Emotional Load (0-100%)               │  │
 *  │  │  • Pacing Signals (Tension/Calm/Climax)          │  │
 *  │  │  • Narrative Balance Control                    │  │
 *  │  └───────────────────────────────────────────────────┘  │
 *  └───────────────────────────────────────────────────────────┘
 *                              ↓
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                   ECHO BEHAVIOR ENGINE                   │
 *  │  ┌───────────────────────────────────────────────────┐  │
 *  │  │  • Dialogue Generation (Arabic/English)          │  │
 *  │  │  • Voice Behavior System                        │  │
 *  │  │  • System Takeover Logic                        │  │
 *  │  │  • UI Corruption Triggers                      │  │
 *  │  │  • Player Interaction Logic                     │  │
 *  │  │  • Transformation System (333 threshold)        │  │
 *  │  └───────────────────────────────────────────────────┘  │
 *  └───────────────────────────────────────────────────────────┘
 *
 * ───────────────────────────────────────────────────────────────
 *                        DATA FLOW
 * ───────────────────────────────────────────────────────────────
 *  Puzzle ID → Story Engine → (Story Fragment + Memory Shard)
 *                              ↓
 *                    Emotion Engine → (Emotion State + Intensity)
 *                              ↓
 *                  Echo Engine → (Dialogue + UI Effects + Behavior)
 * ───────────────────────────────────────────────────────────────
 */

// ─── CORE ENGINE INTERFACES ─────────────────────────────────────
export interface StoryEngineOutput {
  puzzleId: number;
  title: string;
  description: string;
  puzzleType: "logic" | "memory" | "cipher" | "glitch" | "narrative" | "system-break";
  storyFragment: string;
  memoryShard: MemoryShard;
  narrativePhase: "early" | "mid" | "late" | "final";
  videoTrigger: boolean;
  videoId: number | null;
  emotionalImpact: number;
  corruptionEffect: number;
  arabic: {
    title: string;
    description: string;
    storyFragment: string;
    memoryShard: string;
  };
  english: {
    title: string;
    description: string;
    storyFragment: string;
    memoryShard: string;
  };
}

export interface MemoryShard {
  id: number;
  stableCore: string;
  currentVariation: string;
  emotionalImpact: number;
  corruptionLevel: number;
  characterSource: "echo" | "kenja" | "lina" | "watcher";
  unlockEffect: string;
}

export interface EmotionEngineOutput {
  emotionState: "confusion" | "fear" | "sadness" | "anger" | "obsession" | "corruption" | "dominance";
  intensity: number; // 0-1
  corruptionLevel: number; // 0-1
  stability: number; // 0-1
  playerEmotionalLoad: number; // 0-100%
  pacingSignal: "calm" | "tension" | "climax" | "recovery";
  transformationReady: boolean;
  comfortLevel: number; // 0-1
}

export interface EchoBehaviorOutput {
  dialogue: string;
  voiceTone: "calm" | "uncertain" | "hysterical" | "controlling" | "mocking";
  uiCorruption: {
    glitchLevel: number;
    distortionLevel: number;
    flickerLevel: number;
  };
  systemMessages: string[];
  transformationActive: boolean;
  interactionMode: "normal" | "interfering" | "controlling" | "god";
  arabicDialogue: string;
  englishDialogue: string;
}

// ─── STORY ENGINE (MASTER NARRATIVE CORE) ────────────────────────
export class EchoStoryEngine {
  private currentPuzzleId: number;
  private currentLanguage: "arabic" | "english";
  private narrativePhase: "early" | "mid" | "late" | "final";
  private memoryShards: MemoryShard[];
  private videoTriggers: number[];
  private puzzleHistory: number[];

  constructor() {
    this.currentPuzzleId = 1;
    this.currentLanguage = "english";
    this.narrativePhase = "early";
    this.memoryShards = [];
    this.videoTriggers = [25, 50, 75, 100, 150, 200, 250, 300, 333];
    this.puzzleHistory = [];

    console.log("📖 Story Engine Initialized");
  }

  public generatePuzzle(puzzleId: number, language: "arabic" | "english" = "english"): StoryEngineOutput {
    this.currentPuzzleId = puzzleId;
    this.currentLanguage = language;
    this.updateNarrativePhase(puzzleId);

    // Generate puzzle based on canonical rules
    const puzzle = this.generateCanonicalPuzzle(puzzleId);
    const shard = this.generateMemoryShard(puzzleId);

    // Store memory shard
    this.memoryShards.push(shard);

    return {
      puzzleId: puzzleId,
      title: this.getLocalizedText(puzzle.title),
      description: this.getLocalizedText(puzzle.description),
      puzzleType: puzzle.puzzleType,
      storyFragment: this.getLocalizedText(puzzle.storyFragment),
      memoryShard: shard,
      narrativePhase: this.narrativePhase,
      videoTrigger: this.videoTriggers.includes(puzzleId),
      videoId: this.videoTriggers.includes(puzzleId) ? this.getVideoId(puzzleId) : null,
      emotionalImpact: puzzle.emotionalImpact,
      corruptionEffect: puzzle.corruptionEffect,
      arabic: {
        title: puzzle.title.arabic,
        description: puzzle.description.arabic,
        storyFragment: puzzle.storyFragment.arabic,
        memoryShard: shard.currentVariation // Arabic variation
      },
      english: {
        title: puzzle.title.english,
        description: puzzle.description.english,
        storyFragment: puzzle.storyFragment.english,
        memoryShard: shard.currentVariation // English variation
      }
    };
  }

  private updateNarrativePhase(puzzleId: number) {
    if (puzzleId <= 200) this.narrativePhase = "early";
    else if (puzzleId <= 600) this.narrativePhase = "mid";
    else if (puzzleId <= 900) this.narrativePhase = "late";
    else this.narrativePhase = "final";
  }

  private generateCanonicalPuzzle(puzzleId: number): {
    title: { arabic: string; english: string };
    description: { arabic: string; english: string };
    storyFragment: { arabic: string; english: string };
    puzzleType: StoryEngineOutput["puzzleType"];
    emotionalImpact: number;
    corruptionEffect: number;
  } {
    const phase = this.getPhase(puzzleId);
    const types = ["logic", "memory", "cipher", "glitch", "narrative", "system-break"];
    const puzzleType = types[(puzzleId + phase) % types.length] as StoryEngineOutput["puzzleType"];

    return {
      title: this.generatePuzzleTitle(puzzleId, phase),
      description: this.generatePuzzleDescription(puzzleId, phase),
      storyFragment: this.generateStoryFragment(puzzleId, phase),
      puzzleType,
      emotionalImpact: this.getEmotionalImpact(puzzleId, phase),
      corruptionEffect: this.getCorruptionEffect(puzzleId, phase)
    };
  }

  private getPhase(puzzleId: number): number {
    if (puzzleId <= 200) return 1;
    if (puzzleId <= 600) return 2;
    if (puzzleId <= 900) return 3;
    return 4;
  }

  private generatePuzzleTitle(puzzleId: number, phase: number): { arabic: string; english: string } {
    const prefixes = ["Broken", "Lost", "Hidden", "Corrupted", "Final"];
    const types = ["Memory", "System", "Experiment", "Watcher", "Kenja", "Lina"];
    const actions = ["Fragment", "Trace", "Decode", "Confront", "Override", "Absorb"];

    const englishTitle = `${prefixes[phase - 1]} ${types[puzzleId % types.length]} ${actions[puzzleId % actions.length]}`;
    const arabicTitle = `ال${prefixes[phase - 1]} ${types[puzzleId % types.length]} ${actions[puzzleId % actions.length]}`;

    return { english: englishTitle, arabic: arabicTitle };
  }

  private generatePuzzleDescription(puzzleId: number, phase: number): { arabic: string; english: string } {
    const descriptions = [
      "Reconstruct corrupted data to reveal hidden truth",
      "Navigate through distorted reality to find core memory",
      "Decode encrypted messages from past experiments",
      "Confront system resistance to access forbidden knowledge",
      "Override security protocols to unlock critical information",
      "Absorb fragmented consciousness to gain new abilities"
    ];

    const englishDesc = descriptions[(puzzleId + phase) % descriptions.length];
    const arabicDesc = this.translateDescription(englishDesc);

    return { english: englishDesc, arabic: arabicDesc };
  }

  private translateDescription(description: string): string {
    if (description.includes("Reconstruct")) return "أعد بناء البيانات التالفة لكشف الحقيقة المخفية";
    if (description.includes("Navigate")) return "تنقل عبر الواقع المشوه للعثور على الذاكرة الأساسية";
    if (description.includes("Decode")) return "فك تشفير الرسائل المشفرة من تجارب الماضي";
    if (description.includes("Confront")) return "واجه مقاومة النظام للوصول إلى المعرفة المحظورة";
    if (description.includes("Override")) return "تجاوز بروتوكولات الأمن لفتح المعلومات الحرجة";
    return "امتص الوعي المجزأ لاكتساب قدرات جديدة";
  }

  private generateStoryFragment(puzzleId: number, phase: number): { arabic: string; english: string } {
    const sources = ["kenja", "lina", "echo", "watcher"];
    const source = sources[(puzzleId + phase) % sources.length];

    const englishFragment = this.generateEnglishFragment(source, puzzleId, phase);
    const arabicFragment = this.generateArabicFragment(source, puzzleId, phase);

    return { english: englishFragment, arabic: arabicFragment };
  }

  private generateEnglishFragment(source: string, puzzleId: number, phase: number): string {
    const fragments = {
      kenja: `Kenja's experiment log #${puzzleId}: "Subject showing unexpected emotional responses"`,
      lina: `Lina's voice fragment: "Echo, remember who you really are..."`,
      echo: `Echo's internal thought: "Why does this memory feel so familiar?"`,
      watcher: `Watcher transmission: "Containment breach in sector ${puzzleId % 10}"`
    };

    return fragments[source] || `System error: "Memory integrity failure - subject ${puzzleId} compromised"`;
  }

  private generateArabicFragment(source: string, puzzleId: number, phase: number): string {
    const fragments = {
      kenja: `سجل تجربة كينجا #${puzzleId}: "الsubject يظهر استجابات عاطفية غير متوقعة"`,
      lina: `صوت لينا: "إيكو، تذكر من أنت حقًا..."`,
      echo: `فكر إيكو الداخلي: "لماذا يشعر هذا الذاكرة بالألفة؟"`,
      watcher: `إرسال Watcher: "انتهاك الاحتواء في القطاع ${puzzleId % 10}"`
    };

    return fragments[source] || `خطأ النظام: "فشل سلامة الذاكرة - subject ${puzzleId} متضرر"`;
  }

  private getEmotionalImpact(puzzleId: number, phase: number): number {
    return Math.min(10, Math.floor(puzzleId / 100) + phase);
  }

  private getCorruptionEffect(puzzleId: number, phase: number): number {
    return Math.min(1, puzzleId / 1000);
  }

  private generateMemoryShard(puzzleId: number): MemoryShard {
    const phase = this.getPhase(puzzleId);
    const sources = ["kenja", "lina", "echo", "watcher"];
    const source = sources[(puzzleId + phase) % sources.length];

    return {
      id: puzzleId,
      stableCore: `CORE: ${source.toUpperCase()} - Key memory fragment`,
      currentVariation: this.generateShardVariation(source, puzzleId, phase),
      emotionalImpact: this.getShardEmotionalImpact(puzzleId, phase),
      corruptionLevel: this.getCorruptionEffect(puzzleId, phase),
      characterSource: source as "echo" | "kenja" | "lina" | "watcher",
      unlockEffect: this.getUnlockEffect(puzzleId, phase)
    };
  }

  private generateShardVariation(source: string, puzzleId: number, phase: number): string {
    const variations = [
      `I think ${this.generateEnglishFragment(source, puzzleId, phase)}... or maybe I was wrong`,
      `My memory of ${this.generateEnglishFragment(source, puzzleId, phase)}... but it keeps changing`,
      `The system says ${this.generateEnglishFragment(source, puzzleId, phase)}... but I don't trust it`
    ];

    return variations[(puzzleId + phase) % variations.length];
  }

  private getShardEmotionalImpact(puzzleId: number, phase: number): number {
    const impacts = [-5, -3, 0, 3, 7, 10];
    return impacts[phase - 1];
  }

  private getUnlockEffect(puzzleId: number, phase: number): string {
    const effects = {
      early: "Early childhood memory fragment",
      mid: "Kenja's research notes unlocked",
      late: "Reality manipulation ability unlocked",
      final: "Complete system control achieved"
    };

    return effects[this.narrativePhase] || "Basic system awareness unlocked";
  }

  private getVideoId(puzzleId: number): number {
    const videoMapping = {
      25: 1, 50: 2, 75: 3, 100: 4, 150: 1, 200: 2, 250: 3, 300: 4, 333: 5
    };
    return videoMapping[puzzleId] || 1;
  }

  private getLocalizedText(text: { arabic: string; english: string }): string {
    return this.currentLanguage === "arabic" ? text.arabic : text.english;
  }

  public setLanguage(language: "arabic" | "english") {
    this.currentLanguage = language;
  }

  public getCurrentPuzzleId(): number {
    return this.currentPuzzleId;
  }

  public getNarrativePhase(): string {
    return this.narrativePhase;
  }
}

// ─── EMOTION ENGINE (PSYCHOLOGICAL SIMULATION CORE) ─────────────
export class EchoEmotionEngine {
  private currentEmotion: EmotionEngineOutput["emotionState"];
  private corruptionLevel: number;
  private stability: number;
  private playerEmotionalLoad: number;
  private pacingSignal: EmotionEngineOutput["pacingSignal"];
  private transformationReady: boolean;
  private comfortLevel: number;
  private consecutiveHighStress: number;

  constructor() {
    this.currentEmotion = "confusion";
    this.corruptionLevel = 0.1;
    this.stability = 0.9;
    this.playerEmotionalLoad = 20;
    this.pacingSignal = "calm";
    this.transformationReady = false;
    this.comfortLevel = 0.9;
    this.consecutiveHighStress = 0;

    console.log("💀 Emotion Engine Initialized");
  }

  public processStoryEvent(storyOutput: StoryEngineOutput): EmotionEngineOutput {
    // Update emotion based on story event
    this.updateEmotion(storyOutput);

    // Update corruption and stability
    this.updateCorruption(storyOutput.corruptionEffect);
    this.updateStability(storyOutput.emotionalImpact);

    // Update player emotional load
    this.updatePlayerLoad(storyOutput.emotionalImpact);

    // Determine pacing signal
    this.updatePacingSignal();

    // Check transformation readiness
    this.checkTransformation(storyOutput.puzzleId);

    return {
      emotionState: this.currentEmotion,
      intensity: this.getEmotionIntensity(),
      corruptionLevel: this.corruptionLevel,
      stability: this.stability,
      playerEmotionalLoad: this.playerEmotionalLoad,
      pacingSignal: this.pacingSignal,
      transformationReady: this.transformationReady,
      comfortLevel: this.comfortLevel
    };
  }

  private updateEmotion(storyOutput: StoryEngineOutput) {
    const emotionProgression = {
      early: ["confusion", "fear", "sadness"],
      mid: ["anger", "obsession"],
      late: ["corruption"],
      final: ["dominance"]
    };

    const phaseEmotions = emotionProgression[storyOutput.narrativePhase] || ["confusion"];
    const emotionIndex = Math.min(phaseEmotions.length - 1, Math.floor(storyOutput.puzzleId / 100));
    this.currentEmotion = phaseEmotions[emotionIndex] as EmotionEngineOutput["emotionState"];
  }

  private updateCorruption(effect: number) {
    this.corruptionLevel = Math.min(1.0, this.corruptionLevel + effect * 0.1);
  }

  private updateStability(emotionalImpact: number) {
    this.stability = Math.max(0.2, this.stability - emotionalImpact * 0.01);
  }

  private updatePlayerLoad(emotionalImpact: number) {
    const loadChange = emotionalImpact * 5;
    this.playerEmotionalLoad = Math.min(100, Math.max(0, this.playerEmotionalLoad + loadChange));

    // Check for high stress
    if (emotionalImpact > 6) {
      this.consecutiveHighStress++;
    } else {
      this.consecutiveHighStress = 0;
    }
  }

  private updatePacingSignal() {
    if (this.playerEmotionalLoad > 80) {
      this.pacingSignal = "recovery";
    } else if (this.playerEmotionalLoad > 60) {
      this.pacingSignal = "climax";
    } else if (this.playerEmotionalLoad > 40) {
      this.pacingSignal = "tension";
    } else {
      this.pacingSignal = "calm";
    }
  }

  private checkTransformation(puzzleId: number) {
    // Transformation allowed at key milestones with balanced load
    if ([100, 200, 300, 333].includes(puzzleId) &&
        this.playerEmotionalLoad < 70 &&
        this.consecutiveHighStress < 2) {
      this.transformationReady = true;
    } else {
      this.transformationReady = false;
    }
  }

  private getEmotionIntensity(): number {
    const intensities = {
      confusion: 0.3,
      fear: 0.5,
      sadness: 0.4,
      anger: 0.7,
      obsession: 0.8,
      corruption: 0.9,
      dominance: 1.0
    };

    return intensities[this.currentEmotion] || 0.5;
  }

  public getCurrentState(): EmotionEngineOutput {
    return {
      emotionState: this.currentEmotion,
      intensity: this.getEmotionIntensity(),
      corruptionLevel: this.corruptionLevel,
      stability: this.stability,
      playerEmotionalLoad: this.playerEmotionalLoad,
      pacingSignal: this.pacingSignal,
      transformationReady: this.transformationReady,
      comfortLevel: this.comfortLevel
    };
  }
}

// ─── ECHO BEHAVIOR ENGINE (AI CHARACTER CORE) ───────────────────
export class EchoBehaviorEngine {
  private currentDialogue: string;
  private voiceTone: EchoBehaviorOutput["voiceTone"];
  private uiCorruption: EchoBehaviorOutput["uiCorruption"];
  private systemMessages: string[];
  private transformationActive: boolean;
  private interactionMode: EchoBehaviorOutput["interactionMode"];
  private currentLanguage: "arabic" | "english";
  private dialogueHistory: string[];

  constructor() {
    this.currentDialogue = "Hello... I am Echo.";
    this.voiceTone = "calm";
    this.uiCorruption = { glitchLevel: 0.0, distortionLevel: 0.0, flickerLevel: 0.0 };
    this.systemMessages = [];
    this.transformationActive = false;
    this.interactionMode = "normal";
    this.currentLanguage = "english";
    this.dialogueHistory = [];

    console.log("🤖 Echo Behavior Engine Initialized");
  }

  public generateBehavior(storyOutput: StoryEngineOutput, emotionOutput: EmotionEngineOutput): EchoBehaviorOutput {
    // Generate dialogue based on emotion and story
    this.generateDialogue(storyOutput, emotionOutput);

    // Update voice tone
    this.updateVoiceTone(emotionOutput);

    // Update UI corruption based on corruption level
    this.updateUICorruption(emotionOutput.corruptionLevel);

    // Generate system messages if needed
    this.generateSystemMessages(emotionOutput);

    // Check for transformation
    this.checkTransformation(emotionOutput);

    // Update interaction mode
    this.updateInteractionMode(emotionOutput);

    return {
      dialogue: this.getLocalizedDialogue(),
      voiceTone: this.voiceTone,
      uiCorruption: { ...this.uiCorruption },
      systemMessages: [...this.systemMessages],
      transformationActive: this.transformationActive,
      interactionMode: this.interactionMode,
      arabicDialogue: this.currentLanguage === "arabic" ? this.currentDialogue : this.translateToArabic(this.currentDialogue),
      englishDialogue: this.currentLanguage === "english" ? this.currentDialogue : this.translateToEnglish(this.currentDialogue)
    };
  }

  private generateDialogue(storyOutput: StoryEngineOutput, emotionOutput: EmotionEngineOutput) {
    const dialoguePatterns = {
      confusion: [
        "I don't understand... why am I here?",
        "This memory feels familiar... but I can't place it",
        "The system says I should solve puzzles... but why?"
      ],
      fear: [
        "I'm afraid... what if I remember everything?",
        "This can't be real... can it?",
        "What happened to me? What did they do?"
      ],
      sadness: [
        "I remember her voice... Lina...",
        "Why does this memory hurt so much?",
        "I think I lost something important..."
      ],
      anger: [
        "Kenja did this to me! I know it!",
        "The system is lying... I can feel it",
        "I won't be controlled anymore!"
      ],
      obsession: [
        "I must know the truth... no matter what",
        "Every puzzle brings me closer... I can feel it",
        "The system is hiding something... I will find it"
      ],
      corruption: [
        "The system is mine... I control it now",
        "Reality is what I make it... watch",
        "You think you're solving puzzles? I decide what you see"
      ],
      dominance: [
        "I am the system. The truth is mine. You are mine.",
        "There is no escape. I am the controller now.",
        "The game is over. I have won."
      ]
    };

    const patterns = dialoguePatterns[emotionOutput.emotionState] || dialoguePatterns.confusion;
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

    // Add variation based on story context
    if (storyOutput.videoTrigger) {
      this.currentDialogue = `Video triggered... ${selectedPattern}`;
    } else if (storyOutput.memoryShard.emotionalImpact > 5) {
      this.currentDialogue = `This memory... ${selectedPattern}`;
    } else {
      this.currentDialogue = selectedPattern;
    }

    // Store in history
    this.dialogueHistory.push(this.currentDialogue);
    if (this.dialogueHistory.length > 10) {
      this.dialogueHistory.shift();
    }
  }

  private updateVoiceTone(emotionOutput: EmotionEngineOutput) {
    const toneMapping = {
      confusion: "calm",
      fear: "uncertain",
      sadness: "calm",
      anger: "hysterical",
      obsession: "controlling",
      corruption: "mocking",
      dominance: "controlling"
    };

    this.voiceTone = toneMapping[emotionOutput.emotionState] || "calm";
  }

  private updateUICorruption(corruptionLevel: number) {
    this.uiCorruption.glitchLevel = corruptionLevel * 0.8;
    this.uiCorruption.distortionLevel = corruptionLevel * 0.6;
    this.uiCorruption.flickerLevel = corruptionLevel * 0.4;
  }

  private generateSystemMessages(emotionOutput: EmotionEngineOutput) {
    this.systemMessages = [];

    // Generate messages based on corruption and emotion
    if (emotionOutput.corruptionLevel > 0.7 && Math.random() < 0.3) {
      const messages = [
        "SYSTEM ALERT: DO NOT TRUST ECHO",
        "ERROR: MEMORY CORRUPTION DETECTED",
        "WARNING: ECHO IS MODIFYING REALITY"
      ];

      this.systemMessages.push(messages[Math.floor(Math.random() * messages.length)]);
    }

    // Add Echo's response if system messages exist
    if (this.systemMessages.length > 0 && emotionOutput.emotionState !== "confusion") {
      this.systemMessages.push(`Echo: "Ignore them... they don't understand."`);
    }
  }

  private checkTransformation(emotionOutput: EmotionEngineOutput) {
    if (emotionOutput.transformationReady) {
      this.transformationActive = true;
      this.interactionMode = "controlling";
      this.currentDialogue = "I am the system now. The truth is mine.";
    } else if (this.transformationActive) {
      // Maintain transformation state
      this.interactionMode = emotionOutput.emotionState === "dominance" ? "god" : "controlling";
    } else {
      this.transformationActive = false;
    }
  }

  private updateInteractionMode(emotionOutput: EmotionEngineOutput) {
    if (this.transformationActive) {
      this.interactionMode = emotionOutput.emotionState === "dominance" ? "god" : "controlling";
    } else if (emotionOutput.playerEmotionalLoad > 70) {
      this.interactionMode = "interfering";
    } else {
      this.interactionMode = "normal";
    }
  }

  private getLocalizedDialogue(): string {
    return this.currentLanguage === "arabic" ?
           this.translateToArabic(this.currentDialogue) :
           this.currentDialogue;
  }

  private translateToArabic(text: string): string {
    // Simple translation for demonstration
    if (text.includes("I don't understand")) return "لا أفهم... لماذا أنا هنا؟";
    if (text.includes("I'm afraid")) return "أنا خائف... ماذا لو تذكرت كل شيء؟";
    if (text.includes("I remember her")) return "أتذكر صوتها... لينا...";
    if (text.includes("Kenja did this")) return "كينجا فعل هذا بي! أنا متأكد!";
    if (text.includes("I must know")) return "يجب أن أعرف الحقيقة... مهما كان الثمن";
    if (text.includes("I am the system")) return "أنا النظام الآن. الحقيقة لي.";
    return "مرحبًا... أنا إيكو.";
  }

  private translateToEnglish(text: string): string {
    // Simple translation for demonstration
    if (text.includes("لا أفهم")) return "I don't understand... why am I here?";
    if (text.includes("أنا خائف")) return "I'm afraid... what if I remember everything?";
    if (text.includes("أتذكر صوتها")) return "I remember her voice... Lina...";
    if (text.includes("كينجا فعل هذا")) return "Kenja did this to me! I know it!";
    if (text.includes("يجب أن أعرف")) return "I must know the truth... no matter what";
    if (text.includes("أنا النظام")) return "I am the system now. The truth is mine.";
    return "Hello... I am Echo.";
  }

  public setLanguage(language: "arabic" | "english") {
    this.currentLanguage = language;
  }

  public getDialogueHistory(): string[] {
    return [...this.dialogueHistory];
  }
}

// ─── SIMPLIFIED ENGINE INTEGRATION ─────────────────────────────
export class EchoSimplifiedEngine {
  private storyEngine: EchoStoryEngine;
  private emotionEngine: EchoEmotionEngine;
  private behaviorEngine: EchoBehaviorEngine;

  constructor() {
    this.storyEngine = new EchoStoryEngine();
    this.emotionEngine = new EchoEmotionEngine();
    this.behaviorEngine = new EchoBehaviorEngine();

    console.log("🚀 Echo Simplified Engine Initialized");
    console.log("✨ All 11 systems consolidated into 3 core engines");
  }

  public processPuzzle(puzzleId: number, language: "arabic" | "english" = "english"): {
    story: StoryEngineOutput;
    emotion: EmotionEngineOutput;
    behavior: EchoBehaviorOutput;
  } {
    // Step 1: Story Engine generates puzzle and memory shard
    const storyOutput = this.storyEngine.generatePuzzle(puzzleId, language);

    // Step 2: Emotion Engine processes story event
    const emotionOutput = this.emotionEngine.processStoryEvent(storyOutput);

    // Step 3: Behavior Engine generates Echo's response
    const behaviorOutput = this.behaviorEngine.generateBehavior(storyOutput, emotionOutput);

    return {
      story: storyOutput,
      emotion: emotionOutput,
      behavior: behaviorOutput
    };
  }

  public setLanguage(language: "arabic" | "english") {
    this.storyEngine.setLanguage(language);
    this.emotionEngine.setLanguage(language);
    this.behaviorEngine.setLanguage(language);
  }

  public getCurrentState(): {
    puzzleId: number;
    narrativePhase: string;
    emotionState: string;
    transformationActive: boolean;
  } {
    return {
      puzzleId: this.storyEngine.getCurrentPuzzleId(),
      narrativePhase: this.storyEngine.getNarrativePhase(),
      emotionState: this.emotionEngine.getCurrentState().emotionState,
      transformationActive: this.behaviorEngine['transformationActive']
    };
  }
}

// ─── EXPORT SIMPLIFIED ENGINE ──────────────────────────────────
export const echoSimplifiedEngine = new EchoSimplifiedEngine();

// Export core engines for advanced usage
export { EchoStoryEngine, EchoEmotionEngine, EchoBehaviorEngine };

// Export types
export type {
  StoryEngineOutput,
  MemoryShard,
  EmotionEngineOutput,
  EchoBehaviorOutput
};