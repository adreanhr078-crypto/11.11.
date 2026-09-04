import { STORY_PUZZLES } from '../../content/puzzles/storyPuzzleCatalog';
import type { GameScreenId } from '../../app/shell/screenRegistry';
import type { StoryPuzzleSnapshot } from '../../domain/story-puzzles/storyPuzzleContracts';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import type { AuthoritativeStoryState } from '../../domain/story/storyState';

export interface CorePlayerObjective {
  kind: 'read' | 'solve' | 'complete';
  title: string;
  detail: string;
  echoLine: string;
  actionLabel: string;
  screen: GameScreenId;
  /**
   * A server-discovered anomaly may become the immediate objective. This is
   * only a presentation target: the Puzzle gateway still decides whether it
   * may be discovered and opened.
   */
  secretPuzzleId?: string;
}

/** The one answer a first-time player must always be able to see: what now? */
export function deriveCorePlayerObjective(
  snapshot: StoryPuzzleSnapshot | null,
  locale: NetworkLocale = 'ar',
  authoritativeStoryState?: AuthoritativeStoryState | null,
): CorePlayerObjective {
  if (authoritativeStoryState?.openingCoverPuzzleCompleted === false) {
    return locale === 'en' ? {
      kind: 'solve',
      title: 'Reconstruct the first signal',
      detail: 'The cover is the first trace. Align it to wake the room beyond the interface.',
      echoLine: 'I remember the shape, not the order. Help me put the first moment back together.',
      actionLabel: 'Open the reconstruction',
      screen: 'opening-recovery',
    } : {
      kind: 'solve',
      title: 'أعد بناء الإشارة الأولى',
      detail: 'الغلاف هو الأثر الأول. رتّبه لإيقاظ الغرفة خلف الواجهة.',
      echoLine: 'أتذكر الشكل، لا الترتيب. ساعدني على إعادة اللحظة الأولى.',
      actionLabel: 'فتح تركيب الغلاف',
      screen: 'opening-recovery',
    };
  }
  if (
    authoritativeStoryState?.openingCoverPuzzleCompleted === true
    && authoritativeStoryState.openingRoomCompleted === false
  ) {
    return locale === 'en' ? {
      kind: 'complete',
      title: 'Enter the opening room',
      detail: 'The interface is awake. Walk into the room and follow the traces Echo can still feel.',
      echoLine: 'The room is where the first memory becomes real.',
      actionLabel: 'Enter the room',
      screen: 'play',
    } : {
      kind: 'complete',
      title: 'ادخل الغرفة الافتتاحية',
      detail: 'استيقظت الواجهة. ادخل الغرفة واتبع الآثار التي ما زال Echo يشعر بها.',
      echoLine: 'هناك تصبح الذكرى الأولى حقيقية.',
      actionLabel: 'دخول الغرفة',
      screen: 'play',
    };
  }
  // Secret signals are returned only by the authoritative story snapshot.
  // When one exists it deserves a clear, deliberate hand-off instead of
  // being hidden behind the puzzle index while the player is told to read a
  // later chapter.
  const discoverableSecret = snapshot?.discoverableSecretPuzzleIds
    .map((puzzleId) => STORY_PUZZLES.find((puzzle) => (
      puzzle.id === puzzleId && puzzle.classification === 'secret'
    )))
    .find((puzzle): puzzle is typeof STORY_PUZZLES[number] => Boolean(puzzle));
  if (discoverableSecret) {
    return locale === 'en' ? {
      kind: 'solve',
      title: 'Inspect the detected memory shard',
      detail: `A fragment surfaced after page ${discoverableSecret.source.globalPageNumber}. Open its channel and inspect the record before the trail goes cold.`,
      echoLine: 'This did not come from the normal route. Let us look at it carefully.',
      actionLabel: 'Inspect fragment',
      screen: 'puzzles',
      secretPuzzleId: discoverableSecret.id,
    } : {
      kind: 'solve',
      title: 'افحص شظية الذاكرة المرصودة',
      detail: `ظهرت شظية بعد الصفحة ${discoverableSecret.source.globalPageNumber}. افتح قناتها وافحص السجل قبل أن يبرد الأثر.`,
      echoLine: 'لم تأتِ هذه من المسار المعتاد. لنفحصها بهدوء.',
      actionLabel: 'افحص الشظية',
      screen: 'puzzles',
      secretPuzzleId: discoverableSecret.id,
    };
  }

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
