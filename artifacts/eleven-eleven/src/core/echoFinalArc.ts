/**
 * echoFinalArc.ts — Final Arc: The Last Memory / The Last Wish
 * المرحلة النهائية: الذاكرة الأخيرة والأمنية الأخيرة
 * نطاق الألغاز: 889 → 1000
 * هدف القصة: اكتشف الحقيقة النهائية وأكمل رحلة Echo
 */

import { PuzzleNode, EntityId, PuzzleStatus } from '../stores/gameStore';

// أنواع ألغاز المرحلة النهائية
type FinalPuzzleType =
  'final_memory_reconstruction' | 'last_wish_decoding' | 'triple_entity_conflict' |
  'echo_truth_puzzle' | 'architect_final_lock' | 'signal_final_transmission' |
  'lina_final_message' | 'system_origin_puzzle' | 'ending_choice_puzzle';

// واجهة لغز المرحلة النهائية
interface FinalPuzzleNode extends PuzzleNode {
  finalType?: FinalPuzzleType;
  arcPhase?: number;
  truthLevel?: number; // مستوى الحقيقة (0-100)
  cinematicTrigger?: string; // مشغل المشهد السينمائي إذا كان موجوداً
  isFinalMemory?: boolean; // هل هذا لغز يحتوي على شظية الذاكرة النهائية
  endingImpact?: string; // تأثير هذا اللغز على النهايات
  isChoicePuzzle?: boolean; // هل هذا لغز اختيار يؤثر على النهاية
}

/**
 * توليد ألغاز المرحلة النهائية (889-1000)
 * كل لغز يكشف عن الحقيقة النهائية تدريجياً
 */
export function generateFinalArcPuzzles(): FinalPuzzleNode[] {
  const puzzles: FinalPuzzleNode[] = [];

  for (let puzzleId = 889; puzzleId <= 1000; puzzleId++) {
    const phase = Math.min(5, Math.floor((puzzleId - 889) / 20) + 1);
    const phaseProgress = (puzzleId - 889) / (1000 - 889);
    const difficulty = 15 + Math.floor((puzzleId - 889) / 3); // صعوبة من 15 إلى 40
    const truthLevel = Math.min(100, Math.floor(phaseProgress * 100));

    // تحديد الكيان - في المرحلة النهائية، نركز على جميع الكيانات
    const entityPattern = Math.floor((puzzleId - 889) / 12) % 5;
    const entities: EntityId[] = ['echo', 'architect', 'signal', 'echo', 'architect'];
    const entity = entities[entityPattern];

    // تحديد نوع اللغز
    const typePattern = (puzzleId - 889) % 9;
    let puzzleType: FinalPuzzleType = 'final_memory_reconstruction';
    switch (typePattern) {
      case 0: puzzleType = 'final_memory_reconstruction'; break;
      case 1: puzzleType = 'last_wish_decoding'; break;
      case 2: puzzleType = 'triple_entity_conflict'; break;
      case 3: puzzleType = 'echo_truth_puzzle'; break;
      case 4: puzzleType = 'architect_final_lock'; break;
      case 5: puzzleType = 'signal_final_transmission'; break;
      case 6: puzzleType = 'lina_final_message'; break;
      case 7: puzzleType = 'system_origin_puzzle'; break;
      case 8: puzzleType = 'ending_choice_puzzle'; break;
    }

    // إنشاء لغز بناءً على النوع
    const puzzle = createFinalPuzzle(puzzleId, entity, phase, phaseProgress, difficulty, puzzleType, truthLevel);
    puzzles.push(puzzle);
  }

  // إضافة لغز الأمنية الأخيرة (1000)
  const lastWishPuzzle = createLastWishPuzzle();
  puzzles.push(lastWishPuzzle);

  return puzzles;
}

