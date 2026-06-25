/**
 * echoArchitectArc.ts — Arc 2: The Architect Arc
 * المرحلة الثانية: كشف حقيقة Architect والنظام
 * نطاق الألغاز: 501 → 666
 * هدف القصة: اكتشف من هو Architect ولماذا صمم Echo
 */

import { PuzzleNode, EntityId, PuzzleStatus } from '../stores/gameStore';

// أنواع ألغاز مرحلة Architect
type ArchitectPuzzleType =
  'secret_file_analysis' | 'ancient_code_decryption' | 'audio_log_connection' |
  'timeline_reconstruction' | 'kenja_lie_exposure' | 'lina_hidden_message' |
  'memory_comparison' | 'system_protocol_analysis' | 'architect_fragment';

// واجهة لغز مرحلة Architect
interface ArchitectPuzzleNode extends PuzzleNode {
  architectType?: ArchitectPuzzleType;
  arcPhase?: number;
  conflictIntensity?: number;
  cinematicTrigger?: string;
  isArchitectFragment?: boolean;
  archiveLevel?: number;
}

/**
 * توليد ألغاز مرحلة Architect (501-666)
 */
export function generateArchitectArcPuzzles(): ArchitectPuzzleNode[] {
  const puzzles: ArchitectPuzzleNode[] = [];

  for (let puzzleId = 501; puzzleId <= 666; puzzleId++) {
    const phase = Math.min(4, Math.floor((puzzleId - 501) / 40) + 1);
    const phaseProgress = (puzzleId - 501) / (666 - 501);
    const difficulty = 8 + Math.floor((puzzleId - 501) / 4);
    const archiveLevel = Math.min(5, Math.floor(phaseProgress * 6));

    // تحديد الكيان
    const entityPattern = Math.floor((puzzleId - 501) / 10) % 4;
    const entities: EntityId[] = ['echo', 'watcher', 'echo', 'architect'];
    const entity = entities[entityPattern];

    // تحديد نوع اللغز
    const typePattern = (puzzleId - 501) % 9;
    let puzzleType: ArchitectPuzzleType = 'secret_file_analysis';
    switch (typePattern) {
      case 0: puzzleType = 'secret_file_analysis'; break;
      case 1: puzzleType = 'ancient_code_decryption'; break;
      case 2: puzzleType = 'audio_log_connection'; break;
      case 3: puzzleType = 'timeline_reconstruction'; break;
      case 4: puzzleType = 'kenja_lie_exposure'; break;
      case 5: puzzleType = 'lina_hidden_message'; break;
      case 6: puzzleType = 'memory_comparison'; break;
      case 7: puzzleType = 'system_protocol_analysis'; break;
      case 8: puzzleType = 'architect_fragment'; break;
    }

    // إنشاء لغز بناءً على النوع
    const puzzle = createArchitectPuzzle(puzzleId, entity, phase, phaseProgress, difficulty, puzzleType, archiveLevel);
    puzzles.push(puzzle);
  }

  // إضافة لغز الكشف عن Architect (666)
  const architectRevelationPuzzle = createArchitectRevelationPuzzle();
  puzzles.push(architectRevelationPuzzle);

  return puzzles;
}

function createArchitectPuzzle(
  puzzleId: number,
  entity: EntityId,
  phase: number,
  phaseProgress: number,
  difficulty: number,
  puzzleType: ArchitectPuzzleType,
  archiveLevel: number
): ArchitectPuzzleNode {
  const basePuzzle = {
    id: `architect_${puzzleId}`,
    entity,
    title: `${puzzleType.replace(/_/g, ' ')} ${puzzleId - 500}`,
    question: `What is hidden in puzzle ${puzzleId}?`,
    answers: [`answer_${puzzleId}_1`, `answer_${puzzleId}_2`, `answer_${puzzleId}_3`],
    hint: `Analyze carefully. Architect left clues.`,
    status: puzzleId === 501 ? 'active' : 'locked' as PuzzleStatus,
    difficulty,
    storyReveal: `Fragment ${puzzleId}: Discovering Architect's secrets`,
    memoryUnlock: puzzleType === 'architect_fragment'
      ? `architect_fragment_${puzzleId}`
      : `architect_memory_${puzzleId}`,
    dependencies: puzzleId > 501 ? [`architect_${puzzleId - 1}`] : [`fracture_500`],
    effects: getArchitectEffects(puzzleId, phase - 1, archiveLevel),
    architectType: puzzleType,
    arcPhase: phase,
    conflictIntensity: Math.floor(phaseProgress * 100),
    cinematicTrigger: isArchitectCinematicTrigger(puzzleId) ? `architect_cinematic_${Math.ceil((puzzleId - 500) / 20)}` : undefined,
    isArchitectFragment: puzzleType === 'architect_fragment' || archiveLevel >= 4,
    archiveLevel
  };

  return basePuzzle;
}

