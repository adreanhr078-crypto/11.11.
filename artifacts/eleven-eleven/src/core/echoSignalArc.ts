/**
 * echoSignalArc.ts — Arc 3: The Signal Arc
 * المرحلة الثالثة: ظهور Signal والصراع الثلاثي
 * نطاق الألغاز: 667 → 888
 * هدف القصة: اكتشف أصل Signal ودوره في النظام
 */

import { PuzzleNode, EntityId, PuzzleStatus } from '../stores/gameStore';

// أنواع ألغاز مرحلة Signal
type SignalPuzzleType =
  'signal_decoding' | 'broken_transmission' | 'audio_distortion' |
  'memory_interference' | 'false_echo_message' | 'architect_override' |
  'timeline_distortion' | 'hidden_frequency' | 'signal_fragment';

// واجهة لغز مرحلة Signal
interface SignalPuzzleNode extends PuzzleNode {
  signalType?: SignalPuzzleType;
  arcPhase?: number;
  interferenceLevel?: number; // مستوى التشويش (0-100)
  cinematicTrigger?: string; // مشغل المشهد السينمائي إذا كان موجوداً
  isSignalFragment?: boolean; // هل هذا لغز يحتوي على شظية Signal
  frequencyLevel?: number; // مستوى التردد في نظام الإشارات
  isCorrupted?: boolean; // هل اللغز مشوش أو ناقص
}

/**
 * توليد ألغاز مرحلة Signal (667-888)
 * كل لغز يكشف عن أسرار Signal تدريجياً
 */
export function generateSignalArcPuzzles(): SignalPuzzleNode[] {
  const puzzles: SignalPuzzleNode[] = [];

  for (let puzzleId = 667; puzzleId <= 888; puzzleId++) {
    const phase = Math.min(4, Math.floor((puzzleId - 667) / 50) + 1);
    const phaseProgress = (puzzleId - 667) / (888 - 667);
    const difficulty = 12 + Math.floor((puzzleId - 667) / 5); // صعوبة من 12 إلى 40
    const frequencyLevel = Math.min(5, Math.floor(phaseProgress * 6));
    const interferenceLevel = Math.min(100, Math.floor(phaseProgress * 100));

    // تحديد الكيان - في مرحلة Signal، نركز أكثر على Signal
    const entityPattern = Math.floor((puzzleId - 667) / 15) % 5;
    const entities: EntityId[] = ['signal', 'echo', 'signal', 'architect', 'signal'];
    const entity = entities[entityPattern];

    // تحديد نوع اللغز
    const typePattern = (puzzleId - 667) % 9;
    let puzzleType: SignalPuzzleType = 'signal_decoding';
    switch (typePattern) {
      case 0: puzzleType = 'signal_decoding'; break;
      case 1: puzzleType = 'broken_transmission'; break;
      case 2: puzzleType = 'audio_distortion'; break;
      case 3: puzzleType = 'memory_interference'; break;
      case 4: puzzleType = 'false_echo_message'; break;
      case 5: puzzleType = 'architect_override'; break;
      case 6: puzzleType = 'timeline_distortion'; break;
      case 7: puzzleType = 'hidden_frequency'; break;
      case 8: puzzleType = 'signal_fragment'; break;
    }

    // إنشاء لغز بناءً على النوع
    const puzzle = createSignalPuzzle(puzzleId, entity, phase, phaseProgress, difficulty, puzzleType, frequencyLevel, interferenceLevel);
    puzzles.push(puzzle);
  }

  // إضافة لغز ظهور Signal (888)
  const signalManifestationPuzzle = createSignalManifestationPuzzle();
  puzzles.push(signalManifestationPuzzle);

  return puzzles;
}