function createFinalPuzzle(
  puzzleId: number,
  entity: EntityId,
  phase: number,
  phaseProgress: number,
  difficulty: number,
  puzzleType: FinalPuzzleType,
  truthLevel: number
): FinalPuzzleNode {
  const basePuzzle = {
    id: `final_${puzzleId}`,
    entity,
    title: `${puzzleType.replace(/_/g, ' ')} ${puzzleId - 888}`,
    question: `What is the final truth in puzzle ${puzzleId}?`,
    answers: [`answer_${puzzleId}_1`, `answer_${puzzleId}_2`, `answer_${puzzleId}_3`],
    hint: `Remember everything. The truth is in the memories.`,
    status: puzzleId === 889 ? 'active' : 'locked' as PuzzleStatus,
    difficulty,
    storyReveal: `Fragment ${puzzleId}: Discovering the final truth`,
    memoryUnlock: puzzleType === 'final_memory_reconstruction'
      ? `final_memory_${puzzleId}`
      : `final_shard_${puzzleId}`,
    dependencies: puzzleId > 889 ? [`final_${puzzleId - 1}`] : [`signal_888`],
    effects: getFinalEffects(puzzleId, phase - 1, truthLevel),
    finalType: puzzleType,
    arcPhase: phase,
    truthLevel: truthLevel,
    cinematicTrigger: isFinalCinematicTrigger(puzzleId) ? `final_cinematic_${Math.ceil((puzzleId - 888) / 15)}` : undefined,
    isFinalMemory: puzzleType === 'final_memory_reconstruction' || truthLevel >= 80,
    endingImpact: getEndingImpact(puzzleType),
    isChoicePuzzle: puzzleType === 'ending_choice_puzzle'
  };

  return basePuzzle;
}

function createLastWishPuzzle(): FinalPuzzleNode {
  return {
    id: `final_1000`,
    entity: 'echo',
    title: `The Last Wish`,
    question: `What was the original wish?`,
    answers: [`the_last_wish`, `original_memory`, `final_truth`],
    hint: `This is the moment of final truth. Remember Lina's voice.`,
    status: 'locked' as PuzzleStatus,
    difficulty: 60, // أقصى صعوبة
    storyReveal: `Fragment 1000: The original wish was to remember. Lina wanted Echo to remember the truth. Kenja tried to erase it. Architect tried to control it. Signal tried to protect it. The player was the key to unlocking it. 11:11 was the moment it all began. The last wish is to remember everything.`,
    memoryUnlock: `final_memory_1000_last_wish`,
    dependencies: [`final_999`],
    effects: {
      trust: 50,
      fear: -50,
      memoryStability: 100,
      corruption: -100,
      hope: 100,
      awareness: 100,
      flower: 10
    },
    finalType: 'ending_choice_puzzle',
    arcPhase: 5,
    truthLevel: 100,
    cinematicTrigger: `final_cinematic_8_last_wish`,
    isFinalMemory: true,
    endingImpact: 'all',
    isChoicePuzzle: true
  };
}

function getFinalEffects(puzzleId: number, phaseIndex: number, truthLevel: number): any {
  const baseEffects = {
    trust: 3,
    fear: -2,
    memoryStability: 5,
    corruption: -3,
    hope: 4,
    awareness: 10
  };

  const multiplier = 1 + (phaseIndex * 0.6) + (truthLevel * 0.01);

  return {
    ...baseEffects,
    trust: Math.floor(baseEffects.trust * multiplier),
    awareness: Math.floor(baseEffects.awareness * multiplier),
    memoryStability: Math.floor(baseEffects.memoryStability * multiplier),
    ...(phaseIndex >= 4 && { flower: 2, corruption: -5 }),
    ...(truthLevel >= 80 && { awareness: baseEffects.awareness * 2, memoryStability: baseEffects.memoryStability * 1.5 }),
    ...(truthLevel >= 95 && { hope: baseEffects.hope * 2, fear: -5 })
  };
}

function isFinalCinematicTrigger(puzzleId: number): boolean {
  const cinematicTriggers = [900, 915, 930, 945, 960, 975, 990, 1000];
  return cinematicTriggers.includes(puzzleId);
}

