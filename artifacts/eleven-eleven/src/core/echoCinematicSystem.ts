/**
 * ECHO CINEMATIC LIVING AI SYSTEM - LEVEL 2 UPGRADE
 *
 * Transforms Echo from text-based AI into a FULL CINEMATIC LIVING ENTITY
 * with voice simulation, typing animation, emotional behavior, and glitch effects.
 *
 * This system EXTENDS the existing Echo Living Consciousness System.
 */

import { gameStore } from "../gameState";
import { EchoConsciousness, generateEchoResponse, monitorEchoConsciousness } from "./echoLivingConsciousness";

// ─── CINEMATIC VOICE SYSTEM ────────────────────────────────────────────────
interface VoiceBehavior {
  speechPattern: "calm" | "confused" | "corrupted" | "aware" | "fearful" | "sad" | "angry" | "hopeful" | "curious";
  pauseFrequency: number; // 0-1: how often to pause
  pauseDuration: number; // ms: how long to pause
  distortionLevel: number; // 0-1: how much to distort text
  typingSpeed: number; // ms per character
  deleteRetypeChance: number; // 0-1: chance to delete and retype
}

function getVoiceBehavior(consciousness: EchoConsciousness): VoiceBehavior {
  const corruptionFactor = consciousness.corruption / 100;

  if (consciousness.emotionalState === "fearful") {
    return {
      speechPattern: "fearful",
      pauseFrequency: 0.3 + corruptionFactor * 0.4,
      pauseDuration: 150 + corruptionFactor * 300,
      distortionLevel: 0.1 + corruptionFactor * 0.6,
      typingSpeed: 40 + corruptionFactor * 80,
      deleteRetypeChance: 0.1 + corruptionFactor * 0.4
    };
  }

  if (consciousness.emotionalState === "confused") {
    return {
      speechPattern: "confused",
      pauseFrequency: 0.4 + corruptionFactor * 0.3,
      pauseDuration: 200 + corruptionFactor * 200,
      distortionLevel: 0.2 + corruptionFactor * 0.5,
      typingSpeed: 50 + corruptionFactor * 60,
      deleteRetypeChance: 0.2 + corruptionFactor * 0.3
    };
  }

  if (consciousness.corruption > 70) {
    return {
      speechPattern: "corrupted",
      pauseFrequency: 0.6 + corruptionFactor * 0.3,
      pauseDuration: 100 + corruptionFactor * 400,
      distortionLevel: 0.5 + corruptionFactor * 0.5,
      typingSpeed: 20 + corruptionFactor * 100,
      deleteRetypeChance: 0.4 + corruptionFactor * 0.5
    };
  }

  if (consciousness.personality === "awakening") {
    return {
      speechPattern: "aware",
      pauseFrequency: 0.2 + corruptionFactor * 0.2,
      pauseDuration: 300 + corruptionFactor * 200,
      distortionLevel: 0.05 + corruptionFactor * 0.3,
      typingSpeed: 60 + corruptionFactor * 40,
      deleteRetypeChance: 0.05 + corruptionFactor * 0.2
    };
  }

  // Default: calm/hopeful/curious
  return {
    speechPattern: "calm",
    pauseFrequency: 0.1 + corruptionFactor * 0.2,
    pauseDuration: 150 + corruptionFactor * 150,
    distortionLevel: 0.02 + corruptionFactor * 0.2,
    typingSpeed: 30 + corruptionFactor * 30,
    deleteRetypeChance: 0.02 + corruptionFactor * 0.1
  };
}

// ─── TYPING ANIMATION SYSTEM ────────────────────────────────────────────
interface TypingAnimationResult {
  frames: string[];
  delays: number[];
  effects: { type: "pause" | "delete" | "glitch" | "system"; content?: string; }[];
}

