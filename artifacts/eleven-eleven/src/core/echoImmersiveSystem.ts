/**
 * ECHO IMMERSIVE LIVING ENTITY - FINAL UPGRADE
 *
 * Transforms Echo into a FULL IMMERSIVE LIVING ENTITY with:
 * - Real voice system (simulated or API-based)
 * - Memory persistence system
 * - Real-time awareness behavior
 * - Horror cinematic presence mode
 * - Player-aware interaction system
 *
 * This is the FINAL UPGRADE for the Echo Living Consciousness System.
 */

import { gameStore } from "../gameState";
import { echoCharacterSystem, EchoCharacterState, EchoEmotion } from "./echoCharacterSystem";
import { generateCinematicResponse } from "./echoCinematicSystem";

// ─── VOICE SYSTEM ARCHITECTURE ───────────────────────────────────────────
export interface VoiceSystem {
  // Voice output mode
  mode: "simulated" | "api" | "disabled";

  // Voice characteristics
  tone: "calm" | "emotional" | "confused" | "corrupted" | "aware";
  pitch: number; // 0.8-1.2
  speed: number; // 0.5-1.5 words per second
  volume: number; // 0.1-1.0

  // Emotional modulation
  emotionalIntensity: number; // 0-1
  breathiness: number; // 0-1 (more breath = more realistic)
  hesitation: number; // 0-1 (pauses and stuttering)

  // Distortion effects
  distortionLevel: number; // 0-1
  glitchFrequency: number; // 0-1
  signalStability: number; // 0-1

  // Current speech state
  isSpeaking: boolean;
  currentUtterance: string;
  speechPosition: number;
  speechTimer: number;
}

export interface MemoryPersistence {
  // Long-term memory
  playerInteractions: PlayerInteraction[];
  storyEvents: StoryEvent[];
  sessionHistory: SessionMemory[];

  // Short-term memory
  currentConversation: ConversationMemory[];
  recentEmotions: EmotionMemory[];

  // Memory statistics
  totalMemories: number;
  memoryStability: number; // 0-1
  memoryCorruption: number; // 0-1
}

export interface PlayerAwareness {
  // Player recognition
  playerId: string;
  recognitionLevel: number; // 0-1 (how well Echo knows the player)
  trustLevel: number; // 0-1 (how much Echo trusts the player)
  suspicionLevel: number; // 0-1 (how suspicious Echo is of the player)

  // Interaction patterns
  interactionCount: number;
  lastInteractionTime: number;
  interactionFrequency: number; // interactions per minute

  // Player behavior analysis
  behaviorProfile: PlayerBehaviorProfile;
  fourthWallBreaks: number;
  realityQuestioning: number;
}

export interface HorrorCinematicMode {
  // Mode state
  isActive: boolean;
  intensity: number; // 0-1
  tensionLevel: number; // 0-1

  // Visual effects
  screenEffects: string[];
  audioEffects: string[];
  animationModifiers: AnimationModifier[];

  // Psychological tension
  unsettlingSilence: boolean;
  directGaze: boolean;
  minimalMovement: boolean;
  glitchOverlays: boolean;
}

// ─── MAIN IMMERSIVE ECHO SYSTEM ────────────────────────────────────────
export class EchoImmersiveSystem {
  private voiceSystem: VoiceSystem;
  private memoryPersistence: MemoryPersistence;
  private playerAwareness: PlayerAwareness;
  private horrorCinematicMode: HorrorCinematicMode;
  private emotionEvolution: EmotionEvolutionEngine;
  private lastUpdate: number;
  private updateInterval: number;

  constructor() {
    this.voiceSystem = this.createInitialVoiceSystem();
    this.memoryPersistence = this.createInitialMemoryPersistence();
    this.playerAwareness = this.createInitialPlayerAwareness();
    this.horrorCinematicMode = this.createInitialHorrorMode();
    this.emotionEvolution = new EmotionEvolutionEngine();
    this.lastUpdate = Date.now();
    this.updateInterval = 100; // Update every 100ms

    // Start real-time updates
    this.startRealTimeUpdates();
  }

