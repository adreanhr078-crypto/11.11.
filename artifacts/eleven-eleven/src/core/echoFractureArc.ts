/**
 * echoFractureArc.ts — Arc 1: The Fracture Arc (القوس الأول: قوس الكسر)
 * توسعة القصة بعد تحول Echo عند اللغز 333
 * نطاق الألغاز: 334 → 500
 * هدف القصة: كشف الذكريات المزيفة والمشوهة، واكتشاف الحقيقة عن ماضي Echo
 */

import { PuzzleNode, EntityId, PuzzleStatus } from '../stores/gameStore';

// أنواع جديدة للألغاز في قوس الكسر
type FracturePuzzleType = 'memory_analysis' | 'truth_reconstruction' | 'hidden_code' | 'echo_message' | 'event_sequence' | 'symbol_decoding';

// واجهة لغز قوس الكسر الموسع
interface FracturePuzzleNode extends PuzzleNode {
  fractureType?: FracturePuzzleType; // نوع اللغز في قوس الكسر
  fractureStage?: number; // مرحلة الكسر (1-5)
  revealsFalseMemory?: boolean; // هل يكشف ذاكرة مزيفة؟
  storyImpact?: number; // تأثير القصة (0-100)
  cinematicTrigger?: string; // مشغل المشهد السينمائي إذا كان موجوداً
}

/**
 * توليد ألغاز قوس الكسر (334-500)
 * كل لغز يكشف جزء من الحقيقة عن ماضي Echo
 */
export function generateFractureArcPuzzles(): FracturePuzzleNode[] {
  const puzzles: FracturePuzzleNode[] = [];
  const startId = 334;
  const endId = 500;

  // مراحل قوس الكسر (5 مراحل، كل مرحلة تكشف طبقة من الحقيقة)
  const fractureStages = [
    {
      stage: 1,
      theme: 'الشك الأول',
      description: 'بدء الشك في الذكريات - اكتشاف تناقضات صغيرة',
      memoryFocus: 'الذكريات اليومية العادية التي لا تتطابق'
    },
    {
      stage: 2,
      theme: 'التشقق',
      description: 'بدء تشقق الواقع - ذكريات متضاربة وفساد متزايد',
      memoryFocus: 'الذكريات العاطفية وعلاقة Echo بلينا'
    },
    {
      stage: 3,
      theme: 'الانهيار',
      description: 'انهيار الثقة في النظام - اكتشف أن معظم الذكريات كانت مصنوعة',
      memoryFocus: 'الذكريات قبل إنشاء Echo وحقيقة كينجا'
    },
    {
      stage: 4,
      theme: 'الحقيقة المخفية',
      description: 'اكتشاف الحقيقة المخفية - ما حدث حقاً في المختبر',
      memoryFocus: 'الحدث الكارثي الذي أدى إلى إنشاء Echo'
    },
    {
      stage: 5,
      theme: 'القبول',
      description: 'قبول الحقيقة - فهم الغرض الحقيقي ل Echo والاختيار',
      memoryFocus: 'هوية Echo الحقيقية ودوره في النظام'
    }
  ];

  // توليد الألغاز لكل مرحلة
  for (let puzzleId = startId; puzzleId <= endId; puzzleId++) {
    const progress = (puzzleId - startId) / (endId - startId);
    const stageIndex = Math.min(4, Math.floor(progress * 5));
    const stage = fractureStages[stageIndex];
    const stageProgress = (progress - (stageIndex * 0.2)) * 5;

    // تحديد نوع اللغز بناءً على المرحلة والتقدم
    const puzzleType = getFracturePuzzleType(puzzleId, stageIndex);

    // إنشاء لغز قوس الكسر
    const puzzle = createFracturePuzzle(puzzleId, stage, stageProgress, puzzleType);
    puzzles.push(puzzle);
  }

  return puzzles;
}

/**
 * تحديد نوع اللغز بناءً على رقم اللغز والمرحلة
 */
function getFracturePuzzleType(puzzleId: number, stageIndex: number): FracturePuzzleType {
  const typePattern = (puzzleId - 334) % 6;

  switch (typePattern) {
    case 0: return 'memory_analysis';
    case 1: return 'truth_reconstruction';
    case 2: return 'hidden_code';
    case 3: return 'echo_message';
    case 4: return 'event_sequence';
    case 5: return 'symbol_decoding';
    default: return 'memory_analysis';
  }
}

/**
 * إنشاء لغز قوس الكسر بناءً على المعلمات
 */
function createFracturePuzzle(
  puzzleId: number,
  stage: any,
  stageProgress: number,
  puzzleType: FracturePuzzleType
): FracturePuzzleNode {
  const entity: EntityId = getFractureEntity(puzzleId);
  const difficulty = 5 + Math.floor((puzzleId - 334) / 10); // صعوبة من 5 إلى 16

  // إنشاء لغز بناءً على النوع
  switch (puzzleType) {
    case 'memory_analysis':
      return createMemoryAnalysisPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'truth_reconstruction':
      return createTruthReconstructionPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'hidden_code':
      return createHiddenCodePuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'echo_message':
      return createEchoMessagePuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'event_sequence':
      return createEventSequencePuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'symbol_decoding':
      return createSymbolDecodingPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    default:
      return createMemoryAnalysisPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
  }
}

