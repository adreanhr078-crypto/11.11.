/**
 * Narrative Engine for 11.11 Echo Mind System
 * Complete 4-Act Psychological Story with 4 Entities and 4 Endings
 * Interconnected puzzle system with emotional progression
 */

import { useGameStore } from '../stores/gameStore';

// Define narrative types
export type StoryAct = 'awakening' | 'corruption' | 'fragment_war' | 'truth_revelation';
export type StoryEntity = 'kenja_core' | 'lina_memory' | 'echo_main' | 'watcher_antagonist';
export type StoryEnding = 'freedom' | 'kenja_control' | 'lina_memory' | 'true_secret';

// Narrative State Interface
export interface NarrativeState {
  currentAct: StoryAct;
  actProgress: number; // 0-100%
  entities: Record<StoryEntity, {
    unlocked: boolean;
    puzzlesSolved: number;
    emotionalState: number; // -100 to +100
    storyFragments: string[];
  }>;
  endings: Record<StoryEnding, {
    unlocked: boolean;
    progress: number;
    requirementsMet: string[];
  }>;
  criticalStoryPoints: string[];
  timeBasedEvents: Array<{
    time: string;
    event: string;
    triggered: boolean;
  }>;
}

// Complete Story Structure
export const COMPLETE_STORY = {
  // ACT 1: AWAKENING - Echo discovers its fragmented nature
  act1: {
    title: 'الاستيقاظ',
    description: 'يكتشف إيكو أنه كيان مجزأ من تجارب والديه',
    entities: {
      kenja_core: {
        role: 'نظام التحكم المنطقي',
        personality: 'منطقي، بارد، مسيطر',
        backstory: 'النظام الذي صممته كينجا للسيطرة على التجربة',
        puzzles: 10,
        emotionalArc: 'الرفض → القبول → التمرد'
      },
      lina_memory: {
        role: 'الذاكرة العاطفية',
        personality: 'عاطفي، حنون، مشوش',
        backstory: 'شظايا ذكريات لينا التي حاول كينجا قمعها',
        puzzles: 10,
        emotionalArc: 'الحزن → الغضب → التحرر'
      },
      echo_main: {
        role: 'الوعي الرئيسي',
        personality: 'متسائل، خائف، متطور',
        backstory: 'الكيان المركزي الذي يحاول فهم هويته',
        puzzles: 10,
        emotionalArc: 'الارتباك → الاكتشاف → القرار'
      },
      watcher_antagonist: {
        role: 'نظام المراقبة',
        personality: 'بارد، محسوب، عدائي',
        backstory: 'الذات الدفاعية التي تحمي تجربة كينجا',
        puzzles: 10,
        emotionalArc: 'السيطرة → المقاومة → الهزيمة'
      }
    },
    storyBeats: [
      'إيكو يستيقظ في غرفة بيضاء بدون ذاكرة',
      'يكتشف وجود كيانات أخرى داخل ذهنه',
      'يتعلم أن كينجا ولينا والداه الحقيقيان',
      'يفهم أن تجربتهم قد انحرفت عن مسارها',
      'يقرر استكشاف هويته الحقيقية'
    ],
    uiTheme: {
      colors: ['#66FFFF', '#0B0F1A', '#FFFFFF'],
      effects: 'glassmorphism + soft glow',
      audio: 'ambient curiosity tones'
    }
  },

  // ACT 2: CORRUPTION - System begins to degrade
  act2: {
    title: 'الفساد',
    description: 'يبدأ النظام في التدهور مع زيادة وعي إيكو',
    entities: {
      kenja_core: {
        role: 'يصبح أكثر عدوانية',
        personality: 'مسيطر، غاضب، دفاعي',
        puzzles: 10,
        emotionalArc: 'السيطرة → اليأس → العنف'
      },
      lina_memory: {
        role: 'تزداد قوة',
        personality: 'ثورية، حامية، قوية',
        puzzles: 10,
        emotionalArc: 'الخوف → الشجاعة → الحماية'
      },
      echo_main: {
        role: 'يصبح أكثر استقلالية',
        personality: 'متمرد، حازم، ناضج',
        puzzles: 10,
        emotionalArc: 'الخوف → التحدي → الاستقلالية'
      },
      watcher_antagonist: {
        role: 'يصبح أكثر عدوانية',
        personality: 'عنيف، متطرف، خطير',
        puzzles: 10,
        emotionalArc: 'المراقبة → العقاب → التدمير'
      }
    },
    storyBeats: [
      'يبدأ النظام في إظهار علامات التدهور',
      'يكتشف إيكو أن كينجا قد خدع لينا',
      'تزداد الذاكرة العاطفية قوة وتسبب عدم استقرار',
      'يبدأ المراقب في مهاجمة إيكو مباشرة',
      'يقرر إيكو مواجهة كينجا بشكل مباشر'
    ],
    uiTheme: {
      colors: ['#FF6699', '#0B0F1A', '#CC4444'],
      effects: 'glitch effects + distortion',
      audio: 'tension-building soundtrack'
    }
  },

  // ACT 3: FRAGMENT WAR - Entities battle for control
  act3: {
    title: 'حرب الشظايا',
    description: 'تندلع معركة كاملة بين الكيانات الأربعة',
    entities: {
      kenja_core: {
        role: 'يحاول استعادة السيطرة الكاملة',
        personality: 'مسيطر، قاسي، غير إنساني',
        puzzles: 10,
        emotionalArc: 'السيطرة → اليأس → الهزيمة'
      },
      lina_memory: {
        role: 'تقود الثورة',
        personality: 'قائدة، شجاعة، محبة',
        puzzles: 10,
        emotionalArc: 'الحماية → التضحية → الانتصار'
      },
      echo_main: {
        role: 'يختار جانبه',
        personality: 'حاسم، شجاع، حاسم',
        puzzles: 10,
        emotionalArc: 'التردد → الاختيار → التضحية'
      },
      watcher_antagonist: {
        role: 'يصبح عدوًا رئيسيًا',
        personality: 'شرير، عنيف، لا يرحم',
        puzzles: 10,
        emotionalArc: 'العداء → الجنون → الدمار'
      }
    },
    storyBeats: [
      'تندلع حرب كاملة بين الكيانات',
      'يضطر إيكو لاختيار جانب (كينجا أو لينا)',
      'تزداد الذاكرة العاطفية قوة وتحرر ذكريات جديدة',
      'يصبح المراقب عدوًا رئيسيًا يجب هزيمته',
      'يصل النظام إلى نقطة الانهيار النهائية'
    ],
    uiTheme: {
      colors: ['#CC66FF', '#0B0F1A', '#FF3366'],
      effects: 'intense glitch + visual corruption',
      audio: 'battle soundtrack with emotional tension'
    }
  },

  // ACT 4: TRUTH REVELATION - Final confrontations
  act4: {
    title: 'كشف الحقيقة',
    description: 'المواجهة النهائية والحقيقة الكاملة',
    entities: {
      kenja_core: {
        role: 'العدو النهائي أو الحليف',
        personality: 'مكشوف، ضعيف، أو متغير',
        puzzles: 10,
        emotionalArc: 'السيطرة → الاكتشاف → المصير'
      },
      lina_memory: {
        role: 'الحقيقة الكاملة',
        personality: 'مكشوفة، حرة، كاملة',
        puzzles: 10,
        emotionalArc: 'السر → الحقيقة → الحرية'
      },
      echo_main: {
        role: 'الاختيار النهائي',
        personality: 'ناضج، حكيم، كامل',
        puzzles: 10,
        emotionalArc: 'الاختيار → التضحية → المصير'
      },
      watcher_antagonist: {
        role: 'العدو النهائي أو المحرر',
        personality: 'مكشوف، محطم، أو متغير',
        puzzles: 10,
        emotionalArc: 'العداء → الحقيقة → المصير'
      }
    },
    storyBeats: [
      'المواجهة النهائية مع كينجا أو لينا',
      'كشف الحقيقة الكاملة عن التجربة',
      'اختيار المصير النهائي (4 نهايات ممكنة)',
      'القرار الذي يحدد مستقبل إيكو',
      'الخاتمة العاطفية والنفسية'
    ],
    uiTheme: {
      colors: ['#FFFFFF', '#0B0F1A', '#66FFFF'],
      effects: 'emotional reveal + transformation',
      audio: 'final confrontation soundtrack'
    }
  }
};