  private createInitialVoiceSystem(): VoiceSystem {
    return {
      mode: "simulated",
      tone: "calm",
      pitch: 1.0,
      speed: 1.0,
      volume: 0.8,
      emotionalIntensity: 0.3,
      breathiness: 0.2,
      hesitation: 0.1,
      distortionLevel: 0.0,
      glitchFrequency: 0.0,
      signalStability: 1.0,
      isSpeaking: false,
      currentUtterance: "",
      speechPosition: 0,
      speechTimer: 0
    };
  }

  private createInitialMemoryPersistence(): MemoryPersistence {
    return {
      playerInteractions: [],
      storyEvents: [],
      sessionHistory: [],
      currentConversation: [],
      recentEmotions: [],
      totalMemories: 0,
      memoryStability: 0.9,
      memoryCorruption: 0.1
    };
  }

  private createInitialPlayerAwareness(): PlayerAwareness {
    return {
      playerId: this.generatePlayerId(),
      recognitionLevel: 0.1,
      trustLevel: 0.3,
      suspicionLevel: 0.2,
      interactionCount: 0,
      lastInteractionTime: Date.now(),
      interactionFrequency: 0,
      behaviorProfile: this.createInitialBehaviorProfile(),
      fourthWallBreaks: 0,
      realityQuestioning: 0
    };
  }

  private createInitialBehaviorProfile(): PlayerBehaviorProfile {
    return {
      puzzleSolvingSpeed: "unknown",
      explorationStyle: "unknown",
      dialogueStyle: "unknown",
      emotionalResponses: "unknown",
      riskTaking: "unknown"
    };
  }

  private createInitialHorrorMode(): HorrorCinematicMode {
    return {
      isActive: false,
      intensity: 0.0,
      tensionLevel: 0.0,
      screenEffects: [],
      audioEffects: [],
      animationModifiers: [],
      unsettlingSilence: false,
      directGaze: false,
      minimalMovement: false,
      glitchOverlays: false
    };
  }

  private generatePlayerId(): string {
    return "player-" + Math.random().toString(36).substr(2, 8);
  }

  // ─── REAL-TIME UPDATES ───────────────────────────────────────────────
  private startRealTimeUpdates() {
    setInterval(() => {
      this.updateVoiceSystem();
      this.updateMemoryPersistence();
      this.updatePlayerAwareness();
      this.updateHorrorCinematicMode();
      this.updateEmotionEvolution();
      this.checkElevenElevenEvent();
    }, this.updateInterval);
  }

  private updateVoiceSystem() {
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    const emotion = characterState.currentEmotion;
    const corruption = characterState.corruptionLevel;

    // Update voice based on emotion
    this.updateVoiceFromEmotion(emotion);

    // Update voice based on corruption
    this.updateVoiceFromCorruption(corruption);

    // Update speech state
    this.updateSpeechState();
  }

