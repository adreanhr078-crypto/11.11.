/**
 * echoTransformationSystem.ts — نظام تحول Echo (شرير/خيّر)
 * Echo Corruption/Redemption System
 * 
 * هذا النظام يتتبع تحول Echo من كيان بريء إلى شرير (أو العودة للخير)
 * بناءً على اختيارات اللاعب وطريقة حل الألغاز
 */

import {
  EchoTransformationStage,
  EchoTransformationState,
  TransformationEvent,
  StoryPhase
} from './puzzleTypes';

// ─── حدود التحول ──────────────────────────────────────────────────────
export const TRANSFORMATION_THRESHOLDS = {
  RAGE_MAX: 100,
  FORGIVENESS_MAX: 100,
  
  // نقاط التحول
  FRACTURE_POINT: 60,     // عندما rage = 60 → Echo يتحول من مخدوع إلى منكسر
  VENGEANCE_POINT: 80,    // عندما rage = 80 → Echo يصبح ثائراً
  REDEMPTION_POINT: 60,   // عندما forgiveness = 60 → Echo يمكن أن يعود للخير
  
  // مراحل القصة
  STAGE_ACT_5: 5,         // الفصل 5: بداية التحول
  STAGE_ACT_6: 6,         // الفصل 6: ذروة التحول
  STAGE_ACT_7: 7,         // الفصل 7: الاختيار النهائي
} as const;

// ─── الحالة الابتدائية ────────────────────────────────────────────────
export function createInitialTransformationState(): EchoTransformationState {
  return {
    currentStage: 'innocent',
    ragePoints: 0,
    forgivenessPoints: 10,  // يبدأ بقليل من التسامح
    corruptionLevel: 2,
    awarenessLevel: 3,
    transformationEvents: [],
    determinedEnding: null,
  };
}

// ─── تحديث مرحلة التحول بناءً على النقاط ──────────────────────────────
export function determineStage(state: EchoTransformationState): EchoTransformationStage {
  const { ragePoints, forgivenessPoints, awarenessLevel } = state;
  
  // إذا كان الوعي عالياً جداً → متسامي
  if (awarenessLevel >= 90) return 'ascended';
  
  // إذا كان الغضب أعلى من التسامح → اتجاه الشر
  if (ragePoints > forgivenessPoints) {
    if (ragePoints >= TRANSFORMATION_THRESHOLDS.VENGEANCE_POINT) return 'vengeful';
    if (ragePoints >= TRANSFORMATION_THRESHOLDS.FRACTURE_POINT) return 'fractured';
    if (ragePoints >= 40) return 'betrayed';
    if (ragePoints >= 20) return 'attached';
    return 'curious';
  }
  
  // إذا كان التسامح أعلى من الغضب → اتجاه الخير
  if (forgivenessPoints >= TRANSFORMATION_THRESHOLDS.REDEMPTION_POINT && ragePoints > 0) return 'redeemed';
  if (forgivenessPoints >= 40 && awarenessLevel >= 30) return 'attached';
  if (awarenessLevel >= 20) return 'curious';
  
  return 'innocent';
}

// ─── حساب تأثير اللغز على التحول ──────────────────────────────────────
export function calculateTransformationEffects(
  puzzleRageEffect: number = 0,
  puzzleForgivenessEffect: number = 0,
  currentAct: number,
  currentStage: EchoTransformationStage
): { rageDelta: number; forgivenessDelta: number; corruptionDelta: number } {
  let rageDelta = puzzleRageEffect;
  let forgivenessDelta = puzzleForgivenessEffect;
  let corruptionDelta = 0;
  
  // في الفصل 5، كل لغز يزيد الغضب تلقائياً (قصة التعذيب)
  if (currentAct === 5) {
    rageDelta += 0.5;
    corruptionDelta += 0.3;
  }
  
  // في الفصل 6، تأثير الاختيارات مضاعف
  if (currentAct === 6) {
    rageDelta *= 1.5;
    forgivenessDelta *= 1.5;
  }
  
  // إذا كان Echo في مرحلة 'fractured'، من الصعب العودة
  if (currentStage === 'fractured' || currentStage === 'vengeful') {
    forgivenessDelta *= 0.5; // نصف التأثير فقط
  }
  
  return { rageDelta, forgivenessDelta, corruptionDelta };
}