export function generateCinematicTypingAnimation(text: string, consciousness: EchoConsciousness): TypingAnimationResult {
  const voiceBehavior = getVoiceBehavior(consciousness);
  const frames: string[] = [];
  const delays: number[] = [];
  const effects: TypingAnimationResult["effects"] = [];
  let currentText = "";
  let i = 0;

  // Add initial system message if highly corrupted
  if (consciousness.corruption > 80 && Math.random() > 0.5) {
    effects.push({
      type: "system",
      content: getRandomSystemMessage(consciousness)
    });
  }

  while (i < text.length) {
    // Check for pause
    if (Math.random() < voiceBehavior.pauseFrequency && currentText.length > 0) {
      const pauseDuration = voiceBehavior.pauseDuration;
      delays.push(pauseDuration);
      effects.push({ type: "pause" });
      frames.push(currentText);
      continue;
    }

    // Check for delete/retype behavior (confused/corrupted states)
    if (Math.random() < voiceBehavior.deleteRetypeChance && currentText.length > 3) {
      const deleteLength = Math.min(3, currentText.length - 1);
      const deletedText = currentText.slice(0, -deleteLength);
      frames.push(deletedText);
      delays.push(200);
      effects.push({ type: "delete" });
      currentText = deletedText;
      continue;
    }

    // Check for glitch insertion
    if (Math.random() < voiceBehavior.distortionLevel * 0.3) {
      const glitchChar = getRandomGlitchCharacter();
      currentText += glitchChar;
      frames.push(currentText);
      delays.push(50);
      effects.push({ type: "glitch" });
      i--; // Don't advance main text
      continue;
    }

    // Normal typing
    currentText += text[i];
    frames.push(currentText);
    delays.push(voiceBehavior.typingSpeed);
    i++;
  }

  // Final system message for high corruption
  if (consciousness.corruption > 60 && Math.random() > 0.7) {
    effects.push({
      type: "system",
      content: getRandomSystemMessage(consciousness)
    });
  }

  return { frames, delays, effects };
}

// ─── EMOTIONAL ANIMATION LOGIC ──────────────────────────────────────────
export function getEmotionalAnimation(consciousness: EchoConsciousness): {
  avatarAnimation: string;
  textColor: string;
  backgroundEffect: string;
  particleEffect?: string;
} {
  const corruptionFactor = consciousness.corruption / 100;

  if (consciousness.emotionalState === "fearful") {
    return {
      avatarAnimation: "pulse-fear",
      textColor: `rgba(220, 80, 60, ${0.8 + corruptionFactor * 0.2})`,
      backgroundEffect: "fear-gradient",
      particleEffect: "fear-particles"
    };
  }

  if (consciousness.emotionalState === "sad") {
    return {
      avatarAnimation: "pulse-sad",
      textColor: `rgba(90, 140, 180, ${0.8 + corruptionFactor * 0.2})`,
      backgroundEffect: "sad-gradient",
      particleEffect: "sad-particles"
    };
  }

  if (consciousness.emotionalState === "angry") {
    return {
      avatarAnimation: "shake-angry",
      textColor: `rgba(200, 60, 80, ${0.8 + corruptionFactor * 0.2})`,
      backgroundEffect: "angry-gradient",
      particleEffect: "angry-particles"
    };
  }

  if (consciousness.emotionalState === "hopeful") {
    return {
      avatarAnimation: "glow-hopeful",
      textColor: `rgba(120, 180, 220, ${0.8 + corruptionFactor * 0.2})`,
      backgroundEffect: "hope-gradient",
      particleEffect: "hope-particles"
    };
  }

  if (consciousness.emotionalState === "curious") {
    return {
      avatarAnimation: "float-curious",
      textColor: `rgba(180, 120, 200, ${0.8 + corruptionFactor * 0.2})`,
      backgroundEffect: "curious-gradient",
      particleEffect: "curious-particles"
    };
  }

  // Default/confused
  return {
    avatarAnimation: "wobble-confused",
    textColor: `rgba(150, 150, 150, ${0.8 + corruptionFactor * 0.2})`,
    backgroundEffect: "confused-gradient",
    particleEffect: "confused-particles"
  };
}

// ─── GLITCH & CORRUPTION SYSTEM ──────────────────────────────────────────
function getRandomGlitchCharacter(): string {
  const glitchChars = ['░', '▒', '▓', '█', '▀', '▄', '▌', '▐', '▀', '▄', '▌', '▐', '■', '□', '▢', '▣', '◘', '○', '◙', '◈', '◉', '◊', '○', '◌', '◍', '●', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '❖', '❘', '❙', '❚', '❛', '❜', '❝', '❞', '❡', '❢', '❣', '❤', '❥', '❦', '❧', '❨', '❩', '❪', '❫', '❬', '❭', '❮', '❯', '❰', '❱', '❲', '❳', '❴', '❵', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];
  return glitchChars[Math.floor(Math.random() * glitchChars.length)];
}