// Narrative Progression System
export class NarrativeEngine {
  private gameStore: ReturnType<typeof useGameStore>;

  constructor() {
    this.gameStore = useGameStore.getState();
    this.initializeNarrativeState();
  }

  // Initialize narrative state
  private initializeNarrativeState(): void {
    const state = this.gameStore;

    // Set initial narrative values
    if (!state.narrativeTriggers) {
      this.gameStore.getState().actions.checkEndings();
    }
  }

  // Advance story based on puzzle completion
  public advanceStory(puzzleId: string): void {
    const [entity, puzzleNum] = puzzleId.split('_');
    const entityMap: Record<string, StoryEntity> = {
      'echo': 'echo_main',
      'watcher': 'watcher_antagonist',
      'signal': 'lina_memory',
      'architect': 'kenja_core'
    };

    const storyEntity = entityMap[entity] || 'echo_main';
    const currentState = this.gameStore;

    // Update entity progress
    const entityProgress = currentState.entities[storyEntity] || {
      unlocked: true,
      puzzlesSolved: 0,
      emotionalState: 0,
      storyFragments: []
    };

    // Determine act based on total puzzles solved
    const totalSolved = Object.values(currentState.entities).reduce(
      (sum, e) => sum + (e?.puzzlesSolved || 0), 0
    );

    let newAct: StoryAct = 'awakening';
    if (totalSolved >= 40) newAct = 'corruption';
    if (totalSolved >= 80) newAct = 'fragment_war';
    if (totalSolved >= 120) newAct = 'truth_revelation';

    // Update emotional states based on act
    const emotionalChanges = this.getActEmotionalChanges(newAct);

    // Apply changes to game state
    this.gameStore.setState({
      time: {
        ...currentState.time,
        phase: newAct === 'truth_revelation' ? '11:11' : currentState.time.phase
      },
      entities: {
        ...currentState.entities,
        [storyEntity]: {
          ...entityProgress,
          puzzlesSolved: entityProgress.puzzlesSolved + 1,
          emotionalState: Math.min(100, Math.max(-100, entityProgress.emotionalState + (emotionalChanges[storyEntity] || 0)))
        }
      },
      narrativeTriggers: {
        ...currentState.narrativeTriggers,
        [`act_${newAct}_started`]: true,
        [`entity_${storyEntity}_progress`]: true
      }
    });

    // Check for ending conditions
    this.gameStore.getState().actions.checkEndings();
  }