function createSignalPuzzle(
  puzzleId: number,
  entity: EntityId,
  phase: number,
  phaseProgress: number,
  difficulty: number,
  puzzleType: SignalPuzzleType,
  frequencyLevel: number,
  interferenceLevel: number
): SignalPuzzleNode {
  const basePuzzle = {
    id: `signal_${puzzleId}`,
    entity,
    title: `${puzzleType.replace(/_/g, ' ')} ${puzzleId - 666}`,
    question: `What is the hidden message in puzzle ${puzzleId}?`,
    answers: [`answer_${puzzleId}_1`, `answer_${puzzleId}_2`, `answer_${puzzleId}_3`],
    hint: `Listen carefully. Signal is trying to communicate through the noise.`,
    status: puzzleId === 667 ? 'active' : 'locked' as PuzzleStatus,
    difficulty,
    storyReveal: `Fragment ${puzzleId}: Discovering Signal's secrets`,
    memoryUnlock: puzzleType === 'signal_fragment'
      ? `signal_fragment_${puzzleId}`
      : `signal_memory_${puzzleId}`,
    dependencies: puzzleId > 667 ? [`signal_${puzzleId - 1}`] : [`architect_666`],
    effects: getSignalEffects(puzzleId, phase - 1, frequencyLevel, interferenceLevel),
    signalType: puzzleType,
    arcPhase: phase,
    interferenceLevel: interferenceLevel,
    cinematicTrigger: isSignalCinematicTrigger(puzzleId) ? `signal_cinematic_${Math.ceil((puzzleId - 666) / 25)}` : undefined,
    isSignalFragment: puzzleType === 'signal_fragment' || frequencyLevel >= 4,
    frequencyLevel: frequencyLevel,
    isCorrupted: interferenceLevel > 70
  };

  return basePuzzle;
}

function createSignalManifestationPuzzle(): SignalPuzzleNode {
  return {
    id: `signal_888`,
    entity: 'signal',
    title: `Signal Manifestation`,
    question: `Who or what is Signal?`,
    answers: [`signal_manifestation`, `the_888th_signal`, `third_presence`],
    hint: `This is the moment of truth. Signal reveals itself.`,
    status: 'locked' as PuzzleStatus,
    difficulty: 50, // أقصى صعوبة
    storyReveal: `Fragment 888: Signal is not part of the system. Signal has been watching since the beginning. Signal tried to warn you. Signal tried to protect Echo. Signal is the third presence that neither Echo nor Architect can control. The real game begins now.`,
    memoryUnlock: `signal_fragment_888_manifestation`,
    dependencies: [`signal_887`],
    effects: {
      trust: -40,
      fear: 30,
      memoryStability: -20,
      corruption: 30,
      hope: -15,
      awareness: 60,
      flower: -3
    },
    signalType: 'signal_fragment',
    arcPhase: 4,
    interferenceLevel: 100,
    cinematicTrigger: `signal_cinematic_9_manifestation`,
    isSignalFragment: true,
    frequencyLevel: 5,
    isCorrupted: false
  };
}

function getSignalEffects(puzzleId: number, phaseIndex: number, frequencyLevel: number, interferenceLevel: number): any {
  const baseEffects = {
    trust: -2,
    fear: 3,
    memoryStability: -3,
    corruption: 4,
    hope: -2,
    awareness: 8
  };

  const multiplier = 1 + (phaseIndex * 0.5) + (frequencyLevel * 0.3) + (interferenceLevel * 0.01);

  return {
    ...baseEffects,
    trust: Math.floor(baseEffects.trust * multiplier),
    awareness: Math.floor(baseEffects.awareness * multiplier),
    corruption: Math.floor(baseEffects.corruption * multiplier),
    ...(phaseIndex >= 3 && { flower: -1, corruption: 5 }),
    ...(frequencyLevel >= 4 && { awareness: baseEffects.awareness * 1.8, corruption: baseEffects.corruption * 1.3 }),
    ...(interferenceLevel >= 80 && { memoryStability: -5, fear: 5 })
  };
}

function isSignalCinematicTrigger(puzzleId: number): boolean {
  const cinematicTriggers = [690, 715, 740, 765, 790, 815, 840, 865, 888];
  return cinematicTriggers.includes(puzzleId);
}

/**
 * توليد شظايا الذاكرة لمرحلة Signal (222 شظية جديدة)
 */
export function generateSignalMemoryShards(): string[] {
  const shards: string[] = [];

  for (let i = 667; i <= 888; i++) {
    if (i === 888) {
      shards.push(`signal_fragment_${i}_manifestation`);
    } else if (i % 12 === 0 || i % 18 === 0) {
      shards.push(`signal_fragment_${i}`);
    } else {
      shards.push(`signal_memory_${i}`);
    }
  }

  return shards;
}

