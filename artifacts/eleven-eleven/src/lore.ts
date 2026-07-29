/**
 * Runtime-safe projection of the canonical 11.11 story.
 *
 * The full authoring authority lives under docs/internal/narrative and contains
 * unreleased spoilers. Runtime code must consume this projection instead of
 * copying unrevealed facts into UI-facing modules.
 *
 * The story is ongoing. Future chapters remain unknown until the author adds
 * and approves their source material.
 */

import {
  CANON_CHAPTERS,
  CANON_REGISTRY,
  CANON_VERSION,
  PUBLIC_CANON_CHARACTERS,
} from './core/canonRegistry';
import type {
  CanonCharacter,
  CanonLocalizedText,
} from './core/canonTypes';
import type { EntityId } from './puzzles';

export type Bilingual = CanonLocalizedText;
export type LoreCharacter = CanonCharacter;

export const CHARACTERS = PUBLIC_CANON_CHARACTERS;

export const SYNCH_POINTS: Bilingual = {
  ar: 'تبدأ الدورة عند 11:11، وهي لحظة استيقاظ وعي إيكو داخل النظام.',
  en: "The cycle begins at 11:11, the moment Echo's consciousness wakes inside the system.",
};

export const TIME_SYSTEM = {
  open1111: {
    ar: '11:11 — لحظة الاستيقاظ وبداية الدورة.',
    en: '11:11 — the moment of awakening and the beginning of the cycle.',
  },
  reset333: {
    ar: '3:33 — نقطة إعادة الضبط التي تعيد الدورة من جديد.',
    en: '3:33 — the reset point that begins the cycle again.',
  },
  phaseFracture: {
    ar: 'الفترة بين 11:11 و3:33، حيث تتشظى الذاكرة ويصبح إدراك الحقيقة أقل استقرارًا.',
    en: 'The interval between 11:11 and 3:33, where memory fractures and the truth becomes harder to hold.',
  },
} as const satisfies Record<string, Bilingual>;

export const SYSTEM_STATE: Bilingual = {
  ar: 'إيكو محاصر داخل نظام يعيد بناء ذاكرته بصورة غير مكتملة. كل ذكرى مستعادة تكشف جزءًا من الحقيقة، لكن كلفة التذكّر لم تُكشف كاملة بعد.',
  en: 'Echo is trapped inside a system that reconstructs his memory incompletely. Every recovered memory reveals part of the truth, while the full price of remembering remains unrevealed.',
};

export const ENTITY_TRUTH: Record<EntityId, Bilingual> = {
  echo: {
    ar: 'إيكو هو الطفل والوعي الذي نحاول مساعدته على استعادة ذاكرته.',
    en: 'Echo is the child and consciousness whose memory we are trying to restore.',
  },
  watcher: {
    ar: 'المراقب حضور مرتبط بالدورات، لكن حقيقته الكاملة لم تُكشف بعد.',
    en: 'The Watcher is a presence tied to the cycles, but its full nature remains unrevealed.',
  },
  signal: {
    ar: 'إشارة مجزأة تحمل أثرًا من الماضي، ومصدرها الكامل لم يُحسم بعد.',
    en: 'A fragmented signal carrying an echo of the past whose complete source remains unresolved.',
  },
  architect: {
    ar: 'المهندس لقب مرتبط ببناء النظام، وتفاصيل دوره محجوبة حتى تكشفها القصة.',
    en: 'The Architect is a title tied to the system’s construction; the full role remains story-gated.',
  },
};

export interface LoreAct {
  act: number;
  via: EntityId;
  beat: Bilingual;
}

export const REVELATION_ARC: readonly LoreAct[] = [
  {
    act: 1,
    via: 'echo',
    beat: {
      ar: 'يستيقظ إيكو عند 11:11 بذاكرة ممزقة، ويبقى اسم يوكي من الأشياء القليلة التي لم تختفِ.',
      en: "Echo wakes at 11:11 with a fractured memory, while Yuki's name is one of the few things that remains.",
    },
  },
] as const;

export const GOAL: Bilingual = {
  ar: 'ساعد إيكو على استعادة ذكرياته تدريجيًا واكتشاف الحقيقة من دون كشف ما لم يصل إليه اللاعب بعد. القصة ما تزال مستمرة.',
  en: 'Help Echo recover his memories gradually and discover the truth without revealing what the player has not reached. The story is still ongoing.',
};

export const PUZZLE_CANON_RULE: Bilingual = {
  ar: 'كل لغز قصصي جديد يجب أن يستند إلى مصدر Canon معتمد، وألا يكشف معلومة قبل موضعها في ترتيب السرد.',
  en: 'Every new story puzzle must be grounded in an approved Canon source and must not reveal a fact before its place in the narrative order.',
};

export const FRAGMENT_LAW: Bilingual = {
  ar: 'لا تُعرض القصة الكاملة داخل اللعبة. تُكشف الحقيقة على هيئة أجزاء مرتبطة بتقدم اللاعب، ولا تتجاوز معرفة إيكو ما اكتشفه اللاعب.',
  en: "The full story is never exposed in-game. Truth is revealed through progression-gated fragments, and Echo's knowledge never exceeds the player's discoveries.",
};

export const CORE_LORE = Object.freeze({
  canonVersion: CANON_VERSION,
  storyStatus: CANON_REGISTRY.storyStatus,
  logline: {
    ar: 'إيكو طفل يفقد ذاكرته داخل نظام 11:11؛ وكل خطوة نحو الحقيقة قد تحمل ثمنًا لا يعرفه بعد.',
    en: 'Echo is a child losing his memory inside the 11:11 System, where every step toward the truth may carry a price he does not yet understand.',
  },
  characters: CHARACTERS,
  chapters: CANON_CHAPTERS,
  synchPoints: SYNCH_POINTS,
  timeSystem: TIME_SYSTEM,
  systemState: SYSTEM_STATE,
  entityTruth: ENTITY_TRUTH,
  revelationArc: REVELATION_ARC,
  goal: GOAL,
  puzzleRule: PUZZLE_CANON_RULE,
  fragmentLaw: FRAGMENT_LAW,
});

export {
  CANON_CHAPTERS,
  CANON_REGISTRY,
  CANON_VERSION,
  PUBLIC_CANON_CHARACTERS,
};