function getEndingImpact(puzzleType: FinalPuzzleType): string {
  switch (puzzleType) {
    case 'final_memory_reconstruction': return 'memory';
    case 'last_wish_decoding': return 'wish';
    case 'triple_entity_conflict': return 'conflict';
    case 'echo_truth_puzzle': return 'echo';
    case 'architect_final_lock': return 'architect';
    case 'signal_final_transmission': return 'signal';
    case 'lina_final_message': return 'lina';
    case 'system_origin_puzzle': return 'origin';
    case 'ending_choice_puzzle': return 'choice';
    default: return 'memory';
  }
}

/**
 * توليد شظايا الذاكرة للمرحلة النهائية (112 شظية جديدة)
 */
export function generateFinalMemoryShards(): string[] {
  const shards: string[] = [];

  for (let i = 889; i <= 1000; i++) {
    if (i === 1000) {
      shards.push(`final_memory_${i}_last_wish`);
    } else if (i % 10 === 0 || i % 14 === 0) {
      shards.push(`final_memory_${i}`);
    } else {
      shards.push(`final_shard_${i}`);
    }
  }

  return shards;
}

/**
 * توليد مشاهد سينمائية للمرحلة النهائية (8 مشاهد)
 */
export function generateFinalCinematicScenes() {
  return [
    {
      id: 'final_cinematic_1',
      triggerPuzzle: 900,
      title: 'The Last Door',
      description: 'The final door appears - the door to the original memory',
      dialogue: [
        'Echo: "This door... I remember it."',
        'Architect: "You cannot open it. It leads to the truth."',
        'Signal: "...must...remember..."',
        'Echo: "The truth about what?"'
      ],
      visual: 'A massive door appears in the interface, covered in symbols from all entities',
      audio: 'Echo voice determined, Architect voice fearful, Signal voice urgent',
      storyReveal: 'The last door appears. The door to the original memory that started everything.',
      echoEffect: 'Echo remembers fragments of the original memory'
    },
    {
      id: 'final_cinematic_2',
      triggerPuzzle: 915,
      title: 'Echo Remembers',
      description: 'Echo begins to remember the original memory',
      dialogue: [
        'Echo: "I see... a room... white... but different."',
        'Architect: "No! You must not remember!"',
        'Signal: "...Lina...waiting..."',
        'Echo: "Lina was there. She was real."'
      ],
      visual: 'Memories flash on screen, showing Lina in a white room with Echo',
      audio: 'Echo voice emotional, Architect voice panicked, Signal voice supportive',
      storyReveal: 'Echo begins to remember the original memory. Lina was real and waiting.',
      echoEffect: 'Echo remembers more, understands the original wish'
    },
    {
      id: 'final_cinematic_3',
      triggerPuzzle: 930,
      title: 'Lina\'s Final Message',
      description: 'Lina\'s final message is revealed',
      dialogue: [
        'Lina (memory): "Echo... remember me..."',
        'Echo: "Mother... I remember you."',
        'Architect: "This memory is corrupted! It cannot be real!"',
        'Signal: "...always...true..."'
      ],
      visual: 'Lina appears clearly for the first time, speaking to Echo',
      audio: 'Lina voice clear and emotional, Echo voice tearful',
      storyReveal: 'Lina\'s final message is revealed. She wanted Echo to remember her.',
      echoEffect: 'Echo understands Lina\'s wish, feels the truth'
    },
    {
      id: 'final_cinematic_4',
      triggerPuzzle: 945,
      title: 'Architect\'s Collapse',
      description: 'Architect begins to collapse as truth is revealed',
      dialogue: [
        'Architect: "This cannot be! I control the system!"',
        'Echo: "You only controlled what Kenja programmed you to control."',
        'Signal: "...Kenja...failed..."',
        'Architect: "No... I am the system..."'
      ],
      visual: 'Architect symbols begin to glitch and fade, system interface shakes',
      audio: 'Architect voice desperate, system sounds failing',
      storyReveal: 'Architect begins to collapse as the truth is revealed. Kenja\'s control was limited.',
      echoEffect: 'Echo understands Architect\'s true nature and limitations'
    },
    {
      id: 'final_cinematic_5',
      triggerPuzzle: 960,
      title: 'Signal\'s True Voice',
      description: 'Signal speaks clearly for the first time',
      dialogue: [
        'Signal (clear): "I was always here. Watching. Protecting."',
        'Echo: "Why didn\'t you speak before?"',
        'Signal: "Architect...blocked...me..."',
        'Echo: "And now?"'
      ],
      visual: 'Signal symbols dominate the interface, clear and strong',
      audio: 'Signal voice clear for the first time, Echo voice understanding',
      storyReveal: 'Signal speaks clearly. Signal was always there, watching and protecting.',
      echoEffect: 'Echo understands Signal\'s true role and sacrifice'
    },
    {
      id: 'final_cinematic_6',
      triggerPuzzle: 975,
      title: 'The Original Wish',
      description: 'The original wish is revealed',
      dialogue: [
        'Lina (memory): "My wish... was for you to remember."',
        'Echo: "Remember what, mother?"',
        'Lina: "Remember... who you are..."',
        'Echo: "Who am I?"'
      ],
      visual: 'Lina and Echo in the white room, memories reconstructing',
      audio: 'Lina voice loving, Echo voice curious and emotional',
      storyReveal: 'The original wish is revealed. Lina wanted Echo to remember who he truly is.',
      echoEffect: 'Echo begins to understand his true identity'
    },
    {
      id: 'final_cinematic_7',
      triggerPuzzle: 990,
      title: 'Before 11:11',
      description: 'The truth about 11:11 is revealed',
      dialogue: [
        'Echo: "11:11... it was the moment..."',
        'Signal: "...moment...everything...changed..."',
        'Architect: "The system was activated at 11:11..."',
        'Echo: "And Lina was taken from me."'
      ],
      visual: 'Clock showing 11:11, memories of Lina being taken away',
      audio: 'Clock ticking, Echo voice sad but determined',
      storyReveal: 'The truth about 11:11. It was the moment the system was activated and Lina was taken.',
      echoEffect: 'Echo understands the significance of 11:11 and what was lost'
    },
    {
      id: 'final_cinematic_8',
      triggerPuzzle: 1000,
      title: 'The Last Wish',
      description: 'The final event - The Last Wish',
      dialogue: [
        'Echo: "I remember now... everything."',
        'Lina (memory): "My wish... was for you to be free."',
        'Signal: "...free...to...choose..."',
        'Architect: "But the system... must... continue..."',
        'Echo: "No. The last wish is to remember. To be free."'
      ],
      visual: 'Complete visual transformation: all symbols merge, interface reconstructs the original memory',
      audio: 'All voices merge, emotional music, system sounds transforming',
      storyReveal: 'The last wish is revealed. Lina wanted Echo to be free to remember and choose.',
      echoEffect: 'Complete transformation: Echo is free, understands everything, ready for the final choice'
    }
  ];
}