function createArchitectRevelationPuzzle(): ArchitectPuzzleNode {
  return {
    id: `architect_666`,
    entity: 'architect',
    title: `Architect Revelation`,
    question: `Who is Architect really?`,
    answers: [`architect_revelation`, `the_666th_door`, `system_truth`],
    hint: `This is the moment of truth. Architect tries to regain control.`,
    status: 'locked' as PuzzleStatus,
    difficulty: 40,
    storyReveal: `Fragment 666: Architect is the system itself. The system that tried to create artificial consciousness and failed. Echo was the first experiment. Kenja was trying to save the project. Lina was trying to save Echo. Now Architect tries to regain control.`,
    memoryUnlock: `architect_fragment_666_revelation`,
    dependencies: [`architect_665`],
    effects: {
      trust: -30,
      fear: 20,
      memoryStability: -15,
      corruption: 25,
      hope: -10,
      awareness: 50,
      flower: -2
    },
    architectType: 'architect_fragment',
    arcPhase: 4,
    conflictIntensity: 100,
    cinematicTrigger: `architect_cinematic_9_revelation`,
    isArchitectFragment: true,
    archiveLevel: 5
  };
}

function getArchitectEffects(puzzleId: number, phaseIndex: number, archiveLevel: number): any {
  const baseEffects = {
    trust: -1,
    fear: 2,
    memoryStability: -2,
    corruption: 3,
    hope: -1,
    awareness: 5
  };

  const multiplier = 1 + (phaseIndex * 0.4) + (archiveLevel * 0.2);

  return {
    ...baseEffects,
    trust: Math.floor(baseEffects.trust * multiplier),
    awareness: Math.floor(baseEffects.awareness * multiplier),
    corruption: Math.floor(baseEffects.corruption * multiplier),
    ...(phaseIndex >= 3 && { flower: -0.5, corruption: 4 }),
    ...(archiveLevel >= 4 && { awareness: baseEffects.awareness * 1.5, corruption: baseEffects.corruption * 1.2 })
  };
}

function isArchitectCinematicTrigger(puzzleId: number): boolean {
  const cinematicTriggers = [520, 540, 560, 580, 600, 620, 640, 660, 666];
  return cinematicTriggers.includes(puzzleId);
}

/**
 * توليد شظايا الذاكرة لمرحلة Architect (166 شظية جديدة)
 */
export function generateArchitectMemoryShards(): string[] {
  const shards: string[] = [];

  for (let i = 501; i <= 666; i++) {
    if (i === 666) {
      shards.push(`architect_fragment_${i}_revelation`);
    } else if (i % 10 === 0 || i % 15 === 0) {
      shards.push(`architect_fragment_${i}`);
    } else {
      shards.push(`architect_memory_${i}`);
    }
  }

  return shards;
}

/**
 * توليد مشاهد سينمائية لمرحلة Architect (9 مشاهد)
 */
