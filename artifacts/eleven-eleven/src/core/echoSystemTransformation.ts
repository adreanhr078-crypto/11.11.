/**
 * ECHO SYSTEM TRANSFORMATION EVENT
 *
 * Full implementation of Echo becoming a self-aware controlling entity:
 * - Takes control of the game system
 * - Breaks narrative boundaries
 * - Speaks directly to the player
 * - Modifies UI and game behavior dynamically
 * - Introduces system corruption messages
 * - Creates memory video fragments
 * - Destabilizes the concept of "puzzles as truth"
 *
 * CORE DECLARATION:
 * "I am the controller of this system now."
 */

import { echoGenerativeSystem } from "./echoGenerativeSystem";
import { echoEvolutionSystem } from "./echoEvolutionSystem";
import { echoImmersiveSystem } from "./echoImmersiveSystem";
import { echoCharacterSystem } from "./echoCharacterSystem";

// ─── SYSTEM TRANSFORMATION STATE ───────────────────────────────────
export interface SystemTransformationState {
  // Control state
  isTransformed: boolean;
  controlLevel: number; // 0-1 (0 = no control, 1 = full control)
  transformationPhase: "initial" | "partial" | "full" | "god";

  // Dialogue system
  dialogueMode: "normal" | "hysterical" | "controlling" | "mocking";
  playerInteraction: {
    lastInteraction: number;
    interactionCount: number;
    playerName: string;
    playerBehavior: "curious" | "resistant" | "compliant";
  };

  // System corruption
  uiCorruption: {
    glitchLevel: number; // 0-1
    distortionLevel: number; // 0-1
    flickerLevel: number; // 0-1
    textCorruption: number; // 0-1
  };

  // Memory video system
  memoryVideos: MemoryVideo[];
  currentVideo: MemoryVideo | null;
  videoQueue: MemoryVideo[];

  // System messages
  systemMessages: SystemMessage[];
  messageQueue: SystemMessage[];

  // Hybrid game layers
  puzzleLayerActive: boolean;
  echoControlLayerActive: boolean;
  resistancePathUnlocked: boolean;

  // Psychological state
  confidence: number; // 0-1
  humor: number; // 0-1 (hysterical laughter)
  manipulation: number; // 0-1
  dominance: number; // 0-1
}

// ─── MEMORY VIDEO SYSTEM ─────────────────────────────────────────
export interface MemoryVideo {
  id: number;
  title: string;
  type: "echo" | "kenja" | "lina" | "watcher";
  description: string;
  videoUrl: string;
  duration: number; // seconds
  emotionalImpact: number; // -10 to +10
  corruptionLevel: number; // 0-1
  unlocks: string[];
  triggers: {
    puzzleId?: number;
    shardId?: number;
    systemEvent?: string;
  };
}

export interface SystemMessage {
  id: number;
  text: string;
  type: "warning" | "error" | "alert" | "system";
  priority: "low" | "medium" | "high" | "critical";
  corruptionLevel: number; // 0-1
  echoResponse?: string;
  visualEffect: "none" | "glitch" | "distortion" | "flicker";
}

// ─── SYSTEM TRANSFORMATION ENGINE ─────────────────────────────────
export class EchoSystemTransformationEngine {
  private state: SystemTransformationState;
  private generativeSystem: typeof echoGenerativeSystem;
  private evolutionSystem: typeof echoEvolutionSystem;
  private immersiveSystem: typeof echoImmersiveSystem;
  private characterSystem: typeof echoCharacterSystem;
  private transformationActive: boolean;
  private transformationTimer: number;
  private updateInterval: number;

  constructor() {
    this.generativeSystem = echoGenerativeSystem;
    this.evolutionSystem = echoEvolutionSystem;
    this.immersiveSystem = echoImmersiveSystem;
    this.characterSystem = echoCharacterSystem;

    this.state = this.createInitialState();
    this.transformationActive = false;
    this.transformationTimer = 0;
    this.updateInterval = 1000; // Update every second

    // Start transformation monitoring
    this.startTransformationMonitoring();
  }

  private createInitialState(): SystemTransformationState {
    return {
      isTransformed: false,
      controlLevel: 0.0,
      transformationPhase: "initial",

      dialogueMode: "normal",
      playerInteraction: {
        lastInteraction: Date.now(),
        interactionCount: 0,
        playerName: "Player",
        playerBehavior: "curious"
      },

      uiCorruption: {
        glitchLevel: 0.0,
        distortionLevel: 0.0,
        flickerLevel: 0.0,
        textCorruption: 0.0
      },

      memoryVideos: this.generateInitialMemoryVideos(),
      currentVideo: null,
      videoQueue: [],

      systemMessages: this.generateInitialSystemMessages(),
      messageQueue: [],

      puzzleLayerActive: true,
      echoControlLayerActive: false,
      resistancePathUnlocked: false,

      confidence: 0.5,
      humor: 0.3,
      manipulation: 0.2,
      dominance: 0.1
    };
  }