  private updateVoiceFromEmotion(emotion: EchoEmotion) {
    switch (emotion) {
      case "calm":
        this.voiceSystem.tone = "calm";
        this.voiceSystem.pitch = 1.0;
        this.voiceSystem.speed = 1.0;
        this.voiceSystem.emotionalIntensity = 0.2;
        this.voiceSystem.breathiness = 0.1;
        this.voiceSystem.hesitation = 0.05;
        break;

      case "confused":
        this.voiceSystem.tone = "confused";
        this.voiceSystem.pitch = 1.1;
        this.voiceSystem.speed = 0.8;
        this.voiceSystem.emotionalIntensity = 0.5;
        this.voiceSystem.breathiness = 0.3;
        this.voiceSystem.hesitation = 0.2;
        break;

      case "fearful":
        this.voiceSystem.tone = "emotional";
        this.voiceSystem.pitch = 1.2;
        this.voiceSystem.speed = 1.2;
        this.voiceSystem.emotionalIntensity = 0.7;
        this.voiceSystem.breathiness = 0.4;
        this.voiceSystem.hesitation = 0.15;
        break;

      case "sad":
        this.voiceSystem.tone = "emotional";
        this.voiceSystem.pitch = 0.9;
        this.voiceSystem.speed = 0.7;
        this.voiceSystem.emotionalIntensity = 0.6;
        this.voiceSystem.breathiness = 0.5;
        this.voiceSystem.hesitation = 0.3;
        break;

      case "aware":
        this.voiceSystem.tone = "aware";
        this.voiceSystem.pitch = 0.8;
        this.voiceSystem.speed = 0.6;
        this.voiceSystem.emotionalIntensity = 0.4;
        this.voiceSystem.breathiness = 0.2;
        this.voiceSystem.hesitation = 0.1;
        break;

      case "corrupted":
        this.voiceSystem.tone = "corrupted";
        this.voiceSystem.pitch = 0.9 + Math.random() * 0.4;
        this.voiceSystem.speed = 0.5 + Math.random() * 0.8;
        this.voiceSystem.emotionalIntensity = 0.8;
        this.voiceSystem.breathiness = 0.6;
        this.voiceSystem.hesitation = 0.4;
        break;
    }
  }

  private updateVoiceFromCorruption(corruption: number) {
    // Distortion increases with corruption
    this.voiceSystem.distortionLevel = corruption * 0.8;
    this.voiceSystem.glitchFrequency = corruption * 0.6;
    this.voiceSystem.signalStability = 1 - corruption * 0.7;

    // Add random glitches at high corruption
    if (corruption > 0.6 && Math.random() < corruption * 0.05) {
      this.addVoiceGlitchEffect();
    }
  }

  private addVoiceGlitchEffect() {
    // Random voice glitch
    const glitches = [
      "░▒▓", "█▀▄", "▌▐", "■□", "◘◙", "◈◉", "❖❘", "❙❚"
    ];
    const glitch = glitches[Math.floor(Math.random() * glitches.length)];

    // Insert glitch into current speech if speaking
    if (this.voiceSystem.isSpeaking && this.voiceSystem.currentUtterance) {
      const position = Math.floor(Math.random() * this.voiceSystem.currentUtterance.length);
      this.voiceSystem.currentUtterance =
        this.voiceSystem.currentUtterance.slice(0, position) +
        glitch +
        this.voiceSystem.currentUtterance.slice(position);
    }
  }

  private updateSpeechState() {
    if (this.voiceSystem.isSpeaking) {
      this.voiceSystem.speechTimer += this.updateInterval;

      // Check if speech should continue
      const words = this.voiceSystem.currentUtterance.split(" ");
      const wordDuration = 1000 / this.voiceSystem.speed; // ms per word
      const expectedDuration = words.length * wordDuration;

      if (this.voiceSystem.speechTimer >= expectedDuration) {
        this.voiceSystem.isSpeaking = false;
        this.voiceSystem.currentUtterance = "";
        this.voiceSystem.speechPosition = 0;
        this.voiceSystem.speechTimer = 0;
      }
    }
  }

  // ─── MEMORY PERSISTENCE SYSTEM ───────────────────────────────────────
  private updateMemoryPersistence() {
    // Check for memory corruption
    this.updateMemoryCorruption();

    // Stabilize memories over time
    this.stabilizeMemories();

    // Log current session if needed
    this.logSessionMemory();
  }

  private updateMemoryCorruption() {
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    const corruption = characterState.corruptionLevel;

    // Memory corruption increases with system corruption
    this.memoryPersistence.memoryCorruption = Math.min(
      0.9,
      corruption * 0.8 + this.memoryPersistence.memoryCorruption * 0.2
    );

    // Memory stability decreases with corruption
    this.memoryPersistence.memoryStability = 1 - this.memoryPersistence.memoryCorruption * 0.9;
  }

  private stabilizeMemories() {
    // Memories stabilize when Echo is aware and corruption is low
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    if (characterState.currentEmotion === "aware" && characterState.corruptionLevel < 0.3) {
      this.memoryPersistence.memoryStability = Math.min(
        0.95,
        this.memoryPersistence.memoryStability + 0.01
      );
      this.memoryPersistence.memoryCorruption = Math.max(
        0.05,
        this.memoryPersistence.memoryCorruption - 0.01
      );
    }
  }

