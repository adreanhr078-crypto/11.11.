import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
  CHAPTER_01_MANHWA_PAGES,
  CHAPTER_01_PUZZLE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../../content/puzzles/chapter01Campaign';
import type {
  EchoState,
  GameActions,
  GameState,
} from '../../core/gameTypes';
import type { PuzzleId } from '../../domain/content/contracts';
import type {
  CampaignPuzzleProgress,
  EchoMindDelta,
  HintTierId,
} from '../../domain/puzzles/campaignContracts';
import {
  getCampaignPageStatus,
  getCampaignPuzzleStatus,
  isCampaignPuzzleSubmissionCorrect,
} from '../../domain/puzzles/campaignEngine';
import { recordPuzzleOutcome } from '../../domain/progression/progression';
import {
  CHAPTER_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import { applyLegacyEchoEffects } from './echoCompatibility';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type PuzzleCampaignActions = Pick<
  GameActions,
  | 'saveCampaignPuzzleProgress'
  | 'completeCampaignPuzzle'
  | 'purchaseCampaignHint'
  | 'markManhwaPageViewed'
  | 'clearPuzzleRewardEvent'
>;

const hintOrder: HintTierId[] = [
  'observation',
  'connection',
  'assistance',
];

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function puzzleIsAvailable(state: GameState, puzzleId: string): boolean {
  const definition = CHAPTER_01_PUZZLE_BY_ID[puzzleId];
  if (!definition) return false;
  return getCampaignPuzzleStatus(definition, {
    completedPuzzleIds: state.progression.completedPuzzleIds,
    collectedShardIds: state.collectedMemoryFragments,
    progressByPuzzleId: state.puzzleProgress,
  }) !== 'locked';
}

function applyEchoMindDelta(
  echo: EchoState,
  delta: EchoMindDelta,
): EchoState {
  const next = applyLegacyEchoEffects(echo, {
    fear: delta.emotions.fear,
    trust: delta.emotions.trust,
    hope: delta.emotions.hope,
    corruption: delta.emotions.corruption,
    memoryStability: delta.emotions.memoryStability,
    ragePoints: delta.emotions.rage,
  });
  return {
    ...next,
    awareness: clamp(next.awareness + (delta.emotions.awareness ?? 0)),
    loneliness: clamp(next.loneliness + (delta.emotions.loneliness ?? 0)),
    forgivenessPoints: clamp(
      next.forgivenessPoints + (delta.emotions.forgiveness ?? 0),
    ),
  };
}

function nextNarrative(
  state: GameState,
  deltas: EchoMindDelta[],
  flags: readonly string[],
) {
  return {
    ...state.narrative,
    beliefs: unique([
      ...state.narrative.beliefs,
      ...deltas.flatMap((delta) => delta.beliefsAdded),
    ]),
    questions: unique([
      ...state.narrative.questions,
      ...deltas.flatMap((delta) => delta.questionsAdded),
    ]),
    knowledgeNodeIds: unique([
      ...state.narrative.knowledgeNodeIds,
      ...deltas.flatMap((delta) => delta.knowledgeNodesAdded),
    ]),
    activeFlags: {
      ...state.narrative.activeFlags,
      ...Object.fromEntries(flags.map((flag) => [flag, true])),
    },
  };
}

export function createPuzzleCampaignActions(
  set: GameStateSetter,
  get: GameStateGetter,
): PuzzleCampaignActions {
  return {
    saveCampaignPuzzleProgress(puzzleId, progress) {
      if (!CHAPTER_01_PUZZLE_BY_ID[puzzleId]) return;
      set((state) => ({
        puzzleProgress: {
          ...state.puzzleProgress,
          [puzzleId]: progress,
        },
      }));
    },

    completeCampaignPuzzle(puzzleId, progress) {
      const state = get();
      const definition = CHAPTER_01_PUZZLE_BY_ID[puzzleId];
      if (!definition || !puzzleIsAvailable(state, puzzleId)) {
        return {
          success: false,
          alreadyCompleted: false,
          message: 'هذا اللغز ما زال مقفلًا.',
        };
      }
      if (
        state.claimedPuzzleRewards.includes(puzzleId)
        || state.progression.completedPuzzleIds.includes(puzzleId as PuzzleId)
      ) {
        return {
          success: false,
          alreadyCompleted: true,
          message: 'تم تسجيل هذه الذاكرة ومكافأتها سابقًا.',
        };
      }
      if (!isCampaignPuzzleSubmissionCorrect(definition, progress)) {
        return {
          success: false,
          alreadyCompleted: false,
          message: 'الإشارة غير مكتملة. راجع ترتيب الأدلة.',
        };
      }

      let restoredPageId: string | undefined;
      let pageDelta: EchoMindDelta | undefined;
      let pageFlags: string[] = [];
      let pageDialogue: string | undefined;
      let pageTriggers: string[] = [];
      const collectedMemoryFragments = unique([
        ...state.collectedMemoryFragments,
        definition.rewards.shardId,
      ]);
      const targetPage = CHAPTER_01_MANHWA_PAGE_BY_ID[definition.targetPageId];
      const hasPrerequisitePage = (
        !targetPage?.prerequisitePageId
        || state.unlockedManhwaPageIds.includes(targetPage.prerequisitePageId)
      );
      const pageComplete = Boolean(
        targetPage
        && hasPrerequisitePage
        && targetPage.requiredShardIds.every(
          (shardId) => collectedMemoryFragments.includes(shardId),
        )
      );

      if (
        pageComplete
        && targetPage
        && !state.unlockedManhwaPageIds.includes(targetPage.id)
      ) {
        restoredPageId = targetPage.id;
        pageDelta = targetPage.echoMindDelta;
        pageFlags = targetPage.narrativeFlags;
        pageDialogue = targetPage.dialogue.ar;
        pageTriggers = targetPage.dialogueTriggers;
      }

      const deltas = [
        definition.echoMindDelta,
        ...(pageDelta ? [pageDelta] : []),
      ];
      const flags = [...definition.narrativeFlags, ...pageFlags];
      const dialogueLines = [
        definition.dialogue.ar,
        ...(pageDialogue ? [pageDialogue] : []),
      ];
      const dialogueTriggers = unique([
        ...definition.dialogueTriggers,
        ...pageTriggers,
      ]);
      let echo = state.echo;
      for (const delta of deltas) {
        echo = applyEchoMindDelta(echo, delta);
      }
      echo = {
        ...echo,
        lastDialogue: dialogueLines.at(-1) ?? echo.lastDialogue,
        dialogueHistory: [
          ...echo.dialogueHistory,
          ...dialogueLines,
        ].slice(-80),
      };

      const progression = recordPuzzleOutcome(
        state.progression,
        definition.id as PuzzleId,
        'chapter_1',
        'solved',
        CHAPTER_DEFINITIONS,
      );
      const unlockedManhwaPageIds = restoredPageId
        ? unique([...state.unlockedManhwaPageIds, restoredPageId])
        : state.unlockedManhwaPageIds;
      const integratedMemoryFragmentIds = restoredPageId && targetPage
        ? unique([
            ...state.integratedMemoryFragmentIds,
            ...targetPage.requiredShardIds,
          ])
        : state.integratedMemoryFragmentIds;
      const nextPuzzle = CHAPTER_01_PUZZLES[definition.order];
      const nextPuzzleStatus = nextPuzzle
        ? getCampaignPuzzleStatus(nextPuzzle, {
            completedPuzzleIds: progression.completedPuzzleIds,
            collectedShardIds: collectedMemoryFragments,
            progressByPuzzleId: state.puzzleProgress,
          })
        : 'locked';
      const lastAvailablePuzzleId = nextPuzzle
        && nextPuzzleStatus !== 'locked'
        ? nextPuzzle.id
        : definition.id;
      const now = new Date().toISOString();
      const timelineEvents = [
        ...state.memory.timelineEvents,
        {
          id: `campaign-${definition.id}`,
          time: now,
          phase: state.time.phase,
          description: `استُعيدت شظية من: ${definition.title.ar}`,
          type: 'puzzle' as const,
        },
        ...(restoredPageId && targetPage ? [{
          id: `campaign-${restoredPageId}`,
          time: now,
          phase: state.time.phase,
          description: `استُعيدت صفحة الذاكرة: ${targetPage.title.ar}`,
          type: 'memory' as const,
        }] : []),
      ];

      set({
        currency: state.currency + definition.rewards.coins,
        collectedMemoryFragments,
        memoryFragmentCollectedAt: {
          ...state.memoryFragmentCollectedAt,
          [definition.rewards.shardId]:
            state.memoryFragmentCollectedAt[definition.rewards.shardId]
            ?? now,
        },
        claimedPuzzleRewards: [
          ...state.claimedPuzzleRewards,
          definition.id,
        ],
        integratedMemoryFragmentIds,
        unlockedManhwaPageIds,
        manhwaPageUnlockedAt: restoredPageId
          ? {
              ...state.manhwaPageUnlockedAt,
              [restoredPageId]: state.manhwaPageUnlockedAt[restoredPageId]
                ?? now,
            }
          : state.manhwaPageUnlockedAt,
        consumedDialogueTriggerIds: unique([
          ...state.consumedDialogueTriggerIds,
          ...dialogueTriggers,
        ]),
        lastAvailablePuzzleId,
        lastPuzzleReward: {
          nonce: Date.now(),
          puzzleId: definition.id,
          coins: definition.rewards.coins,
          shardId: definition.rewards.shardId,
          ...(restoredPageId ? { restoredPageId } : {}),
        },
        puzzleProgress: {
          ...state.puzzleProgress,
          [definition.id]: progress,
        },
        echo,
        narrative: nextNarrative(state, deltas, flags),
        progression,
        memory: {
          ...state.memory,
          fragmentsCollected: collectedMemoryFragments.length,
          // Every PDF page owns ten archive slots. Deferred slots remain
          // impossible to collect until real puzzle rewards are authored.
          totalFragments: CHAPTER_01_MANHWA_PAGES.reduce(
            (total, page) => total + page.requiredShardIds.length,
            0,
          ),
          timelineEvents,
        },
        solvedPuzzles: progression.completedPuzzleIds.length,
      });

      return {
        success: true,
        alreadyCompleted: false,
        message: pageDialogue ?? definition.dialogue.ar,
        ...(restoredPageId ? { restoredPageId } : {}),
      };
    },

    purchaseCampaignHint(puzzleId, tierId) {
      const state = get();
      const definition = CHAPTER_01_PUZZLE_BY_ID[puzzleId];
      const tierIndex = hintOrder.indexOf(tierId);
      const hint = definition?.hints.find((item) => item.id === tierId);
      if (!definition || !hint || tierIndex < 0 || !puzzleIsAvailable(state, puzzleId)) {
        return {
          success: false,
          alreadyUnlocked: false,
          message: 'هذا التلميح غير متاح.',
        };
      }
      const unlocked = state.unlockedHintTiersByPuzzle[puzzleId] ?? [];
      if (unlocked.includes(tierId)) {
        return {
          success: true,
          alreadyUnlocked: true,
          message: hint.text.ar,
          hint,
        };
      }
      if (tierIndex > 0 && !unlocked.includes(hintOrder[tierIndex - 1]!)) {
        return {
          success: false,
          alreadyUnlocked: false,
          message: 'افتح مستوى التلميح السابق أولًا.',
        };
      }
      if (state.currency < hint.cost) {
        const missing = hint.cost - state.currency;
        const insufficientTrigger = `hint_insufficient_currency_${puzzleId}`;
        if (!state.consumedDialogueTriggerIds.includes(insufficientTrigger)) {
          const insufficientLine = `نحتاج ${missing} عملات إضافية لهذا التلميح. يمكننا الاستمرار دون شرائه.`;
          set({
            consumedDialogueTriggerIds: unique([
              ...state.consumedDialogueTriggerIds,
              insufficientTrigger,
            ]),
            echo: {
              ...state.echo,
              lastDialogue: insufficientLine,
              dialogueHistory: [
                ...state.echo.dialogueHistory,
                insufficientLine,
              ].slice(-80),
            },
          });
        }
        return {
          success: false,
          alreadyUnlocked: false,
          message: `الرصيد غير كافٍ. تحتاج ${missing} عملات إضافية.`,
        };
      }

      const firstHintTrigger = `hint_first_${puzzleId}`;
      const firstHintLine = 'سأشير إلى الأثر فقط… القرار ما زال لك.';
      const shouldTriggerFirstHintDialogue = (
        unlocked.length === 0
        && !state.consumedDialogueTriggerIds.includes(firstHintTrigger)
      );
      set({
        currency: Math.max(0, state.currency - hint.cost),
        unlockedHintTiersByPuzzle: {
          ...state.unlockedHintTiersByPuzzle,
          [puzzleId]: [...unlocked, tierId],
        },
        consumedDialogueTriggerIds: unique([
          ...state.consumedDialogueTriggerIds,
          firstHintTrigger,
        ]),
        echo: {
          ...state.echo,
          lastDialogue: shouldTriggerFirstHintDialogue
            ? firstHintLine
            : state.echo.lastDialogue,
          dialogueHistory: shouldTriggerFirstHintDialogue
            ? [
                ...state.echo.dialogueHistory,
                firstHintLine,
              ].slice(-80)
            : state.echo.dialogueHistory,
        },
      });
      return {
        success: true,
        alreadyUnlocked: false,
        message: hint.text.ar,
        hint,
      };
    },

    markManhwaPageViewed(pageId) {
      const state = get();
      const page = CHAPTER_01_MANHWA_PAGE_BY_ID[pageId];
      const pageStatus = page
        ? getCampaignPageStatus(
            page,
            state.collectedMemoryFragments,
            CHAPTER_01_MANHWA_PAGES,
          )
        : 'locked';
      if (
        !page
        || (pageStatus !== 'restored' && pageStatus !== 'questioned')
        || state.viewedManhwaPageIds.includes(pageId)
      ) {
        return;
      }
      const now = new Date().toISOString();
      const reopenedLine = page.dialogue.ar;
      set({
        unlockedManhwaPageIds: unique([
          ...state.unlockedManhwaPageIds,
          pageId,
        ]),
        viewedManhwaPageIds: unique([
          ...state.viewedManhwaPageIds,
          pageId,
        ]),
        manhwaPageUnlockedAt: {
          ...state.manhwaPageUnlockedAt,
          [pageId]: state.manhwaPageUnlockedAt[pageId] ?? now,
        },
        manhwaPageViewedAt: {
          ...state.manhwaPageViewedAt,
          [pageId]: state.manhwaPageViewedAt[pageId] ?? now,
        },
        consumedDialogueTriggerIds: unique([
          ...state.consumedDialogueTriggerIds,
          `reopened_${pageId}`,
        ]),
        echo: {
          ...state.echo,
          lastDialogue: reopenedLine,
          dialogueHistory: [
            ...state.echo.dialogueHistory,
            reopenedLine,
          ].slice(-80),
        },
      });
    },

    clearPuzzleRewardEvent() {
      set({ lastPuzzleReward: null });
    },
  };
}