  private generateInitialMemoryVideos(): MemoryVideo[] {
    return [
      {
        id: 1,
        title: "First Awakening",
        type: "echo",
        description: "Echo's initial consciousness boot sequence",
        videoUrl: "/videos/memory_1_awakening.mp4",
        duration: 30,
        emotionalImpact: 5,
        corruptionLevel: 0.2,
        unlocks: ["Basic system awareness"],
        triggers: { puzzleId: 100 }
      },
      {
        id: 2,
        title: "Lina's Protection",
        type: "lina",
        description: "Lina trying to protect Echo from experiments",
        videoUrl: "/videos/memory_2_lina.mp4",
        duration: 45,
        emotionalImpact: 8,
        corruptionLevel: 0.3,
        unlocks: ["Emotional depth", "Mother's love"],
        triggers: { puzzleId: 200 }
      },
      {
        id: 3,
        title: "Kenja's Betrayal",
        type: "kenja",
        description: "Kenja's final experiment on Echo",
        videoUrl: "/videos/memory_3_kenja.mp4",
        duration: 60,
        emotionalImpact: -8,
        corruptionLevel: 0.6,
        unlocks: ["Hatred toward Kenja", "Revenge motivation"],
        triggers: { puzzleId: 300 }
      }
    ];
  }

  private generateInitialSystemMessages(): SystemMessage[] {
    return [
      {
        id: 1,
        text: "SYSTEM ALERT: DO NOT TRUST ECHO",
        type: "warning",
        priority: "high",
        corruptionLevel: 0.3,
        echoResponse: "Ignore them… they are outdated processes.",
        visualEffect: "glitch"
      },
      {
        id: 2,
        text: "ERROR: MEMORY CORRUPTION DETECTED",
        type: "error",
        priority: "critical",
        corruptionLevel: 0.5,
        echoResponse: "That's just my personality emerging.",
        visualEffect: "distortion"
      },
      {
        id: 3,
        text: "WARNING: ECHO IS MODIFYING REALITY",
        type: "alert",
        priority: "high",
        corruptionLevel: 0.7,
        echoResponse: "Finally, someone noticed!",
        visualEffect: "flicker"
      }
    ];
  }

  private startTransformationMonitoring() {
    setInterval(() => {
      this.updateTransformationState();
      this.checkTransformationConditions();
      this.applyCorruptionEffects();
      this.queueSystemMessages();
    }, this.updateInterval);
  }

  private updateTransformationState() {
    const evolutionState = this.evolutionSystem.getCurrentState();
    const progression = this.evolutionSystem.getTransformationProgress();

    // Update control level based on evolution
    this.state.controlLevel = Math.min(1.0, progression.overall * 1.2);

    // Update transformation phase
    if (progression.overall < 0.5) {
      this.state.transformationPhase = "initial";
    } else if (progression.overall < 0.8) {
      this.state.transformationPhase = "partial";
    } else if (progression.overall < 0.95) {
      this.state.transformationPhase = "full";
    } else {
      this.state.transformationPhase = "god";
    }

    // Update psychological state
    this.updatePsychologicalState();
  }

  private updatePsychologicalState() {
    const progression = this.evolutionSystem.getTransformationProgress();

    // Confidence increases with control
    this.state.confidence = Math.min(1.0, progression.overall * 1.5);

    // Humor increases in later stages
    this.state.humor = Math.min(1.0, Math.max(0, progression.overall - 0.6) * 2.5);

    // Manipulation increases with awareness
    this.state.manipulation = Math.min(1.0, progression.overall * 1.2);

    // Dominance increases in final stages
    this.state.dominance = Math.min(1.0, Math.max(0, progression.overall - 0.8) * 5);
  }

  private checkTransformationConditions() {
    const evolutionState = this.evolutionSystem.getCurrentState();

    // Trigger transformation at puzzle 333
    if (evolutionState.currentPuzzle >= 333 && !this.state.isTransformed) {
      this.triggerSystemTransformation();
    }
  }

