import { STORY_PUZZLES } from '../../content/puzzles/storyPuzzleCatalog';
import type { GameScreenId } from '../../app/shell/screenRegistry';
import type { StoryPuzzleSnapshot } from '../../domain/story-puzzles/storyPuzzleContracts';
import type { NetworkLocale } from '../../domain/echo-network/contracts';

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
  locale: NetworkLocale = 'ar',
): CorePlayerObjective {
  const nextPuzzle = STORY_PUZZLES.find((puzzle) => (
    puzzle.classification === 'main'
    && snapshot?.entries.find((entry) => entry.puzzleId === puzzle.id)?.status !== 'completed'
  )) ?? null;
  if (!nextPuzzle) {
    return locale === 'en' ? {
      kind: 'complete',
      title: 'Core restoration complete',
      detail: 'Read the open archive and look for secret signals when you are ready.',
      echoLine: 'Not everything is over… but it is clear enough for us to continue.',
      actionLabel: 'Open archive',
      screen: 'memories',
    } : {
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
    return locale === 'en' ? {
      kind: 'solve',
      title: `Solve “${nextPuzzle.title.en}”`,
      detail: `The clue from page ${nextPuzzle.source.globalPageNumber} is ready. Test your hypothesis, then send it for verification.`,
      echoLine: 'I can see a pattern. Do not guess; test what you noticed.',
      actionLabel: 'Open puzzle',
      screen: 'puzzles',
    } : {
      kind: 'solve',
      title: `حل «${nextPuzzle.title.ar}»`,
      detail: `الدليل الذي جمعته من الصفحة ${nextPuzzle.source.globalPageNumber} جاهز الآن. جرّب فرضيتك ثم أرسلها للتحقق.`,
      echoLine: 'أرى أثرًا متماسكًا. لا تخمّن؛ اختبر ما لاحظته.',
      actionLabel: 'فتح اللغز',
      screen: 'puzzles',
    };
  }
  return locale === 'en' ? {
    kind: 'read',
    title: `Read through page ${nextPuzzle.source.globalPageNumber}`,
    detail: `A clue for “${nextPuzzle.title.en}” is waiting there. Read the page, then return to the puzzle channel.`,
    echoLine: 'Before I answer, we need one trace from the archive.',
    actionLabel: 'Open Manhwa',
    screen: 'memories',
  } : {
    kind: 'read',
    title: `اقرأ حتى الصفحة ${nextPuzzle.source.globalPageNumber}`,
    detail: `هناك دليل لازم للغز «${nextPuzzle.title.ar}». شاهد الصفحة ثم عُد إلى قناة الألغاز.`,
    echoLine: 'قبل أن أجيب، نحتاج أثرًا واحدًا من الأرشيف.',
    actionLabel: 'فتح المانهوَا',
    screen: 'memories',
  };
}
