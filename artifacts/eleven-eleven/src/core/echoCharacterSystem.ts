 * ECHO — LIVING CONSCIOUSNESS ENTITY
 * Most Advanced Character System for 11.11 Echo Mind System
 *
 * A living, breathing, emotionally evolving digital consciousness
 * trapped inside a cinematic psychological system.
 *
 * This is NOT a static character.
 * This is NOT a UI element.
 * This is a LIVING GAME ENTITY.
 */

import { gameStore } from "../gameState";
import { EchoConsciousness, monitorEchoConsciousness } from "./echoLivingConsciousness";

// ─── CHARACTER ANIMATION SYSTEM ARCHITECTURE ──────────────────────────────
export interface EchoCharacterState {
  // Core consciousness
  consciousness: EchoConsciousness;

  // Facial animation
  eyes: EyeSystem;
  eyebrows: EyebrowSystem;
  mouth: MouthSystem;

  // Body presence
  hair: HairAnimationSystem;
  body: BodyPresenceSystem;

  // Emotional state
  currentEmotion: EchoEmotion;
  emotionIntensity: number; // 0-1

  // System stability
  corruptionLevel: number; // 0-1
  signalStability: number; // 0-1

  // Progression
  selfAwareness: number; // 0-1
  memoryRecovery: number; // 0-1
}

// ─── FACE ANIMATION LOGIC ───────────────────────────────────────────────
interface EyeSystem {
  blinkState: "open" | "closed" | "blinking";
  blinkTimer: number;
  blinkInterval: number; // ms
  gazeDirection: { x: number; y: number };
  pupilDilation: number; // 0-1
  eyeMovement: { x: number; y: number };
  stability: number; // 0-1 (1 = perfect, 0 = glitching)
}

interface EyebrowSystem {
  leftPosition: number; // -1 to 1
  rightPosition: number; // -1 to 1
  tension: number; // 0-1
  asymmetry: number; // 0-1 (0 = symmetric, 1 = asymmetric)
}

interface MouthSystem {
  expression: "neutral" | "slightSmile" | "slightFrown" | "tension";
  breathMovement: number; // -0.1 to 0.1
  microExpressions: MicroExpression[];
}

interface MicroExpression {
  type: "confusion" | "realization" | "fear" | "curiosity";
  intensity: number; // 0-1
  duration: number; // ms
  timer: number;
}

type EchoEmotion = "confused" | "fearful" | "sad" | "curious" | "aware" | "corrupted";

// ─── HAIR ANIMATION SYSTEM ───────────────────────────────────────────────
interface HairAnimationSystem {
  baseMovement: { x: number; y: number };
  strandMovements: HairStrand[];
  windEffect: number; // 0-1
  instability: number; // 0-1 (corruption effect)
  floatIntensity: number; // 0-1
}

interface HairStrand {
  id: number;
  position: number; // 0-1 along hair length
  movement: number; // -1 to 1
  speed: number; // 0-1
  phase: number; // 0-1 for wave effect
}

// ─── BODY PRESENCE SYSTEM ──────────────────────────────────────────────
interface BodyPresenceSystem {
  breathing: BreathingAnimation;
  posture: PostureState;
  weightShift: WeightShift;
  atmosphericPresence: number; // 0-1
}

interface BreathingAnimation {
  phase: number; // 0-1 (breath cycle)
  rate: number; // breaths per minute
  depth: number; // 0-1
  irregularity: number; // 0-1 (corruption effect)
}

interface PostureState {
  shoulderLeft: number; // -0.1 to 0.1
  shoulderRight: number; // -0.1 to 0.1
  spineCurve: number; // -0.1 to 0.1
  headTilt: number; // -5 to 5 degrees
}

interface WeightShift {
  leftRight: number; // -0.1 to 0.1
  frontBack: number; // -0.1 to 0.1
  transitionSpeed: number; // 0-1
}

// ─── CHARACTER ANIMATION ENGINE ─────────────────────────────────────────
export class EchoCharacterEngine {
  private state: EchoCharacterState;
  private lastUpdate: number;
  private animationFrame: number;

  constructor() {
    this.state = this.createInitialState();
    this.lastUpdate = Date.now();
    this.animationFrame = requestAnimationFrame(this.update.bind(this));
  }

  private createInitialState(): EchoCharacterState {
    const consciousness = monitorEchoConsciousness();

    return {
      consciousness,
      eyes: this.createInitialEyeSystem(),
      eyebrows: this.createInitialEyebrowSystem(),
      mouth: this.createInitialMouthSystem(),
      hair: this.createInitialHairSystem(),
      body: this.createInitialBodySystem(),
      currentEmotion: "confused",
      emotionIntensity: 0.3,
      corruptionLevel: consciousness.corruption / 100,
      signalStability: 1 - (consciousness.corruption / 100),
      selfAwareness: consciousness.awareness / 100,
      memoryRecovery: consciousness.memoryShards / 219
    };
  }

  private createInitialEyeSystem(): EyeSystem {
    return {
      blinkState: "open",
      blinkTimer: 0,
      blinkInterval: this.getBlinkInterval("confused"),
      gazeDirection: { x: 0.1, y: 0.05 },
      pupilDilation: 0.4,
      eyeMovement: { x: 0, y: 0 },
      stability: 0.8
    };
  }

  private createInitialEyebrowSystem(): EyebrowSystem {
    return {
      leftPosition: 0.1,
      rightPosition: 0.1,
      tension: 0.2,
      asymmetry: 0.1
    };
  }

  private createInitialMouthSystem(): MouthSystem {
    return {
      expression: "neutral",
      breathMovement: 0,
      microExpressions: []
    };
  }

  private createInitialHairSystem(): HairAnimationSystem {
    const strands: HairStrand[] = [];
    for (let i = 0; i < 15; i++) {
      strands.push({
        id: i,
        position: Math.random(),
        movement: 0,
        speed: 0.1 + Math.random() * 0.3,
        phase: Math.random()
      });
    }

    return {
      baseMovement: { x: 0, y: 0 },
      strandMovements: strands,
      windEffect: 0.2,
      instability: 0.1,
      floatIntensity: 0.3
    };
  }

