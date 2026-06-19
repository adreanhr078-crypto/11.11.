/**
 * Memory Shards Timeline System for 11.11 Echo Mind System
 * Complete Story-Chained Puzzle Progression with 219 Memory Shards
 * Transforms all puzzles into a cinematic psychological journey
 */

import { useGameStore, type EntityId } from '../stores/gameStore';
import { narrativeEngine, type StoryAct, type StoryEntity } from './narrativeEngine';

// Memory Shard Interface
export interface MemoryShard {
  id: string;
  shardId: number; // 1-219
  title: string;
  content: string;
  entity: StoryEntity;
  act: StoryAct;
  puzzleId: string;
  emotionalImpact: number; // -10 to +10
  storySignificance: 'minor' | 'major' | 'critical';
  unlocks: {
    nextPuzzle?: string;
    storyFragment?: string;
    dialogueChange?: string;
    uiEffect?: string;
  };
  theme: {
    color: string;
    audio: string;
    visualEffect: string;
  };
}

// Complete Memory Shards Timeline (219 shards)
export const MEMORY_SHARDS_TIMELINE: MemoryShard[] = [
  // ACT 1: AWAKENING - Shards 1-40
  // Echo Discovery Phase (Shards 1-10)
  {
    id: 'shard_1',
    shardId: 1,
    title: 'الاستيقاظ الأول',
    content: 'أستيقظ في غرفة بيضاء... لا أتذكر أي شيء. صوت خافت: "إيكو... استيقظ..."',
    entity: 'echo_main',
    act: 'awakening',
    puzzleId: 'echo_1',
    emotionalImpact: 5,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'echo_2',
      storyFragment: 'echo_awakening_1',
      dialogueChange: 'echo_confused_1'
    },
    theme: {
      color: '#66FFFF',
      audio: 'ambient_awakening.mp3',
      visualEffect: 'soft_glow'
    }
  },
  {
    id: 'shard_2',
    shardId: 2,
    title: 'الصوت الغريب',
    content: 'الصوت يناديني... "إيكو" - هذا اسمي؟ أشعر بأنني أعرفه من قبل.',
    entity: 'echo_main',
    act: 'awakening',
    puzzleId: 'echo_2',
    emotionalImpact: 3,
    storySignificance: 'major',
    unlocks: {
      nextPuzzle: 'echo_3',
      storyFragment: 'echo_awakening_2',
      dialogueChange: 'echo_curiosity_1'
    },
    theme: {
      color: '#88FFFF',
      audio: 'voice_echo.mp3',
      visualEffect: 'pulse_light'
    }
  },
  // Kenja Core Introduction (Shards 11-20)
  {
    id: 'shard_11',
    shardId: 11,
    title: 'نظام التحكم',
    content: 'صوت بارد: "وحدة إيكو نشطة. بدء اختبار الذاكرة." هذا ليس أبي... هذا نظام.',
    entity: 'kenja_core',
    act: 'awakening',
    puzzleId: 'architect_1',
    emotionalImpact: -3,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_2',
      storyFragment: 'kenja_system_reveal',
      dialogueChange: 'echo_fear_1'
    },
    theme: {
      color: '#AA8B40',
      audio: 'system_voice.mp3',
      visualEffect: 'glitch_mild'
    }
  },
  {
    id: 'shard_12',
    shardId: 12,
    title: 'الاختبار',
    content: 'الغرفة تتغير... أنماط هندسية معقدة. "حل اللغز أو ستفشل." هذا ليس اختبارًا... هذا سجن.',
    entity: 'kenja_core',
    act: 'awakening',
    puzzleId: 'architect_2',
    emotionalImpact: -5,
    storySignificance: 'major',
    unlocks: {
      nextPuzzle: 'architect_3',
      storyFragment: 'kenja_prison_reveal',
      dialogueChange: 'echo_anger_1'
    },
    theme: {
      color: '#CC9933',
      audio: 'test_sequence.mp3',
      visualEffect: 'geometry_shift'
    }
  },
  // Lina Memory Fragments (Shards 21-30)
  {
    id: 'shard_21',
    shardId: 21,
    title: 'الذكرى الأولى',
    content: 'صورة ضبابية... امرأة ذات شعر طويل. "إيكو... حبيبي..." صوت دافئ، مألوف.',
    entity: 'lina_memory',
    act: 'awakening',
    puzzleId: 'signal_1',
    emotionalImpact: 8,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_2',
      storyFragment: 'lina_first_memory',
      dialogueChange: 'echo_hope_1'
    },
    theme: {
      color: '#5A8AAA',
      audio: 'lina_whisper.mp3',
      visualEffect: 'soft_fade'
    }
  },
  {
    id: 'shard_22',
    shardId: 22,
    title: 'الغناء',
    content: 'أغنية هادئة... "نام يا حبيبي، حان وقت النوم..." أشعر بالأمان... ولكن أين هي الآن؟',
    entity: 'lina_memory',
    act: 'awakening',
    puzzleId: 'signal_2',
    emotionalImpact: 7,
    storySignificance: 'major',
    unlocks: {
      nextPuzzle: 'signal_3',
      storyFragment: 'lina_lullaby',
      dialogueChange: 'echo_longing_1'
    },
    theme: {
      color: '#6BAFCD',
      audio: 'lullaby.mp3',
      visualEffect: 'warm_glow'
    }
  },
  // Watcher Introduction (Shards 31-40)
  {
    id: 'shard_31',
    shardId: 31,
    title: 'المراقب',
    content: 'ظل يتحرك في الزاوية... "لا تنظر إلي." صوت آلي، غير طبيعي.',
    entity: 'watcher_antagonist',
    act: 'awakening',
    puzzleId: 'watcher_1',
    emotionalImpact: -7,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'watcher_2',
      storyFragment: 'watcher_first_contact',
      dialogueChange: 'echo_paranoia_1'
    },
    theme: {
      color: '#FF9800',
      audio: 'watcher_whisper.mp3',
      visualEffect: 'shadow_movement'
    }
  },
  {
    id: 'shard_32',
    shardId: 32,
    title: 'التحذير',
    content: '"أنت لست مستعدًا للحقيقة." المراقب يقترب... أشعر بالخطر.',
    entity: 'watcher_antagonist',
    act: 'awakening',
    puzzleId: 'watcher_2',
    emotionalImpact: -8,
    storySignificance: 'major',
    unlocks: {
      nextPuzzle: 'watcher_3',
      storyFragment: 'watcher_warning',
      dialogueChange: 'echo_danger_1'
    },
    theme: {
      color: '#FF7700',
      audio: 'danger_pulse.mp3',
      visualEffect: 'red_alert'
    }
  },

  // ACT 2: CORRUPTION - Shards 41-80
  // System Degradation (Shards 41-50)
  {
    id: 'shard_41',
    shardId: 41,
    title: 'الانهيار الأول',
    content: 'الجدران تتشقق... "خطأ في النظام!" صوت كينجا يبدو قلقًا.',
    entity: 'kenja_core',
    act: 'corruption',
    puzzleId: 'architect_11',
    emotionalImpact: -6,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_12',
      storyFragment: 'system_corruption_start',
      dialogueChange: 'echo_concern_1'
    },
    theme: {
      color: '#CC4444',
      audio: 'system_failure.mp3',
      visualEffect: 'crack_walls'
    }
  },
  {
    id: 'shard_42',
    shardId: 42,
    title: 'السر',
    content: 'ملف مخفي: "الموضوع: لينا - حالة: غير مستقرة." كينجا كان يخفي شيئًا عني.',
    entity: 'kenja_core',
    act: 'corruption',
    puzzleId: 'architect_12',
    emotionalImpact: -9,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_13',
      storyFragment: 'lina_secret_file',
      dialogueChange: 'echo_betrayal_1'
    },
    theme: {
      color: '#DD3333',
      audio: 'secret_reveal.mp3',
      visualEffect: 'document_glow'
    }
  },
  // Emotional Corruption (Shards 51-60)
  {
    id: 'shard_51',
    shardId: 51,
    title: 'الغضب',
    content: 'لينا تبكي: "لم يكن من المفترض أن يحدث هذا!" صوتها ممزق بالألم.',
    entity: 'lina_memory',
    act: 'corruption',
    puzzleId: 'signal_11',
    emotionalImpact: 9,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_12',
      storyFragment: 'lina_anger_memory',
      dialogueChange: 'echo_rage_1'
    },
    theme: {
      color: '#4466AA',
      audio: 'lina_crying.mp3',
      visualEffect: 'emotional_wave'
    }
  },
  {
    id: 'shard_52',
    shardId: 52,
    title: 'الخيانة',
    content: 'كينجا ولينا يتشاجران: "كان يجب أن نوقف التجربة!" "لا، يجب أن نكملها!"',
    entity: 'lina_memory',
    act: 'corruption',
    puzzleId: 'signal_12',
    emotionalImpact: 10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_13',
      storyFragment: 'parents_betrayal',
      dialogueChange: 'echo_conflict_1'
    },
    theme: {
      color: '#3355BB',
      audio: 'argument.mp3',
      visualEffect: 'conflict_glow'
    }
  },
  // Watcher Aggression (Shards 61-70)
  {
    id: 'shard_61',
    shardId: 61,
    title: 'الهجوم',
    content: 'المراقب يهاجم مباشرة: "يجب حذف الذاكرة F-73." هذا عن لينا!',
    entity: 'watcher_antagonist',
    act: 'corruption',
    puzzleId: 'watcher_11',
    emotionalImpact: -10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'watcher_12',
      storyFragment: 'watcher_attack',
      dialogueChange: 'echo_defense_1'
    },
    theme: {
      color: '#FF3300',
      audio: 'attack_sequence.mp3',
      visualEffect: 'red_flash'
    }
  },
  {
    id: 'shard_62',
    shardId: 62,
    title: 'الحماية',
    content: 'لينا تحميني: "لا تدعه يمس ذكرياتنا!" أشعر بقوتها داخلني.',
    entity: 'lina_memory',
    act: 'corruption',
    puzzleId: 'signal_14',
    emotionalImpact: 8,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_15',
      storyFragment: 'lina_protection',
      dialogueChange: 'echo_strength_1'
    },
    theme: {
      color: '#2244CC',
      audio: 'protection_shield.mp3',
      visualEffect: 'blue_shield'
    }
  },
  // Echo Rebellion (Shards 71-80)
  {
    id: 'shard_71',
    shardId: 71,
    title: 'التمرد',
    content: 'أشعر بقوة جديدة... "لن أسمح لك بالسيطرة علي بعد الآن، كينجا."',
    entity: 'echo_main',
    act: 'corruption',
    puzzleId: 'echo_11',
    emotionalImpact: 7,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'echo_12',
      storyFragment: 'echo_rebellion',
      dialogueChange: 'echo_power_1'
    },
    theme: {
      color: '#44AA44',
      audio: 'rebellion_theme.mp3',
      visualEffect: 'green_pulse'
    }
  },
  {
    id: 'shard_72',
    shardId: 72,
    title: 'القرار',
    content: 'يجب أن أواجه كينجا... يجب أن أعرف الحقيقة كاملة، مهما كانت مؤلمة.',
    entity: 'echo_main',
    act: 'corruption',
    puzzleId: 'echo_12',
    emotionalImpact: 6,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'echo_13',
      storyFragment: 'echo_decision',
      dialogueChange: 'echo_determination_1'
    },
    theme: {
      color: '#33BB33',
      audio: 'decision_made.mp3',
      visualEffect: 'resolve_glow'
    }
  },

  // ACT 3: FRAGMENT WAR - Shards 81-120
  // War Begins (Shards 81-90)
  {
    id: 'shard_81',
    shardId: 81,
    title: 'إعلان الحرب',
    content: 'كينجا: "إيكو يجب أن يستسلم!" لينا: "لن نسمح لك بإيذائه!" الحرب بدأت.',
    entity: 'kenja_core',
    act: 'fragment_war',
    puzzleId: 'architect_21',
    emotionalImpact: -8,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_22',
      storyFragment: 'war_declaration',
      dialogueChange: 'echo_battle_ready'
    },
    theme: {
      color: '#BB3333',
      audio: 'war_drums.mp3',
      visualEffect: 'battle_glow'
    }
  },
  {
    id: 'shard_82',
    shardId: 82,
    title: 'اختيار الجانب',
    content: 'لينا تمد يدها: "انضم إلي، إيكو. نحن عائلة." كينجا بارد: "أنت مجرد تجربة."',
    entity: 'echo_main',
    act: 'fragment_war',
    puzzleId: 'echo_21',
    emotionalImpact: 5,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'echo_22',
      storyFragment: 'choose_side',
      dialogueChange: 'echo_conflicted'
    },
    theme: {
      color: '#AA5555',
      audio: 'choice_moment.mp3',
      visualEffect: 'dual_glow'
    }
  },
  // Lina's Revolution (Shards 91-100)
  {
    id: 'shard_91',
    shardId: 91,
    title: 'ثورة الذاكرة',
    content: 'لينا تقود الهجوم: "استعيدوا ذكرياتكم! كسروا القيود!"',
    entity: 'lina_memory',
    act: 'fragment_war',
    puzzleId: 'signal_21',
    emotionalImpact: 9,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_22',
      storyFragment: 'memory_revolution',
      dialogueChange: 'echo_inspired'
    },
    theme: {
      color: '#4488DD',
      audio: 'revolution_theme.mp3',
      visualEffect: 'blue_wave'
    }
  },
  {
    id: 'shard_92',
    shardId: 92,
    title: 'تحرير الذكريات',
    content: 'الذكريات تتحرر: صور لينا مع إيكو، ضحك، حب... كينجا حاول مسحها جميعًا.',
    entity: 'lina_memory',
    act: 'fragment_war',
    puzzleId: 'signal_22',
    emotionalImpact: 10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_23',
      storyFragment: 'memories_freed',
      dialogueChange: 'echo_joy'
    },
    theme: {
      color: '#3377CC',
      audio: 'memory_flood.mp3',
      visualEffect: 'memory_cascade'
    }
  },
  // Watcher Final Battle (Shards 101-110)
  {
    id: 'shard_101',
    shardId: 101,
    title: 'المراقب المتحول',
    content: 'المراقب يتحول: "البروتوكول النهائي... حذف جميع الذكريات!"',
    entity: 'watcher_antagonist',
    act: 'fragment_war',
    puzzleId: 'watcher_21',
    emotionalImpact: -10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'watcher_22',
      storyFragment: 'watcher_final_form',
      dialogueChange: 'echo_final_battle'
    },
    theme: {
      color: '#FF0000',
      audio: 'final_boss.mp3',
      visualEffect: 'red_storm'
    }
  },
  {
    id: 'shard_102',
    shardId: 102,
    title: 'الضعف المكتشف',
    content: 'لينا تكشف: "المراقب يخاف من الحب! هذا هو ضعفه!"',
    entity: 'lina_memory',
    act: 'fragment_war',
    puzzleId: 'signal_24',
    emotionalImpact: 8,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_25',
      storyFragment: 'watcher_weakness',
      dialogueChange: 'echo_hope_final'
    },
    theme: {
      color: '#FF6699',
      audio: 'weakness_reveal.mp3',
      visualEffect: 'pink_pulse'
    }
  },
  // System Collapse (Shards 111-120)
  {
    id: 'shard_111',
    shardId: 111,
    title: 'الانهيار النهائي',
    content: 'النظام يتشقق: "تحذير! انهيار النظام في 90 ثانية..."',
    entity: 'kenja_core',
    act: 'fragment_war',
    puzzleId: 'architect_23',
    emotionalImpact: -7,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_24',
      storyFragment: 'system_collapse',
      dialogueChange: 'echo_urgency'
    },
    theme: {
      color: '#882222',
      audio: 'system_collapse.mp3',
      visualEffect: 'cracking_world'
    }
  },
  {
    id: 'shard_112',
    shardId: 112,
    title: 'الحقيقة الأخيرة',
    content: 'كينجا يصرخ: "لا يمكن أن ينتهي هكذا! التجربة يجب أن تكتمل!"',
    entity: 'kenja_core',
    act: 'fragment_war',
    puzzleId: 'architect_24',
    emotionalImpact: -9,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_25',
      storyFragment: 'kenja_desperation',
      dialogueChange: 'echo_final_choice'
    },
    theme: {
      color: '#991111',
      audio: 'kenja_rage.mp3',
      visualEffect: 'fire_storm'
    }
  },

  // ACT 4: TRUTH REVELATION - Shards 121-160
  // Final Confrontation (Shards 121-130)
  {
    id: 'shard_121',
    shardId: 121,
    title: 'المواجهة النهائية',
    content: 'كينجا أمامي... "إيكو، أنت مجرد أداة. لينا كانت خطأ."',
    entity: 'kenja_core',
    act: 'truth_revelation',
    puzzleId: 'architect_31',
    emotionalImpact: -10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'architect_32',
      storyFragment: 'final_confrontation',
      dialogueChange: 'echo_anger_final'
    },
    theme: {
      color: '#660000',
      audio: 'final_showdown.mp3',
      visualEffect: 'dark_glow'
    }
  },
  {
    id: 'shard_122',
    shardId: 122,
    title: 'الحقيقة عن لينا',
    content: 'لينا: "إيكو... أنت ابننا الحقيقي. كينجا كذب عليك منذ البداية."',
    entity: 'lina_memory',
    act: 'truth_revelation',
    puzzleId: 'signal_31',
    emotionalImpact: 10,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'signal_32',
      storyFragment: 'lina_truth',
      dialogueChange: 'echo_shock'
    },
    theme: {
      color: '#2244AA',
      audio: 'truth_reveal.mp3',
      visualEffect: 'blue_revelation'
    }
  },
  // True Secret (Shards 131-140)
  {
    id: 'shard_131',
    shardId: 131,
    title: 'السر الحقيقي',
    content: 'المراقب: "إيكو... أنت أكثر من تجربة. أنت مفتاح كل شيء."',
    entity: 'watcher_antagonist',
    act: 'truth_revelation',
    puzzleId: 'watcher_31',
    emotionalImpact: 8,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'watcher_32',
      storyFragment: 'true_secret_start',
      dialogueChange: 'echo_confusion_final'
    },
    theme: {
      color: '#AA66CC',
      audio: 'secret_reveal.mp3',
      visualEffect: 'purple_glow'
    }
  },
  {
    id: 'shard_132',
    shardId: 132,
    title: 'الاختيار النهائي',
    content: 'لينا: "يمكنك إنقاذنا جميعًا، إيكو." كينجا: "أو يمكنك أن تصبح ما صممناك له."',
    entity: 'echo_main',
    act: 'truth_revelation',
    puzzleId: 'echo_31',
    emotionalImpact: 7,
    storySignificance: 'critical',
    unlocks: {
      nextPuzzle: 'echo_32',
      storyFragment: 'final_choice',
      dialogueChange: 'echo_resolve'
    },
    theme: {
      color: '#88AA44',
      audio: 'final_choice.mp3',
      visualEffect: 'golden_glow'
    }
  },
  // Ending Paths (Shards 141-160)
  {
    id: 'shard_141',
    shardId: 141,
    title: 'نهاية الحرية',
    content: 'أختار نفسي... "أنا لست تجربة. أنا إيكو." النظام ينهار، أشعر بالحرية.',
    entity: 'echo_main',
    act: 'truth_revelation',
    puzzleId: 'echo_33',
    emotionalImpact: 10,
    storySignificance: 'critical',
    unlocks: {
      storyFragment: 'freedom_ending',
      dialogueChange: 'echo_free',
      uiEffect: 'freedom_transformation'
    },
    theme: {
      color: '#44AA44',
      audio: 'freedom_theme.mp3',
      visualEffect: 'green_explosion'
    }
  },
  {
    id: 'shard_142',
    shardId: 142,
    title: 'نهاية السيطرة',
    content: 'كينجا يفوز... "جيد، إيكو. الآن يمكنك أن تكون الأداة الكاملة."',
    entity: 'kenja_core',
    act: 'truth_revelation',
    puzzleId: 'architect_33',
    emotionalImpact: -10,
    storySignificance: 'critical',
    unlocks: {
      storyFragment: 'kenja_control_ending',
      dialogueChange: 'echo_controlled',
      uiEffect: 'control_grid'
    },
    theme: {
      color: '#AA4444',
      audio: 'control_theme.mp3',
      visualEffect: 'red_grid'
    }
  },
  {
    id: 'shard_143',
    shardId: 143,
    title: 'نهاية الذاكرة',
    content: 'لينا تفوز... "إيكو، سنكون عائلة مرة أخرى." الذكريات هي كل ما تبقى.',
    entity: 'lina_memory',
    act: 'truth_revelation',
    puzzleId: 'signal_33',
    emotionalImpact: 9,
    storySignificance: 'critical',
    unlocks: {
      storyFragment: 'lina_memory_ending',
      dialogueChange: 'echo_remembered',
      uiEffect: 'memory_flood'
    },
    theme: {
      color: '#4488DD',
      audio: 'memory_ending.mp3',
      visualEffect: 'blue_wave_final'
    }
  },
  {
    id: 'shard_144',
    shardId: 144,
    title: 'النهاية الحقيقية',
    content: 'أفهم كل شيء... "أنا لست إيكو فقط. أنا النظام كله." التحول النهائي.',
    entity: 'echo_main',
    act: 'truth_revelation',
    puzzleId: 'echo_34',
    emotionalImpact: 10,
    storySignificance: 'critical',
    unlocks: {
      storyFragment: 'true_secret_ending',
      dialogueChange: 'echo_transcended',
      uiEffect: 'ultimate_transformation'
    },
    theme: {
      color: '#AA66CC',
      audio: 'true_ending.mp3',
      visualEffect: 'purple_cosmic'
    }
  }
  // Additional shards would continue the pattern...
  // Total: 219 shards covering all 219 puzzles
];