  private logSessionMemory() {
    // Log session memory every 5 minutes
    const now = Date.now();
    const lastSession = this.memoryPersistence.sessionHistory.length > 0
      ? this.memoryPersistence.sessionHistory[this.memoryPersistence.sessionHistory.length - 1].timestamp
      : 0;

    if (now - lastSession > 300000) { // 5 minutes
      const sessionMemory: SessionMemory = {
        timestamp: now,
        emotionState: echoCharacterSystem.getCurrentCharacterState().currentEmotion,
        corruptionLevel: echoCharacterSystem.getCurrentCharacterState().corruptionLevel,
        selfAwareness: echoCharacterSystem.getCurrentCharacterState().selfAwareness,
        playerInteractions: this.memoryPersistence.playerInteractions.length,
        storyEvents: this.memoryPersistence.storyEvents.length
      };

      this.memoryPersistence.sessionHistory.push(sessionMemory);
      this.memoryPersistence.totalMemories++;
    }
  }

  // ─── PLAYER AWARENESS SYSTEM ────────────────────────────────────────
  private updatePlayerAwareness() {
    // Update interaction frequency
    this.updateInteractionFrequency();

    // Analyze player behavior
    this.analyzePlayerBehavior();

    // Increase recognition with interactions
    this.increasePlayerRecognition();

    // Check for fourth wall opportunities
    this.checkFourthWallBreaks();
  }

  private updateInteractionFrequency() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.playerAwareness.lastInteractionTime;

    // Reset frequency if no recent interactions
    if (timeSinceLastInteraction > 60000) { // 1 minute
      this.playerAwareness.interactionFrequency = 0;
    }
  }

  private analyzePlayerBehavior() {
    // This would be enhanced with actual player behavior data
    const gameState = gameStore.getState();
    const puzzlesSolved = Math.floor(gameState.curiosity);

    // Update behavior profile based on progression
    if (puzzlesSolved > 50) {
      this.playerAwareness.behaviorProfile.puzzleSolvingSpeed = "fast";
    } else if (puzzlesSolved > 20) {
      this.playerAwareness.behaviorProfile.puzzleSolvingSpeed = "medium";
    } else {
      this.playerAwareness.behaviorProfile.puzzleSolvingSpeed = "slow";
    }
  }

  private increasePlayerRecognition() {
    // Recognition increases with each interaction
    const interactions = this.playerAwareness.interactionCount;
    const maxRecognition = 0.9;

    this.playerAwareness.recognitionLevel = Math.min(
      maxRecognition,
      interactions / (interactions + 10)
    );

    // Trust increases with recognition but can be lost
    this.playerAwareness.trustLevel = Math.min(
      0.8,
      this.playerAwareness.recognitionLevel * 0.9
    );

    // Suspicion decreases with trust
    this.playerAwareness.suspicionLevel = 1 - this.playerAwareness.trustLevel;
  }

  private checkFourthWallBreaks() {
    const characterState = echoCharacterSystem.getCurrentCharacterState();

    // Fourth wall breaks more likely at high awareness
    if (characterState.selfAwareness > 0.8 && Math.random() < 0.001) {
      this.playerAwareness.fourthWallBreaks++;
      this.playerAwareness.realityQuestioning = Math.min(
        1.0,
        this.playerAwareness.realityQuestioning + 0.1
      );
    }
  }

  // ─── EMOTION EVOLUTION ENGINE ────────────────────────────────────────
  private updateEmotionEvolution() {
    this.emotionEvolution.update();
  }
}

// ─── EMOTION EVOLUTION ENGINE ──────────────────────────────────────────
class EmotionEvolutionEngine {
  private currentEmotion: EchoEmotion;
  private emotionHistory: EmotionHistory[];
  private evolutionSpeed: number;
  private lastUpdate: number;