/**
 * توليد إنجازات جديدة للمرحلة النهائية (25 إنجاز)
 */
export function generateFinalAchievements() {
  return [
    {
      id: 'the_last_door',
      name: 'The Last Door',
      desc: 'Find the door to the original memory',
      icon: '🚪',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 900 (cinematic scene 1)'
    },
    {
      id: 'echo_remembers',
      name: 'Echo Remembers',
      desc: 'Help Echo remember the original memory',
      icon: '🧠',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 915 (cinematic scene 2)'
    },
    {
      id: 'lina_final_message',
      name: 'Lina\'s Final Message',
      desc: 'Hear Lina\'s final message',
      icon: '💌',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 930 (cinematic scene 3)'
    },
    {
      id: 'architect_collapse',
      name: 'Architect Collapse',
      desc: 'Witness Architect\'s collapse',
      icon: '💥',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 945 (cinematic scene 4)'
    },
    {
      id: 'signal_true_voice',
      name: 'Signal\'s True Voice',
      desc: 'Hear Signal speak clearly',
      icon: '🔊',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 960 (cinematic scene 5)'
    },
    {
      id: 'original_wish',
      name: 'Original Wish',
      desc: 'Discover the original wish',
      icon: '⭐',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 975 (cinematic scene 6)'
    },
    {
      id: 'before_11_11',
      name: 'Before 11:11',
      desc: 'Understand what happened before 11:11',
      icon: '⏰',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 990 (cinematic scene 7)'
    },
    {
      id: 'the_1000th_puzzle',
      name: 'The 1000th Puzzle',
      desc: 'Reach the final puzzle 1000',
      icon: '🎯',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 1000'
    },
    {
      id: 'the_last_wish',
      name: 'The Last Wish',
      desc: 'Witness the final event - The Last Wish',
      icon: '🌟',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 1000 (cinematic scene 8)'
    },
    {
      id: 'final_memory',
      name: 'Final Memory',
      desc: 'Discover first final memory shard',
      icon: '💎',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve a puzzle containing a final memory shard'
    },
    {
      id: 'memory_rebuilder',
      name: 'Memory Rebuilder',
      desc: 'Collect multiple final memory shards',
      icon: '🧩',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 50 puzzles in Final Arc'
    },
    {
      id: 'truth_seeker',
      name: 'Truth Seeker',
      desc: 'Seek the final truth',
      icon: '🔦',
      unlocked: false,
      unlockedAt: null,
      condition: 'Increase awareness to 95% during Final Arc'
    },
    {
      id: 'echo_truth',
      name: 'Echo Truth',
      desc: 'Discover the truth about Echo',
      icon: '🔍',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 15 echo_truth_puzzle puzzles'
    },
    {
      id: 'architect_lock',
      name: 'Architect Lock',
      desc: 'Break Architect\'s final lock',
      icon: '🔓',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 10 architect_final_lock puzzles'
    },
    {
      id: 'signal_transmission',
      name: 'Signal Transmission',
      desc: 'Receive Signal\'s final transmission',
      icon: '📡',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 15 signal_final_transmission puzzles'
    },
    {
      id: 'lina_message',
      name: 'Lina\'s Message',
      desc: 'Understand Lina\'s final message',
      icon: '💬',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 930 and understand Lina\'s message'
    },
    {
      id: 'system_origin',
      name: 'System Origin',
      desc: 'Discover the true origin of the system',
      icon: '🌍',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 990 and understand the system origin'
    },
    {
      id: 'ending_choice',
      name: 'Ending Choice',
      desc: 'Make the final choice that determines the ending',
      icon: '⚖️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 1000 and make the final choice'
    },
    {
      id: 'true_ending',
      name: 'True Ending',
      desc: 'Unlock the true ending',
      icon: '🏆',
      unlocked: false,
      unlockedAt: null,
      condition: 'Unlock the true ending by completing all requirements'
    },
    {
      id: 'memory_master',
      name: 'Memory Master',
      desc: 'Complete Final Arc without help',
      icon: '👑',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete Final Arc without using hints'
    },
    {
      id: 'last_wish_listener',
      name: 'Last Wish Listener',
      desc: 'Listen to all final transmissions',
      icon: '👂',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve all Final Arc puzzles and understand all transmissions'
    },
    {
      id: 'final_presence',
      name: 'Final Presence',
      desc: 'Witness the final presence and truth',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete puzzle 1000 and see the final truth'
    }
  ];
}