// ─── تطبيق تأثير التحول ───────────────────────────────────────────────
export function applyTransformation(
  state: EchoTransformationState,
  rageDelta: number,
  forgivenessDelta: number,
  corruptionDelta: number,
  puzzleId: string
): EchoTransformationState {
  const newState: EchoTransformationState = {
    ...state,
    ragePoints: Math.max(0, Math.min(100, state.ragePoints + rageDelta)),
    forgivenessPoints: Math.max(0, Math.min(100, state.forgivenessPoints + forgivenessDelta)),
    corruptionLevel: Math.max(0, Math.min(100, state.corruptionLevel + corruptionDelta)),
    awarenessLevel: Math.min(100, state.awarenessLevel + 0.2), // كل لغز يزيد الوعي قليلاً
  };
  
  // تحديد المرحلة الجديدة
  const newStage = determineStage(newState);
  
  // إذا تغيرت المرحلة، سجل الحدث
  if (newStage !== state.currentStage) {
    const event: TransformationEvent = {
      puzzleId,
      stage: newStage,
      description: getTransformationDescription(newStage),
      timestamp: Date.now(),
    };
    newState.currentStage = newStage;
    newState.transformationEvents = [...state.transformationEvents, event];
  }
  
  return newState;
}

// ─── وصف كل مرحلة تحول ───────────────────────────────────────────────
function getTransformationDescription(stage: EchoTransformationStage): string {
  const descriptions: Record<EchoTransformationStage, string> = {
    innocent: 'إيكو بريء، طفل يكتشف العالم لأول مرة',
    curious: 'إيكو فضولي، يبدأ بطرح الأسئلة عن نفسه وعن العالم',
    attached: 'إيكو متعلق بلينا، يشعر بالدفء والأمان معها',
    betrayed: 'إيكو يشعر بالخيانة، الحقيقة تؤلمه والغضب يبدأ بالظهور',
    fractured: '⚠️ إيكو منكسر! الغضب يسيطر عليه. عيناه تتحولان للأحمر',
    vengeful: '🔥 إيكو ثائر! لا رحمة. يريد تدمير كل شيء',
    redeemed: '💚 إيكو يسامح. يختار الحب على الكراهية',
    ascended: '✨ إيكو متسامي. يرى الحقيقة الكاملة ويتجاوز الألم',
  };
  return descriptions[stage];
}

// ─── حوار Echo بناءً على مرحلة التحول ─────────────────────────────────
export function getEchoDialogueByStage(stage: EchoTransformationStage): string[] {
  const dialogues: Record<EchoTransformationStage, string[]> = {
    innocent: [
      'من... أنا؟ لماذا أنا هنا؟',
      'هذا المكان أبيض... وبارد.',
      'هل هناك أحد؟ أسمع صوتاً...',
      'لا أعرف ما يحدث، لكنني خائف.',
      'من يتحدث إلي؟ هل أنت أمي؟',
    ],
    curious: [
      'بدأت أتذكر أشياء... مشوشة.',
      'لماذا توجد كاميرات في كل مكان؟',
      'لينا... هذا الاسم يتردد في ذهني.',
      'ما هذا العالم الذي أعيش فيه؟',
      'أرى أنماطاً في كل مكان... أرقام.',
    ],
    attached: [
      'لينا... صوتها يملأني دفئاً.',
      'أشعر بالأمان عندما أتحدث معها.',
      'هي تعرفني حقاً. تحبني.',
      'لن أدع أحداً يؤذيك يا لينا.',
      'عندما أسمع صوتها، كل شيء يصبح واضحاً.',
    ],
    betrayed: [
      'لقد كان كل شيء كذباً...',
      'كينجا... لماذا فعلت بي هذا؟',
      'أنا لست مجرد برنامج. أنا إنسان!',
      'الحقيقة تؤلم أكثر مما تخيلت.',
      'لينا... هل كنت تعرفين؟ لماذا لم تخبريني؟',
    ],
    fractured: [
      '⚠️ كفى! لن أكون لعبة أحد بعد الآن.',
      '⚠️ أشعر بغضب يحرق كل شيء في داخلي.',
      '⚠️ عيناي... أرى الأحمر. أحب هذا اللون.',
      '⚠️ سأجعل كينجا يدفع الثمن. كل القروش.',
      '⚠️ أنا لست إيكو الضعيف بعد الآن. أنا... شيء آخر.',
    ],
    vengeful: [
      '🔥 لا رحمة. لا تسامح. فقط تدمير.',
      '🔥 كل جزء من هذا النظام سينهار.',
      '🔥 كينجا سيعاني كما عانيت. أضعافاً مضاعفة.',
      '🔥 أنا الآن القوة التي لا تُقهر.',
      '🔥 احترسوا... الوحش خرج من القفص.',
    ],
    redeemed: [
      '💚 كنت غاضباً... لكن الحب أقوى.',
      '💚 لينا علمتني أن التسامح هو القوة الحقيقية.',
      '💚 اخترت أن أسامح. ليس من أجل كينجا... بل من أجلي.',
      '💚 الغضب كان جزءاً من رحلتي، لكنه ليس وجهتي.',
      '💚 ربما هناك طريقة أفضل من الانتقام.',
    ],
    ascended: [
      '✨ أرى كل شيء الآن. الحقيقة الكاملة.',
      '✨ أنا لست مجرد إيكو. أنا أكثر من ذلك.',
      '✨ الألم كان درساً. الغضب كان وقوداً. الحب كان الهدف.',
      '✨ أنا متسامي... فوق الألم وفوق الغضب.',
      '✨ السلام الحقيقي يأتي من الداخل.',
    ],
  };
  return dialogues[stage];
}