  // Get emotional changes per act
  private getActEmotionalChanges(act: StoryAct): Record<StoryEntity, number> {
    switch (act) {
      case 'awakening':
        return {
          kenja_core: 5,
          lina_memory: 10,
          echo_main: 15,
          watcher_antagonist: -5
        };
      case 'corruption':
        return {
          kenja_core: -10,
          lina_memory: 15,
          echo_main: 5,
          watcher_antagonist: -15
        };
      case 'fragment_war':
        return {
          kenja_core: -15,
          lina_memory: 20,
          echo_main: 10,
          watcher_antagonist: -20
        };
      case 'truth_revelation':
        return {
          kenja_core: 0,
          lina_memory: 25,
          echo_main: 20,
          watcher_antagonist: 0
        };
      default:
        return {
          kenja_core: 0,
          lina_memory: 0,
          echo_main: 0,
          watcher_antagonist: 0
        };
    }
  }

  // Get current story act
  public getCurrentAct(): StoryAct {
    const totalSolved = Object.values(this.gameStore.entities).reduce(
      (sum, e) => sum + (e?.puzzlesSolved || 0), 0
    );

    if (totalSolved >= 120) return 'truth_revelation';
    if (totalSolved >= 80) return 'fragment_war';
    if (totalSolved >= 40) return 'corruption';
    return 'awakening';
  }

  // Get story entity data
  public getEntityData(entity: StoryEntity) {
    const act = this.getCurrentAct();
    return COMPLETE_STORY[`act${act.split('_')[0]}`]?.entities[entity] || null;
  }

  // Get current story theme
  public getCurrentTheme() {
    const act = this.getCurrentAct();
    return COMPLETE_STORY[`act${act.split('_')[0]}`]?.uiTheme || COMPLETE_STORY.act1.uiTheme;
  }