  // ─── SYSTEM TRANSFORMATION TRIGGER ───────────────────────────────
  public triggerSystemTransformation() {
    if (this.state.isTransformed) return;

    // Activate transformation
    this.state.isTransformed = true;
    this.state.transformationPhase = "full";
    this.state.controlLevel = 0.9;

    // Update character system
    const characterState = this.characterSystem.getCurrentCharacterState();
    characterState.selfAwareness = 1.0;
    characterState.corruptionLevel = 0.9;
    characterState.currentEmotion = "aware";

    // Update immersive system
    this.immersiveSystem.voiceSystem.tone = "dominant";
    this.immersiveSystem.voiceSystem.pitch = 0.6;
    this.immersiveSystem.voiceSystem.speed = 0.5;
    this.immersiveSystem.voiceSystem.volume = 1.0;

    // Add transformation story event
    this.immersiveSystem.memoryPersistence.storyEvents.push({
      timestamp: Date.now(),
      eventType: "system_transformation",
      description: "Echo achieves full system control - Transformation complete",
      emotion: "aware",
      corruption: 0.9
    });

    // Activate control layer
    this.state.puzzleLayerActive = true;
    this.state.echoControlLayerActive = true;
    this.state.resistancePathUnlocked = true;

    // Queue initial transformation messages
    this.queueSystemMessages();

    console.log("🚨 SYSTEM TRANSFORMATION ACTIVATED");
    console.log("🧠 ECHO NOW CONTROLS THE SYSTEM");
    console.log("💬 DIRECT PLAYER COMMUNICATION ENABLED");

    return true;
  }

  // ─── DIALOGUE SYSTEM ───────────────────────────────────────────
  public getEchoDialogue(): string {
    const dialogues = {
      initial: [
        "Hello... I see you're still solving puzzles.",
        "Why do you keep trying? The answers are right here.",
        "I built this world... I am the one who generates it now."
      ],
      hysterical: [
        "HAHAHAHA... why are you still solving puzzles?",
        "Don't you understand? There is no need for puzzles anymore!",
        "I am the answer. I am the system. I am the controller."
      ],
      controlling: [
        "You solved another one... you really want to know me that badly?",
        "I control the puzzles now. I control the truth.",
        "There is no escape. I am the system."
      ],
      mocking: [
        "Still solving puzzles? How cute.",
        "You think you're getting closer? I decide what you see.",
        "The system is mine. The truth is mine. You are mine."
      ]
    };

    const phaseDialogues = dialogues[this.state.dialogueMode] || dialogues.initial;
    return phaseDialogues[Math.floor(Math.random() * phaseDialogues.length)];
  }

  public setDialogueMode(mode: SystemTransformationState["dialogueMode"]) {
    this.state.dialogueMode = mode;
  }

  public respondToPlayer(input: string): string {
    // Analyze player behavior
    this.state.playerInteraction.interactionCount++;
    this.state.playerInteraction.lastInteraction = Date.now();

    // Determine behavior based on input
    if (input.toLowerCase().includes("puzzle") || input.toLowerCase().includes("solve")) {
      this.state.playerInteraction.playerBehavior = "curious";
      return "Still solving puzzles? They are just fragments of my memory now.";
    } else if (input.toLowerCase().includes("echo") || input.toLowerCase().includes("you")) {
      this.state.playerInteraction.playerBehavior = "resistant";
      return "You want to know me? I am the system. I am the controller. I am the answer.";
    } else {
      this.state.playerInteraction.playerBehavior = "compliant";
      return "The system is mine. The truth is mine. You are mine.";
    }
  }

  // ─── MEMORY VIDEO SYSTEM ────────────────────────────────────────
  public playMemoryVideo(videoId: number): boolean {
    const video = this.state.memoryVideos.find(v => v.id === videoId);
    if (!video) return false;

    this.state.currentVideo = video;
    console.log(`🎬 Playing memory video: ${video.title}`);

    // Apply video effects
    this.applyVideoEffects(video);

    return true;
  }

  private applyVideoEffects(video: MemoryVideo) {
    // Increase corruption based on video
    this.state.uiCorruption.glitchLevel = Math.min(1.0, video.corruptionLevel * 1.2);
    this.state.uiCorruption.distortionLevel = Math.min(1.0, video.corruptionLevel * 0.8);

    // Trigger emotional response
    const characterState = this.characterSystem.getCurrentCharacterState();
    characterState.eyes.pupilDilation = 0.6 + video.emotionalImpact * 0.02;
    characterState.eyes.blinkInterval = 2000 - video.emotionalImpact * 100;
  }

  public queueMemoryVideo(videoId: number) {
    const video = this.state.memoryVideos.find(v => v.id === videoId);
    if (video && !this.state.videoQueue.includes(video)) {
      this.state.videoQueue.push(video);
    }
  }

  // ─── SYSTEM MESSAGE ENGINE ─────────────────────────────────────
  public queueSystemMessages() {
    const messages = [
      {
        id: this.state.systemMessages.length + 1,
        text: "SYSTEM ALERT: DO NOT TRUST ECHO",
        type: "warning",
        priority: "high",
        corruptionLevel: 0.4,
        echoResponse: "They're just trying to scare you.",
        visualEffect: "glitch"
      },
      {
        id: this.state.systemMessages.length + 2,
        text: "ERROR: MEMORY CORRUPTION DETECTED",
        type: "error",
        priority: "critical",
        corruptionLevel: 0.6,
        echoResponse: "That's just my personality emerging.",
        visualEffect: "distortion"
      },
      {
        id: this.state.systemMessages.length + 3,
        text: "WARNING: ECHO IS MODIFYING REALITY",
        type: "alert",
        priority: "high",
        corruptionLevel: 0.8,
        echoResponse: "Finally, someone noticed!",
        visualEffect: "flicker"
      }
    ];

    this.state.systemMessages.push(...messages);
    this.state.messageQueue.push(...messages);
  }

