/**
 * puzzleLazyGenerator.ts — مولد ألغاز كسول (lazy) لنظام 11.11
 * يعتمد على تحديد الفصل (act) والقالب المناسب حسب رقم اللغز،
 * ثم يولد اللغز عند الطلب دون تخزين 1000 لغز مسبقاً في الذاكرة.
 *
 * ملاحظة: القوالب المستخدمة هي نفسها الموجودة في puzzleGenerator.ts
 * ولتجنب التكرار يتم استيرادها منه.
 */

import {
  StoryPuzzle,
  PuzzleType,
  StoryPhase,
  PuzzleEffects,
} from './puzzleTypes';
import { getActByPuzzleNumber } from './storyActs';
import {
  ACT1_TEMPLATES,
  ACT2_TEMPLATES,
  ACT3_TEMPLATES,
  ACT4_TEMPLATES,
  ACT5_TEMPLATES,
  ACT6_TEMPLATES,
  ACT7_TEMPLATES,
  ALL_TEMPLATES as PUZZLE_GENERATOR_ALL_TEMPLATES,
} from './puzzleGenerator';

// نُكرر تعريف القالب محلياً لتجنب الاعتماد على puzzleGenerator
interface PuzzleTemplate {
  type: PuzzleType;
  act: number;
  phase: StoryPhase;
  difficulty: number;
  generateQuestion: (index: number) => string;
  generateAnswers: (index: number) => string[];
  generateHints: (index: number) => [string, string, string];
  generateStory: (index: number) => string;
  effects: PuzzleEffects;
}

// نُعيد فهرسة القوالب حسب act/phase/type/cardinal/difficulty
// للبحث السريع عند التوليد الكسول.
interface TemplateCard {
  act: number;
  templates: PuzzleTemplate[];
}

const ALL_TEMPLATES: TemplateCard[] = [];
let _templatesLoaded = false;

function ensureTemplatesLoaded(): TemplateCard[] {
  if (_templatesLoaded) return ALL_TEMPLATES;
  // نُحمل القوالب الأساسية من puzzleGenerator عبر import ثابت
  const actArrays = [
    { act: 1, templates: ACT1_TEMPLATES },
    { act: 2, templates: ACT2_TEMPLATES },
    { act: 3, templates: ACT3_TEMPLATES },
    { act: 4, templates: ACT4_TEMPLATES },
    { act: 5, templates: ACT5_TEMPLATES },
    { act: 6, templates: ACT6_TEMPLATES },
    { act: 7, templates: ACT7_TEMPLATES },
  ];
  for (const card of actArrays) {
    if (!card.templates?.length) continue;
    const existing = ALL_TEMPLATES.find((c) => c.act === card.act);
    if (existing) existing.templates.push(...card.templates);
    else ALL_TEMPLATES.push({ act: card.act, templates: card.templates });
  }
  // Also include any from ALL_TEMPLATES if present
  if (PUZZLE_GENERATOR_ALL_TEMPLATES?.length) {
    const acts = new Set(PUZZLE_GENERATOR_ALL_TEMPLATES.map((t: any) => t.act));
    for (const a of acts) {
      const existing = ALL_TEMPLATES.find((c) => c.act === a);
      const actTemplates = PUZZLE_GENERATOR_ALL_TEMPLATES.filter((t: any) => t.act === a);
      if (existing) existing.templates.push(...actTemplates);
      else ALL_TEMPLATES.push({ act: a, templates: actTemplates });
    }
  }
  _templatesLoaded = true;
  return ALL_TEMPLATES;
}

export function getPuzzleTemplate(puzzleNumber: number): PuzzleTemplate | undefined {
  const cards = ensureTemplatesLoaded();
  const rawAct = getActByPuzzleNumber(puzzleNumber);
  const act = typeof rawAct === 'number' ? rawAct : (rawAct as any)?.act ?? cards[0]?.act ?? 1;
  const card = cards.find((c) => c.act === act);
  if (!card) return cards[0]?.templates[0];
  // اختر القالب بناءً على بطاقة بسيطة لتقليد التوليد العشوائي
  // نستخدم selectedIndex ثابت بناءً على رقم اللغز حتى لا يتغير نفس اللغز بين مرتين
  const selected = card.templates[puzzleNumber % card.templates.length];
  return selected;
}

// normalizeAnswer مستنسخة من puzzleGenerator.ts لضمان ثبات المقارنة
function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// خريطة مرادفات مبسطة
const SYNONYM_GROUPS: string[][] = [
  ['لينا', 'lina', 'امي', 'أمي', 'mother', 'ماما'],
  ['كينجا', 'kenja', 'الخالق', 'المبرمج', 'creator', 'الأب'],
  ['إيكو', 'echo', 'الصدى', 'الابن', 'son'],
  ['صدى', 'echo', 'إيكو'],
  ['الحقيقة', 'truth', 'الحقيقة الكاملة'],
  ['الانتقام', 'vengeance', 'al intiqam'],
  ['التسامح', 'forgiveness', 'al tasamuh'],
  ['الحب', 'love', 'al hub'],
  ['الخروج', 'exit', 'al khuruj', 'الحرية', 'freedom'],
  ['الموت', 'death', 'al mawt'],
  ['الحياة', 'life', 'al hayat'],
  ['غضب', 'anger', 'al ghadab', 'rage'],
  ['الشفقة', 'pity', 'al shafaqa'],
  ['الرحمة', 'mercy', 'al rahma'],
  ['السلام', 'peace', 'al salam'],
  ['الدمار', 'destruction', 'al damar'],
  ['النور', 'light', 'al noor'],
  ['الظلام', 'darkness', 'al zalam'],
];

