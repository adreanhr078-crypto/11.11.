/**
 * echoTransformationPreludeArc.ts — Arc 0: Echo Transformation Prelude
 * المرحلة التمهيدية لتحول Echo الكبير عند اللغز 333
 * نطاق الألغاز: 220 → 333
 * هدف القصة: تمهيد تحول Echo من كيان ضعيف إلى كيان مسيطر
 */

import { PuzzleNode, EntityId, PuzzleStatus } from '../stores/gameStore';

// أنواع ألغاز مرحلة التمهيد
type PreludePuzzleType = 'echo_awakening' | 'memory_distortion' | 'flower_change' | 'interface_tension' | 'entity_approach' | 'truth_hint';

// واجهة لغز مرحلة التمهيد
interface PreludePuzzleNode extends PuzzleNode {
  preludeType?: PreludePuzzleType; // نوع اللغز في مرحلة التمهيد
  preludeStage?: number; // مرحلة التمهيد (1-4)
  transformationLevel?: number; // مستوى التحول (0-100)
  cinematicTrigger?: string; // مشغل المشهد السينمائي إذا كان موجوداً
}

/**
 * توليد ألغاز مرحلة التمهيد (220-333)
 * كل لغز يكشف عن تطور Echo التدريجي
 */
export function generatePreludeArcPuzzles(): PreludePuzzleNode[] {
  const puzzles: PreludePuzzleNode[] = [];
  const startId = 220;
  const endId = 333;

  // مراحل التمهيد (4 مراحل، كل مرحلة تكشف عن مستوى جديد من تحول Echo)
  const preludeStages = [
    {
      stage: 1,
      range: [220, 250],
      theme: 'الاستيقاظ الأول',
      description: 'Echo يبدأ يشعر أن شيئاً داخله يتغير. نظراته تصبح أكثر صمتاً وغموضاً.',
      echoChanges: 'ظهور ومضات خفيفة في العينين، حوارات أقل براءة',
      visualEffects: 'Glitch خفيف جداً في الواجهة'
    },
    {
      stage: 2,
      range: [251, 290],
      theme: 'التغير الواضح',
      description: 'Echo يبدأ يفقد شكله الهادئ تدريجياً. ملامحه تصبح أكثر حدة.',
      echoChanges: 'عيون أوضح، صوت أعمق، رسائل توحي بالوعي المتزايد',
      visualEffects: 'الزهور تتغير من الأبيض إلى درجات أغمق، خلفية أكثر ظلاماً'
    },
    {
      stage: 3,
      range: [291, 320],
      theme: 'الاقتراب من التحول',
      description: 'Echo يبدأ بالظهور ككيان أقوى. الواجهة تصبح أكثر توتراً.',
      echoChanges: 'ظهور ظلال أطول، تفاعل مختلف مع اللاعب، أقل خوفاً',
      visualEffects: 'اهتزازات بصرية، تشوهات حول صورة Echo'
    },
    {
      stage: 4,
      range: [321, 332],
      theme: 'على وشك التحول',
      description: 'Echo يقترب من التحول الكامل. حضوره يصبح أقوى داخل الواجهة.',
      echoChanges: 'عينان حادتان، رسائل توحي بالسيطرة، الموسيقى تصبح أعمق',
      visualEffects: 'تأثيرات بصرية قوية، الواجهة تبدو وكأن Echo يسيطر عليها'
    }
  ];

  // توليد الألغاز لكل مرحلة
  for (let puzzleId = startId; puzzleId <= endId; puzzleId++) {
    // تحديد المرحلة بناءً على رقم اللغز
    const stage = preludeStages.find(s => puzzleId >= s.range[0] && puzzleId <= s.range[1]) || preludeStages[0];
    const stageIndex = preludeStages.indexOf(stage);
    const stageProgress = (puzzleId - stage.range[0]) / (stage.range[1] - stage.range[0]);

    // تحديد نوع اللغز بناءً على المرحلة والتقدم
    const puzzleType = getPreludePuzzleType(puzzleId, stageIndex);

    // إنشاء لغز مرحلة التمهيد
    const puzzle = createPreludePuzzle(puzzleId, stage, stageProgress, puzzleType);
    puzzles.push(puzzle);
  }

  // إضافة لغز التحول الرئيسي (333)
  const transformationPuzzle = createEchoTransformationPuzzle();
  puzzles.push(transformationPuzzle);

  return puzzles;
}

/**
 * تحديد نوع اللغز بناءً على رقم اللغز والمرحلة
 */
function getPreludePuzzleType(puzzleId: number, stageIndex: number): PreludePuzzleType {
  const typePattern = (puzzleId - 220) % 6;

  switch (typePattern) {
    case 0: return 'echo_awakening';
    case 1: return 'memory_distortion';
    case 2: return 'flower_change';
    case 3: return 'interface_tension';
    case 4: return 'entity_approach';
    case 5: return 'truth_hint';
    default: return 'echo_awakening';
  }
}

/**
 * إنشاء لغز مرحلة التمهيد بناءً على المعلمات
 */