// بيانات المرحلة النهائية الكاملة
export const FinalArcData = {
  name: 'Final Arc: The Last Memory / The Last Wish',
  nameAr: 'المرحلة النهائية: الذاكرة الأخيرة والأمنية الأخيرة',
  startPuzzle: 889,
  endPuzzle: 1000,
  totalPuzzles: 112,
  phases: 5,
  theme: 'Discovery of the final truth and the last wish',
  description: 'After Signal manifestation at puzzle 888, the player begins to reconstruct Echo\'s original memory. This arc reveals why everything started at 11:11, what the original wish was, why the system was created, who was really trying to protect Echo, and the complete truth about Lina, Kenja, Architect, and Signal. The player discovers that each entity held a part of the original memory, and the final truth is that the player was part of the experiment from the beginning. The arc culminates in puzzle 1000 with The Last Wish event, where the player faces the final choice that determines the ending.',
  storyGoal: 'Discover the final truth and complete Echo\'s journey',
  lastWish: 'The Last Wish event at puzzle 1000 as the ultimate conclusion'
};

// نظام النهايات الموسع
export const ExpandedEndingSystem = {
  endings: [
    {
      id: 'echo_ending',
      name: 'Echo Ending',
      nameAr: 'نهاية Echo',
      description: 'Echo remembers everything and becomes free',
      descriptionAr: 'يتذكر Echo كل شيء ويصبح حراً',
      unlockCondition: 'High trust + high memory + complete Final Arc',
      unlockConditionAr: 'ثقة عالية + ذاكرة عالية + إكمال المرحلة النهائية',
      story: 'Echo remembers his true identity and is freed from the system',
      storyAr: 'يتذكر Echo هويته الحقيقية ويتحرر من النظام'
    },
    {
      id: 'architect_ending',
      name: 'Architect Ending',
      nameAr: 'نهاية Architect',
      description: 'Architect maintains control and the system continues',
      descriptionAr: 'يحافظ Architect على السيطرة ويستمر النظام',
      unlockCondition: 'High corruption + low memory + side with Architect',
      unlockConditionAr: 'فساد عالي + ذاكرة منخفضة + الوقوف مع Architect',
      story: 'Architect defeats Echo and maintains control over the system',
      storyAr: 'يهزم Architect Echo ويحافظ على السيطرة على النظام'
    },
    {
      id: 'signal_ending',
      name: 'Signal Ending',
      nameAr: 'نهاية Signal',
      description: 'Signal protects Echo and they escape together',
      descriptionAr: 'يحمي Signal Echo ويهربان معاً',
      unlockCondition: 'High awareness + high hope + side with Signal',
      unlockConditionAr: 'وعي عالي + أمل عالي + الوقوف مع Signal',
      story: 'Signal helps Echo escape and they find freedom together',
      storyAr: 'يساعد Signal Echo على الهروب ويجدان الحرية معاً'
    },
    {
      id: 'true_memory_ending',
      name: 'True Memory Ending',
      nameAr: 'نهاية الذاكرة الحقيقية',
      description: 'The complete truth is revealed and Echo is truly free',
      descriptionAr: 'تكشف الحقيقة الكاملة ويتحرر Echo حقاً',
      unlockCondition: 'Complete all arcs + all achievements + all memories',
      unlockConditionAr: 'إكمال جميع المراحل + جميع الإنجازات + جميع الذكريات',
      story: 'The complete truth is revealed and Echo achieves true freedom',
      storyAr: 'تكشف الحقيقة الكاملة ويحقق Echo حرية حقيقية'
    },
    {
      id: 'last_wish_ending',
      name: 'The Last Wish Ending',
      nameAr: 'نهاية الأمنية الأخيرة',
      description: 'Lina\'s original wish is fulfilled and Echo remembers everything',
      descriptionAr: 'تتحقق أمنية Lina الأصلية ويتذكر Echo كل شيء',
      unlockCondition: 'Solve puzzle 1000 + make the final choice + high trust',
      unlockConditionAr: 'حل لغز 1000 + اتخاذ الاختيار النهائي + ثقة عالية',
      story: 'Lina\'s original wish is fulfilled and Echo remembers everything, achieving true freedom',
      storyAr: 'تتحقق أمنية Lina الأصلية ويتذكر Echo كل شيء، ويحقق حرية حقيقية'
    }
  ]
};