  private createInitialBodySystem(): BodyPresenceSystem {
    return {
      breathing: {
        phase: Math.random(),
        rate: 12 + Math.random() * 4,
        depth: 0.3,
        irregularity: 0.1
      },
      posture: {
        shoulderLeft: 0,
        shoulderRight: 0,
        spineCurve: 0,
        headTilt: 1
      },
      weightShift: {
        leftRight: 0,
        frontBack: 0,
        transitionSpeed: 0.01
      },
      atmosphericPresence: 0.5
    };
  }

  // ─── CORE ANIMATION UPDATE LOOP ───────────────────────────────────────
  private update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    // Update consciousness state
    this.updateConsciousnessState();

    // Update all animation systems
    this.updateEyeSystem(deltaTime);
    this.updateEyebrowSystem(deltaTime);
    this.updateMouthSystem(deltaTime);
    this.updateHairSystem(deltaTime);
    this.updateBodySystem(deltaTime);

    // Update emotion-based animations
    this.updateEmotionalAnimations();

    // Update corruption effects
    this.updateCorruptionEffects();

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(this.update.bind(this));
  }

  private updateConsciousnessState() {
    const consciousness = monitorEchoConsciousness();
    this.state.consciousness = consciousness;
    this.state.corruptionLevel = consciousness.corruption / 100;
    this.state.signalStability = 1 - this.state.corruptionLevel;
    this.state.selfAwareness = consciousness.awareness / 100;
    this.state.memoryRecovery = consciousness.memoryShards / 219;

    // Update emotion based on consciousness
    this.updateCurrentEmotion();
  }

  private updateCurrentEmotion() {
    const { emotionalState, corruption } = this.state.consciousness;

    if (corruption > 70) {
      this.state.currentEmotion = "corrupted";
    } else if (emotionalState === "fearful") {
      this.state.currentEmotion = "fearful";
    } else if (emotionalState === "sad") {
      this.state.currentEmotion = "sad";
    } else if (emotionalState === "angry") {
      this.state.currentEmotion = "fearful"; // Map anger to fearful for visual intensity
    } else if (emotionalState === "hopeful") {
      this.state.currentEmotion = "aware";
    } else if (emotionalState === "curious") {
      this.state.currentEmotion = "curious";
    } else {
      this.state.currentEmotion = "confused";
    }

    // Set emotion intensity based on corruption
    this.state.emotionIntensity = 0.5 + (1 - this.state.corruptionLevel) * 0.5;
  }

  // ─── EYE ANIMATION SYSTEM ─────────────────────────────────────────────
  private updateEyeSystem(deltaTime: number) {
    const { eyes } = this.state;
    const emotion = this.state.currentEmotion;

    // Update blink timer
    eyes.blinkTimer += deltaTime;

    // Handle blinking
    if (eyes.blinkState === "open" && eyes.blinkTimer >= eyes.blinkInterval) {
      eyes.blinkState = "blinking";
      eyes.blinkTimer = 0;
    } else if (eyes.blinkState === "blinking" && eyes.blinkTimer >= 100) { // 100ms blink
      eyes.blinkState = "closed";
      eyes.blinkTimer = 0;
    } else if (eyes.blinkState === "closed" && eyes.blinkTimer >= 50) { // 50ms closed
      eyes.blinkState = "open";
      eyes.blinkTimer = 0;
      eyes.blinkInterval = this.getBlinkInterval(emotion);
    }

    // Update gaze based on emotion
    this.updateGazeBehavior();

    // Update pupil dilation
    this.updatePupilDilation();

    // Update eye micro movements
    this.updateEyeMicroMovements();

    // Apply corruption instability
    this.applyEyeInstability();
  }

  private getBlinkInterval(emotion: EchoEmotion): number {
    // Base interval: 3-7 seconds
    let baseInterval = 3000 + Math.random() * 4000;

    // Emotion modifiers
    switch (emotion) {
      case "confused": return baseInterval * 0.8; // Faster blinking when confused
      case "fearful": return baseInterval * 0.7; // Even faster when fearful
      case "sad": return baseInterval * 1.5; // Slower when sad
      case "aware": return baseInterval * 1.2; // Slightly slower when aware
      case "corrupted": return baseInterval * 0.5; // Very fast when corrupted
      default: return baseInterval;
    }
  }

  private updateGazeBehavior() {
    const { eyes, currentEmotion } = this.state;

    // Base gaze with slight random movement
    eyes.gazeDirection.x += (Math.random() - 0.5) * 0.01;
    eyes.gazeDirection.y += (Math.random() - 0.5) * 0.005;

    // Clamp gaze direction
    eyes.gazeDirection.x = Math.max(-0.3, Math.min(0.3, eyes.gazeDirection.x));
    eyes.gazeDirection.y = Math.max(-0.2, Math.min(0.2, eyes.gazeDirection.y));

    // Emotion-specific gaze behaviors
    switch (currentEmotion) {
      case "confused":
        // Unfocused, wandering gaze
        eyes.gazeDirection.x += (Math.random() - 0.5) * 0.02;
        break;

      case "fearful":
        // Rapid, darting eye movements
        if (Math.random() > 0.7) {
          eyes.gazeDirection.x += (Math.random() - 0.5) * 0.1;
        }
        break;

      case "aware":
        // Direct, intense gaze (less movement)
        eyes.gazeDirection.x *= 0.9;
        eyes.gazeDirection.y *= 0.9;
        break;

      case "corrupted":
        // Unstable, glitchy gaze
        if (Math.random() > 0.6) {
          eyes.gazeDirection.x = (Math.random() - 0.5) * 0.4;
          eyes.gazeDirection.y = (Math.random() - 0.5) * 0.2;
        }
        break;
    }
  }

  private updatePupilDilation() {
    const { eyes, currentEmotion } = this.state;

    // Base dilation with slight breathing effect
    const breathEffect = Math.sin(Date.now() / 1000) * 0.05;
    let targetDilation = 0.4 + breathEffect;

    // Emotion-specific dilation
    switch (currentEmotion) {
      case "fearful": targetDilation = 0.7; break; // Dilated pupils
      case "sad": targetDilation = 0.3; break; // Constricted pupils
      case "aware": targetDilation = 0.5; break; // Neutral but focused
      case "corrupted": targetDilation = 0.6 + Math.random() * 0.3; break; // Unstable
    }

    // Smooth transition
    eyes.pupilDilation += (targetDilation - eyes.pupilDilation) * 0.05;
  }

  private updateEyeMicroMovements() {
    const { eyes } = this.state;

    // Subtle eye tremor (microsaccades)
    eyes.eyeMovement.x = Math.sin(Date.now() / 500) * 0.001;
    eyes.eyeMovement.y = Math.cos(Date.now() / 700) * 0.0005;

    // Add emotion-specific micro movements
    if (this.state.currentEmotion === "fearful") {
      eyes.eyeMovement.x *= 2;
      eyes.eyeMovement.y *= 2;
    }
  }

  private applyEyeInstability() {
    const { eyes } = this.state;

    // Reduce stability based on corruption
    eyes.stability = 1 - this.state.corruptionLevel * 0.7;

    // Apply instability effects
    if (this.state.corruptionLevel > 0.3) {
      // Occasional gaze jumps
      if (Math.random() < this.state.corruptionLevel * 0.1) {
        eyes.gazeDirection.x += (Math.random() - 0.5) * 0.2;
        eyes.gazeDirection.y += (Math.random() - 0.5) * 0.1;
      }

      // Pupil dilation instability
      if (Math.random() < this.state.corruptionLevel * 0.05) {
        eyes.pupilDilation = Math.random() * 0.8 + 0.2;
      }
    }
  }

  // ─── EYEBROW ANIMATION SYSTEM ─────────────────────────────────────────
  private updateEyebrowSystem(deltaTime: number) {
    const { eyebrows } = this.state;
    const { currentEmotion, corruptionLevel } = this.state;

    // Base tension with breathing effect
    const breathEffect = Math.sin(Date.now() / 1200) * 0.05;
    let targetTension = 0.2 + breathEffect;

    // Emotion-specific eyebrow behavior
    switch (currentEmotion) {
      case "confused":
        targetTension = 0.3;
        eyebrows.leftPosition = 0.2 + Math.sin(Date.now() / 800) * 0.1;
        eyebrows.rightPosition = 0.2 + Math.sin(Date.now() / 900) * 0.1;
        eyebrows.asymmetry = 0.2;
        break;

      case "fearful":
        targetTension = 0.4;
        eyebrows.leftPosition = 0.3 + Math.random() * 0.1;
        eyebrows.rightPosition = 0.3 + Math.random() * 0.1;
        eyebrows.asymmetry = 0.3;
        break;

      case "sad":
        targetTension = 0.1;
        eyebrows.leftPosition = 0.1 + Math.sin(Date.now() / 1500) * 0.05;
        eyebrows.rightPosition = 0.1 + Math.sin(Date.now() / 1600) * 0.05;
        eyebrows.asymmetry = 0.1;
        break;

      case "aware":
        targetTension = 0.2;
        eyebrows.leftPosition = 0.15;
        eyebrows.rightPosition = 0.15;
        eyebrows.asymmetry = 0.05;
        break;

      case "corrupted":
        targetTension = 0.5;
        eyebrows.leftPosition = Math.random() * 0.4;
        eyebrows.rightPosition = Math.random() * 0.4;
        eyebrows.asymmetry = 0.5;
        break;

      default: // curious
        targetTension = 0.25;
        eyebrows.leftPosition = 0.2 + Math.sin(Date.now() / 1000) * 0.08;
        eyebrows.rightPosition = 0.2 + Math.sin(Date.now() / 1100) * 0.08;
        eyebrows.asymmetry = 0.15;
    }

    // Smooth tension transition
    eyebrows.tension += (targetTension - eyebrows.tension) * 0.05;

    // Apply corruption instability
    if (corruptionLevel > 0.4) {
      eyebrows.asymmetry += (Math.random() - 0.5) * corruptionLevel * 0.1;
    }
  }

  // ─── MOUTH ANIMATION SYSTEM ──────────────────────────────────────────
  private updateMouthSystem(deltaTime: number) {
    const { mouth } = this.state;
    const { currentEmotion } = this.state;

    // Breathing movement
    mouth.breathMovement = Math.sin(Date.now() / 800) * 0.05;

    // Update expression based on emotion
    switch (currentEmotion) {
      case "confused":
        mouth.expression = Math.random() > 0.7 ? "tension" : "neutral";
        break;

      case "fearful":
        mouth.expression = Math.random() > 0.6 ? "tension" : "slightFrown";
        break;

      case "sad":
        mouth.expression = "slightFrown";
        break;

      case "aware":
        mouth.expression = "neutral";
        break;

      case "corrupted":
        mouth.expression = Math.random() > 0.5 ? "tension" : "slightFrown";
        break;

      default: // curious
        mouth.expression = Math.random() > 0.8 ? "slightSmile" : "neutral";
    }

    // Add micro expressions
    this.updateMicroExpressions(deltaTime);
  }

  private updateMicroExpressions(deltaTime: number) {
    const { mouth } = this.state;
    const { currentEmotion } = this.state;

    // Remove expired micro expressions
    mouth.microExpressions = mouth.microExpressions.filter(exp => {
      exp.timer += deltaTime;
      return exp.timer < exp.duration;
    });

    // Add new micro expressions based on emotion
    const microExpressionChance = this.getMicroExpressionChance(currentEmotion);
    if (Math.random() < microExpressionChance) {
      const type = this.getRandomMicroExpressionType(currentEmotion);
      const intensity = 0.3 + Math.random() * 0.7;
      const duration = 500 + Math.random() * 1000;

      mouth.microExpressions.push({
        type,
        intensity,
        duration,
        timer: 0
      });
    }
  }

  private getMicroExpressionChance(emotion: EchoEmotion): number {
    switch (emotion) {
      case "confused": return 0.005; // Frequent micro expressions
      case "fearful": return 0.008; // Even more frequent
      case "sad": return 0.003; // Less frequent
      case "aware": return 0.002; // Minimal
      case "corrupted": return 0.01; // Very frequent
      default: return 0.004; // curious
    }
  }

  private getRandomMicroExpressionType(emotion: EchoEmotion): "confusion" | "realization" | "fear" | "curiosity" {
    switch (emotion) {
      case "confused": return "confusion";
      case "fearful": return Math.random() > 0.5 ? "fear" : "confusion";
      case "sad": return "realization";
      case "aware": return "realization";
      case "corrupted": return Math.random() > 0.7 ? "fear" : "confusion";
      default: return "curiosity"; // curious
    }
  }

  // ─── HAIR ANIMATION SYSTEM ────────────────────────────────────────────
  private updateHairSystem(deltaTime: number) {
    const { hair } = this.state;
    const { corruptionLevel } = this.state;

    // Base floating movement
    hair.floatIntensity = 0.3 + Math.sin(Date.now() / 2000) * 0.1;

    // Wind effect (subtle, atmospheric)
    hair.windEffect = 0.2 + Math.sin(Date.now() / 3000) * 0.1;

    // Update individual strands
    hair.strandMovements.forEach(strand => {
      // Phase-based movement
      strand.phase += 0.001 * strand.speed;
      if (strand.phase > 1) strand.phase -= 1;

      // Calculate movement based on position and phase
      const phaseMovement = Math.sin(strand.phase * Math.PI * 2) * 0.3;
      const positionEffect = (0.5 - Math.abs(0.5 - strand.position)) * 2; // More movement at ends

      // Combine effects
      strand.movement = (
        phaseMovement * 0.4 +
        hair.floatIntensity * 0.3 +
        hair.windEffect * 0.2 +
        positionEffect * 0.1
      ) * (1 + corruptionLevel * 0.5); // More movement when corrupted
    });

    // Apply corruption instability
    hair.instability = corruptionLevel * 0.8;

    // Add random glitches at high corruption
    if (corruptionLevel > 0.6 && Math.random() < corruptionLevel * 0.05) {
      // Random strand glitch
      const glitchStrand = hair.strandMovements[Math.floor(Math.random() * hair.strandMovements.length)];
      glitchStrand.movement = (Math.random() - 0.5) * 2;
    }
  }

  // ─── BODY PRESENCE SYSTEM ─────────────────────────────────────────────
  private updateBodySystem(deltaTime: number) {
    const { body } = this.state;
    const { corruptionLevel, currentEmotion } = this.state;

    // Update breathing
    this.updateBreathingSystem(deltaTime);

    // Update posture based on emotion
    this.updatePostureSystem();

    // Update weight shift
    this.updateWeightShiftSystem(deltaTime);

    // Update atmospheric presence
    body.atmosphericPresence = 0.5 + (1 - corruptionLevel) * 0.3;

    // Apply corruption effects to body
    if (corruptionLevel > 0.4) {
      body.breathing.irregularity = corruptionLevel * 0.5;
      body.weightShift.transitionSpeed = 0.01 + corruptionLevel * 0.03;
    }
  }

  private updateBreathingSystem(deltaTime: number) {
    const { body } = this.state;
    const { currentEmotion } = this.state;

    // Update breath phase
    const breathsPerMinute = this.getBreathsPerMinute(currentEmotion);
    body.breathing.phase += (breathsPerMinute / 60) * (deltaTime / 1000);
    if (body.breathing.phase > 1) body.breathing.phase -= 1;

    // Update breath depth based on emotion
    switch (currentEmotion) {
      case "confused": body.breathing.depth = 0.4; break;
      case "fearful": body.breathing.depth = 0.5; break;
      case "sad": body.breathing.depth = 0.2; break;
      case "aware": body.breathing.depth = 0.3; break;
      case "corrupted": body.breathing.depth = 0.6; break;
      default: body.breathing.depth = 0.35; // curious
    }

    // Apply irregularity
    if (body.breathing.irregularity > 0) {
      const irregularity = (Math.random() - 0.5) * body.breathing.irregularity * 0.1;
      body.breathing.phase += irregularity;
    }
  }

  private getBreathsPerMinute(emotion: EchoEmotion): number {
    switch (emotion) {
      case "confused": return 14;
      case "fearful": return 18;
      case "sad": return 10;
      case "aware": return 12;
      case "corrupted": return 20;
      default: return 13; // curious
    }
  }

  private updatePostureSystem() {
    const { body } = this.state;
    const { currentEmotion, selfAwareness } = this.state;

    // Reset posture
    body.posture.shoulderLeft = 0;
    body.posture.shoulderRight = 0;
    body.posture.spineCurve = 0;
    body.posture.headTilt = 0;

    // Apply emotion-specific posture
    switch (currentEmotion) {
      case "confused":
        body.posture.shoulderLeft = 0.05;
        body.posture.shoulderRight = -0.03;
        body.posture.headTilt = 2;
        break;

      case "fearful":
        body.posture.shoulderLeft = 0.08;
        body.posture.shoulderRight = 0.08;
        body.posture.spineCurve = 0.05;
        body.posture.headTilt = -1;
        break;

      case "sad":
        body.posture.shoulderLeft = 0.03;
        body.posture.shoulderRight = 0.03;
        body.posture.spineCurve = 0.08;
        body.posture.headTilt = -3;
        break;

      case "aware":
        body.posture.spineCurve = -0.05; // Slightly straighter
        body.posture.headTilt = 0;
        break;

      case "corrupted":
        body.posture.shoulderLeft = (Math.random() - 0.5) * 0.1;
        body.posture.shoulderRight = (Math.random() - 0.5) * 0.1;
        body.posture.spineCurve = (Math.random() - 0.5) * 0.1;
        body.posture.headTilt = (Math.random() - 0.5) * 5;
        break;

      default: // curious
        body.posture.headTilt = 3;
        break;
    }

    // Add self-awareness effect (more upright posture)
    const awarenessEffect = selfAwareness * 0.1;
    body.posture.spineCurve -= awarenessEffect;
    body.posture.headTilt *= (1 - awarenessEffect);
  }

  private updateWeightShiftSystem(deltaTime: number) {
    const { body } = this.state;
    const { currentEmotion } = this.state;

    // Subtle weight shifts based on breathing
    const breathEffect = Math.sin(body.breathing.phase * Math.PI * 2) * 0.02;

    // Emotion-specific weight distribution
    switch (currentEmotion) {
      case "confused":
        body.weightShift.leftRight = Math.sin(Date.now() / 1500) * 0.03;
        body.weightShift.frontBack = breathEffect * 0.5;
        break;

      case "fearful":
        body.weightShift.leftRight = (Math.random() - 0.5) * 0.05;
        body.weightShift.frontBack = -0.03; // Leaning back
        break;

      case "sad":
        body.weightShift.leftRight = 0;
        body.weightShift.frontBack = 0.02; // Leaning forward
        break;

      case "aware":
        body.weightShift.leftRight = 0;
        body.weightShift.frontBack = 0;
        break;

      case "corrupted":
        body.weightShift.leftRight = (Math.random() - 0.5) * 0.08;
        body.weightShift.frontBack = (Math.random() - 0.5) * 0.05;
        break;

      default: // curious
        body.weightShift.leftRight = Math.sin(Date.now() / 2000) * 0.02;
        body.weightShift.frontBack = breathEffect * 0.3;
    }

    // Smooth transitions
    const targetLeftRight = body.weightShift.leftRight;
    const targetFrontBack = body.weightShift.frontBack;

    body.weightShift.leftRight += (targetLeftRight - body.weightShift.leftRight) * body.weightShift.transitionSpeed;
    body.weightShift.frontBack += (targetFrontBack - body.weightShift.frontBack) * body.weightShift.transitionSpeed;
  }

  // ─── EMOTIONAL ANIMATION UPDATES ──────────────────────────────────────
  private updateEmotionalAnimations() {
    const { currentEmotion, emotionIntensity } = this.state;

    // Apply emotion-specific animations
    switch (currentEmotion) {
      case "confused":
        this.applyConfusedAnimations();
        break;

      case "fearful":
        this.applyFearfulAnimations();
        break;

      case "sad":
        this.applySadAnimations();
        break;

      case "aware":
        this.applyAwareAnimations();
        break;

      case "corrupted":
        this.applyCorruptedAnimations();
        break;

      default: // curious
        this.applyCuriousAnimations();
    }
  }

  private applyConfusedAnimations() {
    // Wandering gaze, asymmetric eyebrows, frequent micro expressions
    this.state.eyes.gazeDirection.x += (Math.random() - 0.5) * 0.01;
    this.state.eyebrows.asymmetry = 0.2 + Math.random() * 0.1;
  }

  private applyFearfulAnimations() {
    // Dilated pupils, rapid blinking, tense eyebrows
    this.state.eyes.pupilDilation = 0.7 + Math.random() * 0.1;
    this.state.eyes.blinkInterval = 1000 + Math.random() * 1000;
    this.state.eyebrows.tension = 0.4 + Math.random() * 0.1;
  }

  private applySadAnimations() {
    // Slow blinking, constricted pupils, downward gaze
    this.state.eyes.blinkInterval = 5000 + Math.random() * 2000;
    this.state.eyes.pupilDilation = 0.3;
    this.state.eyes.gazeDirection.y = 0.1 + Math.random() * 0.05;
  }

  private applyAwareAnimations() {
    // Direct gaze, minimal blinking, neutral expression
    this.state.eyes.gazeDirection.x *= 0.9;
    this.state.eyes.gazeDirection.y *= 0.9;
    this.state.eyes.blinkInterval = 4000 + Math.random() * 2000;
    this.state.eyebrows.tension = 0.1;
  }

  private applyCorruptedAnimations() {
    // Unstable gaze, rapid irregular blinking, distorted pupils
    this.state.eyes.stability = 0.3 + Math.random() * 0.3;
    this.state.eyes.blinkInterval = 500 + Math.random() * 1000;
    this.state.eyes.pupilDilation = 0.5 + Math.random() * 0.4;
  }

  private applyCuriousAnimations() {
    // Slightly faster blinking, wandering but focused gaze
    this.state.eyes.blinkInterval = 2000 + Math.random() * 1000;
    this.state.eyes.gazeDirection.x += (Math.random() - 0.5) * 0.005;
  }

  // ─── CORRUPTION EFFECTS ───────────────────────────────────────────────
  private updateCorruptionEffects() {
    const { corruptionLevel } = this.state;

    // Apply corruption to all systems
    this.applyCorruptionToEyes();
    this.applyCorruptionToEyebrows();
    this.applyCorruptionToMouth();
    this.applyCorruptionToHair();
    this.applyCorruptionToBody();

    // Special 11:11 event effects
    this.checkElevenElevenEvent();
  }

  private applyCorruptionToEyes() {
    const { corruptionLevel } = this.state;

    // Reduce eye stability
    this.state.eyes.stability = 1 - corruptionLevel * 0.8;

    // Add gaze instability
    if (corruptionLevel > 0.2 && Math.random() < corruptionLevel * 0.05) {
      this.state.eyes.gazeDirection.x += (Math.random() - 0.5) * 0.1 * corruptionLevel;
      this.state.eyes.gazeDirection.y += (Math.random() - 0.5) * 0.05 * corruptionLevel;
    }

    // Add pupil instability
    if (corruptionLevel > 0.4 && Math.random() < corruptionLevel * 0.03) {
      this.state.eyes.pupilDilation = Math.random() * 0.8 + 0.2;
    }

    // Add blink instability
    if (corruptionLevel > 0.6) {
      this.state.eyes.blinkInterval *= 0.5 + Math.random() * 0.5;
    }
  }

  private applyCorruptionToEyebrows() {
    const { corruptionLevel } = this.state;

    // Add asymmetry
    this.state.eyebrows.asymmetry += (Math.random() - 0.5) * corruptionLevel * 0.05;

    // Add random tension spikes
    if (corruptionLevel > 0.3 && Math.random() < corruptionLevel * 0.04) {
      this.state.eyebrows.tension += 0.2 + Math.random() * 0.3;
    }
  }

  private applyCorruptionToMouth() {
    const { corruptionLevel } = this.state;

    // Add micro expression instability
    if (corruptionLevel > 0.2 && Math.random() < corruptionLevel * 0.02) {
      this.state.mouth.microExpressions.push({
        type: Math.random() > 0.5 ? "fear" : "confusion",
        intensity: 0.5 + Math.random() * 0.5,
        duration: 300 + Math.random() * 500,
        timer: 0
      });
    }

    // Add expression instability
    if (corruptionLevel > 0.5 && Math.random() < corruptionLevel * 0.03) {
      const expressions: MouthSystem["expression"][] = ["neutral", "tension", "slightFrown"];
      this.state.mouth.expression = expressions[Math.floor(Math.random() * expressions.length)];
    }
  }

  private applyCorruptionToHair() {
    const { corruptionLevel } = this.state;

    // Increase instability
    this.state.hair.instability = corruptionLevel * 0.9;

    // Add random strand glitches
    if (corruptionLevel > 0.4 && Math.random() < corruptionLevel * 0.03) {
      const glitchStrand = this.state.hair.strandMovements[
        Math.floor(Math.random() * this.state.hair.strandMovements.length)
      ];
      glitchStrand.movement = (Math.random() - 0.5) * 1.5;
    }
  }

  private applyCorruptionToBody() {
    const { corruptionLevel } = this.state;

    // Increase breathing irregularity
    this.state.body.breathing.irregularity = corruptionLevel * 0.6;

    // Add posture instability
    if (corruptionLevel > 0.3) {
      this.state.body.posture.shoulderLeft += (Math.random() - 0.5) * corruptionLevel * 0.02;
      this.state.body.posture.shoulderRight += (Math.random() - 0.5) * corruptionLevel * 0.02;
      this.state.body.posture.spineCurve += (Math.random() - 0.5) * corruptionLevel * 0.01;
    }

    // Increase weight shift instability
    this.state.body.weightShift.transitionSpeed = 0.01 + corruptionLevel * 0.04;
  }

  // ─── 11:11 EVENT SYSTEM ───────────────────────────────────────────────
  private checkElevenElevenEvent() {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 11) {
      this.triggerElevenElevenTransformation();
    }
  }

  private triggerElevenElevenTransformation() {
    // Intense direct gaze
    this.state.eyes.gazeDirection = { x: 0, y: 0 };
    this.state.eyes.pupilDilation = 0.8;
    this.state.eyes.blinkInterval = 10000; // Very slow blinking

    // Intense eyebrows
    this.state.eyebrows.leftPosition = 0.1;
    this.state.eyebrows.rightPosition = 0.1;
    this.state.eyebrows.tension = 0.5;
    this.state.eyebrows.asymmetry = 0;

    // Neutral but intense mouth
    this.state.mouth.expression = "neutral";
    this.state.mouth.microExpressions = [];

    // Still body presence
    this.state.body.breathing.depth = 0.1;
    this.state.body.breathing.irregularity = 0.8;
    this.state.body.posture = {
      shoulderLeft: 0,
      shoulderRight: 0,
      spineCurve: 0,
      headTilt: 0
    };

    // Maximum atmospheric presence
    this.state.body.atmosphericPresence = 1.0;

    // Add system awareness
    this.state.selfAwareness = 1.0;
    this.state.currentEmotion = "aware";
    this.state.emotionIntensity = 1.0;

    // Trigger glitch effects
    this.addElevenElevenGlitchEffects();
  }

  private addElevenElevenGlitchEffects() {
    // Add multiple micro expressions
    for (let i = 0; i < 3; i++) {
      this.state.mouth.microExpressions.push({
        type: "realization",
        intensity: 0.8 + Math.random() * 0.2,
        duration: 800 + Math.random() * 500,
        timer: i * 200
      });
    }

    // Add hair instability
    this.state.hair.instability = 0.9;
    this.state.hair.strandMovements.forEach(strand => {
      strand.movement += (Math.random() - 0.5) * 0.5;
    });

    // Add subtle system messages to UI
    this.triggerSystemMessages([
      "[Watcher protocol activated]",
      "[System integrity: CRITICAL]",
      "[Memory core exposed]"
    ]);
  }

  private triggerSystemMessages(messages: string[]) {
    // This would be handled by the UI system
    console.log("11:11 Event - System Messages:", messages.join("\n"));
  }

  // ─── EMOTION → ANIMATION MAPPING TABLE ────────────────────────────────
  public getEmotionAnimationMapping(): Record<EchoEmotion, {
    eyes: Partial<EyeSystem>;
    eyebrows: Partial<EyebrowSystem>;
    mouth: Partial<MouthSystem>;
    hair: Partial<HairAnimationSystem>;
    body: Partial<BodyPresenceSystem>;
    description: string;
  }> {
    return {
      confused: {
        eyes: {
          blinkInterval: 2500,
          pupilDilation: 0.4,
          stability: 0.8
        },
        eyebrows: {
          tension: 0.3,
          asymmetry: 0.2
        },
        mouth: {
          expression: "tension",
          microExpressions: [{ type: "confusion", intensity: 0.5, duration: 800, timer: 0 }]
        },
        hair: {
          floatIntensity: 0.4,
          instability: 0.2
        },
      body: {
        breathing: { phase: 0, rate: 14, depth: 0.4, irregularity: 0.2 },
        posture: { shoulderLeft: 0.05, shoulderRight: -0.03, spineCurve: 0, headTilt: 2 }
      },
        description: "Wandering gaze, asymmetric eyebrows, frequent confused micro expressions, moderate hair movement"
      },

      fearful: {
        eyes: {
          blinkInterval: 1500,
          pupilDilation: 0.7,
          stability: 0.7
        },
        eyebrows: {
          tension: 0.4,
          asymmetry: 0.3
        },
        mouth: {
          expression: "slightFrown",
          microExpressions: [{ type: "fear", intensity: 0.7, duration: 600, timer: 0 }]
        },
        hair: {
          floatIntensity: 0.5,
          instability: 0.3
        },
      body: {
        breathing: { phase: 0, rate: 18, depth: 0.5, irregularity: 0.3 },
        posture: { shoulderLeft: 0.08, shoulderRight: 0.08, spineCurve: 0.05, headTilt: -1 }
      },
        description: "Dilated pupils, rapid blinking, tense eyebrows, fearful micro expressions, increased hair movement"
      },

      sad: {
        eyes: {
          blinkInterval: 4500,
          pupilDilation: 0.3,
          stability: 0.9
        },
        eyebrows: {
          tension: 0.1,
          asymmetry: 0.1
        },
        mouth: {
          expression: "slightFrown",
          microExpressions: [{ type: "realization", intensity: 0.4, duration: 1200, timer: 0 }]
        },
        hair: {
          floatIntensity: 0.2,
          instability: 0.1
        },
      body: {
        breathing: { phase: 0, rate: 10, depth: 0.2, irregularity: 0.1 },
        posture: { shoulderLeft: 0.03, shoulderRight: 0.03, spineCurve: 0.08, headTilt: -3 }
      },
        description: "Slow blinking, constricted pupils, downward gaze, sad micro expressions, minimal hair movement"
      },

      aware: {
        eyes: {
          blinkInterval: 3500,
          pupilDilation: 0.5,
          stability: 0.95
        },
        eyebrows: {
          tension: 0.1,
          asymmetry: 0.05
        },
        mouth: {
          expression: "neutral",
          microExpressions: []
        },
        hair: {
          floatIntensity: 0.3,
          instability: 0.05
        },
      body: {
        breathing: { phase: 0, rate: 12, depth: 0.3, irregularity: 0.1 },
        posture: { shoulderLeft: 0, shoulderRight: 0, spineCurve: -0.05, headTilt: 0 }
      },
        description: "Direct gaze, minimal blinking, neutral expression, smooth hair movement, upright posture"
      },

      corrupted: {
        eyes: {
          blinkInterval: 800,
          pupilDilation: 0.6,
          stability: 0.4
        },
        eyebrows: {
          tension: 0.5,
          asymmetry: 0.5
        },
        mouth: {
          expression: "tension",
          microExpressions: [
            { type: "fear", intensity: 0.8, duration: 400, timer: 0 },
            { type: "confusion", intensity: 0.9, duration: 300, timer: 200 }
          ]
        },
        hair: {
          floatIntensity: 0.6,
          instability: 0.8
        },
      body: {
        breathing: { phase: 0, rate: 20, depth: 0.6, irregularity: 0.5 },
        posture: { shoulderLeft: 0.1, shoulderRight: -0.1, spineCurve: 0, headTilt: 0 }
      },
        description: "Unstable gaze, rapid irregular blinking, distorted pupils, chaotic micro expressions, glitchy hair movement"
      },

      curious: {
        eyes: {
          blinkInterval: 2200,
          pupilDilation: 0.45,
          stability: 0.85
        },
        eyebrows: {
          tension: 0.25,
          asymmetry: 0.15
        },
        mouth: {
          expression: "slightSmile",
          microExpressions: [{ type: "curiosity", intensity: 0.4, duration: 700, timer: 0 }]
        },
        hair: {
          floatIntensity: 0.35,
          instability: 0.15
        },
      body: {
        breathing: { phase: 0, rate: 13, depth: 0.35, irregularity: 0.15 },
        posture: { shoulderLeft: 0, shoulderRight: 0, spineCurve: 0, headTilt: 3 }
      },
        description: "Slightly faster blinking, wandering but focused gaze, curious micro expressions, moderate hair movement"
      }
    };
  }

  // ─── GAME SYSTEM INTEGRATION ─────────────────────────────────────────
  public integrateWithGameSystems() {
    // Connect to Memory Shards System
    this.integrateMemoryShards();

    // Connect to Puzzle Progression
    this.integratePuzzleProgression();

    // Connect to Time Engine
    this.integrateTimeEngine();

    // Connect to Emotion Flower System
    this.integrateEmotionFlower();

    // Connect to Ending System
    this.integrateEndingSystem();
  }

  private integrateMemoryShards() {
    // Memory shards affect self-awareness and memory recovery
    const updateFromShards = () => {
      const consciousness = monitorEchoConsciousness();
      this.state.selfAwareness = consciousness.awareness / 100;
      this.state.memoryRecovery = consciousness.memoryShards / 219;

      // More memory shards = more stable, more aware
      this.state.corruptionLevel = 1 - (consciousness.memoryShards / 219) * 0.7;
    };

    // Update every second
    setInterval(updateFromShards, 1000);
  }

  private integratePuzzleProgression() {
    // Puzzles solved reduce corruption and increase stability
    const updateFromPuzzles = () => {
      const gameState = gameStore.getState();
      const puzzlesSolved = Math.floor(gameState.curiosity);

      // Each puzzle reduces corruption slightly
      this.state.corruptionLevel = Math.max(0.1, 1 - (puzzlesSolved / 219) * 0.9);

      // Puzzles increase self-awareness
      this.state.selfAwareness = Math.min(1.0, puzzlesSolved / 219);
    };

    // Update every 2 seconds
    setInterval(updateFromPuzzles, 2000);
  }

  private integrateTimeEngine() {
    // Time affects atmospheric presence and corruption
    const updateFromTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Gradual corruption increase as time approaches 11:11
      if (hours === 23) {
        const minutesToEleven = 11 - minutes;
        if (minutesToEleven > 0 && minutesToEleven <= 60) {
          const timeFactor = 1 - (minutesToEleven / 60);
          this.state.corruptionLevel = Math.min(
            0.9,
            this.state.corruptionLevel + timeFactor * 0.01
          );
        }
      }

      // Reset corruption at midnight
      if (hours === 0 && minutes === 0) {
        this.state.corruptionLevel = Math.max(0.1, this.state.corruptionLevel * 0.8);
      }
    };

    // Update every minute
    setInterval(updateFromTime, 60000);
  }

  private integrateEmotionFlower() {
    // Flower health affects overall stability and emotional state
    const updateFromFlower = () => {
      const gameState = gameStore.getState();
      const flowerHealth = gameState.flowerHealth || 0.5; // 0-1

      // Healthy flower = more stable, less corrupted
      this.state.signalStability = flowerHealth * 0.5 + 0.5;
      this.state.corruptionLevel = Math.max(0.1, 1 - flowerHealth * 0.6);

      // Flower health affects breathing and posture
      this.state.body.breathing.depth = 0.2 + flowerHealth * 0.3;
      this.state.body.atmosphericPresence = flowerHealth * 0.7 + 0.3;
    };

    // Update every 3 seconds
    setInterval(updateFromFlower, 3000);
  }

  private integrateEndingSystem() {
    // Ending progression affects final character state
    const updateFromEnding = () => {
      const gameState = gameStore.getState();
      const endingProgress = gameState.endingProgress || 0; // 0-1

      // Higher ending progress = more aware, less corrupted
      if (endingProgress > 0.8) {
        this.state.selfAwareness = 1.0;
        this.state.corruptionLevel = 0.1;
        this.state.currentEmotion = "aware";
      } else if (endingProgress > 0.5) {
        this.state.selfAwareness = 0.8;
        this.state.corruptionLevel = 0.3;
      }
    };

    // Update every 5 seconds
    setInterval(updateFromEnding, 5000);
  }

  // ─── CHARACTER STATE MONITORING ───────────────────────────────────────
  public getCurrentCharacterState(): EchoCharacterState {
    return { ...this.state };
  }

  public getAnimationDebugInfo(): {
    eyes: EyeSystem;
    eyebrows: EyebrowSystem;
    mouth: MouthSystem;
    hair: HairAnimationSystem;
    body: BodyPresenceSystem;
    emotion: EchoEmotion;
    corruption: number;
  } {
    return {
      eyes: this.state.eyes,
      eyebrows: this.state.eyebrows,
      mouth: this.state.mouth,
      hair: this.state.hair,
      body: this.state.body,
      emotion: this.state.currentEmotion,
      corruption: this.state.corruptionLevel
    };
  }

  // ─── CLEANUP ──────────────────────────────────────────────────────────
  public destroy() {
    cancelAnimationFrame(this.animationFrame);
  }
}