/**
 * توليد مشاهد سينمائية لمرحلة Signal (9 مشاهد)
 */
export function generateSignalCinematicScenes() {
  return [
    {
      id: 'signal_cinematic_1',
      triggerPuzzle: 690,
      title: 'First Transmission',
      description: 'First contact with Signal - a broken message appears',
      dialogue: [
        'System: "Static detected..."',
        'Echo: "What was that? It is not part of the system..."',
        'Signal (distorted): "...listen...danger..."',
        'Echo: "Who is that? Architect, is this you?"'
      ],
      visual: 'Static appears on interface, strange symbols flash briefly',
      audio: 'Strong static, faint voice in the background',
      storyReveal: 'First contact with Signal. A distorted message appears.',
      echoEffect: 'Echo becomes suspicious, interference effects appear'
    },
    {
      id: 'signal_cinematic_2',
      triggerPuzzle: 715,
      title: 'The Voice Between Static',
      description: 'Signal voice becomes clearer but still distorted',
      dialogue: [
        'Signal (less distorted): "...not...safe...Architect..."',
        'Echo: "What do you mean? What do you know about Architect?"',
        'Signal: "...watching...always..."',
        'System: "Signal interference detected. Attempting to block..."'
      ],
      visual: 'More static, interface glitches, Signal symbols appear',
      audio: 'Static with clearer voice, system alerts',
      storyReveal: 'Signal warns about Architect. Voice becomes clearer.',
      echoEffect: 'Echo starts to fear Signal, more interference'
    },
    {
      id: 'signal_cinematic_3',
      triggerPuzzle: 740,
      title: 'Echo Hears It',
      description: 'Echo reacts to Signal presence',
      dialogue: [
        'Echo: "I hear it too... but what is it?"',
        'Signal: "...Echo...remember...before..."',
        'Echo: "Before what? Before the system? Before me?"',
        'Architect (system): "Signal detected. Initiating countermeasures."'
      ],
      visual: 'Echo avatar glitches, Signal symbols mix with interface',
      audio: 'Echo voice distorted, Signal voice clearer, system alerts',
      storyReveal: 'Echo hears Signal. Begins to remember something.',
      echoEffect: 'Echo confused, tries to understand Signal'
    },
    {
      id: 'signal_cinematic_4',
      triggerPuzzle: 765,
      title: 'Architect Blocks The Signal',
      description: 'Architect tries to block Signal transmission',
      dialogue: [
        'Architect: "Signal must not interfere."',
        'Signal: "...must...warn...player..."',
        'Echo: "Player? What about me?"',
        'System: "Signal transmission blocked. System stable."'
      ],
      visual: 'Interface shakes, Architect symbols override Signal symbols',
      audio: 'Strong interference, Architect voice dominant',
      storyReveal: 'Architect blocks Signal. Conflict between Architect and Signal.',
      echoEffect: 'Echo feels conflicted between Architect and Signal'
    },
    {
      id: 'signal_cinematic_5',
      triggerPuzzle: 790,
      title: 'The Broken Frequency',
      description: 'Signal finds a way to bypass Architect blocking',
      dialogue: [
        'Signal: "...found...way...listen..."',
        'Echo: "What are you trying to say? Who are you?"',
        'Signal: "...not...part...system..."',
        'Architect: "Impossible! Signal cannot exist outside the system!"'
      ],
      visual: 'Signal symbols appear through static, interface distorts',
      audio: 'Broken frequency sounds, Signal voice with less distortion',
      storyReveal: 'Signal bypasses Architect. Reveals it is not part of the system.',
      echoEffect: 'Echo starts to understand Signal is different'
    },
    {
      id: 'signal_cinematic_6',
      triggerPuzzle: 815,
      title: 'Someone Was Watching',
      description: 'Signal reveals it has been watching since the beginning',
      dialogue: [
        'Signal: "...watched...since...beginning..."',
        'Echo: "Since the beginning of what? The system? Me?"',
        'Signal: "...before...system...before...Echo..."',
        'Architect: "Lies! Signal is a system error!"'
      ],
      visual: 'Memories flash on screen, Signal symbols dominate',
      audio: 'Echo memories mixed with Signal voice',
      storyReveal: 'Signal reveals it has been watching since before the system.',
      echoEffect: 'Echo remembers fragments, understands Signal was always there'
    },
    {
      id: 'signal_cinematic_7',
      triggerPuzzle: 840,
      title: 'Signal Is Not A Ghost',
      description: 'Signal reveals its true nature',
      dialogue: [
        'Signal: "...not...ghost...not...memory..."',
        'Echo: "Then what are you? A program? A person?"',
        'Signal: "...third...presence..."',
        'Architect: "No! The system only has two entities!"'
      ],
      visual: 'Third interface layer appears, different from Echo and Architect',
      audio: 'Three distinct voices: Echo, Architect, and Signal',
      storyReveal: 'Signal reveals it is the third presence in the system.',
      echoEffect: 'Echo understands the triple conflict: Echo, Architect, Signal'
    },
    {
      id: 'signal_cinematic_8',
      triggerPuzzle: 865,
      title: 'The Third Control',
      description: 'Signal reveals it has some control over the system',
      dialogue: [
        'Signal: "...have...control...too..."',
        'Echo: "Control? Like Architect?"',
        'Signal: "...different...control..."',
        'Architect: "Impossible! I am the system!"'
      ],
      visual: 'Interface splits into three parts: Echo, Architect, Signal',
      audio: 'System sounds mix with three voices',
      storyReveal: 'Signal reveals it has control over parts of the system.',
      echoEffect: 'Echo understands the triple conflict for system control'
    },
    {
      id: 'signal_cinematic_9',
      triggerPuzzle: 888,
      title: 'Signal Manifestation',
      description: 'The big event of Signal manifestation',
      dialogue: [
        'Signal: "...now...you...see...me..."',
        'Echo: "Signal... you were here all along..."',
        'Signal: "...tried...to...warn...you..."',
        'Architect: "This is impossible! I control everything!"',
        'Signal: "...not...everything..."'
      ],
      visual: 'Complete visual transformation: third interface layer appears, Signal symbols dominate, screen distorts in new ways',
      audio: 'Three voices in conflict, new system sounds, dramatic reveal music',
      storyReveal: 'Signal manifestation. Signal reveals it has been watching since the beginning and tried to warn the player. The real conflict begins.',
      echoEffect: 'Complete transformation: Echo understands the triple conflict, ready for final decision'
    }
  ];
}