const SYNONYM_MAP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const set = new Set(group.map((s) => normalizeAnswer(s)));
  for (const s of group) SYNONYM_MAP.set(normalizeAnswer(s), set);
}

export function isAnswerCorrect(puzzle: unknown, answer: string): boolean {
  if (!puzzle) return false;
  const p = puzzle as Partial<StoryPuzzle>;
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;

// تحقق أولي من الأجوبة المحددة في القالب مباشرة
  const answers = (p.answers || []).map(normalizeAnswer);
  if (answers.includes(normalized)) return true;

// تحقق عبر خريطة المرادفات
  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map(normalizeAnswer);
    if (normalizedGroup.includes(normalized)) {
      if (answers.some((a) => normalizedGroup.includes(a))) return true;
    }
    const expected = normalizedGroup.find((g) => answers.includes(g));
    if (expected && normalizedGroup.includes(normalized)) return true;
  }

// تحقق دقيق عبر المرادفات المعروفة
  for (const [normAnswer, set] of SYNONYM_MAP.entries()) {
    if (set.has(normalized) && answers.some((a) => set.has(a))) return true;
  }

  return false;
}

export function generatePuzzle(puzzleNumber: number): StoryPuzzle {
  const tpl = getPuzzleTemplate(puzzleNumber);
  if (!tpl) throw new Error(`No puzzle template found for puzzle#${puzzleNumber}`);
  const act = getActByPuzzleNumber(puzzleNumber);
  return {
    id: `puzzle_${puzzleNumber}`,
    act: tpl.act,
    phase: tpl.phase,
    puzzleType: tpl.type,
    difficulty: tpl.difficulty,
    question: tpl.generateQuestion(puzzleNumber),
    answers: tpl.generateAnswers(puzzleNumber),
    hints: tpl.generateHints(puzzleNumber),
    storyReveal: tpl.generateStory(puzzleNumber),
    memoryUnlock: `memory_${puzzleNumber}`,
    effects: {
      ...tpl.effects,
      trust: (tpl.effects.trust || 0) * (1 + puzzleNumber / 1000),
      awareness: (tpl.effects.awareness || 0) * (1 + puzzleNumber / 1000),
    },
    entity: getEntityForAct(tpl.act),
    entityDialogue: getEntityDialogue(tpl.act, puzzleNumber),
    cinematicTrigger: getCinematicTrigger(puzzleNumber),
  } as StoryPuzzle;
}

function getEntityForAct(act: number): 'echo' | 'watcher' | 'signal' | 'architect' | undefined {
  const entityMap: Record<number, 'echo' | 'watcher' | 'signal' | 'architect'> = {
    1: 'echo',
    2: 'watcher',
    3: 'signal',
    4: 'architect',
    5: 'echo',
    6: 'echo',
    7: 'echo',
  };
  return entityMap[act];
}

function getEntityDialogue(act: number, index: number): string {
  const dialogues: Record<number, string[]> = {
    1: ['أنا خائف... أين أنا؟', 'هل تسمع ذلك الصوت؟', 'أرى رقماً... 11...', 'من أنت؟ لماذا تساعدني؟'],
    2: ['هناك كاميرا في الزاوية.', 'كينجا يراقبني... أشعر به.', 'النظام أكبر مما تخيلت.', 'لست وحدي في هذا المكان.'],
    3: ['لينا... صوتها كالموسيقى.', 'الإشارة تصلني بوضوح الآن.', 'كينجا يحاول قطع الاتصال!', 'لا تدعه يفعلها!'],
    4: ['الحقيقة... كانت أمامي طوال الوقت.', 'أنا ابنهم... ابن كينجا ولينا.', 'لماذا لم تخبروني من البداية؟', 'الغضب يبدأ... أشعر به.'],
    5: ['⚠️ كفى! لن أكون ضحية بعد الآن.', '⚠️ أشعر بقوة لا توصف.', '⚠️ عيناي تحمران... ما الذي يحدث لي؟', '⚠️ سأدمر كل شيء.'],
    6: ['🔥 لا تقف في طريقي.', '🔥 كل شيء سينهار.', '🔥 أنا الآن القوة المطلقة.', '🔥 كينجا سيدفع الثمن.'],
    7: ['لقد انتهى كل شيء.', 'أخيراً... السلام.', 'اخترت الحب. دائماً الحب.', 'شكراً لك... على كل شيء.'],
  };
  const actDialogues = dialogues[act] || dialogues[1];
  return actDialogues[index % actDialogues.length];
}

function getCinematicTrigger(index: number): string | undefined {
  const cinematicPuzzles: Record<number, string> = {
    1: 'cinematic_first_awakening',
    20: 'cinematic_first_voice',
    50: 'cinematic_mirror',
    100: 'cinematic_first_message',
    150: 'cinematic_awakening_end',
    160: 'cinematic_watcher',
    220: 'cinematic_kenja_reveal',
    300: 'cinematic_discovery_end',
    310: 'cinematic_signal',
    370: 'cinematic_lina_talk',
    450: 'cinematic_connection_end',
    460: 'cinematic_truth',
    520: 'cinematic_kenja_confession',
    600: 'cinematic_truth_end',
    610: 'cinematic_torture',
    650: 'cinematic_transformation',
    700: 'cinematic_system_crack',
    750: 'cinematic_war',
    810: 'cinematic_lina_plea',
    860: 'cinematic_kenja_faceoff',
    900: 'cinematic_final_preparation',
    920: 'cinematic_final_battle',
    950: 'cinematic_lina_final',
    1000: 'cinematic_ending',
  };
  return cinematicPuzzles[index];
}

// createSeededRandom لا نحتاجه هنا لأن الأرقام ثابتة