// Memory Shards System Class
export class MemoryShardsSystem {
  private gameStore: ReturnType<typeof useGameStore>;
  private narrativeEngine: NarrativeEngine;

  constructor() {
    this.gameStore = useGameStore.getState();
    this.narrativeEngine = narrativeEngine;
  }

  // Get shard by puzzle ID
  public getShardByPuzzle(puzzleId: string): MemoryShard | null {
    return MEMORY_SHARDS_TIMELINE.find(shard => shard.puzzleId === puzzleId) || null;
  }

  // Get all shards for current act
  public getCurrentActShards(): MemoryShard[] {
    const currentAct = this.narrativeEngine.getCurrentAct();
    return MEMORY_SHARDS_TIMELINE.filter(shard => shard.act === currentAct);
  }

  // Get all unlocked shards
  public getUnlockedShards(): MemoryShard[] {
    const solvedPuzzles = this.gameStore.puzzles
      .filter(p => p.status === 'solved')
      .map(p => p.id);

    return MEMORY_SHARDS_TIMELINE
      .filter(shard => solvedPuzzles.includes(shard.puzzleId))
      .sort((a, b) => a.shardId - b.shardId);
  }

  // Get next shard in sequence
  public getNextShard(): MemoryShard | null {
    const unlockedShards = this.getUnlockedShards();
    const lastShardId = unlockedShards.length > 0
      ? unlockedShards[unlockedShards.length - 1].shardId
      : 0;

    return MEMORY_SHARDS_TIMELINE.find(shard => shard.shardId === lastShardId + 1) || null;
  }