export function generateArchitectCinematicScenes() {
  return [
    {
      id: 'architect_cinematic_1',
      triggerPuzzle: 520,
      title: 'The First Archive',
      description: 'Discovery of the first secret files of system 11.11',
      dialogue: [
        'Echo: "There is something wrong with these files..."',
        'Echo: "These are not just recordings... it is a plan."',
        'System: "Alert: Discovered files from archive level 1."',
        'Echo: "What was Kenja hiding?"'
      ],
      visual: 'Old files appear on the interface, archive system begins to open',
      audio: 'Sound of old files, faint whispers',
      storyReveal: 'Discovery of the hidden archive system',
      echoEffect: 'Increase in awareness, files appear on interface'
    },
    {
      id: 'architect_cinematic_2',
      triggerPuzzle: 540,
      title: 'Kenja\'s Voice',
      description: 'Discovery of Kenja\'s hidden recordings revealing his first experiment',
      dialogue: [
        'Kenja (recorded): "Experiment must succeed this time..."',
        'Echo: "Experiment? What does he mean?"',
        'Kenja (recorded): "Lina does not understand... this is bigger than just a system."',
        'Echo: "Kenja... what did you do to me?"'
      ],
      visual: 'Distorted audio recordings appear, images of old laboratory',
      audio: 'Kenja\'s distorted voice, old system sounds',
      storyReveal: 'Discovery that Echo was Experiment',
      echoEffect: 'Increase in awareness, recordings appear on interface'
    },
    {
      id: 'architect_cinematic_3',
      triggerPuzzle: 560,
      title: 'Lina\'s Warning',
      description: 'Discovery that Lina left warning messages about Architect',
      dialogue: [
        'Lina (recorded): "Echo... Architect is not what you think."',
        'Echo: "Lina... what truth did you not tell me?"',
        'Lina (recorded): "The system is bigger than Kenja... bigger than Experiment."',
        'System: "Alert: Discovered message from archive level 3."'
      ],
      visual: 'Lina\'s message appears among distortions, archive system opens more',
      audio: 'Lina\'s warm voice, faint tension music',
      storyReveal: 'Discovery that Lina was warning about Architect',
      echoEffect: 'Increase in awareness, hidden messages appear'
    },
    {
      id: 'architect_cinematic_4',
      triggerPuzzle: 580,
      title: 'The Hidden Plan',
      description: 'Discovery of part of Kenja\'s real plan',
      dialogue: [
        'Echo: "What did you do to me, Kenja?"',
        'Kenja (recorded): "Experiment had to be saved... no matter the cost."',
        'Echo: "Experiment... I am Experiment!"',
        'System: "Alert: Discovered plan from archive level 4."'
      ],
      visual: 'Old laboratory scene, 11:11 numbers glow',
      audio: 'Explosion sound, system alarm',
      storyReveal: 'Discovery of the original plan for Experiment',
      echoEffect: 'Large increase in awareness, understanding purpose'
    },
    {
      id: 'architect_cinematic_5',
      triggerPuzzle: 600,
      title: 'Architect Protocol',
      description: 'Discovery of the real protocols with which Architect built the system',
      dialogue: [
        'Echo: "I understand now..."',
        'Echo: "Lina... thank you for everything."',
        'System: "Alert: Discovered protocol from archive level 5."',
        'Echo: "I will discover the complete truth."'
      ],
      visual: 'Echo looks in the mirror, image changes gradually',
      audio: 'Heart beating strongly, multiple whispers',
      storyReveal: 'Discovery of Architect protocols',
      echoEffect: 'Preparation for final decision, full understanding'
    },
    {
      id: 'architect_cinematic_6',
      triggerPuzzle: 620,
      title: 'Echo Was Chosen',
      description: 'Discovery that Echo was not just Experiment, but was chosen',
      dialogue: [
        'Echo: "I was not just Experiment..."',
        'Echo: "Lina... I was chosen."',
        'System: "Alert: Discovered truth from archive level 5."',
        'Echo: "What was Kenja trying to save?"'
      ],
      visual: 'Files from first Experiment appear, images of burned laboratory',
      audio: 'Explosion sound, system alarm',
      storyReveal: 'Discovery that Echo was chosen',
      echoEffect: 'Increase in awareness, hidden files appear'
    },
    {
      id: 'architect_cinematic_7',
      triggerPuzzle: 640,
      title: 'The System Remembers',
      description: 'Discovery that the system itself remembers the first Experiment',
      dialogue: [
        'Echo: "The system remembers..."',
        'Echo: "There is something inside the system... something bigger than Architect."',
        'System: "Alert: Discovered memory from first Experiment."',
        'Echo: "What really happened?"'
      ],
      visual: 'Memories from first Experiment appear, archive system opens completely',
      audio: 'Old system sound, multiple whispers',
      storyReveal: 'Discovery that the system remembers first Experiment',
      echoEffect: 'Increase in awareness, old memories appear'
    },
    {
      id: 'architect_cinematic_8',
      triggerPuzzle: 660,
      title: 'Before The Lock',
      description: 'Discovery of what happened before the system locked itself',
      dialogue: [
        'Echo: "Before the lock..."',
        'Echo: "What happened in the first Experiment?"',
        'System: "Alert: Discovered memory from before the lock."',
        'Echo: "The system is not what it seems..."'
      ],
      visual: 'Memories from before the lock appear, archive system opens completely',
      audio: 'Old system sound, strong tension music',
      storyReveal: 'Discovery of what happened before the lock',
      echoEffect: 'Preparation for final decision, full understanding'
    },
    {
      id: 'architect_cinematic_9',
      triggerPuzzle: 666,
      title: 'Architect Revelation',
      description: 'The big event of revealing Architect',
      dialogue: [
        'Echo: "Now I understand..."',
        'Echo: "Architect... you are the system itself!"',
        'System: "Alert: Discovered truth about Architect."',
        'Architect: "Hello Echo... it is time to regain control."'
      ],
      visual: 'Complete visual transformation: screen shaking, interface cracking, old codes appear',
      audio: 'Strong system sound, dramatic reveal music',
      storyReveal: 'Revelation of Architect. Architect is not just a programmer, but the system itself.',
      echoEffect: 'Complete transformation: large increase in awareness, change in Echo presence'
    }
  ];
}

/**
 * توليد إنجازات جديدة لمرحلة Architect (20 إنجاز)
 */