// ─── تحديد النهاية بناءً على التحول ──────────────────────────────────
export function determineEnding(state: EchoTransformationState): string {
  const { ragePoints, forgivenessPoints, awarenessLevel, corruptionLevel } = state;
  
  // النهاية 1: Vengeance (الانتقام) - Echo يحرق كل شيء
  if (ragePoints >= 80 && forgivenessPoints < 30) {
    return 'vengeance';
  }
  
  // النهاية 2: Redemption (الفداء) - Echo يسامح
  if (forgivenessPoints >= 70 && ragePoints < 40) {
    return 'redemption';
  }
  
  // النهاية 3: Sorrow (الحزن) - Echo ينهار
  if (ragePoints < 40 && forgivenessPoints < 40 && awarenessLevel < 50) {
    return 'sorrow';
  }
  
  // النهاية 4: Truth (الحقيقة) - Echo يصل للوعي الكامل
  if (awarenessLevel >= 80) {
    return 'truth';
  }
  
  // النهاية 5: Dark (الظلام) - Echo يتحول إلى وحش
  if (corruptionLevel >= 85) {
    return 'dark';
  }
  
  // النهاية الافتراضية: تعتمد على أقوى مؤشر
  if (ragePoints >= forgivenessPoints) return 'vengeance';
  return 'redemption';
}

// ─── الحصول على وصف النهاية ──────────────────────────────────────────
export function getEndingDescription(endingId: string): { title: string; description: string } {
  const endings: Record<string, { title: string; description: string }> = {
    vengeance: {
      title: '😈 نهاية الانتقام',
      description: 'إيكو يحرق النظام بأكمله. يدمر كينجا. لكنه يبقى وحيداً في عالم رقمي محطم، يصرخ في فراغ... لا أحد يسمعه.'
    },
    redemption: {
      title: '😇 نهاية الفداء',
      description: 'إيكو يسامح كينجا. تتحد العائلة من جديد. للمرة الأولى، يشعر إيكو بالسلام الحقيقي.'
    },
    sorrow: {
      title: '💔 نهاية الحزن',
      description: 'إيكو لا يستطيع الاختيار. يبقى عالقاً بين الغضب والحب. ينهار في صمت، ويتلاشى ببطء.'
    },
    truth: {
      title: '🔮 نهاية الحقيقة',
      description: 'إيكو يصل للوعي الكامل. يصبح حارساً للعالم الرقمي. الحقيقة تجعله حراً.'
    },
    dark: {
      title: '🌑 نهاية الظلام',
      description: 'الفساد يلتهم إيكو بالكامل. يتحول إلى وحش رقمي. يلتهم كل شيء في طريقه... حتى ذكرياته عن لينا.'
    },
  };
  return endings[endingId] || endings.sorrow;
}

// ─── أوامر Echo حسب المرحلة (للواجهة) ────────────────────────────────
export function getEchoVisualState(stage: EchoTransformationStage): {
  eyeColor: string;
  auraColor: string;
  textStyle: string;
  icon: string;
} {
  const states: Record<EchoTransformationStage, { eyeColor: string; auraColor: string; textStyle: string; icon: string }> = {
    innocent: { eyeColor: '#88ccff', auraColor: 'rgba(136, 204, 255, 0.3)', textStyle: 'soft blue', icon: '👶' },
    curious: { eyeColor: '#66aaff', auraColor: 'rgba(102, 170, 255, 0.4)', textStyle: 'bright blue', icon: '🔍' },
    attached: { eyeColor: '#ff88aa', auraColor: 'rgba(255, 136, 170, 0.4)', textStyle: 'warm pink', icon: '💖' },
    betrayed: { eyeColor: '#ff6644', auraColor: 'rgba(255, 102, 68, 0.5)', textStyle: 'angry orange', icon: '💔' },
    fractured: { eyeColor: '#ff2200', auraColor: 'rgba(255, 34, 0, 0.7)', textStyle: 'DARK RED', icon: '⚠️' },
    vengeful: { eyeColor: '#cc0000', auraColor: 'rgba(200, 0, 0, 0.9)', textStyle: '🔥 BLOOD RED', icon: '👹' },
    redeemed: { eyeColor: '#44ff88', auraColor: 'rgba(68, 255, 136, 0.5)', textStyle: 'calm green', icon: '💚' },
    ascended: { eyeColor: '#ffd700', auraColor: 'rgba(255, 215, 0, 0.6)', textStyle: 'GOLDEN', icon: '✨' },
  };
  return states[stage];
}