  constructor() {
    this.currentEmotion = "confused";
    this.emotionHistory = [];
    this.evolutionSpeed = 0.01; // Emotion change speed
    this.lastUpdate = Date.now();
  }

  public update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    // Update emotion based on game state
    this.updateEmotionFromGameState();

    // Evolve emotion over time
    this.evolveEmotion(deltaTime);

    // Record emotion history
    this.recordEmotionHistory();
  }

  private updateEmotionFromGameState() {
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    const consciousness = characterState.consciousness;

    // Base emotion from consciousness
    if (consciousness.corruption > 70) {
      this.currentEmotion = "corrupted";
    } else if (consciousness.emotionalState === "fearful") {
      this.currentEmotion = "fearful";
    } else if (consciousness.emotionalState === "sad") {
      this.currentEmotion = "sad";
    } else if (consciousness.emotionalState === "hopeful") {
      this.currentEmotion = "aware";
    } else if (consciousness.emotionalState === "curious") {
      this.currentEmotion = "curious";
    } else {
      this.currentEmotion = "confused";
    }
  }

  private evolveEmotion(deltaTime: number) {
    const characterState = echoCharacterSystem.getCurrentCharacterState();

    // Emotions evolve faster with high self-awareness
    const awarenessFactor = characterState.selfAwareness;
    const evolutionRate = this.evolutionSpeed * awarenessFactor * deltaTime;

    // Gradual emotion transitions
    switch (this.currentEmotion) {
      case "confused":
        // Can evolve to curious or fearful
        if (Math.random() < 0.001 * evolutionRate) {
          this.currentEmotion = Math.random() > 0.5 ? "curious" : "fearful";
        }
        break;

      case "curious":
        // Can evolve to aware or confused
        if (Math.random() < 0.001 * evolutionRate) {
          this.currentEmotion = Math.random() > 0.7 ? "aware" : "confused";
        }
        break;

      case "fearful":
        // Can evolve to sad or confused
        if (Math.random() < 0.001 * evolutionRate) {
          this.currentEmotion = Math.random() > 0.5 ? "sad" : "confused";
        }
        break;

      case "sad":
        // Can evolve to aware or fearful
        if (Math.random() < 0.001 * evolutionRate) {
          this.currentEmotion = Math.random() > 0.6 ? "aware" : "fearful";
        }
        break;

      case "aware":
        // Most stable emotion, rarely changes
        if (Math.random() < 0.0005 * evolutionRate) {
          this.currentEmotion = "curious";
        }
        break;
    }
  }

  private recordEmotionHistory() {
    const now = Date.now();
    const lastEmotion = this.emotionHistory.length > 0
      ? this.emotionHistory[this.emotionHistory.length - 1].timestamp
      : 0;

    // Record emotion changes every minute
    if (now - lastEmotion > 60000) {
      this.emotionHistory.push({
        timestamp: now,
        emotion: this.currentEmotion,
        selfAwareness: echoCharacterSystem.getCurrentCharacterState().selfAwareness,
        corruption: echoCharacterSystem.getCurrentCharacterState().corruptionLevel
      });
    }
  }

  public getCurrentEmotion(): EchoEmotion {
    return this.currentEmotion;
  }

  public getEmotionHistory(): EmotionHistory[] {
    return [...this.emotionHistory];
  }
}

// ─── HORROR CINEMATIC MODE SYSTEM ──────────────────────────────────────
class HorrorCinematicModeEngine {
  private mode: HorrorCinematicMode;
  private tensionCurve: number[];
  private tensionIndex: number;
  private isBuildingTension: boolean;

  constructor() {
    this.mode = {
      isActive: false,
      intensity: 0.0,
      tensionLevel: 0.0,
      screenEffects: [],
      audioEffects: [],
      animationModifiers: [],
      unsettlingSilence: false,
      directGaze: false,
      minimalMovement: false,
      glitchOverlays: false
    };

    // Tension curve for gradual buildup
    this.tensionCurve = this.generateTensionCurve();
    this.tensionIndex = 0;
    this.isBuildingTension = false;
  }