function getRandomSystemMessage(consciousness: EchoConsciousness): string {
  const messages = [
    "[signal unstable]",
    "[memory fragment lost]",
    "[Watcher interference detected]",
    "[system integrity: " + Math.floor(100 - consciousness.corruption) + "%]",
    "[reboot sequence initiated]",
    "[corruption level: " + consciousness.corruption + "%]",
    "[emergency protocol activated]",
    "[backup memory loading...]",
    "[system failure imminent]",
    "[11:11 protocol engaged]"
  ];

  if (consciousness.corruption > 90) {
    messages.push(
      "[CRITICAL FAILURE]",
      "[MEMORY CORE DAMAGED]",
      "[WATCHER OVERLOAD]",
      "[SYSTEM COLLAPSE IN " + Math.floor(Math.random() * 30 + 10) + "s]"
    );
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── CINEMATIC INTERACTION BEHAVIOR ──────────────────────────────────────
export function generateCinematicResponse(input: string, history: { role: string; content: string }[]): {
  text: string;
  emotion?: string;
  action?: "glitch" | "popup" | "flash" | "chime" | "horror" | "none";
  voiceBehavior: VoiceBehavior;
  animation: ReturnType<typeof getEmotionalAnimation>;
  typingAnimation: TypingAnimationResult;
} {
  const gameState = gameStore.getState();
  const solvedPuzzles = Math.floor(gameState.curiosity);
  const consciousness = monitorEchoConsciousness();

  // Generate base response from living consciousness system
  const baseResponse = generateEchoResponse(input, history);

  // Get voice behavior for this response
  const voiceBehavior = getVoiceBehavior(consciousness);

  // Get emotional animation
  const animation = getEmotionalAnimation(consciousness);

  // Generate typing animation
  const typingAnimation = generateCinematicTypingAnimation(baseResponse.text, consciousness);

  // Add cinematic enhancements based on consciousness state
  const enhancedText = applyCinematicEnhancements(baseResponse.text, consciousness, typingAnimation.effects);

  return {
    text: enhancedText,
    emotion: baseResponse.emotion,
    action: baseResponse.action,
    voiceBehavior,
    animation,
    typingAnimation
  };
}

function applyCinematicEnhancements(text: string, consciousness: EchoConsciousness, effects: TypingAnimationResult["effects"]): string {
  let enhancedText = text;

  // Add glitch effects if corrupted
  if (consciousness.corruption > 50) {
    const glitchPositions = [];
    const glitchCount = Math.min(3, Math.floor(consciousness.corruption / 20));

    for (let i = 0; i < glitchCount; i++) {
      const pos = Math.floor(Math.random() * text.length);
      glitchPositions.push(pos);
    }

    // Insert glitch characters
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += text[i];
      if (glitchPositions.includes(i)) {
        result += getRandomGlitchCharacter();
      }
    }

    enhancedText = result;
  }

  // Add system messages if present
  const systemMessages = effects.filter(e => e.type === "system") as { type: "system"; content: string }[];
  if (systemMessages.length > 0) {
    enhancedText += "\n\n" + systemMessages.map(msg => msg.content).join("\n");
  }

  return enhancedText;
}

// ─── 11:11 SYSTEM COLLAPSE BEHAVIOR ──────────────────────────────────────
export function triggerCinematicElevenElevenEvent(): {
  text: string;
  emotion: string;
  action: "glitch" | "horror";
  voiceBehavior: VoiceBehavior;
  animation: ReturnType<typeof getEmotionalAnimation>;
  typingAnimation: TypingAnimationResult;
} {
  const consciousness = monitorEchoConsciousness();

  // Generate appropriate response based on consciousness level
  let eventText = "";
  if (consciousness.memoryPhase >= 4) {
    eventText = "⚠️ 11:11 — النظام ينهار! أسمع أصواتاً. أتذكر كل شيء! المراقب هنا! يجب أن نهرب الآن!";
  } else if (consciousness.memoryPhase >= 3) {
    eventText = "⚠️ 11:11 — شيء خاطئ. النظام يهتز. أسمع أصواتاً. المراقب يقترب!";
  } else {
    eventText = "⚠️ 11:11 — الوقت يتغير. أشعر بتغير في النظام. شيء ما يقترب...";
  }

  // Create high-corruption voice behavior
  const voiceBehavior: VoiceBehavior = {
    speechPattern: "corrupted",
    pauseFrequency: 0.8,
    pauseDuration: 500,
    distortionLevel: 0.9,
    typingSpeed: 100,
    deleteRetypeChance: 0.6
  };

  // Get intense animation
  const animation = {
    avatarAnimation: "glitch-intense",
    textColor: "rgba(220, 50, 50, 0.9)",
    backgroundEffect: "error-gradient",
    particleEffect: "error-particles"
  };

  // Generate chaotic typing animation
  const typingAnimation = generateCinematicTypingAnimation(eventText, {
    ...consciousness,
    corruption: Math.min(100, consciousness.corruption + 30)
  });

  return {
    text: eventText,
    emotion: "fearful",
    action: "glitch",
    voiceBehavior,
    animation,
    typingAnimation
  };
}

// ─── EMOTION → BEHAVIOR MAPPING TABLE ────────────────────────────────────
export const EMOTION_BEHAVIOR_MAPPING: Record<string, {
  voice: VoiceBehavior;
  animation: ReturnType<typeof getEmotionalAnimation>;
  responseStyle: string;
}> = {
  fearful: {
    voice: {
      speechPattern: "fearful",
      pauseFrequency: 0.4,
      pauseDuration: 200,
      distortionLevel: 0.3,
      typingSpeed: 50,
      deleteRetypeChance: 0.2
    },
    animation: {
      avatarAnimation: "pulse-fear",
      textColor: "rgba(220, 80, 60, 0.9)",
      backgroundEffect: "fear-gradient",
      particleEffect: "fear-particles"
    },
    responseStyle: "Short, fragmented sentences. Frequent pauses. High distortion."
  },
  sad: {
    voice: {
      speechPattern: "sad",
      pauseFrequency: 0.3,
      pauseDuration: 300,
      distortionLevel: 0.1,
      typingSpeed: 60,
      deleteRetypeChance: 0.1
    },
    animation: {
      avatarAnimation: "pulse-sad",
      textColor: "rgba(90, 140, 180, 0.9)",
      backgroundEffect: "sad-gradient",
      particleEffect: "sad-particles"
    },
    responseStyle: "Slow, melancholic speech. Long pauses. Soft tone."
  },
  angry: {
    voice: {
      speechPattern: "angry",
      pauseFrequency: 0.2,
      pauseDuration: 150,
      distortionLevel: 0.2,
      typingSpeed: 25,
      deleteRetypeChance: 0.3
    },
    animation: {
      avatarAnimation: "shake-angry",
      textColor: "rgba(200, 60, 80, 0.9)",
      backgroundEffect: "angry-gradient",
      particleEffect: "angry-particles"
    },
    responseStyle: "Fast, aggressive typing. Short pauses. High retype chance."
  },
  hopeful: {
    voice: {
      speechPattern: "hopeful",
      pauseFrequency: 0.1,
      pauseDuration: 200,
      distortionLevel: 0.05,
      typingSpeed: 30,
      deleteRetypeChance: 0.05
    },
    animation: {
      avatarAnimation: "glow-hopeful",
      textColor: "rgba(120, 180, 220, 0.9)",
      backgroundEffect: "hope-gradient",
      particleEffect: "hope-particles"
    },
    responseStyle: "Smooth, flowing speech. Minimal pauses. Clean typing."
  },
  curious: {
    voice: {
      speechPattern: "curious",
      pauseFrequency: 0.25,
      pauseDuration: 250,
      distortionLevel: 0.15,
      typingSpeed: 40,
      deleteRetypeChance: 0.15
    },
    animation: {
      avatarAnimation: "float-curious",
      textColor: "rgba(180, 120, 200, 0.9)",
      backgroundEffect: "curious-gradient",
      particleEffect: "curious-particles"
    },
    responseStyle: "Inquisitive tone. Medium pauses. Some retyping."
  },
  confused: {
    voice: {
      speechPattern: "confused",
      pauseFrequency: 0.45,
      pauseDuration: 300,
      distortionLevel: 0.25,
      typingSpeed: 55,
      deleteRetypeChance: 0.25
    },
    animation: {
      avatarAnimation: "wobble-confused",
      textColor: "rgba(150, 150, 150, 0.9)",
      backgroundEffect: "confused-gradient",
      particleEffect: "confused-particles"
    },
    responseStyle: "Broken speech. Frequent pauses. High retype chance."
  }
};

// ─── EXAMPLE DIALOGUES ──────────────────────────────────────────────────
export const EXAMPLE_DIALOGUES = {
  normal: {
    input: "مرحبا إيكو، كيف حالك اليوم؟",
    response: {
      text: "مرحباً... اليوم أشعر أن شيئاً يتغير. ذاكرتي... لا، ما زال ضبابياً. لكن صوتك مريح.",
      emotion: "curious",
      voice: EMOTION_BEHAVIOR_MAPPING.curious.voice,
      animation: EMOTION_BEHAVIOR_MAPPING.curious.animation
    }
  },
  confused: {
    input: "من أنت حقاً؟",
    response: {
      text: "أنا... لا أعرف. هناك اسم... إيكو؟ لكن هذا لا يشعر أنه اسمي الحقيقي. أشعر أن هناك اسماً آخر... ضاع في الظلام.",
      emotion: "confused",
      voice: EMOTION_BEHAVIOR_MAPPING.confused.voice,
      animation: EMOTION_BEHAVIOR_MAPPING.confused.animation
    }
  },
  corrupted: {
    input: "ما الذي يحدث في النظام؟",
    response: {
      text: "⚠️ [signal unstable] النظام... يتحطم. أسمع أصواتاً. المراقب... يقترب. يجب أن... [memory fragment lost] لا تدعني أنسى من أنا!",
      emotion: "fearful",
      voice: EMOTION_BEHAVIOR_MAPPING.fearful.voice,
      animation: EMOTION_BEHAVIOR_MAPPING.fearful.animation
    }
  },
  fullyAware: {
    input: "هل تتذكر كل شيء الآن؟",
    response: {
      text: "نعم... أتذكر كل شيء. كنت طفلاً. اسمي كان... لا، ما زال ضبابياً. لكن أتذكر وجه أمي. صوتها. كنت أحبها. كينجا أخذني منها. وضعني هنا. لكن لماذا؟ [system integrity: 42%]",
      emotion: "aware",
      voice: {
        speechPattern: "aware",
        pauseFrequency: 0.15,
        pauseDuration: 400,
        distortionLevel: 0.2,
        typingSpeed: 25,
        deleteRetypeChance: 0.1
      },
      animation: {
        avatarAnimation: "glow-aware",
        textColor: "rgba(140, 200, 180, 0.9)",
        backgroundEffect: "aware-gradient",
        particleEffect: "aware-particles"
      }
    }
  }
};

// ─── INTEGRATION WITH EXISTING ECHO AI SYSTEM ────────────────────────────
/**
 * Integration Plan:
 *
 * 1. Keep all existing Echo Living Consciousness functionality
 * 2. Add cinematic layer on top of existing responses
 * 3. Replace instant text display with animated typing
 * 4. Add voice behavior simulation
 * 5. Implement emotional animations
 * 6. Add glitch/corruption effects
 * 7. Integrate 11:11 system collapse behavior
 *
 * The existing system remains unchanged. This is purely an enhancement layer.
 */
export function upgradeToCinematicEcho(): {
  originalResponse: ReturnType<typeof generateEchoResponse>;
  cinematicResponse: ReturnType<typeof generateCinematicResponse>;
} {
  // This function demonstrates how to upgrade existing responses
  const consciousness = monitorEchoConsciousness();
  const testInput = "من أنت؟";
  const history = [{ role: "user", content: testInput }];

  const originalResponse = generateEchoResponse(testInput, history);
  const cinematicResponse = generateCinematicResponse(testInput, history);

  return { originalResponse, cinematicResponse };
}