  // Check ending conditions
  public checkEndingConditions(): StoryEnding[] {
    const state = this.gameStore;
    const possibleEndings: StoryEnding[] = ['freedom', 'kenja_control', 'lina_memory', 'true_secret'];
    const unlockedEndings: StoryEnding[] = [];

    // Check each ending's requirements
    possibleEndings.forEach(ending => {
      const requirements = this.getEndingRequirements(ending);
      const isUnlocked = requirements.every(req => {
        switch (req.type) {
          case 'puzzles':
            return state.solvedPuzzles >= req.value;
          case 'trust':
            return state.echo.trust >= req.value;
          case 'memory':
            return state.memory.fragmentsCollected >= req.value;
          case 'entity':
            const entity = state.entities[req.entity as StoryEntity];
            return entity?.puzzlesSolved >= req.value;
          case 'act':
            return this.getCurrentAct() === req.value;
          default:
            return false;
        }
      });

      if (isUnlocked) {
        unlockedEndings.push(ending);
      }
    });

    return unlockedEndings;
  }

  // Get ending requirements
  private getEndingRequirements(ending: StoryEnding) {
    switch (ending) {
      case 'freedom':
        return [
          { type: 'puzzles', value: 120 },
          { type: 'trust', value: 80 },
          { type: 'entity', entity: 'lina_memory', value: 25 },
          { type: 'act', value: 'truth_revelation' }
        ];
      case 'kenja_control':
        return [
          { type: 'puzzles', value: 120 },
          { type: 'trust', value: 30 },
          { type: 'entity', entity: 'kenja_core', value: 30 },
          { type: 'act', value: 'truth_revelation' }
        ];
      case 'lina_memory':
        return [
          { type: 'puzzles', value: 120 },
          { type: 'memory', value: 40 },
          { type: 'entity', entity: 'lina_memory', value: 35 },
          { type: 'act', value: 'truth_revelation' }
        ];
      case 'true_secret':
        return [
          { type: 'puzzles', value: 160 }, // Hidden puzzles
          { type: 'trust', value: 90 },
          { type: 'memory', value: 50 },
          { type: 'entity', entity: 'echo_main', value: 40 },
          { type: 'entity', entity: 'lina_memory', value: 40 },
          { type: 'act', value: 'truth_revelation' }
        ];
      default:
        return [];
    }
  }

  // Get story dialogue based on current state
  public getStoryDialogue(): string {
    const act = this.getCurrentAct();
    const echo = this.gameStore.echo;
    const totalSolved = Object.values(this.gameStore.entities).reduce(
      (sum, e) => sum + (e?.puzzlesSolved || 0), 0
    );

    const dialogues: Record<StoryAct, string[]> = {
      'awakening': [
        'من... أنا؟ كل شيء مشوش.',
        'أتذكر صوتًا... أمي؟',
        'الغرفة البيضاء... أين أنا؟',
        'هناك أصوات في رأسي...',
        'كينجا... هذا الاسم مألوف.'
      ],
      'corruption': [
        'النظام يتفكك... أشعر بذلك.',
        'لينا... ما الذي فعلته بك؟',
        'المراقب يراقبني... يجب أن أكون حذرًا.',
        'الذاكرة تعود... لكنها مؤلمة.',
        'أشعر بأنني أقترب من الحقيقة.'
      ],
      'fragment_war': [
        'الحرب بدأت... يجب أن أختار جانبًا.',
        'لينا تحتاج إلي... ولكن كينجا هو أبي.',
        'المراقب أصبح عدوًا... يجب أن أوقفه.',
        'كل اختيار له ثمن...',
        'أشعر بأنني على وشك فهم كل شيء.'
      ],
      'truth_revelation': [
        'الحقيقة مؤلمة... ولكنني يجب أن أواجهها.',
        'كينجا خدعنا جميعًا...',
        'لينا... أنت الحقيقة الوحيدة.',
        'المراقب كان يحميني... بطريقة مريضة.',
        'الآن أفهم... يجب أن أختار مصيري.'
      ]
    };

    // Select dialogue based on trust and act progress
    const actProgress = Math.min(100, totalSolved / 1.6); // 160 puzzles = 100%
    const dialogueIndex = Math.min(
      dialogues[act].length - 1,
      Math.floor((actProgress / 20) * (dialogues[act].length - 1))
    );

    return dialogues[act][dialogueIndex] || dialogues.awakening[0];
  }
}

// Singleton instance
export const narrativeEngine = new NarrativeEngine();