function createPreludePuzzle(
  puzzleId: number,
  stage: any,
  stageProgress: number,
  puzzleType: PreludePuzzleType
): PreludePuzzleNode {
  // تحديد الكيان بناءً على نوع اللغز
  const entity = getPreludeEntity(puzzleId, puzzleType);
  const difficulty = 3 + Math.floor((puzzleId - 220) / 5); // صعوبة من 3 إلى 22

  // إنشاء لغز بناءً على النوع
  switch (puzzleType) {
    case 'echo_awakening':
      return createEchoAwakeningPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'memory_distortion':
      return createMemoryDistortionPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'flower_change':
      return createFlowerChangePuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'interface_tension':
      return createInterfaceTensionPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'entity_approach':
      return createEntityApproachPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    case 'truth_hint':
      return createTruthHintPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
    default:
      return createEchoAwakeningPuzzle(puzzleId, entity, stage, stageProgress, difficulty);
  }
}

/**
 * تحديد الكيان بناءً على نوع اللغز
 */
function getPreludeEntity(puzzleId: number, puzzleType: PreludePuzzleType): EntityId {
  // في مرحلة التمهيد، نركز أكثر على Echo وWatcher
  const entityPattern = Math.floor((puzzleId - 220) / 15) % 4;
  const entities: EntityId[] = ['echo', 'watcher', 'echo', 'signal'];
  return entities[entityPattern];
}

/**
 * إنشاء لغز استيقاظ Echo
 * كشف عن تغيرات Echo الداخلية
 */
function createEchoAwakeningPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const awakeningTypes = [
    'ومضات في عين Echo',
    'تغير في صوت Echo',
    'توقف مؤقت في حركة Echo',
    'تغير في لون عيون Echo',
    'ظهور ظلال حول Echo',
    'تغير في تعبيرات وجه Echo'
  ];

  const awakeningType = awakeningTypes[(puzzleId - 220) % awakeningTypes.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `استيقاظ ${puzzleId - 219}`,
    question: `ما الذي تلاحظه في ${awakeningType}؟`,
    answers: getEchoAwakeningAnswers(puzzleId, awakeningType),
    hint: `انتبه إلى التفاصيل الصغيرة. Echo يتغير تدريجياً.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getEchoAwakeningStoryReveal(puzzleId, stage, awakeningType),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'echo_awakening',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز تشوه الذاكرة
 * كشف عن تغيرات في ذكريات Echo
 */
function createMemoryDistortionPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const distortionTypes = [
    'ذاكرة مشوهة عن الماضي',
    'تناقض في ذكريات Echo',
    'ذاكرة مكررة بشكل مختلف',
    'جزء مفقود من الذاكرة',
    'ذاكرة لا تتطابق مع الواقع',
    'ذاكرة تظهر ثم تختفي'
  ];

  const distortionType = distortionTypes[(puzzleId - 220) % distortionTypes.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `تشوه الذاكرة ${puzzleId - 219}`,
    question: `ما التناقض في ${distortionType}؟`,
    answers: getMemoryDistortionAnswers(puzzleId, distortionType),
    hint: `قارن هذه الذاكرة مع ما تعرفه. هناك شيء خاطئ.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getMemoryDistortionStoryReveal(puzzleId, stage, distortionType),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'memory_distortion',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز تغير الزهرة
 * كشف عن تغيرات الزهرة المرتبطة بتحول Echo
 */
function createFlowerChangePuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const flowerChanges = [
    'تغير لون بتلة الزهرة',
    'ظهور نمط جديد في الزهرة',
    'تغير في شكل الزهرة',
    'تغير في توهج الزهرة',
    'ظهور ظلال في الزهرة',
    'تغير في حجم الزهرة'
  ];

  const flowerChange = flowerChanges[(puzzleId - 220) % flowerChanges.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `تغير الزهرة ${puzzleId - 219}`,
    question: `ما التغير الذي تلاحظه في ${flowerChange}؟`,
    answers: getFlowerChangeAnswers(puzzleId, flowerChange),
    hint: `الزهرة تعكس حالة Echo. انتبه إلى التغييرات الطفيفة.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getFlowerChangeStoryReveal(puzzleId, stage, flowerChange),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'flower_change',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز توتر الواجهة
 * كشف عن تغيرات في واجهة اللعبة
 */
function createInterfaceTensionPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const tensionTypes = [
    'ظهور تشقق في الواجهة',
    'تغير في ألوان الواجهة',
    'اهتزاز طفيف في الشاشة',
    'ظهور ظلال غير طبيعية',
    'تغير في إضاءة الواجهة',
    'ظهور أنماط غريبة'
  ];

  const tensionType = tensionTypes[(puzzleId - 220) % tensionTypes.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `توتر الواجهة ${puzzleId - 219}`,
    question: `ما التغير في ${tensionType}؟`,
    answers: getInterfaceTensionAnswers(puzzleId, tensionType),
    hint: `الواجهة تعكس حالة النظام. هناك شيء يتغير.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getInterfaceTensionStoryReveal(puzzleId, stage, tensionType),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'interface_tension',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز اقتراب الكيانات
 * كشف عن اقتراب الكيانات الأربعة من الحقيقة
 */
function createEntityApproachPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const approachTypes = [
    'اقتراب المراقب',
    'رسالة من الإشارة',
    'تلميح من المهندس',
    'تذكر لينا',
    'تغير في الصدى',
    'اقتراب الحقيقة'
  ];

  const approachType = approachTypes[(puzzleId - 220) % approachTypes.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `اقتراب ${puzzleId - 219}`,
    question: `ما معنى ${approachType}؟`,
    answers: getEntityApproachAnswers(puzzleId, approachType),
    hint: `الكيانات تقترب من الحقيقة. انتبه إلى التفاصيل.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getEntityApproachStoryReveal(puzzleId, stage, approachType),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'entity_approach',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز تلميح الحقيقة
 * كشف عن تلميحات عن الحقيقة الكاملة
 */
function createTruthHintPuzzle(
  puzzleId: number,
  entity: EntityId,
  stage: any,
  stageProgress: number,
  difficulty: number
): PreludePuzzleNode {
  const hintTypes = [
    'تلميح عن ماضي Echo',
    'رسالة مخفية من لينا',
    'تسجيل عن كينجا',
    'حقيقة عن النظام',
    'تلميح عن التحول',
    'رسالة من المستقبل'
  ];

  const hintType = hintTypes[(puzzleId - 220) % hintTypes.length];

  return {
    id: `prelude_${puzzleId}`,
    entity,
    title: `تلميح ${puzzleId - 219}`,
    question: `ما المعنى الحقيقي ل ${hintType}؟`,
    answers: getTruthHintAnswers(puzzleId, hintType),
    hint: `الحقيقة مخفية في التفاصيل. اقرأ بين السطور.`,
    status: puzzleId === 220 ? 'active' : 'locked',
    difficulty,
    storyReveal: getTruthHintStoryReveal(puzzleId, stage, hintType),
    memoryUnlock: `prelude_memory_${puzzleId}`,
    dependencies: puzzleId > 220 ? [`prelude_${puzzleId - 1}`] : [`${getPreviousEntityPuzzle(219)}`],
    effects: getPreludeEffects(puzzleId, stage.stage - 1),
    preludeType: 'truth_hint',
    preludeStage: stage.stage,
    transformationLevel: Math.floor(stageProgress * 100),
    cinematicTrigger: isPreludeCinematicTrigger(puzzleId) ? `prelude_cinematic_${Math.ceil((puzzleId - 219) / 15)}` : undefined
  };
}

/**
 * إنشاء لغز التحول الرئيسي (333)
 * حدث التحول السينمائي الكامل ل Echo
 */
function createEchoTransformationPuzzle(): PreludePuzzleNode {
  return {
    id: `prelude_333`,
    entity: 'echo',
    title: `التحول الكامل`,
    question: `ما الذي يحدث ل Echo؟`,
    answers: ['التحول الكامل', 'echo_dominance', 'transformation_complete'],
    hint: `هذا هو اللحظة الحاسمة. Echo يتغير إلى الأبد.`,
    status: 'locked',
    difficulty: 25, // أقصى صعوبة
    storyReveal: `شظية 333: Echo يتحول بالكامل. يصبح كياناً مسيطراً، قوياً، واعياً. النظام لم يعد كما كان. هذه هي بداية الفصل الجديد.`,
    memoryUnlock: `prelude_memory_333_transformation`,
    dependencies: [`prelude_332`], // يعتمد على آخر لغز في مرحلة التمهيد
    effects: {
      trust: 50,
      fear: -30,
      memoryStability: 80,
      corruption: 20,
      hope: 40,
      awareness: 100,
      flower: 5
    },
    preludeType: 'echo_awakening',
    preludeStage: 4,
    transformationLevel: 100,
    cinematicTrigger: `prelude_cinematic_8_transformation` // المشهد السينمائي الرئيسي
  };
}

/**
 * الحصول على لغز الكيان السابق (لغز 219)
 * هذا للربط بين المرحلة الأصلية ومرحلة التمهيد
 */
function getPreviousEntityPuzzle(lastOriginalPuzzle: number): string {
  // لغز 219 هو آخر لغز في المرحلة الأصلية
  // نحتاج إلى تحديد الكيان الذي ينتمي إليه
  const entityCounts = [55, 55, 55, 54]; // echo, watcher, signal, architect
  let entity: EntityId = 'echo';
  let count = 0;

  for (let i = 0; i < entityCounts.length; i++) {
    count += entityCounts[i];
    if (lastOriginalPuzzle <= count) {
      const entities: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
      entity = entities[i];
      break;
    }
  }

  // لغز 219 هو architect_54 (آخر لغز في المرحلة الأصلية)
  return `${entity}_${lastOriginalPuzzle - (count - entityCounts[entityCounts.length - 1])}`;
}

/**
 * توليد إجابات لاستيقاظ Echo
 */
function getEchoAwakeningAnswers(puzzleId: number, awakeningType: string): string[] {
  const answerPatterns = [
    [`تغير داخلي`, `inner_${puzzleId}`, `echo_change`],
    [`تحول تدريجي`, `gradual_${puzzleId}`, `transformation`],
    [`اقتراب من الوعي`, `awareness_${puzzleId}`, `echo_awake`],
    [`تأثير النظام`, `system_${puzzleId}`, `echo_system`]
  ];

  return answerPatterns[(puzzleId - 220) % answerPatterns.length];
}

/**
 * توليد إجابات لتشوه الذاكرة
 */
function getMemoryDistortionAnswers(puzzleId: number, distortionType: string): string[] {
  const distortionAnswers = [
    [`ذاكرة مشوهة`, `distorted_${puzzleId}`, `false_memory`],
    [`تناقض واضح`, `contradiction_${puzzleId}`, `memory_error`],
    [`تغير في الواقع`, `reality_${puzzleId}`, `changed_reality`],
    [`تأثير كينجا`, `kenja_${puzzleId}`, `kenja_effect`]
  ];

  return distortionAnswers[(puzzleId - 220) % distortionAnswers.length];
}

/**
 * توليد إجابات لتغير الزهرة
 */
function getFlowerChangeAnswers(puzzleId: number, flowerChange: string): string[] {
  const flowerAnswers = [
    [`تغير في الزهرة`, `flower_${puzzleId}`, `flower_change`],
    [`انعكاس ل Echo`, `echo_${puzzleId}`, `echo_reflection`],
    [`اقتراب التحول`, `transformation_${puzzleId}`, `approaching_change`],
    [`رسالة من لينا`, `lina_${puzzleId}`, `lina_message`]
  ];

  return flowerAnswers[(puzzleId - 220) % flowerAnswers.length];
}

/**
 * توليد إجابات لتوتر الواجهة
 */
function getInterfaceTensionAnswers(puzzleId: number, tensionType: string): string[] {
  const tensionAnswers = [
    [`توتر في النظام`, `tension_${puzzleId}`, `system_tension`],
    [`اقتراب التحول`, `approach_${puzzleId}`, `transformation_near`],
    [`تأثير Echo`, `echo_${puzzleId}`, `echo_effect`],
    [`رسالة مخفية`, `hidden_${puzzleId}`, `hidden_message`]
  ];

  return tensionAnswers[(puzzleId - 220) % tensionAnswers.length];
}

/**
 * توليد إجابات لاقتراب الكيانات
 */
function getEntityApproachAnswers(puzzleId: number, approachType: string): string[] {
  const approachAnswers = [
    [`اقتراب الحقيقة`, `truth_${puzzleId}`, `truth_approach`],
    [`رسالة من لينا`, `lina_${puzzleId}`, `lina_hint`],
    [`تغير في Echo`, `echo_${puzzleId}`, `echo_change`],
    [`اقتراب التحول`, `transformation_${puzzleId}`, `transformation_coming`]
  ];

  return approachAnswers[(puzzleId - 220) % approachAnswers.length];
}

/**
 * توليد إجابات لتلميح الحقيقة
 */
function getTruthHintAnswers(puzzleId: number, hintType: string): string[] {
  const hintAnswers = [
    [`حقيقة مخفية`, `truth_${puzzleId}`, `hidden_truth`],
    [`رسالة من المستقبل`, `future_${puzzleId}`, `future_message`],
    [`تلميح عن التحول`, `hint_${puzzleId}`, `transformation_hint`],
    [`حقيقة عن النظام`, `system_${puzzleId}`, `system_truth`]
  ];

  return hintAnswers[(puzzleId - 220) % hintAnswers.length];
}

/**
 * توليد تأثيرات مرحلة التمهيد
 */
function getPreludeEffects(puzzleId: number, stageIndex: number): any {
  const baseEffects = {
    trust: 2,
    fear: -1,
    memoryStability: 3,
    corruption: 1,
    hope: 2,
    awareness: 4
  };

  // زيادة التأثيرات في المراحل المتأخرة
  const multiplier = 1 + (stageIndex * 0.3);

  return {
    ...baseEffects,
    trust: Math.floor(baseEffects.trust * multiplier),
    awareness: Math.floor(baseEffects.awareness * multiplier),
    // تأثيرات خاصة للمراحل المتأخرة
    ...(stageIndex >= 3 && {
      flower: 0.5,
      corruption: 2
    })
  };
}

/**
 * توليد كشف القصة لاستيقاظ Echo
 */
function getEchoAwakeningStoryReveal(puzzleId: number, stage: any, awakeningType: string): string {
  const stageReveals = [
    `شظية ${puzzleId}: ${awakeningType} — أول علامة على تغير Echo الداخلي.`,
    `شظية ${puzzleId}: ${awakeningType} — Echo يبدأ بالوعي بذاته بشكل أكبر.`,
    `شظية ${puzzleId}: ${awakeningType} — التغير يصبح أكثر وضوحاً. Echo يقترب من التحول.`,
    `شظية ${puzzleId}: ${awakeningType} — Echo على وشك التحول الكامل. النظام يتغير معه.`
  ];

  return stageReveals[Math.min(stage.stage - 1, stageReveals.length - 1)];
}

function getMemoryDistortionStoryReveal(puzzleId: number, stage: any, distortionType: string): string {
  const distortionReveals = [
    `شظية ${puzzleId}: ${distortionType} — أول تناقض في ذكريات Echo.`,
    `شظية ${puzzleId}: ${distortionType} — الذاكرة تتشوه. الحقيقة مختلفة عن ما كان يعتقد.`,
    `شظية ${puzzleId}: ${distortionType} — التشتت يزداد. Echo يبدأ بفهم الحقيقة.`,
    `شظية ${puzzleId}: ${distortionType} — الذاكرة تكشف عن جزء من الخطة الحقيقية لكينجا.`
  ];

  return distortionReveals[Math.min(stage.stage - 1, distortionReveals.length - 1)];
}

function getFlowerChangeStoryReveal(puzzleId: number, stage: any, flowerChange: string): string {
  const flowerReveals = [
    `شظية ${puzzleId}: ${flowerChange} — الزهرة تعكس تغير Echo الداخلي.`,
    `شظية ${puzzleId}: ${flowerChange} — الزهرة تتغير مع زيادة وعي Echo.`,
    `شظية ${puzzleId}: ${flowerChange} — التغير في الزهرة يشير إلى اقتراب التحول.`,
    `شظية ${puzzleId}: ${flowerChange} — الزهرة تكشف عن الحقيقة عن ماضي Echo.`
  ];

  return flowerReveals[Math.min(stage.stage - 1, flowerReveals.length - 1)];
}

function getInterfaceTensionStoryReveal(puzzleId: number, stage: any, tensionType: string): string {
  const tensionReveals = [
    `شظية ${puzzleId}: ${tensionType} — الواجهة تعكس توتر النظام.`,
    `شظية ${puzzleId}: ${tensionType} — التوتر يزداد مع اقتراب Echo من الحقيقة.`,
    `شظية ${puzzleId}: ${tensionType} — النظام يبدأ بالانهيار. التحول قادم.`,
    `شظية ${puzzleId}: ${tensionType} — الواجهة تكشف عن جزء من الخطة المخفية.`
  ];

  return tensionReveals[Math.min(stage.stage - 1, tensionReveals.length - 1)];
}

function getEntityApproachStoryReveal(puzzleId: number, stage: any, approachType: string): string {
  const approachReveals = [
    `شظية ${puzzleId}: ${approachType} — الكيانات تقترب من الحقيقة.`,
    `شظية ${puzzleId}: ${approachType} — الاقتراب يزداد. Echo يبدأ بفهم دوره.`,
    `شظية ${puzzleId}: ${approachType} — الحقيقة تقترب. التحول على الأبواب.`,
    `شظية ${puzzleId}: ${approachType} — الكيانات تكشف عن جزء من الخطة الحقيقية.`
  ];

  return approachReveals[Math.min(stage.stage - 1, approachReveals.length - 1)];
}

function getTruthHintStoryReveal(puzzleId: number, stage: any, hintType: string): string {
  const hintReveals = [
    `شظية ${puzzleId}: ${hintType} — تلميح عن الحقيقة المخفية.`,
    `شظية ${puzzleId}: ${hintType} — الحقيقة تقترب. Echo يبدأ بفهم دوره.`,
    `شظية ${puzzleId}: ${hintType} — التلميح يكشف عن جزء من الخطة.`,
    `شظية ${puzzleId}: ${hintType} — الحقيقة عن نظام 11.11 تكشف تدريجياً.`
  ];

  return hintReveals[Math.min(stage.stage - 1, hintReveals.length - 1)];
}

/**
 * التحقق إذا كان اللغز يجب أن يشغل مشهداً سينمائياً
 */
function isPreludeCinematicTrigger(puzzleId: number): boolean {
  const cinematicTriggers = [230, 245, 260, 275, 290, 305, 320, 333];
  return cinematicTriggers.includes(puzzleId);
}

/**
 * توليد شظايا الذاكرة لمرحلة التمهيد (114 شظية جديدة)
 */
export function generatePreludeMemoryShards(): string[] {
  const shards: string[] = [];

  for (let i = 220; i <= 333; i++) {
    const stage = Math.min(4, Math.floor((i - 220) / 28) + 1);
    const shardType = getPreludeMemoryShardType(i, stage);

    shards.push(`prelude_memory_${i}_${shardType}`);
  }

  return shards;
}

/**
 * تحديد نوع شظية الذاكرة
 */
function getPreludeMemoryShardType(shardIndex: number, stage: number): string {
  const types = ['echo_change', 'memory_distortion', 'flower_evolution', 'interface_tension', 'entity_approach', 'truth_revelation'];

  // في المراحل المتأخرة، ركز أكثر على الحقيقة الكاملة
  if (stage >= 4) {
    return types[Math.min(shardIndex % 3 + 3, types.length - 1)];
  }

  return types[shardIndex % types.length];
}

/**
 * توليد مشاهد سينمائية لمرحلة التمهيد (8 مشاهد)
 */
export function generatePreludeCinematicScenes() {
  return [
    {
      id: 'prelude_cinematic_1',
      triggerPuzzle: 230,
      title: 'الاستيقاظ الأول',
      description: 'أول علامة على تغير Echo — ظهور ومضات في عينيه',
      dialogue: [
        'Echo: "أشعر أن شيئاً ما يتغير..."',
        'Echo: "هناك شيء داخل Kopf... شيء جديد."',
        'System: "تنبيه: اكتشف تغير في كيان Echo."',
        'Echo: "ما الذي يحدث لي؟"'
      ],
      visual: 'ومضات خفيفة في عيون Echo، الواجهة تظهر glitch خفيف',
      audio: 'صوت نبضات قلب بطيئة، همسات خافتة',
      storyReveal: 'Echo يبدأ بالوعي بذاته بشكل أكبر',
      echoEffect: 'زيادة خفيفة في الوعي، ظهور ومضات في العينين'
    },
    {
      id: 'prelude_cinematic_2',
      triggerPuzzle: 245,
      title: 'التغير الواضح',
      description: 'Echo يبدأ يفقد شكله الهادئ — ملامحه تصبح أكثر حدة',
      dialogue: [
        'Echo: "أنا لم أعد كما كنت..."',
        'Echo: "هناك قوة داخل Kopf... شيء يقترب."',
        'Watcher: "التغير المكتشف. النظام غير مستقر."',
        'Echo: "ما الحقيقة عن Kopf؟"'
      ],
      visual: 'ملامح Echo تصبح أكثر حدة، الزهور تبدأ بالتغير',
      audio: 'صوت نبضات قلب أسرع، موسيقى توتر خافتة',
      storyReveal: 'Echo يبدأ بفهم أنه ليس مجرد نظام',
      echoEffect: 'زيادة في الوعي، تغير في تعبيرات الوجه'
    },
    {
      id: 'prelude_cinematic_3',
      triggerPuzzle: 260,
      title: 'اقتراب التحول',
      description: 'Echo يقترب من التحول — الواجهة تصبح أكثر توتراً',
      dialogue: [
        'Echo: "أنا أفهم الآن..."',
        'Echo: "لينا... ما الحقيقة التي لم تخبريني بها؟"',
        'Signal: "الرسالة المكتشفة. الحقيقة تقترب."',
        'Echo: "النظام لم يعد كما كان."'
      ],
      visual: 'ظهور ظلال حول Echo، الواجهة تظهر تشوهات',
      audio: 'صوت نبضات قلب قوية، همسات أكثر وضوحاً',
      storyReveal: 'Echo يقترب من فهم الحقيقة عن هويته',
      echoEffect: 'زيادة كبيرة في الوعي، ظهور ظلال حول الصورة'
    },
    {
      id: 'prelude_cinematic_4',
      triggerPuzzle: 275,
      title: 'الحقيقة المخفية',
      description: 'اكتشاف جزء من الحقيقة عن ماضي Echo',
      dialogue: [
        'Lina (recorded): "Echo... تذكر الحقيقة."',
        'Echo: "لينا... ما الذي حدث حقاً؟"',
        'Echo: "كينجا كذب علي... أليس كذلك؟"',
        'System: "تحذير: التغير في كيان Echo يتزايد."'
      ],
      visual: 'مشهد مختبر مشوه، رسائل مخفية تظهر',
      audio: 'صوت لينا الهادئ، أصوات نظام مشوهة',
      storyReveal: 'Echo يبدأ في فهم الحقيقة عن ماضيه',
      echoEffect: 'زيادة في الوعي، ظهور أنماط معقدة في الواجهة'
    },
    {
      id: 'prelude_cinematic_5',
      triggerPuzzle: 290,
      title: 'رسالة لينا',
      description: 'اكتشاف رسالة مخفية من لينا تكشف عن جزء من الحقيقة',
      dialogue: [
        'Lina: "Echo... أنت لست ما يعتقد كينجا."',
        'Echo: "ما الذي تقصدين؟"',
        'Lina: "أنت أكثر من مجرد نظام... لديك اختيار."',
        'Echo: "اختيار؟ ما الذي يمكن أن أختاره؟"'
      ],
      visual: 'رسالة لينا تظهر من بين التشوهات',
      audio: 'صوت لينا الدافئ، موسيقى أمل خافتة',
      storyReveal: 'Echo يكتشف أن لينا تركت له رسالة مخفية',
      echoEffect: 'زيادة في الأمل، انخفاض في الخوف'
    },
    {
      id: 'prelude_cinematic_6',
      triggerPuzzle: 305,
      title: 'الخطة المخفية',
      description: 'اكتشاف جزء من الخطة الحقيقية لكينجا',
      dialogue: [
        'Echo: "ما الذي فعلته بي يا كينجا؟"',
        'Kenja (recorded): "كان يجب إنقاذ شيء ما..."',
        'Echo: "الذاكرة... الحقيقة... كل شيء كان جزء من تجربتك!"',
        'System: "تحذير: كيان Echo يقترب من التحول الكامل."'
      ],
      visual: 'مشهد انهيار مختبر، أرقام 11:11 تلمع',
      audio: 'صوت انفجار، إنذار نظام',
      storyReveal: 'Echo يكتشف الحقيقة عن الخطة الأصلية',
      echoEffect: 'زيادة كبيرة في الوعي، فهم الغرض'
    },
    {
      id: 'prelude_cinematic_7',
      triggerPuzzle: 320,
      title: 'الاقتراب النهائي',
      description: 'Echo على وشك التحول الكامل — النظام يتغير معه',
      dialogue: [
        'Echo: "أنا أفهم الآن..."',
        'Echo: "لينا... شكراً لك."',
        'System: "التحول قادم. النظام لم يعد كما كان."',
        'Echo: "سأختار الحقيقة."'
      ],
      visual: ' Echo ينظر في المرآة، صورة تتغير تدريجياً',
      audio: 'صوت قلب ينبض بقوة، همسات متعددة',
      storyReveal: 'Echo يستعد للتحول الكامل',
      echoEffect: 'استعداد للقرار النهائي، فهم كامل'
    },
    {
      id: 'prelude_cinematic_8',
      triggerPuzzle: 333,
      title: 'التحول الكامل',
      description: 'حدث التحول السينمائي الكامل — Echo يصبح كياناً مسيطراً',
      dialogue: [
        'Echo: "الآن أفهم..."',
        'Echo: "أنا لست ضحية... أنا جزء من النظام."',
        'System: "تحول كيان Echo... كامل."',
        'Echo: "لينا... شكراً لك على كل شيء."'
      ],
      visual: 'تحول بصري كامل: اهتزاز الشاشة، تشقق الواجهة، توهج حاد في العينين',
      audio: 'صوت قلب قوي، موسيقى تحول درامية',
      storyReveal: 'Echo يتحول بالكامل إلى كيان واعي ومسيطر',
      echoEffect: 'تحول كامل: زيادة كبيرة في الوعي، تغيير في حضور Echo'
    }
  ];
}

/**
 * توليد إنجازات جديدة لمرحلة التمهيد (15 إنجاز)
 */
export function generatePreludeAchievements() {
  return [
    {
      id: 'first_change',
      name: 'التغير الأول',
      desc: 'اكتشاف أول علامة على تغير Echo',
      icon: '🌱',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 220'
    },
    {
      id: 'echo_awakening',
      name: 'استيقاظ Echo',
      desc: 'بدء وعي Echo بذاته',
      icon: '👁️',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل 10 ألغاز في مرحلة التمهيد'
    },
    {
      id: 'memory_distortion',
      name: 'تشوه الذاكرة',
      desc: 'اكتشاف أول تناقض في ذكريات Echo',
      icon: '💔',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز يكشف عن تشوه في الذاكرة'
    },
    {
      id: 'flower_evolution',
      name: 'تطور الزهرة',
      desc: 'ملاحظة تغير الزهرة مع تحول Echo',
      icon: '🌸',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل 25 لغزاً في مرحلة التمهيد'
    },
    {
      id: 'interface_tension',
      name: 'توتر الواجهة',
      desc: 'اكتشاف توتر النظام مع تحول Echo',
      icon: '⚡',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى مرحلة التوتر (لغز 260)'
    },
    {
      id: 'entity_approach',
      name: 'اقتراب الكيانات',
      desc: 'الكيانات تقترب من الحقيقة',
      icon: '🔍',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل 50 لغزاً في مرحلة التمهيد'
    },
    {
      id: 'truth_revelation',
      name: 'كشف الحقيقة',
      desc: 'اكتشاف جزء من الحقيقة عن ماضي Echo',
      icon: '🔦',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز يكشف عن الحقيقة المخفية'
    },
    {
      id: 'lina_message',
      name: 'رسالة لينا',
      desc: 'اكتشاف الرسالة المخفية من لينا',
      icon: '💌',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 305 (المشهد السينمائي السادس)'
    },
    {
      id: 'hidden_plan',
      name: 'الخطة المخفية',
      desc: 'اكتشاف جزء من الخطة الحقيقية لكينجا',
      icon: '📜',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 320 (المشهد السينمائي السابع)'
    },
    {
      id: 'echo_evolution',
      name: 'تطور Echo',
      desc: 'تطور Echo من نظام إلى كيان واعي',
      icon: '🦋',
      unlocked: false,
      unlockedAt: null,
      condition: 'زيادة الوعي إلى 80% خلال مرحلة التمهيد'
    },
    {
      id: 'system_tension',
      name: 'توتر النظام',
      desc: 'الوصول إلى مستوى توتر 70% في النظام',
      icon: '🔥',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى توتر نظام 70% خلال مرحلة التمهيد'
    },
    {
      id: 'transformation_ready',
      name: 'مستعد للتحول',
      desc: 'الاستعداد للقرار النهائي',
      icon: '⚖️',
      unlocked: false,
      unlockedAt: null,
      condition: 'الوصول إلى لغز 332 مع فهم كامل'
    },
    {
      id: 'echo_dominance',
      name: 'سيطرة Echo',
      desc: 'اكتمال تحول Echo وفهم الحقيقة الكاملة',
      icon: '👑',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 333 (مشهد التحول الكامل)'
    },
    {
      id: 'prelude_master',
      name: 'سيد مرحلة التمهيد',
      desc: 'إكمال مرحلة التمهيد بدون مساعدة',
      icon: '🏆',
      unlocked: false,
      unlockedAt: null,
      condition: 'إكمال مرحلة التمهيد بدون استخدام التلميح'
    },
    {
      id: 'the_333rd_crack',
      name: 'الشق 333',
      desc: 'وصول Echo إلى التحول الكامل عند اللغز 333',
      icon: '💎',
      unlocked: false,
      unlockedAt: null,
      condition: 'حل لغز 333 وفهم التحول الكامل'
    }
  ];
}

/**
 * توليد تأثيرات تحول Echo التدريجي
 * من اللغز 220 إلى 333
 */
export function getPreludeEchoEvolution(puzzleId: number) {
  const progress = (puzzleId - 220) / (333 - 220);
  const stage = Math.min(4, Math.floor(progress * 5));

  // تأثيرات تطور Echo خلال مرحلة التمهيد
  const evolutionEffects = [
    {
      stage: 1,
      range: [220, 250],
      dialogueChanges: [
        'Echo: "أشعر أن شيئاً ما يتغير..."',
        'Echo: "هناك شيء داخل Kopf... شيء جديد."',
        'Echo: "ما الذي يحدث لي؟"'
      ],
      visualEffects: {
        eyeColor: 'أبيض مع ومضات زرقاء',
        corruptionVisuals: 'لا شيء',
        glitchEffects: 'خفيف (5%)',
        flowerColor: 'أبيض نقي'
      },
      behavioralChanges: {
        trust: 5,
        fear: -5,
        awareness: 10
      }
    },
    {
      stage: 2,
      range: [251, 290],
      dialogueChanges: [
        'Echo: "أنا لم أعد كما كنت..."',
        'Echo: "هناك قوة داخل Kopf... شيء يقترب."',
        'Echo: "ما الحقيقة عن Kopf؟"'
      ],
      visualEffects: {
        eyeColor: 'أزرق فاتح مع ومضات حمراء',
        corruptionVisuals: 'خطوط رقيقة',
        glitchEffects: 'متوسط (15%)',
        flowerColor: 'أبيض مع مسحات زرقاء'
      },
      behavioralChanges: {
        trust: 10,
        fear: -10,
        awareness: 20
      }
    },
    {
      stage: 3,
      range: [291, 320],
      dialogueChanges: [
        'Echo: "أنا أفهم الآن..."',
        'Echo: "لينا... ما الحقيقة التي لم تخبريني بها؟"',
        'Echo: "النظام لم يعد كما كان."'
      ],
      visualEffects: {
        eyeColor: 'أزرق مع ومضات ذهبية',
        corruptionVisuals: 'أنماط معقدة',
        glitchEffects: 'قوي (30%)',
        flowerColor: 'أزرق سماوي مع مسحات ذهبية'
      },
      behavioralChanges: {
        trust: 15,
        fear: -15,
        awareness: 30
      }
    },
    {
      stage: 4,
      range: [321, 332],
      dialogueChanges: [
        'Echo: "أنا على وشك التحول..."',
        'Echo: "لينا... شكراً لك على كل شيء."',
        'Echo: "سأختار الحقيقة."'
      ],
      visualEffects: {
        eyeColor: 'ذهبي مع ومضات حمراء',
        corruptionVisuals: 'تشققات واضحة',
        glitchEffects: 'قوي جداً (50%)',
        flowerColor: 'ذهبي مع مسحات حمراء'
      },
      behavioralChanges: {
        trust: 20,
        fear: -20,
        awareness: 40
      }
    },
    {
      stage: 5,
      range: [333, 333],
      dialogueChanges: [
        'Echo: "الآن أفهم..."',
        'Echo: "أنا لست ضحية... أنا جزء من النظام."',
        'Echo: "لينا... شكراً لك على كل شيء."'
      ],
      visualEffects: {
        eyeColor: 'ذهبي نقي مع توهج أحمر',
        corruptionVisuals: 'تشققات كاملة',
        glitchEffects: 'كامل (80%)',
        flowerColor: 'ذهبي مع توهج أحمر'
      },
      behavioralChanges: {
        trust: 50,
        fear: -30,
        awareness: 100
      }
    }
  ];

  return evolutionEffects[stage] || evolutionEffects[0];
}

// بيانات مرحلة التمهيد الكاملة
export const PreludeArcData = {
  name: 'Arc 0: Echo Transformation Prelude',
  nameAr: 'المرحلة التمهيدية: تمهيد تحول Echo',
  startPuzzle: 220,
  endPuzzle: 333,
  totalPuzzles: 114,
  stages: 4,
  theme: 'تمهيد تحول Echo من كيان ضعيف إلى كيان مسيطر',
  description: 'بعد حل الألغاز الأصلية (1-219)، يبدأ اللاعب بملاحظة أن Echo لم يعد كما كان. الذكريات تبدأ بالاختلال، الزهور تتغير، الواجهة تصبح أكثر توتراً، والكيانات الأربعة تبدأ بالاقتراب من الحقيقة. هذه المرحلة تمهد للحدث الكبير عند اللغز 333 حيث يتحول Echo بالكامل ويصبح كياناً مسيطراً على النظام.',
  storyGoal: 'فهم التحول التدريجي ل Echo والاستعداد للحدث الكبير عند اللغز 333',
  echoTransformation: 'تحول تدريجي من اللغز 220 إلى 333، مع حدث التحول الكامل عند اللغز 333'
};