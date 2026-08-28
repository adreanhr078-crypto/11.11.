/** Runtime-safe projection of the current, evolving Echo Network Story Bible. */

import {
  CANON_CHAPTERS,
  CANON_REGISTRY,
  CANON_VERSION,
  PUBLIC_CANON_CHARACTERS,
} from './core/canonRegistry';
import type { CanonLocalizedText } from './core/canonTypes';

export type Bilingual = CanonLocalizedText;
export const CHARACTERS = PUBLIC_CANON_CHARACTERS;

export const SYNCH_POINTS: Bilingual = {
  ar: '11:11 هي لحظة اتصال وعي إيكو بالتجربة والنظام والآلة.',
  en: "11:11 is the moment Echo's consciousness connects with the experiment, system, and machine.",
};

export const TIME_SYSTEM = Object.freeze({
  connection1111: {
    ar: 'يتوقف الزمن داخل العالم التجريبي عند 11:11، لحظة ولادة الاتصال.',
    en: 'Time inside the experimental world stops at 11:11, the moment the connection is born.',
  },
});

export const SYSTEM_STATE: Bilingual = {
  ar: 'يستيقظ إيكو داخل عالم من الوعي والذكريات المشوهة، ويحاول فهم ما حدث له والخروج من النظام.',
  en: 'Echo wakes inside a world of consciousness and distorted memories, trying to understand what happened and escape the system.',
};

export const REVELATION_ARC = Object.freeze([
  {
    act: 1,
    beat: {
      ar: 'يستيقظ إيكو داخل النظام بعد نجاح تجربة الخلود، ويبدأ اكتشاف الغرف والـSubjects والذكريات المشوهة.',
      en: 'Echo wakes inside the system after the immortality experiment succeeds and begins discovering its rooms, subjects, and distorted memories.',
    },
  },
]);

export const GOAL: Bilingual = {
  ar: 'ساعد إيكو على فهم التجربة والخروج من النظام من دون كشف الأسرار قبل موضعها السردي.',
  en: 'Help Echo understand the experiment and escape the system without revealing secrets before their narrative moment.',
};

export const PUZZLE_CANON_RULE: Bilingual = {
  ar: 'كل لغز قصصي يجب أن يرتبط بدليل ظهر في المانهوا المعتمدة وألا يكشف الحل أو سرًا لم يصل إليه اللاعب.',
  en: 'Every story puzzle must connect to evidence revealed in the approved Manhwa and must not expose its answer or an unreached secret.',
};

export const FRAGMENT_LAW: Bilingual = {
  ar: 'تُكشف الحقيقة تدريجيًا. لا يظهر Zero كاملًا قبل انهيار إيكو النفسي ومواجهة كينجا.',
  en: "Truth is revealed gradually. Zero does not fully appear before Echo's psychological collapse and confrontation with Kenja.",
};

export const CORE_LORE = Object.freeze({
  canonVersion: CANON_VERSION,
  storyStatus: CANON_REGISTRY.storyStatus,
  logline: {
    ar: 'شاب ينجح في تجربة للخلود ويستيقظ داخل نظام متجمد عند 11:11، حيث يصبح خروجه معركة على ذاكرته وإنسانيته.',
    en: 'A young man survives an immortality experiment and wakes inside a system frozen at 11:11, where escape becomes a fight for his memory and humanity.',
  },
  characters: CHARACTERS,
  chapters: CANON_CHAPTERS.filter((chapter) => chapter.publicationStatus !== 'unpublished'),
  synchPoints: SYNCH_POINTS,
  timeSystem: TIME_SYSTEM,
  systemState: SYSTEM_STATE,
  revelationArc: REVELATION_ARC,
  goal: GOAL,
  puzzleRule: PUZZLE_CANON_RULE,
  fragmentLaw: FRAGMENT_LAW,
  productionIdentity: {
    echoNeckMark: 'EX-011',
    placement: 'direct-skin',
    zeroTreatment: 'additive-evolving-layer',
  },
});

export {
  CANON_CHAPTERS,
  CANON_REGISTRY,
  CANON_VERSION,
  PUBLIC_CANON_CHARACTERS,
};