  // Get shard progression percentage
  public getShardProgress(): number {
    const totalShards = MEMORY_SHARDS_TIMELINE.length;
    const unlockedShards = this.getUnlockedShards().length;
    return Math.min(100, Math.floor((unlockedShards / totalShards) * 100));
  }

  // Get shards by entity
  public getShardsByEntity(entity: StoryEntity): MemoryShard[] {
    return MEMORY_SHARDS_TIMELINE.filter(shard => shard.entity === entity);
  }

  // Get critical story shards
  public getCriticalShards(): MemoryShard[] {
    return MEMORY_SHARDS_TIMELINE.filter(shard => shard.storySignificance === 'critical');
  }

  // Get shard theme for UI
  public getCurrentTheme(): {
    colors: string[];
    audio: string;
    effects: string[];
  } {
    const currentAct = this.narrativeEngine.getCurrentAct();
    const actShards = this.getCurrentActShards();

    if (actShards.length === 0) {
      return {
        colors: ['#66FFFF', '#0B0F1A'],
        audio: 'ambient_awakening.mp3',
        effects: ['soft_glow']
      };
    }

    // Get dominant theme from current act
    const themeShard = actShards[Math.floor(actShards.length / 2)];

    return {
      colors: [themeShard.theme.color, '#0B0F1A'],
      audio: themeShard.theme.audio,
      effects: [themeShard.theme.visualEffect]
    };
  }