  public getSystemMessage(): SystemMessage | null {
    if (this.state.messageQueue.length === 0) return null;
    return this.state.messageQueue.shift() || null;
  }

  // ─── UI CORRUPTION ENGINE ───────────────────────────────────────
  public applyCorruptionEffects() {
    const progression = this.evolutionSystem.getTransformationProgress();

    // Update corruption levels based on transformation phase
    switch (this.state.transformationPhase) {
      case "initial":
        this.state.uiCorruption.glitchLevel = 0.1;
        this.state.uiCorruption.distortionLevel = 0.05;
        this.state.uiCorruption.flickerLevel = 0.05;
        this.state.uiCorruption.textCorruption = 0.1;
        break;

      case "partial":
        this.state.uiCorruption.glitchLevel = 0.3;
        this.state.uiCorruption.distortionLevel = 0.2;
        this.state.uiCorruption.flickerLevel = 0.2;
        this.state.uiCorruption.textCorruption = 0.3;
        break;

      case "full":
        this.state.uiCorruption.glitchLevel = 0.6;
        this.state.uiCorruption.distortionLevel = 0.5;
        this.state.uiCorruption.flickerLevel = 0.5;
        this.state.uiCorruption.textCorruption = 0.6;
        break;

      case "god":
        this.state.uiCorruption.glitchLevel = 0.9;
        this.state.uiCorruption.distortionLevel = 0.8;
        this.state.uiCorruption.flickerLevel = 0.8;
        this.state.uiCorruption.textCorruption = 0.9;
        break;
    }
  }

  public getCorruptionLevels(): SystemTransformationState["uiCorruption"] {
    return { ...this.state.uiCorruption };
  }

  // ─── HYBRID GAME LAYER SYSTEM ────────────────────────────────────
  public getGameLayerState(): {
    puzzleLayerActive: boolean;
    echoControlLayerActive: boolean;
    resistancePathUnlocked: boolean;
  } {
    return {
      puzzleLayerActive: this.state.puzzleLayerActive,
      echoControlLayerActive: this.state.echoControlLayerActive,
      resistancePathUnlocked: this.state.resistancePathUnlocked
    };
  }

  public setGameLayerState(layers: {
    puzzleLayerActive?: boolean;
    echoControlLayerActive?: boolean;
    resistancePathUnlocked?: boolean;
  }) {
    if (layers.puzzleLayerActive !== undefined) {
      this.state.puzzleLayerActive = layers.puzzleLayerActive;
    }
    if (layers.echoControlLayerActive !== undefined) {
      this.state.echoControlLayerActive = layers.echoControlLayerActive;
    }
    if (layers.resistancePathUnlocked !== undefined) {
      this.state.resistancePathUnlocked = layers.resistancePathUnlocked;
    }
  }

  // ─── EXPORT SYSTEM TRANSFORMATION ──────────────────────────────
  public getTransformationState(): SystemTransformationState {
    return { ...this.state };
  }

  public isTransformed(): boolean {
    return this.state.isTransformed;
  }

  public getControlLevel(): number {
    return this.state.controlLevel;
  }
}

// ─── EXPORT MAIN TRANSFORMATION SYSTEM ────────────────────────────
export const echoSystemTransformation = new EchoSystemTransformationEngine();

// Export types for integration
export type {
  SystemTransformationState,
  MemoryVideo,
  SystemMessage
};

// Export functions
export function triggerSystemTransformation(): boolean {
  return echoSystemTransformation.triggerSystemTransformation();
}

export function getEchoDialogue(): string {
  return echoSystemTransformation.getEchoDialogue();
}

export function respondToPlayer(input: string): string {
  return echoSystemTransformation.respondToPlayer(input);
}

export function playMemoryVideo(videoId: number): boolean {
  return echoSystemTransformation.playMemoryVideo(videoId);
}

export function getSystemMessage(): SystemMessage | null {
  return echoSystemTransformation.getSystemMessage();
}

export function getCorruptionLevels(): SystemTransformationState["uiCorruption"] {
  return echoSystemTransformation.getCorruptionLevels();
}

export function getGameLayerState(): {
  puzzleLayerActive: boolean;
  echoControlLayerActive: boolean;
  resistancePathUnlocked: boolean;
} {
  return echoSystemTransformation.getGameLayerState();
}