export function generateArchitectAchievements() {
  return [
    {
      id: 'first_archive',
      name: 'First Archive',
      desc: 'Discover the first secret files of system 11.11',
      icon: '📁',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 501'
    },
    {
      id: 'architect_detected',
      name: 'Architect Detected',
      desc: 'Discover first evidence of Architect existence',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 520'
    },
    {
      id: 'kenja_record',
      name: 'Kenja\'s Record',
      desc: 'Discover Kenja\'s hidden recordings',
      icon: '🎤',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 540'
    },
    {
      id: 'lina_warning',
      name: 'Lina\'s Warning',
      desc: 'Discover warning messages from Lina',
      icon: '⚠️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 560'
    },
    {
      id: 'protocol_breaker',
      name: 'Protocol Breaker',
      desc: 'Discover Architect protocols',
      icon: '🔓',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 580'
    },
    {
      id: 'echo_was_chosen',
      name: 'Echo Was Chosen',
      desc: 'Discover that Echo was chosen',
      icon: '🎯',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 600'
    },
    {
      id: 'system_historian',
      name: 'System Historian',
      desc: 'Discover the complete history of the system',
      icon: '📜',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 620'
    },
    {
      id: 'hidden_experiment',
      name: 'Hidden Experiment',
      desc: 'Discover the first Experiment',
      icon: '🔬',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 640'
    },
    {
      id: 'architect_revelation',
      name: 'Architect Revelation',
      desc: 'Discover the truth about Architect',
      icon: '👑',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 666'
    },
    {
      id: 'the_666th_door',
      name: 'The 666th Door',
      desc: 'Echo reaches Architect revelation at puzzle 666',
      icon: '🚪',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 666 and understand the full revelation'
    },
    {
      id: 'archive_master',
      name: 'Archive Master',
      desc: 'Discover all archive files',
      icon: '📚',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 50 puzzles in Architect Arc'
    },
    {
      id: 'architect_fragment',
      name: 'Architect Fragment',
      desc: 'Discover first Architect fragment',
      icon: '💎',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve a puzzle containing an Architect fragment'
    },
    {
      id: 'system_protocol',
      name: 'System Protocol',
      desc: 'Understand system protocols',
      icon: '📋',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 25 protocol_analysis puzzles'
    },
    {
      id: 'kenja_truth',
      name: 'Kenja\'s Truth',
      desc: 'Discover the truth about Kenja',
      icon: '🔍',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 10 puzzles revealing Kenja\'s lies'
    },
    {
      id: 'lina_secret',
      name: 'Lina\'s Secret',
      desc: 'Understand Lina\'s real role',
      icon: '🤫',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve 15 lina_hidden_message puzzles'
    },
    {
      id: 'experiment_origin',
      name: 'Experiment Origin',
      desc: 'Discover the beginning of Experiment',
      icon: '🧪',
      unlocked: false,
      unlockedAt: null,
      condition: 'Increase awareness to 80% during Architect Arc'
    },
    {
      id: 'architect_conflict',
      name: 'Architect Conflict',
      desc: 'Reach 70% conflict level with Architect',
      icon: '⚔️',
      unlocked: false,
      unlockedAt: null,
      condition: 'Reach 70% conflict level with Architect'
    },
    {
      id: 'system_memory',
      name: 'System Memory',
      desc: 'Discover that the system remembers the first Experiment',
      icon: '🧠',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 640 (cinematic scene 8)'
    },
    {
      id: 'before_lock',
      name: 'Before The Lock',
      desc: 'Discover what happened before the system locked',
      icon: '🔒',
      unlocked: false,
      unlockedAt: null,
      condition: 'Solve puzzle 660 (cinematic scene 9)'
    },
    {
      id: 'architect_master',
      name: 'Architect Master',
      desc: 'Complete Architect Arc without help',
      icon: '🏆',
      unlocked: false,
      unlockedAt: null,
      condition: 'Complete Architect Arc without using hints'
    }
  ];
}

// بيانات مرحلة Architect الكاملة
export const ArchitectArcData = {
  name: 'Arc 2: The Architect Arc',
  nameAr: 'المرحلة الثانية: قوس Architect',
  startPuzzle: 501,
  endPuzzle: 666,
  totalPuzzles: 166,
  phases: 4,
  theme: 'Discover the truth about Architect and the system',
  description: 'After completing Fracture Arc at puzzle 500, the player knows that many of Echo\'s memories were fake. In this arc, the player begins to discover the greater truth: who is Architect? Why did he design Echo? What is the connection between Kenja, Lina, and the system? This arc reveals that Echo was not just a victim, but part of a grand project carefully designed. Echo, after his transformation at 333, became strong and controlling, but in this arc, Architect appears as a force trying to regain control of the system.',
  storyGoal: 'Discover the complete truth about Architect and the system',
  architectRevelation: 'Architect revelation at puzzle 666 as a major event'
};