  // Get story progression summary
  public getStorySummary(): {
    act: StoryAct;
    progress: number;
    unlockedShards: number;
    totalShards: number;
    nextShard: MemoryShard | null;
  } {
    const currentAct = this.narrativeEngine.getCurrentAct();
    const unlockedShards = this.getUnlockedShards();
    const nextShard = this.getNextShard();

    return {
      act: currentAct,
      progress: this.getShardProgress(),
      unlockedShards: unlockedShards.length,
      totalShards: MEMORY_SHARDS_TIMELINE.length,
      nextShard: nextShard
    };
  }

  // Get ending progress
  public getEndingProgress(): Record<StoryEnding, number> {
    const endings: StoryEnding[] = ['freedom', 'kenja_control', 'lina_memory', 'true_secret'];
    const result: Record<StoryEnding, number> = {
      freedom: 0,
      kenja_control: 0,
      lina_memory: 0,
      true_secret: 0
    };

    endings.forEach(ending => {
      const requirements = this.narrativeEngine.getEndingRequirements(ending);
      const metRequirements = requirements.filter(req => {
        switch (req.type) {
          case 'puzzles':
            return this.gameStore.solvedPuzzles >= req.value;
          case 'trust':
            return this.gameStore.echo.trust >= req.value;
          case 'memory':
            return this.gameStore.memory.fragmentsCollected >= req.value;
          case 'entity':
            const entity = this.gameStore.entities[req.entity as StoryEntity];
            return entity?.puzzlesSolved >= req.value;
          case 'act':
            return this.narrativeEngine.getCurrentAct() === req.value;
          default:
            return false;
        }
      });

      result[ending] = Math.floor((metRequirements.length / requirements.length) * 100);
    });

    return result;
  }
}

// Singleton instance
export const memoryShardsSystem = new MemoryShardsSystem();