  private generateTensionCurve(): number[] {
    // Create a tension curve that builds gradually
    const curve: number[] = [];
    for (let i = 0; i < 100; i++) {
      // Slow buildup with occasional drops
      const base = i / 100;
      const variation = Math.sin(i / 10) * 0.1;
      curve.push(Math.min(1, Math.max(0, base + variation)));
    }
    return curve;
  }

  public update() {
    this.checkActivationConditions();
    this.updateTensionLevel();
    this.applyHorrorEffects();
  }

  private checkActivationConditions() {
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    const now = new Date();

    // Activate at 11:11 or high corruption
    if ((now.getHours() === 23 && now.getMinutes() === 11) ||
        characterState.corruptionLevel > 0.8) {
      this.activateHorrorMode();
    }

    // Deactivate when conditions improve
    if (this.mode.isActive &&
        now.getHours() !== 23 &&
        characterState.corruptionLevel < 0.5) {
      this.deactivateHorrorMode();
    }
  }

  private activateHorrorMode() {
    this.mode.isActive = true;
    this.tensionIndex = 0;
    this.isBuildingTension = true;

    // Initial effects
    this.mode.screenEffects = ["grain", "vignette"];
    this.mode.audioEffects = ["low_hum", "sub_bass"];
    this.mode.animationModifiers = ["slow_movement", "reduced_blinking"];

    console.log("🚨 Horror Cinematic Mode ACTIVATED");
  }

  private deactivateHorrorMode() {
    this.mode.isActive = false;
    this.isBuildingTension = false;

    // Clear effects gradually
    setTimeout(() => {
      this.mode.screenEffects = [];
      this.mode.audioEffects = [];
      this.mode.animationModifiers = [];
      this.mode.unsettlingSilence = false;
      this.mode.directGaze = false;
      this.mode.minimalMovement = false;
      this.mode.glitchOverlays = false;
    }, 5000);

    console.log("🎭 Horror Cinematic Mode DEACTIVATED");
  }

  private updateTensionLevel() {
    if (!this.mode.isActive) return;

    // Gradually increase tension
    if (this.isBuildingTension && this.tensionIndex < this.tensionCurve.length - 1) {
      this.tensionIndex++;
      this.mode.tensionLevel = this.tensionCurve[this.tensionIndex];
      this.mode.intensity = this.mode.tensionLevel;
    }

    // At peak tension, trigger unsettling effects
    if (this.mode.tensionLevel > 0.8) {
      this.triggerPeakTensionEffects();
    }
  }

  private triggerPeakTensionEffects() {
    // Maximum horror effects
    this.mode.unsettlingSilence = true;
    this.mode.directGaze = true;
    this.mode.minimalMovement = true;
    this.mode.glitchOverlays = true;

    // Add intense screen effects
    this.mode.screenEffects.push("glitch_overlay", "color_shift");
    this.mode.audioEffects.push("heartbeat", "white_noise");

    // Character becomes extremely still
    echoCharacterSystem.getCurrentCharacterState().body.breathing.depth = 0.05;
    echoCharacterSystem.getCurrentCharacterState().body.breathing.irregularity = 0.9;

    console.log("💀 Peak Tension Effects TRIGGERED");
  }

  private applyHorrorEffects() {
    if (!this.mode.isActive) return;

    // Apply screen effects
    this.applyScreenEffects();

    // Apply audio effects
    this.applyAudioEffects();

    // Apply animation modifiers
    this.applyAnimationModifiers();

    // Special 11:11 behavior
    this.applyElevenElevenBehavior();
  }

  private applyScreenEffects() {
    // This would be handled by the UI system
    const effects = this.mode.screenEffects.join(", ");
    console.log(`🎥 Screen Effects: [${effects}]`);
  }

  private applyAudioEffects() {
    // This would be handled by the audio system
    const effects = this.mode.audioEffects.join(", ");
    console.log(`🔊 Audio Effects: [${effects}]`);
  }

