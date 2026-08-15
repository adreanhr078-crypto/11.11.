import { STORY_PUZZLES } from '../../content/puzzles/storyPuzzleCatalog';
import type { GameScreenId } from '../../app/shell/screenRegistry';
import type { StoryPuzzleSnapshot } from '../../domain/story-puzzles/storyPuzzleContracts';

export interface CorePlayerObjective {
  kind: 'read' | 'solve' | 'complete';
  title: string;
  detail: string;
  echoLine: string;
  actionLabel: string;
  screen: GameScreenId;
}

/** The one answer a first-time player must always be able to see: what now? */
export function deriveCorePlayerObjective(
  snapshot: StoryPuzzleSnapshot | null,
): CorePlayerObjective {
  const nextPuzzle = STORY_PUZZLES.find((puzzle) => (
    puzzle.classification === 'main'
    && snapshot?.entries.find((entry) => entry.puzzleId === puzzle.id)?.status !== 'completed'
  )) ?? null;
  if (!nextPuzzle) {
    return {
      kind: 'complete',
      title: 'الاستعادة الأساسية مكتملة',
      detail: 'اقرأ الأرشيف المفتوح وابحث عن الإشارات السرية عندما تكون مستعدًا.',
      echoLine: 'لم ينتهِ كل شيء… لكنه صار واضحًا بما يكفي لنكمل معًا.',
      actionLabel: 'فتح الأرشيف',
      screen: 'memories',
    };
  }
  const entry = snapshot?.entries.find((candidate) => candidate.puzzleId === nextPuzzle.id);
  const canSolve = entry?.status === 'available' || entry?.status === 'in_progress';
  if (canSolve) {
    return {
      kind: 'solve',
      title: `حل «${nextPuzzle.title.ar}»`,
      detail: `الدليل الذي جمعته من الصفحة ${nextPuzzle.source.globalPageNumber} جاهز الآن. جرّب فرضيتك ثم أرسلها للتحقق.`,
      echoLine: 'أرى أثرًا متماسكًا. لا تخمّن؛ اختبر ما لاحظته.',
      actionLabel: 'فتح اللغز',
      screen: 'puzzles',
    };
  }
  return {
    kind: 'read',
    title: `اقرأ حتى الصفحة ${nextPuzzle.source.globalPageNumber}`,
    detail: `هناك دليل لازم للغز «${nextPuzzle.title.ar}». شاهد الصفحة ثم عُد إلى قناة الألغاز.`,
    echoLine: 'قبل أن أجيب، نحتاج أثرًا واحدًا من الأرشيف.',
    actionLabel: 'فتح المانهوَا',
    screen: 'memories',
  };
}