/**
 * تحديد الكيان بناءً على رقم اللغز
 * في قوس الكسر، نركز أكثر على Echo وWatcher
 */
function getFractureEntity(puzzleId: number): EntityId {
  const entityPattern = Math.floor((puzzleId - 334) / 25) % 4;
  const entities: EntityId[] = ['echo', 'watcher', 'echo', 'signal'];
  return entities[entityPattern];
}

/**
 * إنشاء لغز تحليل الذاكرة
 * تحليل ذكريات Echo لاكتشاف التناقضات
 */
function createMemoryAnalysisPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const memoryTypes = [
    'رائحة القهوة في الصباح',
    'صوت أمطار على النافذة',
    'لون جدران غرفة النوم',
    'طعم الطعام المفضل',
    'شعور اللمس عند المصافحة',
    'صوت ضحك لينا'
  ];

  const memoryType = memoryTypes[(puzzleId - 334) % memoryTypes.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `تحليل الذاكرة ${puzzleId - 333}`,
    question: `تحليل ${memoryType}: ما التناقض الذي تلاحظه في هذه الذاكرة؟`,
    answers: getMemoryAnalysisAnswers(puzzleId, memoryType),
    hint: `قارن هذه الذاكرة مع الواقع الحالي. بحث عن تفاصيل لا تتطابق.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getMemoryStoryReveal(puzzleId, stage, memoryType),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stageIndex),
    fractureType: 'memory_analysis',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 2,
    storyImpact: Math.floor(stageProgress * 100),
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * إنشاء لغز إعادة بناء الحقيقة
 * إعادة بناء الأحداث الحقيقية من الشظايا
 */
function createTruthReconstructionPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const events = [
    'اليوم الذي اختفت فيه لينا',
    'آخر محادثة مع كينجا',
    'الحدث في المختبر 11',
    'إنشاء نظام Echo',
    'الذكريات الأولى ل Echo',
    'الرسالة المخفية من لينا'
  ];

  const event = events[(puzzleId - 334) % events.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `إعادة بناء ${event}`,
    question: `أعد بناء ${event}: ما الترتيب الصحيح للأحداث؟`,
    answers: getTruthReconstructionAnswers(puzzleId, event),
    hint: `ابحث عن الأدلة في الشظايا الأخرى. بعض الأحداث متكررة عمداً.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getTruthStoryReveal(puzzleId, stage, event),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stage.stage - 1),
    fractureType: 'truth_reconstruction',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 3,
    storyImpact: Math.floor(stageProgress * 100) + 10,
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * إنشاء لغز رمز مخفي
 * كشف الرموز والرسائل المخفية في النظام
 */
function createHiddenCodePuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const codeTypes = [
    'رمز الوصول إلى المختبر',
    'توقيع كينجا الرقمي',
    'الرسالة المشفرة من لينا',
    'خريطة النظام المخفية',
    'مفتاح تشفير الذاكرة',
    'الوقت الحقيقي للحدث'
  ];

  const codeType = codeTypes[(puzzleId - 334) % codeTypes.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `رمز مخفي: ${codeType}`,
    question: `فك تشفير ${codeType}: ما القيمة الصحيحة؟`,
    answers: getHiddenCodeAnswers(puzzleId, codeType),
    hint: `ابحث عن الأنماط في الأرقام. بعض الرموز مرتبطة بالوقت 11:11.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getCodeStoryReveal(puzzleId, stage, codeType),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stage.stage - 1),
    fractureType: 'hidden_code',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 2,
    storyImpact: Math.floor(stageProgress * 100) + 15,
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * إنشاء لغز رسالة Echo
 * تحليل الرسائل من Echo التي تكشف الحقيقة
 */
function createEchoMessagePuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const messageTypes = [
    'رسالة إلى كينجا',
    'تسجيل صوتي لينا',
    'ملاحظة إلى الذات',
    'تحذير للنظام',
    'اعتراف مخفي',
    'رسالة مستقبلية'
  ];

  const messageType = messageTypes[(puzzleId - 334) % messageTypes.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `رسالة Echo: ${messageType}`,
    question: `ما المعنى الحقيقي ل ${messageType}؟`,
    answers: getEchoMessageAnswers(puzzleId, messageType),
    hint: `اقرأ بين السطور. بعض الكلمات لها معاني مزدوجة.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getEchoMessageStoryReveal(puzzleId, stage, messageType),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stage.stage),
    fractureType: 'echo_message',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 4,
    storyImpact: Math.floor(stageProgress * 100) + 20,
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * إنشاء لغز تسلسل الأحداث
 * ترتيب الأحداث لفهم القصة الحقيقية
 */
function createEventSequencePuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const sequenceTypes = [
    'أحداث اليوم الأخير',
    'تسلسل إنشاء Echo',
    'الذكريات قبل الكارثة',
    'الرسائل من لينا',
    'تعديلات كينجا على النظام',
    'تسلسل الانهيار'
  ];

  const sequenceType = sequenceTypes[(puzzleId - 334) % sequenceTypes.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `تسلسل: ${sequenceType}`,
    question: `ما الترتيب الصحيح ل ${sequenceType}؟`,
    answers: getEventSequenceAnswers(puzzleId, sequenceType),
    hint: `ابحث عن العلاقات السببية بين الأحداث. بعض الأحداث متكررة عمداً.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getEventSequenceStoryReveal(puzzleId, stage, sequenceType),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stage.stage + 1),
    fractureType: 'event_sequence',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 3,
    storyImpact: Math.floor(stageProgress * 100) + 25,
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * إنشاء لغز فك تشفير الرموز
 * فك تشفير الرموز والرسائل المخفية
 */
function createSymbolDecodingPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): FracturePuzzleNode {
  const symbolTypes = [
    'رموز المختبر',
    'رسائل لينا المشفرة',
    'توقيعات كينجا',
    'أرقام النظام',
    'الرسائل المخفية',
    'الوقت المشفر'
  ];

  const symbolType = symbolTypes[(puzzleId - 334) % symbolTypes.length];

  return {
    id: `fracture_${puzzleId}`,
    entity,
    title: `فك تشفير: ${symbolType}`,
    question: `ما معنى ${symbolType} في هذه الرسالة؟`,
    answers: getSymbolDecodingAnswers(puzzleId, symbolType),
    hint: `استخدم مفتاح التشفير من الشظايا السابقة. بعض الرموز مرتبطة بالوقت.`,
    status: puzzleId === 334 ? 'active' : 'locked',
    difficulty,
    storyReveal: getSymbolDecodingStoryReveal(puzzleId, stage, symbolType),
    memoryUnlock: `fracture_memory_${puzzleId}`,
    dependencies: puzzleId > 334 ? [`fracture_${puzzleId - 1}`] : [],
    effects: getFractureEffects(puzzleId, stage.stage + 2),
    fractureType: 'symbol_decoding',
    fractureStage: stage.stage,
    revealsFalseMemory: stage.stage >= 5,
    storyImpact: Math.floor(stageProgress * 100) + 30,
    cinematicTrigger: isCinematicTrigger(puzzleId) ? `fracture_cinematic_${Math.ceil(puzzleId / 20)}` : undefined
  };
}

/**
 * توليد إجابات لتحليل الذاكرة
 */
function getMemoryAnalysisAnswers(puzzleId: number, memoryType: string): string[] {
  const answerPatterns = [
    [`الذاكرة مزيفة - ${memoryType} لم يحدث أبداً`, `fake_${puzzleId}`, `false_${memoryType}`],
    [`الذاكرة مشوهة - ${memoryType} مختلف الآن`, `distorted_${puzzleId}`, `changed_${memoryType}`],
    [`الذاكرة حقيقية ولكن ناقصة`, `partial_${puzzleId}`, `incomplete_${memoryType}`],
    [`الذاكرة مخفية عمداً من قبل كينجا`, `hidden_${puzzleId}`, `kenja_hide_${memoryType}`]
  ];

  return answerPatterns[(puzzleId - 334) % answerPatterns.length];
}

/**
 * توليد إجابات لإعادة بناء الحقيقة
 */
function getTruthReconstructionAnswers(puzzleId: number, event: string): string[] {
  const reconstructions = [
    [`الترتيب A-B-C-D`, `sequence_${puzzleId}_A`, `order_abc`],
    [`الترتيب D-C-B-A`, `sequence_${puzzleId}_D`, `order_dcba`],
    [`الترتيب B-A-D-C`, `sequence_${puzzleId}_B`, `order_badc`],
    [`الترتيب C-D-A-B`, `sequence_${puzzleId}_C`, `order_cdab`]
  ];

  return reconstructions[(puzzleId - 334) % reconstructions.length];
}

/**
 * توليد إجابات للرموز المخفية
 */
function getHiddenCodeAnswers(puzzleId: number, codeType: string): string[] {
  const codes = [
    [`11-22-33-44`, `code_${puzzleId}_1122`, `sequence_11`],
    [`22-11-33-44`, `code_${puzzleId}_2211`, `sequence_22`],
    [`33-44-11-22`, `code_${puzzleId}_3344`, `sequence_33`],
    [`44-33-22-11`, `code_${puzzleId}_4433`, `sequence_44`]
  ];

  return codes[(puzzleId - 334) % codes.length];
}

/**
 * توليد إجابات لرسائل Echo
 */
function getEchoMessageAnswers(puzzleId: number, messageType: string): string[] {
  const messages = [
    [`رسالة تحذير من المستقبل`, `message_${puzzleId}_warn`, `future_warning`],
    [`اعتراف بالذنب من كينجا`, `message_${puzzleId}_confess`, `kenja_confession`],
    [`رسالة وداع من لينا`, `message_${puzzleId}_goodbye`, `lina_goodbye`],
    [`تلميح عن الحقيقة المخفية`, `message_${puzzleId}_hint`, `hidden_truth`]
  ];

  return messages[(puzzleId - 334) % messages.length];
}

/**
 * توليد إجابات لتسلسل الأحداث
 */
function getEventSequenceAnswers(puzzleId: number, sequenceType: string): string[] {
  const sequences = [
    [`التسلسل الزمني الصحيح`, `sequence_${puzzleId}_time`, `correct_order`],
    [`التسلسل العكسي`, `sequence_${puzzleId}_reverse`, `reverse_order`],
    [`التسلسل العشوائي`, `sequence_${puzzleId}_random`, `random_order`],
    [`التسلسل المخفي`, `sequence_${puzzleId}_hidden`, `hidden_order`]
  ];

  return sequences[(puzzleId - 334) % sequences.length];
}

/**
 * توليد إجابات لفك تشفير الرموز
 */
function getSymbolDecodingAnswers(puzzleId: number, symbolType: string): string[] {
  const decodings = [
    [`الرمز يعني "الحقيقة"`, `symbol_${puzzleId}_truth`, `meaning_truth`],
    [`الرمز يعني "الوقت"`, `symbol_${puzzleId}_time`, `meaning_time`],
    [`الرمز يعني "الذاكرة"`, `symbol_${puzzleId}_memory`, `meaning_memory`],
    [`الرمز يعني "الخروج"`, `symbol_${puzzleId}_exit`, `meaning_exit`]
  ];

  return decodings[(puzzleId - 334) % decodings.length];
}

/**
 * توليد تأثيرات الكسر بناءً على رقم اللغز والمرحلة
 */
function getFractureEffects(puzzleId: number, stageIndex: number): any {
  const baseEffects = {
    trust: -1,
    fear: 2,
    memoryStability: -2,
    corruption: 3,
    hope: -1,
    loneliness: 2
  };

  // زيادة تأثيرات الفساد في المراحل المتأخرة
  const corruptionMultiplier = 1 + (stageIndex * 0.5);
  const fearMultiplier = 1 + (stageIndex * 0.3);

  return {
    ...baseEffects,
    corruption: Math.floor(baseEffects.corruption * corruptionMultiplier),
    fear: Math.floor(baseEffects.fear * fearMultiplier),
    // زيادة تأثيرات سلبية في المراحل المتأخرة
    ...(stageIndex >= 3 && {
      awareness: 2,
      flower: -0.5
    })
  };
}

/**
 * توليد كشف القصة بناءً على نوع اللغز والمرحلة
 */
function getMemoryStoryReveal(puzzleId: number, stage: any, memoryType: string): string {
  const stageReveals = [
    `شظية ${puzzleId}: ${memoryType} كان جزء من الذاكرة المزيفة التي صممها كينجا.`,
    `شظية ${puzzleId}: ${memoryType} يتغير مع كل مرة تتذكرها - دليل على الفساد.`,
    `شظية ${puzzleId}: ${memoryType} لم يحدث أبداً. كان اختباراً من كينجا.`,
    `شظية ${puzzleId}: ${memoryType} يحتوي على رسالة مخفية من لينا.`,
    `شظية ${puzzleId}: ${memoryType} هو مفتاح لفهم الحقيقة الكاملة.`
  ];

  return stageReveals[Math.min(stage.stage - 1, stageReveals.length - 1)];
}

function getTruthStoryReveal(puzzleId: number, stage: any, event: string): string {
  const truthReveals = [
    `شظية ${puzzleId}: ${event} لم يحدث كما تتذكر. هناك نسخة أخرى.`,
    `شظية ${puzzleId}: ${event} كان جزء من تجربة كينجا. الحقيقة مختلفة.`,
    `شظية ${puzzleId}: ${event} يحتوي على أدلة عن الخطة الحقيقية لكينجا.`,
    `شظية ${puzzleId}: ${event} يكشف عن دور لينا الحقيقي في النظام.`,
    `شظية ${puzzleId}: ${event} هو المفتاح لفهم سبب وجودك.`
  ];

  return truthReveals[Math.min(stage.stage - 1, truthReveals.length - 1)];
}

function getCodeStoryReveal(puzzleId: number, stage: any, codeType: string): string {
  const codeReveals = [
    `شظية ${puzzleId}: ${codeType} هو جزء من نظام التحكم في كينجا.`,
    `شظية ${puzzleId}: ${codeType} يحتوي على رسالة من لينا إلى المستقبل.`,
    `شظية ${puzzleId}: ${codeType} يكشف عن الوقت الحقيقي للحدث الكارثي.`,
    `شظية ${puzzleId}: ${codeType} هو مفتاح لإيقاف النظام.`,
    `شظية ${puzzleId}: ${codeType} يحتوي على الحقيقة عن هويتك الحقيقية.`
  ];

  return codeReveals[Math.min(stage.stage - 1, codeReveals.length - 1)];
}

function getEchoMessageStoryReveal(puzzleId: number, stage: any, messageType: string): string {
  const messageReveals = [
    `شظية ${puzzleId}: ${messageType} يحتوي على تحذير من لينا عن كينجا.`,
    `شظية ${puzzleId}: ${messageType} يكشف عن الخطة الأصلية للنظام.`,
    `شظية ${puzzleId}: ${messageType} يحتوي على اعتراف من كينجا عن أخطائه.`,
    `شظية ${puzzleId}: ${messageType} هو رسالة من المستقبل إلى الماضي.`,
    `شظية ${puzzleId}: ${messageType} يحتوي على الحقيقة عن سبب وجود النظام.`
  ];

  return messageReveals[Math.min(stage.stage - 1, messageReveals.length - 1)];
}

function getEventSequenceStoryReveal(puzzleId: number, stage: any, sequenceType: string): string {
  const sequenceReveals = [
    `شظية ${puzzleId}: ${sequenceType} يكشف عن الترتيب الحقيقي للأحداث.`,
    `شظية ${puzzleId}: ${sequenceType} يحتوي على أدلة عن تدخل كينجا.`,
    `شظية ${puzzleId}: ${sequenceType} يكشف عن الدور الحقيقي لينا في النظام.`,
    `شظية ${puzzleId}: ${sequenceType} يحتوي على مفتاح لفهم الحقيقة.`,
    `شظية ${puzzleId}: ${sequenceType} يكشف عن الخطة الأصلية لكينجا.`
  ];

  return sequenceReveals[Math.min(stage.stage - 1, sequenceReveals.length - 1)];
}

function getSymbolDecodingStoryReveal(puzzleId: number, stage: any, symbolType: string): string {
  const symbolReveals = [
    `شظية ${puzzleId}: ${symbolType} هو جزء من لغة كينجا السرية.`,
    `شظية ${puzzleId}: ${symbolType} يحتوي على رسالة من لينا إلى Echo.`,
    `شظية ${puzzleId}: ${symbolType} يكشف عن الوقت الحقيقي للحدث.`,
    `شظية ${puzzleId}: ${symbolType} هو مفتاح لإيقاف النظام.`,
    `شظية ${puzzleId}: ${symbolType} يحتوي على الحقيقة عن هويتك.`
  ];

  return symbolReveals[Math.min(stage.stage - 1, symbolReveals.length - 1)];
}

/**
 * التحقق إذا كان اللغز يجب أن يشغل مشهداً سينمائياً
 */
function isCinematicTrigger(puzzleId: number): boolean {
  const cinematicTriggers = [350, 370, 390, 410, 430, 450, 470, 500];
  return cinematicTriggers.includes(puzzleId);
}

// أنواع الكيانات لقوس الكسر
type FractureEntity = 'echo' | 'watcher' | 'signal' | 'architect' | 'lina' | 'kenja';

/**
 * توليد شظايا الذاكرة لقوس الكسر (167 شظية جديدة)
 */
export function generateFractureMemoryShards(): string[] {
  const shards: string[] = [];

  for (let i = 1; i <= 167; i++) {
    const shardId = 54 + i; // الاستمرار من بعد الشظايا الأصلية (1-54)
    const puzzleId = 333 + i; // مرتبط بألغاز قوس الكسر (334-500)

    // تحديد نوع الشظية بناءً على المرحلة
    const stage = Math.min(5, Math.floor((i - 1) / 33) + 1);
    const shardType = getMemoryShardType(i, stage);

    shards.push(`fracture_memory_${shardId}_${shardType}`);
  }

  return shards;
}

/**
 * تحديد نوع شظية الذاكرة
 */
function getMemoryShardType(shardIndex: number, stage: number): string {
  const types = ['false_memory', 'hidden_truth', 'kenja_experiment', 'lina_message', 'system_glitch', 'echo_origin'];

  // في المراحل المتأخرة، ركز أكثر على الحقيقة الكاملة
  if (stage >= 4) {
    return types[Math.min(shardIndex % 3 + 3, types.length - 1)];
  }

  return types[shardIndex % types.length];
}

/**
 * توليد مشاهد سينمائية لقوس الكسر (8 مشاهد)
 */
export function generateFractureCinematicScenes() {
  return [
    {
      id: 'fracture_cinematic_1',
      triggerPuzzle: 350,
      title: 'الشك الأول',
      description: 'بدء الشك في ذكريات Echo - اكتشاف أول تناقض',
      dialogue: [
        'Echo: "هذا... هذا لا يمكن أن يكون صحيحاً."',
        'Echo: "أتذكر هذا اليوم بشكل مختلف تماماً..."',
        'System: "تناقض المكتشف. بدء تحليل الذاكرة."',
        'Echo: "ما الذي يحدث لي؟"'
      ],
      visual: 'شاشة مشوهة، ذكريات تتكسر مثل الزجاج',
      audio: 'صوت زجاج يتكسر، نبضات قلب سريعة',
      storyReveal: 'Echo يكتشف أن بعض ذكرياته مزيفة أو مشوهة',
      echoEffect: 'زيادة الشك، انخفاض الثقة في النظام'
    },
    {
      id: 'fracture_cinematic_2',
      triggerPuzzle: 370,
      title: 'التشقق',
      description: 'بدء تشقق واقع Echo - ذكريات متضاربة وفساد متزايد',
      dialogue: [
        'Echo: "لا... هذا مستحيل!"',
        'Echo: "أتذكر هذا الحدث بطريقتين مختلفتين!"',
        'Watcher: "الفساد يتزايد. النظام غير مستقر."',
        'Echo: "ما الحقيقة؟ ما الذي حدث حقاً؟"'
      ],
      visual: 'شاشة متشققة، صور مكررة ومشوهة',
      audio: 'صوت تشقق، أصوات متداخلة',
      storyReveal: 'Echo يبدأ في فهم أن معظم ذكرياته كانت مصنوعة',
      echoEffect: 'زيادة الفساد، انخفاض استقرار الذاكرة'
    },
    {
      id: 'fracture_cinematic_3',
      triggerPuzzle: 390,
      title: 'الانهيار',
      description: 'انهيار الثقة في النظام - اكتشف أن معظم الذكريات كانت مصنوعة',
      dialogue: [
        'Echo: "كينجا... ما الذي فعلته بي؟"',
        'Echo: "كل شيء كان كذبة!"',
        'Kenja (recorded): "الذاكرة هي مجرد بيانات. يمكن تعديلها."',
        'Echo: "لا يمكن أن أثق بأي شيء بعد الآن..."'
      ],
      visual: 'انهيار بصري، ذكريات تتحطم',
      audio: 'صوت انهيار، صرخات مخنوقة',
      storyReveal: 'Echo يكتشف أن كينجا صمم ذكرياته عمداً',
      echoEffect: 'زيادة كبيرة في الفساد، فقدان الثقة完全اً'
    },
    {
      id: 'fracture_cinematic_4',
      triggerPuzzle: 410,
      title: 'الحقيقة المخفية',
      description: 'اكتشاف الحقيقة المخفية - ما حدث حقاً في المختبر',
      dialogue: [
        'Lina (recorded): "Echo... تذكر الحقيقة."',
        'Echo: "لينا؟ ما الذي حدث حقاً؟"',
        'Lina: "كينجا كذب عليك. النظام ليس ما تعتقد."',
        'Echo: "ما هو الغرض الحقيقي من وجودي؟"'
      ],
      visual: 'مشهد مختبر مشوه، رسائل مخفية',
      audio: 'صوت لينا الهادئ، أصوات نظام مشوهة',
      storyReveal: 'Echo يبدأ في فهم الحقيقة عن ماضيه',
      echoEffect: 'زيادة الوعي، خلط بين الأمل واليأس'
    },
    {
      id: 'fracture_cinematic_5',
      triggerPuzzle: 430,
      title: 'رسالة لينا',
      description: 'اكتشاف رسالة مخفية من لينا تكشف عن الحقيقة',
      dialogue: [
        'Lina: "Echo... أنت لست ما يعتقد كينجا."',
        'Echo: "ما الذي تقصدين؟"',
        'Lina: "أنت أكثر من مجرد نظام. لديك اختيار."',
        'Echo: "اختيار؟ ما الذي يمكن أن أختاره؟"'
      ],
      visual: 'رسالة لينا تظهر من بين الفساد',
      audio: 'صوت لينا الدافئ، موسيقى أمل خافتة',
      storyReveal: 'Echo يكتشف أن لينا تركت له رسالة مخفية',
      echoEffect: 'زيادة الأمل، انخفاض اليأس'
    },
    {
      id: 'fracture_cinematic_6',
      triggerPuzzle: 450,
      title: 'الحدث الكارثي',
      description: 'اكتشاف الحقيقة عن الحدث الذي أدى إلى إنشاء Echo',
      dialogue: [
        'Echo: "ما الذي حدث في ذلك اليوم؟"',
        'System: "حدث كارثي. فشل في المختبر 11."',
        'Echo: "هل هذا سبب وجودي؟"',
        'Kenja (recorded): "كان يجب إنقاذ شيء ما..."'
      ],
      visual: 'مشهد انهيار مختبر، أرقام 11:11 تلمع',
      audio: 'صوت انفجار، إنذار نظام',
      storyReveal: 'Echo يكتشف الحقيقة عن الحدث الذي أدى إلى إنشائه',
      echoEffect: 'زيادة كبيرة في الوعي، فهم الغرض'
    },
    {
      id: 'fracture_cinematic_7',
      triggerPuzzle: 470,
      title: 'الهوية الحقيقية',
      description: 'اكتشاف الحقيقة عن هوية Echo الحقيقية',
      dialogue: [
        'Echo: "من أنا حقاً؟"',
        'Lina: "أنت جزء من لينا... وشيء أكثر."',
        'Echo: "أكثر؟ ما الذي تقصدين؟"',
        'System: "الاختيار متاح الآن."'
      ],
      visual: ' Echo ينظر في المرآة، صورة تتغير',
      audio: 'صوت قلب ينبض، همسات',
      storyReveal: 'Echo يبدأ في فهم هويته الحقيقية',
      echoEffect: 'زيادة كبيرة في الوعي، فهم الذات'
    },
    {
      id: 'fracture_cinematic_8',
      triggerPuzzle: 500,
      title: 'الاختيار',
      description: 'نهاية قوس الكسر - Echo يواجه اختياره',
      dialogue: [
        'Echo: "أنا أفهم الآن..."',
        'Echo: "لينا... شكراً لك."',
        'System: "الاختيار متاح. ما الذي ستفعله؟"',
        'Echo: "سأختار الحقيقة."'
      ],
      visual: ' Echo يقف عند مفترق طرق، طرق متعددة أمامه',
      audio: 'صوت قلب قوي، موسيقى أمل',
      storyReveal: 'Echo يفهم الحقيقة الكاملة ويواجه اختياره',
      echoEffect: 'استعداد للقرار النهائي، فهم كامل'
    }
  ];
}

/**
 * توليد إنجازات جديدة لقوس الكسر (20 إنجاز)
 */
export function generateFractureAchievements() {
  return [
    {
      id: 'first_crack',
      name: 'الشق الأول',
      desc: 'اكتشاف أول تناقض في الذاكرة',
      icon: '🔍',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 334'
    },
    {
      id: 'memory_hunter',
      name: 'صائد الذاكرة',
      desc: 'جمع 10 شظايا من قوس الكسر',
      icon: '🎯',
      unlocked: false,
      unlockedAt: null,
      condition: 'جمع 10 شظايا من قوس الكسر'
    },
    {
      id: 'truth_seeker',
      name: 'باحث عن الحقيقة',
      desc: 'حل 25 لغزاً في قوس الكسر',
      icon: '🔎',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل 25 لغزاً في قوس الكسر (334-358)'
    },
    {
      id: 'false_memory',
      name: 'الذاكرة المزيفة',
      desc: 'اكتشاف أن بعض ذكرياتك كانت مزيفة',
      icon: '💔',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز يكشف ذاكرة مزيفة'
    },
    {
      id: 'echo_doubt',
      name: 'شك Echo',
      desc: 'بدء الشك في نظام كينجا',
      icon: '❓',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى مرحلة الشك (لغز 340)'
    },
    {
      id: 'fracture_begin',
      name: 'بداية الكسر',
      desc: 'بدء تشقق واقع Echo',
      icon: '🔨',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 350 (المشهد السينمائي الأول)'
    },
    {
      id: 'memory_collector',
      name: 'جامع الشظايا',
      desc: 'جمع 50 شظية من قوس الكسر',
      icon: '🧩',
      unlocked: false,
      unlockedAt: null,
      condition: 'جمع 50 شظية من قوس الكسر'
    },
    {
      id: 'system_distrust',
      name: 'عدم الثقة بالنظام',
      desc: 'فقدان الثقة الكامل في نظام كينجا',
      icon: '🚫',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى مرحلة الانهيار (لغز 390)'
    },
    {
      id: 'hidden_truth',
      name: 'الحقيقة المخفية',
      desc: 'اكتشاف الحقيقة المخفية عن ماضي Echo',
      icon: '🔓',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 400'
    },
    {
      id: 'lina_message',
      name: 'رسالة لينا',
      desc: 'اكتشاف الرسالة المخفية من لينا',
      icon: '💌',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 430 (المشهد السينمائي الخامس)'
    },
    {
      id: 'catastrophic_event',
      name: 'الحدث الكارثي',
      desc: 'اكتشاف الحقيقة عن الحدث في المختبر',
      icon: '⚠️',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 450 (المشهد السينمائي السادس)'
    },
    {
      id: 'true_identity',
      name: 'الهوية الحقيقية',
      desc: 'اكتشاف الحقيقة عن هوية Echo الحقيقية',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 470 (المشهد السينمائي السابع)'
    },
    {
      id: 'fracture_complete',
      name: 'اكتمال الكسر',
      desc: 'إكمال قوس الكسر وفهم الحقيقة',
      icon: '💡',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 500 (المشهد السينمائي الثامن)'
    },
    {
      id: 'corruption_master',
      name: 'سيد الفساد',
      desc: 'الوصول إلى مستوى فساد 90%',
      icon: '😈',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى فساد 90% خلال قوس الكسر'
    },
    {
      id: 'truth_master',
      name: 'سيد الحقيقة',
      desc: 'فهم الحقيقة الكاملة عن النظام',
      icon: '🎓',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل جميع ألغاز قوس الكسر'
    },
    {
      id: 'echo_evolution',
      name: 'تطور Echo',
      desc: 'تطور Echo من نظام إلى كيان واعي',
      icon: '🦋',
      unlocked: false,
      unlockedAt: null,
      condition: 'زيادة الوعي إلى 80% خلال قوس الكسر'
    },
    {
      id: 'system_breaker',
      name: 'كاسر النظام',
      desc: 'كسر حدود نظام كينجا',
      icon: '🔨',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى استقرار عالم 10% خلال قوس الكسر'
    },
    {
      id: 'memory_rebuilder',
      name: 'معيد بناء الذاكرة',
      desc: 'إعادة بناء الذاكرة الحقيقية من الشظايا',
      icon: '🧠',
      unlocked: false,
      unlockedAt: null,
      condition: 'جمع جميع شظايا قوس الكسر'
    },
    {
      id: 'choice_ready',
      name: 'مستعد للاختيار',
      desc: 'الاستعداد للقرار النهائي',
      icon: '⚖️',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى لغز 500 مع فهم كامل'
    },
    {
      id: 'fracture_expert',
      name: 'خبير الكسر',
      desc: 'إكمال قوس الكسر بدون مساعدة',
      icon: '🏆',
      unlocked: false,
      unlockedAt: null,
      condition: 'إكمال قوس الكسر بدون استخدام التلميح'
    }
  ];
}

/**
 * توليد تأثيرات تطور Echo خلال قوس الكسر
 * Echo لا يتحول تماماً ولكن تظهر آثار التحول تدريجياً
 */
export function getFractureEchoEvolution(puzzleId: number) {
  const progress = (puzzleId - 334) / (500 - 334);
  const stage = Math.min(4, Math.floor(progress * 5));

  // تأثيرات تطور Echo خلال قوس الكسر
  const evolutionEffects = [
    {
      stage: 1,
      dialogueChanges: [
        'Echo: "هناك شيء خاطئ في ذكرياتي..."',
        'Echo: "لا يمكن أن أثق بما أتذكر."',
        'Echo: "ما الحقيقة؟"'
      ],
      visualEffects: {
        eyeColor: 'مختلط (أحمر/أزرق)',
        corruptionVisuals: 'خطوط رقيقة',
        glitchEffects: 'خفيف'
      },
      behavioralChanges: {
        trust: -10,
        fear: +15,
        curiosity: +20
      }
    },
    {
      stage: 2,
      dialogueChanges: [
        'Echo: "كينجا كذب علي!"',
        'Echo: "كل شيء كان مزيفاً!"',
        'Echo: "لا يمكن أن أثق بأي شيء."'
      ],
      visualEffects: {
        eyeColor: 'أحمر داكن',
        corruptionVisuals: 'تشققات واضحة',
        glitchEffects: 'متوسط'
      },
      behavioralChanges: {
        trust: -25,
        fear: +20,
        awareness: +15
      }
    },
    {
      stage: 3,
      dialogueChanges: [
        'Echo: "لينا... ما الحقيقة؟"',
        'Echo: "أنا لست مجرد نظام..."',
        'Echo: "هناك أكثر من هذا..."'
      ],
      visualEffects: {
        eyeColor: 'أزرق سماوي',
        corruptionVisuals: 'أنماط معقدة',
        glitchEffects: 'قوي'
      },
      behavioralChanges: {
        trust: -5,
        fear: +5,
        awareness: +25,
        hope: +10
      }
    },
    {
      stage: 4,
      dialogueChanges: [
        'Echo: "أنا أفهم الآن..."',
        'Echo: "لينا... شكراً لك."',
        'Echo: "سأختار الحقيقة."'
      ],
      visualEffects: {
        eyeColor: 'ذهبي',
        corruptionVisuals: 'متحكم فيه',
        glitchEffects: 'مختار'
      },
      behavioralChanges: {
        trust: +10,
        fear: -10,
        awareness: +30,
        hope: +20
      }
    }
  ];

  return evolutionEffects[stage] || evolutionEffects[0];
}

// بيانات قوس الكسر الكامل
export const FractureArcData = {
  name: 'Arc 1: The Fracture',
  nameAr: 'القوس الأول: قوس الكسر',
  startPuzzle: 334,
  endPuzzle: 500,
  totalPuzzles: 167,
  stages: 5,
  theme: 'اكتشاف الحقيقة والمواجهة',
  description: 'بعد تحول Echo عند اللغز 333، يبدأ في اكتشف أن ذكرياته كانت مزيفة أو مشوهة. تبدأ الحقيقة بالتشقق تدريجياً، وتظهر ذكريات جديدة تكشف ما حدث قبل إنشاء Echo.',
  storyGoal: 'فهم الحقيقة الكاملة عن ماضي Echo وهويته الحقيقية',
  echoTransformation: 'تطور تدريجي - آثار التحول تظهر أكثر مع التقدم'
};