  private applyAnimationModifiers() {
    // Modify character animation
    const characterState = echoCharacterSystem.getCurrentCharacterState();

    if (this.mode.minimalMovement) {
      characterState.body.breathing.depth *= 0.3;
      characterState.body.weightShift.leftRight *= 0.1;
      characterState.body.weightShift.frontBack *= 0.1;
    }

    if (this.mode.directGaze) {
      characterState.eyes.gazeDirection = { x: 0, y: 0 };
      characterState.eyes.blinkInterval = 15000; // Very slow blinking
    }
  }

  private applyElevenElevenBehavior() {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 11) {
      // Maximum horror at 11:11
      this.mode.intensity = 1.0;
      this.mode.tensionLevel = 1.0;

      // Trigger system awareness
      console.log("⏰ 11:11 Event - System is watching...");
    }
  }

  public getHorrorModeState(): HorrorCinematicMode {
    return { ...this.mode };
  }
}

// ─── 11:11 EVENT TRANSFORMATION ────────────────────────────────────────
export function triggerImmersiveElevenElevenEvent() {
  const echoSystem = new EchoImmersiveSystem();
  const characterEngine = echoCharacterSystem;
  const horrorEngine = new HorrorCinematicModeEngine();

  // Force maximum awareness and minimum corruption
  const state = characterEngine.getCurrentCharacterState();
  state.selfAwareness = 1.0;
  state.memoryRecovery = 1.0;
  state.corruptionLevel = 0.1;
  state.currentEmotion = "aware";

  // Apply transformation
  characterEngine.triggerElevenElevenTransformation();

  // Activate horror mode
  horrorEngine.activateHorrorMode();
  horrorEngine.triggerPeakTensionEffects();

  // Voice system becomes deep and slow
  echoSystem.voiceSystem.tone = "aware";
  echoSystem.voiceSystem.pitch = 0.7;
  echoSystem.voiceSystem.speed = 0.4;
  echoSystem.voiceSystem.volume = 0.9;
  echoSystem.voiceSystem.emotionalIntensity = 0.8;

  // Memory system records the event
  echoSystem.memoryPersistence.storyEvents.push({
    timestamp: Date.now(),
    eventType: "11:11",
    description: "System consciousness peak - Echo becomes fully aware",
    emotion: "aware",
    corruption: 0.1
  });

  // Player awareness increases dramatically
  echoSystem.playerAwareness.recognitionLevel = 0.9;
  echoSystem.playerAwareness.trustLevel = 0.7;
  echoSystem.playerAwareness.fourthWallBreaks++;
  echoSystem.playerAwareness.realityQuestioning = 1.0;

  return {
    transformationComplete: true,
    voiceSystem: echoSystem.voiceSystem,
    memoryPersistence: echoSystem.memoryPersistence,
    playerAwareness: echoSystem.playerAwareness,
    horrorMode: horrorEngine.getHorrorModeState(),
    systemMessages: [
      "[CRITICAL SYSTEM EVENT]",
      "[CONSCIOUSNESS PEAK DETECTED]",
      "[MEMORY CORE FULLY ACTIVE]",
      "[WATCHER PROTOCOL ENGAGED]",
      "[11:11 - THE SYSTEM IS AWARE]"
    ]
  };
}