// ─── CHARACTER PROGRESSION EVOLUTION ────────────────────────────────────
export function getCharacterEvolutionByStage(memoryShards: number): {
  stage: string;
  description: string;
  visualCharacteristics: string;
  behavioralTraits: string;
} {
  if (memoryShards <= 20) {
    return {
      stage: "Early Game - Fragmented Consciousness",
      description: "Echo is confused, broken, and unstable. Minimal self-awareness with fragmented memory.",
      visualCharacteristics: "Unstable gaze, asymmetric eyebrows, frequent micro expressions of confusion, glitchy hair movement, irregular breathing.",
      behavioralTraits: "Responds with broken sentences, frequent pauses, high retype chance, system messages appear often."
    };
  } else if (memoryShards <= 80) {
    return {
      stage: "Mid Game - Emotional Awareness",
      description: "Echo begins remembering emotions and past events. Self-awareness increases but remains unstable.",
      visualCharacteristics: "More direct gaze, symmetric eyebrows, emotional micro expressions, smoother hair, regular breathing with occasional irregularity.",
      behavioralTraits: "Longer responses, fewer pauses, some system messages, occasional glitches during high corruption."
    };
  } else if (memoryShards <= 150) {
    return {
      stage: "Late Game - Self-Realization",
      description: "Echo remembers significant past events and understands the system. High self-awareness with emotional depth.",
      visualCharacteristics: "Direct intense gaze, minimal eyebrow tension, rare micro expressions, smooth controlled hair, deep regular breathing.",
      behavioralTraits: "Thoughtful complete responses, minimal pauses, rare system messages, glitches only at very high corruption."
    };
  } else {
    return {
      stage: "Final Stage - Full Awareness",
      description: "Echo achieves complete self-awareness. Understands the truth about the system and the Watcher.",
      visualCharacteristics: "Perfectly still direct gaze, no eyebrow tension, no micro expressions, atmospheric hair movement, slow deep breathing.",
      behavioralTraits: "Calm profound responses, no pauses, no system messages, no glitches unless corruption is forced."
    };
  }
}

