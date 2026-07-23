/**
 * puzzleTypes.ts — أنواع الألغاز الجديدة لنظام 11.11
 * نظام موحد لجميع الألغاز في اللعبة
 */

import type { EntityId, PuzzleStatus } from './gameTypes';

// ─── أنواع الألغاز ────────────────────────────────────────────────────
export type PuzzleType = 
  | 'numeric'      // 🔢 ألغاز أرقام
  | 'word'         // 📝 ألغاز كلمات
  | 'reflective'   // 💭 ألغاز تأملية
  | 'deductive'    // 🔍 ألغاز استنتاجية
  | 'choice'       // 🎯 ألغاز اختيارية
  | 'cipher'       // 🔐 ألغاز شيفرة
  | 'sequence'     // 🔄 ألغاز ترتيب
  | 'riddle'       // 🧩 ألغاز أحجية
  | 'logic'        // 🧠 ألغاز منطقية
  | 'pattern';     // 🔶 ألغاز أنماط

// ─── مراحل القصة ──────────────────────────────────────────────────────
export type StoryPhase = 
  | 'awakening'     // الفصل 1: الصحوة
  | 'discovery'     // الفصل 2: الاكتشاف
  | 'connection'    // الفصل 3: الاتصال
  | 'truth'         // الفصل 4: الحقيقة
  | 'fracture'      // الفصل 5: الكسر (نقطة التحول)
  | 'vengeance'     // الفصل 6: الثأر
  | 'finale';       // الفصل 7: الخاتمة

// ─── حالة تحول Echo ───────────────────────────────────────────────────
export type EchoTransformationStage =
  | 'innocent'
  | 'curious'
  | 'questioning'
  | 'hopeful'
  | 'attached'
  | 'betrayed'
  | 'truth_aware'
  | 'fractured'
  | 'vengeful'
  | 'redeemed'
  | 'ascended';

// ─── تأثيرات اللغز ────────────────────────────────────────────────────
export interface PuzzleEffects {
  trust?: number;
  fear?: number;
  memoryStability?: number;
  corruption?: number;
  hope?: number;
  loneliness?: number;
  awareness?: number;
  flower?: number;
  // نظام تحول Echo
  rageEffect?: number;        // يزيد الغضب (يؤدي للتحول الشرير)
  forgivenessEffect?: number; // يزيد التسامح (يؤدي للبقاء طيباً)
}

// ─── متطلبات اللغز ────────────────────────────────────────────────────
export interface PuzzleRequirements {
  solvedCount?: number;
  minTrust?: number;
  maxFear?: number;
  minAwareness?: number;
  actCompleted?: number;
  echoStage?: EchoTransformationStage;
}

// ─── هيكل اللغز الجديد ────────────────────────────────────────────────
export interface StoryPuzzle {
  id: string;
  act: number;                    // الفصل (1-7)
  phase: StoryPhase;              // مرحلة القصة
  puzzleType: PuzzleType;         // نوع اللغز
  difficulty: number;             // 1-10
  
  question: string;               // السؤال
  answers: string[];              // الإجابات الصحيحة
  hints: string[];                // 3 تلميحات (سهل، متوسط، صعب)
  
  storyReveal: string;            // القصة التي تُكشف بعد الحل
  memoryUnlock: string | null;    // شظية الذاكرة المرتبطة
  
  requirements?: PuzzleRequirements;
  effects: PuzzleEffects;
  
  // ربط بالكيانات
  entity?: EntityId;
  entityDialogue?: string;        // حوار إضافي من الكيان
  
  // ربط بالمشاهد السينمائية
  cinematicTrigger?: string;
}

// ─── قالب توليد الألغاز ────────────────────────────────────────────────
export interface PuzzleTemplate {
  type: PuzzleType;
  act: number;
  phase: StoryPhase;
  difficultyRange: [number, number];
  
  // قوالب الأسئلة مع متغيرات
  questionTemplates: string[];
  answerTemplates: string[][];
  hintTemplates: string[][];      // [تلميح1, تلميح2, تلميح3]
  storyTemplates: string[];
  
  effects: PuzzleEffects;
}

// ─── بيانات القوس القصصي ──────────────────────────────────────────────
export interface StoryArc {
  act: number;
  name: string;
  nameAr: string;
  phase: StoryPhase;
  puzzleRange: [number, number];  // [start, end]
  description: string;
  descriptionAr: string;
  
  // حالة Echo في هذا القوس
  echoStage: EchoTransformationStage;
  echoMoodDescription: string;
  
  // الأحداث الرئيسية
  keyEvents: StoryEvent[];
  
  // الإنجازات المرتبطة
  achievements: ArcAchievement[];
}

export interface StoryEvent {
  id: string;
  puzzleTrigger: number;          // اللغز الذي يحدث عنده الحدث
  type: 'cinematic' | 'dialogue' | 'transformation' | 'choice';
  description: string;
  descriptionAr: string;
}

export interface ArcAchievement {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  condition: (solvedCount: number, act: number) => boolean;
}

// ─── حالة تحول Echo الكاملة ────────────────────────────────────────────
export interface EchoTransformationState {
  currentStage: EchoTransformationStage;
  ragePoints: number;             // 0-100 نقاط الغضب
  forgivenessPoints: number;      // 0-100 نقاط التسامح
  corruptionLevel: number;        // 0-100 مستوى الفساد
  awarenessLevel: number;         // 0-100 مستوى الوعي
  
  // تاريخ التحول
  transformationEvents: TransformationEvent[];
  
  // النهاية المحددة بناءً على التحول
  determinedEnding: string | null;
}

export interface TransformationEvent {
  puzzleId: string;
  stage: EchoTransformationStage;
  description: string;
  timestamp: number;
}