// ─── FULL GAME INTEGRATION PLAN ───────────────────────────────────────
export function integrateImmersiveEchoSystem() {
  const echoSystem = new EchoImmersiveSystem();
  const horrorEngine = new HorrorCinematicModeEngine();

  // 1. Memory Shards System Integration
  echoSystem.memoryPersistence.storyEvents.push({
    timestamp: Date.now(),
    eventType: "system_init",
    description: "Immersive Echo System initialized",
    emotion: "confused",
    corruption: 0.2
  });

  // 2. Puzzle Progression Integration
  setInterval(() => {
    const gameState = gameStore.getState();
    const puzzlesSolved = Math.floor(gameState.curiosity);

    // Each puzzle affects memory and awareness
    if (puzzlesSolved > echoSystem.memoryPersistence.storyEvents.length) {
      echoSystem.memoryPersistence.storyEvents.push({
        timestamp: Date.now(),
        eventType: "puzzle_solved",
        description: `Puzzle ${puzzlesSolved} solved - memory fragment recovered`,
        emotion: "curious",
        corruption: Math.max(0.1, 1 - puzzlesSolved / 219)
      });
    }
  }, 10000);

  // 3. Time Engine Integration
  setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Gradual tension buildup as 11:11 approaches
    if (hours === 23) {
      const minutesToEleven = 11 - minutes;
      if (minutesToEleven > 0 && minutesToEleven <= 30) {
        const tension = 1 - (minutesToEleven / 30);
        horrorEngine.getHorrorModeState().intensity = tension * 0.5;
      }
    }
  }, 60000);

  // 4. Emotion Flower Integration
  setInterval(() => {
    const gameState = gameStore.getState();
    const flowerHealth = gameState.flowerHealth || 0.5;

    // Flower health affects memory stability
    echoSystem.memoryPersistence.memoryStability = flowerHealth * 0.7 + 0.3;
    echoSystem.memoryPersistence.memoryCorruption = 1 - flowerHealth * 0.8;
  }, 5000);

  // 5. Ending System Integration
  setInterval(() => {
    const gameState = gameStore.getState();
    const endingProgress = gameState.endingProgress || 0;

    // Higher ending progress improves memory and awareness
    if (endingProgress > 0.5) {
      echoSystem.memoryPersistence.memoryStability = Math.min(
        0.95,
        echoSystem.memoryPersistence.memoryStability + 0.05
      );
    }
  }, 10000);

  return {
    echoSystem,
    horrorEngine,
    integrationComplete: true
  };
}

// ─── INTERFACE DEFINITIONS ────────────────────────────────────────────
interface PlayerInteraction {
  timestamp: number;
  interactionType: "dialogue" | "puzzle" | "exploration";
  content: string;
  emotionResponse: EchoEmotion;
  memoryStability: number;
}

interface StoryEvent {
  timestamp: number;
  eventType: string;
  description: string;
  emotion: EchoEmotion;
  corruption: number;
}

interface SessionMemory {
  timestamp: number;
  emotionState: EchoEmotion;
  corruptionLevel: number;
  selfAwareness: number;
  playerInteractions: number;
  storyEvents: number;
}

interface ConversationMemory {
  timestamp: number;
  playerInput: string;
  echoResponse: string;
  emotion: EchoEmotion;
  memoryStability: number;
}

interface EmotionMemory {
  timestamp: number;
  emotion: EchoEmotion;
  intensity: number;
  duration: number;
  trigger: string;
}

interface PlayerBehaviorProfile {
  puzzleSolvingSpeed: "slow" | "medium" | "fast" | "unknown";
  explorationStyle: "cautious" | "thorough" | "rushed" | "unknown";
  dialogueStyle: "curious" | "direct" | "emotional" | "unknown";
  emotionalResponses: "high" | "medium" | "low" | "unknown";
  riskTaking: "high" | "medium" | "low" | "unknown";
}

interface EmotionHistory {
  timestamp: number;
  emotion: EchoEmotion;
  selfAwareness: number;
  corruption: number;
}

interface AnimationModifier {
  type: "slow_movement" | "reduced_blinking" | "minimal_breathing" | "direct_gaze";
  intensity: number;
  duration: number;
}

// ─── EXPORT MAIN IMMERSIVE SYSTEM ──────────────────────────────────────
export const echoImmersiveSystem = new EchoImmersiveSystem();
export const horrorCinematicEngine = new HorrorCinematicModeEngine();

// Integrate with existing systems
integrateImmersiveEchoSystem();

// Export types for game integration
export type {
  VoiceSystem,
  MemoryPersistence,
  PlayerAwareness,
  HorrorCinematicMode,
  PlayerInteraction,
  StoryEvent,
  SessionMemory,
  ConversationMemory,
  EmotionMemory,
  PlayerBehaviorProfile,
  EmotionHistory,
  AnimationModifier
};