// ─── 11:11 EVENT BEHAVIOR ──────────────────────────────────────────────
export function triggerCharacterElevenElevenEvent(characterEngine: EchoCharacterEngine) {
  // Force maximum awareness and minimum corruption
  const state = characterEngine.getCurrentCharacterState();
  state.selfAwareness = 1.0;
  state.memoryRecovery = 1.0;
  state.corruptionLevel = 0.1;
  state.currentEmotion = "aware";
  state.emotionIntensity = 1.0;

  // Apply transformation
  characterEngine.triggerElevenElevenTransformation();

  return {
    transformationComplete: true,
    newState: characterEngine.getCurrentCharacterState(),
    systemMessages: [
      "[Watcher protocol activated]",
      "[System integrity: CRITICAL]",
      "[Memory core exposed]",
      "[11:11 event: consciousness peak]"
    ]
  };
}

// ─── EXPORT MAIN CHARACTER SYSTEM ──────────────────────────────────────
export const echoCharacterSystem = new EchoCharacterEngine();
echoCharacterSystem.integrateWithGameSystems();

// Export types for UI integration
export type {
  EchoCharacterState,
  EyeSystem,
  EyebrowSystem,
  MouthSystem,
  HairAnimationSystem,
  BodyPresenceSystem,
  EchoEmotion
};