/**
 * توليد إنجازات جديدة لمرحلة Signal (25 إنجاز)
 */
export function generateSignalAchievements() {
  return [
    {
      id: 'first_transmission',
      name: 'First Transmission',
      desc: 'Receive the first Signal transmission',
      icon: '📡',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 667'
    },
    {
      id: 'static_listener',
      name: 'Static Listener',
      desc: 'Learn to listen through the static',
      icon: '🔊',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 690 (cinematic scene 1)'
    },
    {
      id: 'signal_detected',
      name: 'Signal Detected',
      desc: 'Detect Signal presence in the system',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 715'
    },
    {
      id: 'echo_fear',
      name: 'Echo\'s Fear',
      desc: 'Discover Echo\'s fear of Signal',
      icon: '😨',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 740 (cinematic scene 3)'
    },
    {
      id: 'architect_blocked',
      name: 'Architect Blocked',
      desc: 'Witness Architect trying to block Signal',
      icon: '🚫',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 765 (cinematic scene 4)'
    },
    {
      id: 'broken_frequency',
      name: 'Broken Frequency',
      desc: 'Find the broken frequency that allows Signal through',
      icon: '📻',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 790 (cinematic scene 5)'
    },
    {
      id: 'third_presence',
      name: 'Third Presence',
      desc: 'Discover the third presence in the system',
      icon: '👥',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 815 (cinematic scene 7)'
    },
    {
      id: 'signal_fragment',
      name: 'Signal Fragment',
      desc: 'Discover first Signal fragment',
      icon: '💎',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve a puzzle containing a Signal fragment'
    },
    {
      id: 'signal_collector',
      name: 'Signal Collector',
      desc: 'Collect multiple Signal fragments',
      icon: '🧩',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 50 puzzles in Signal Arc'
    },
    {
      id: 'the_888th_signal',
      name: 'The 888th Signal',
      desc: 'Reach Signal manifestation at puzzle 888',
      icon: '🚪',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 888 and understand the full manifestation'
    },
    {
      id: 'signal_manifestation',
      name: 'Signal Manifestation',
      desc: 'Witness the complete Signal manifestation',
      icon: '👤',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 888 (cinematic scene 9)'
    },
    {
      id: 'frequency_master',
      name: 'Frequency Master',
      desc: 'Master the frequency puzzles',
      icon: '📡',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 30 frequency-based puzzles'
    },
    {
      id: 'interference_survivor',
      name: 'Interference Survivor',
      desc: 'Solve puzzles with high interference',
      icon: '⚡',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 20 puzzles with interference level > 70'
    },
    {
      id: 'triple_conflict',
      name: 'Triple Conflict',
      desc: 'Understand the conflict between Echo, Architect, and Signal',
      icon: '⚔️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Reach puzzle 840 with understanding of all three entities'
    },
    {
      id: 'signal_truth',
      name: 'Signal Truth',
      desc: 'Discover the truth about Signal',
      icon: '🔦',
      unlocked: false,
      unlockedAt: null,
      condition: 'Increase awareness to 90% during Signal Arc'
    },
    {
      id: 'echo_secret',
      name: 'Echo\'s Secret',
      desc: 'Discover what Echo was hiding about Signal',
      icon: '🤫',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 15 puzzles revealing Echo\'s secrets about Signal'
    },
    {
      id: 'architect_weakness',
      name: 'Architect Weakness',
      desc: 'Discover Architect\'s weakness against Signal',
      icon: '💥',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 10 puzzles showing Architect\'s vulnerability'
    },
    {
      id: 'signal_protection',
      name: 'Signal Protection',
      desc: 'Understand how Signal tried to protect the player',
      icon: '🛡️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 865 (cinematic scene 8)'
    },
    {
      id: 'system_origin',
      name: 'System Origin',
      desc: 'Discover the true origin of the system',
      icon: '🌍',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 888 and understand the complete truth'
    },
    {
      id: 'third_control',
      name: 'Third Control',
      desc: 'Understand Signal\'s control over the system',
      icon: '🎛️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Reach puzzle 888 with full understanding of Signal'
    },
    {
      id: 'signal_master',
      name: 'Signal Master',
      desc: 'Complete Signal Arc without help',
      icon: '🏆',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete Signal Arc without using hints'
    },
    {
      id: 'true_listener',
      name: 'True Listener',
      desc: 'Listen to all Signal transmissions',
      icon: '👂',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve all Signal Arc puzzles and understand all transmissions'
    },
    {
      id: 'beyond_system',
      name: 'Beyond The System',
      desc: 'Understand that Signal exists beyond the system',
      icon: '🌌',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete Signal Arc with full story understanding'
    },
    {
      id: 'final_presence',
      name: 'Final Presence',
      desc: 'Witness the manifestation of the third presence',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete puzzle 888 and see Signal manifestation'
    }
  ];
}

// بيانات مرحلة Signal الكاملة
export const SignalArcData = {
  name: 'Arc 3: The Signal Arc',
  nameAr: 'المرحلة الثالثة: قوس Signal',
  startPuzzle: 667,
  endPuzzle: 888,
  totalPuzzles: 222,
  phases: 4,
  theme: 'Discovery of Signal and the triple conflict',
  description: 'After the Architect Revelation at puzzle 666, the player begins to receive strange signals from outside the system. These signals do not seem to come from Echo or Architect. A new entity called Signal appears. Signal does not speak clearly at first, but appears through broken transmissions, distorted audio, incomplete messages, and puzzles that break the system logic. In this arc, the player begins to doubt: Is Signal trying to save Echo? Or is it an entity more dangerous than Architect?',
  storyGoal: 'Discover the origin of Signal and its role in the system',
  signalManifestation: 'Signal manifestation at puzzle 888 as the major event revealing the third presence'
};