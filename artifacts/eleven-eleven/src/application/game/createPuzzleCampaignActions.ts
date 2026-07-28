import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
  CHAPTER_01_MANHWA_PAGES,
  CHAPTER_01_PUZZLE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../../content/puzzles/chapter01Campaign';
import type {
  GameActions,
  GameState,
} from '../../core/gameTypes';
import type {
  EchoMindDelta,
  HintTierId,
} from '../../domain/puzzles/campaignContracts';
import type { PuzzleId } from '../../domain/content/contracts';
import {
  getCampaignPageStatus,
  getCampaignPuzzleStatus,
  isCampaignPuzzleSubmissionCorrect,
} from '../../domain/puzzles/campaignEngine';
import {
  createChapter01RewardPlan,
} from './chapter01RewardAdapter';
import {
  createGameProgressionActions,
  type GameProgressionActions,
} from './createGameProgressionActions';
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

function puzzleIsAvailable(state: GameState, puzzleId: string): boolean {
  const definition = CHAPTER_01_PUZZLE_BY_ID[puzzleId];
  if (!definition) return false;
  return getCampaignPuzzleStatus(definition, {
    completedPuzzleIds: state.progression.completedPuzzleIds,
    collectedShardIds: state.collectedMemoryFragments,
    progressByPuzzleId: state.puzzleProgress,
  }) !== 'locked';
}

function nextNarrative(
  state: GameState,
  deltas: readonly EchoMindDelta[],
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
    activeFlags: { ...state.narrative.activeFlags },
  };
}

export function createPuzzleCampaignActions(
  set: GameStateSetter,
  get: GameStateGetter,
  progressionActions: GameProgressionActions = createGameProgressionActions(
    set,
    get,
  ),
): PuzzleCampaignActions {
  return {
    saveCampaignPuzzleProgress(puzzleId, progress) {
      if (!CHAPTER_01_PUZZLE_BY_ID[puzzleId]) return;
      set((state) => {
        const campaignProgressByPuzzleId = {
          ...state.progressionState.puzzles.campaignProgressByPuzzleId,
          [puzzleId]: progress,
        };
        return {
          progressionState: {
            ...state.progressionState,
            puzzles: {
              ...state.progressionState.puzzles,
              campaignProgressByPuzzleId,
            },
          },
          puzzleProgress: campaignProgressByPuzzleId,
        };
      });
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
        state.progressionState.puzzles.claimedRewardReceipts.includes(
          `${puzzleId}:1`,
        )
        || state.progression.completedPuzzleIds.includes(
          definition.id as PuzzleId,
        )
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

      const timestamp = new Date().toISOString();
      const rewardPlan = createChapter01RewardPlan(
        definition,
        state.progressionState,
      );
      const rewardResult = progressionActions.applyPuzzleReward(
        definition.id,
        rewardPlan.reward,
        timestamp,
      );
      if (!rewardResult.success) {
        return {
          success: false,
          alreadyCompleted: rewardResult.alreadyClaimed,
          message: rewardResult.alreadyClaimed
            ? 'تم تسجيل هذه الذاكرة ومكافأتها سابقًا.'
            : 'تعذر تسجيل مكافأة الذاكرة.',
        };
      }

      const rewardedState = get();
      const restoredPageId = rewardPlan.restoredPageId
        && rewardResult.unlockedPageIds.includes(
          rewardPlan.restoredPageId,
        )
        ? rewardPlan.restoredPageId
        : undefined;
      const restoredPage = restoredPageId
        ? CHAPTER_01_MANHWA_PAGE_BY_ID[restoredPageId]
        : undefined;
      const narrative = nextNarrative(
        rewardedState,
        rewardPlan.narrativeDeltas,
      );
      const integratedMemoryFragmentIds = restoredPageId
        ? unique([
            ...rewardedState.integratedMemoryFragmentIds,
            ...rewardPlan.integratedShardIds,
          ])
        : rewardedState.integratedMemoryFragmentIds;
      const nextPuzzle = CHAPTER_01_PUZZLES[definition.order];
      const nextPuzzleStatus = nextPuzzle
        ? getCampaignPuzzleStatus(nextPuzzle, {
            completedPuzzleIds:
              rewardedState.progression.completedPuzzleIds,
            collectedShardIds:
              rewardedState.collectedMemoryFragments,
            progressByPuzzleId: rewardedState.puzzleProgress,
          })
        : 'locked';
      const lastAvailablePuzzleId = nextPuzzle
        && nextPuzzleStatus !== 'locked'
        ? nextPuzzle.id
        : definition.id;
      const timelineEvents = [
        ...rewardedState.memory.timelineEvents,
        {
          id: `campaign-${definition.id}`,
          time: timestamp,
          phase: rewardedState.time.phase,
          description: `استُعيدت شظية من: ${definition.title.ar}`,
          type: 'puzzle' as const,
        },
        ...(restoredPageId && restoredPage ? [{
          id: `campaign-${restoredPageId}`,
          time: timestamp,
          phase: rewardedState.time.phase,
          description: `استُعيدت صفحة الذاكرة: ${restoredPage.title.ar}`,
          type: 'memory' as const,
        }] : []),
      ];
      const campaignProgressByPuzzleId = {
        ...rewardedState.progressionState.puzzles
          .campaignProgressByPuzzleId,
        [definition.id]: progress,
      };
      const claimedPageEffectIds = rewardPlan.pageEffectReceiptId
        && restoredPageId
        ? unique([
            ...rewardedState.progressionState.manhwa
              .claimedPageEffectIds,
            rewardPlan.pageEffectReceiptId,
          ])
        : rewardedState.progressionState.manhwa.claimedPageEffectIds;

      set({
        progressionState: {
          ...rewardedState.progressionState,
          puzzles: {
            ...rewardedState.progressionState.puzzles,
            campaignProgressByPuzzleId,
          },
          manhwa: {
            ...rewardedState.progressionState.manhwa,
            claimedPageEffectIds,
          },
          story: {
            narrative,
          },
        },
        integratedMemoryFragmentIds,
        consumedDialogueTriggerIds: unique([
          ...rewardedState.consumedDialogueTriggerIds,
          ...rewardPlan.dialogueTriggers,
        ]),
        lastAvailablePuzzleId,
        lastPuzzleReward: {
          nonce: Date.parse(timestamp),
          puzzleId: definition.id,
          coins: definition.rewards.coins,
          shardId: definition.rewards.shardId,
          ...(restoredPageId ? { restoredPageId } : {}),
        },
        puzzleProgress: campaignProgressByPuzzleId,
        echo: {
          ...rewardedState.echo,
          lastDialogue:
            rewardPlan.dialogueLines.at(-1)
            ?? rewardedState.echo.lastDialogue,
          dialogueHistory: [
            ...rewardedState.echo.dialogueHistory,
            ...rewardPlan.dialogueLines,
          ].slice(-80),
        },
        narrative,
        memory: {
          ...rewardedState.memory,
          totalFragments: CHAPTER_01_MANHWA_PAGES.reduce(
            (total, page) => total + page.requiredShardIds.length,
            0,
          ),
          timelineEvents,
        },
      });

      return {
        success: true,
        alreadyCompleted: false,
        message:
          rewardPlan.dialogueLines.at(-1)
          ?? definition.dialogue.ar,
        ...(restoredPageId ? { restoredPageId } : {}),
      };
    },

    purchaseCampaignHint(puzzleId, tierId) {
      const state = get();
      const definition = CHAPTER_01_PUZZLE_BY_ID[puzzleId];
      const tierIndex = hintOrder.indexOf(tierId);
      const hint = definition?.hints.find((item) => item.id === tierId);
      if (
        !definition
        || !hint
        || tierIndex < 0
        || !puzzleIsAvailable(state, puzzleId)
      ) {
        return {
          success: false,
          alreadyUnlocked: false,
          message: 'هذا التلميح غير متاح.',
        };
      }
      const unlocked = (
        state.progressionState.puzzles.unlockedHintTiersByPuzzle[puzzleId]
        ?? []
      );
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
      const balance = state.progressionState.resources.coins;
      if (balance < hint.cost) {
        const missing = hint.cost - balance;
        const insufficientTrigger =
          `hint_insufficient_currency_${puzzleId}`;
        if (
          !state.consumedDialogueTriggerIds.includes(
            insufficientTrigger,
          )
        ) {
          const insufficientLine =
            `نحتاج ${missing} عملات إضافية لهذا التلميح. يمكننا الاستمرار دون شرائه.`;
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

      if (hint.cost > 0 && !progressionActions.spendCoins(hint.cost)) {
        return {
          success: false,
          alreadyUnlocked: false,
          message: 'الرصيد غير كافٍ.',
        };
      }
      const paidState = get();
      const firstHintTrigger = `hint_first_${puzzleId}`;
      const firstHintLine = 'سأشير إلى الأثر فقط… القرار ما زال لك.';
      const shouldTriggerFirstHintDialogue = (
        unlocked.length === 0
        && !paidState.consumedDialogueTriggerIds.includes(firstHintTrigger)
      );
      const unlockedHintTiersByPuzzle = {
        ...paidState.progressionState.puzzles
          .unlockedHintTiersByPuzzle,
        [puzzleId]: [...unlocked, tierId],
      };
      set({
        progressionState: {
          ...paidState.progressionState,
          puzzles: {
            ...paidState.progressionState.puzzles,
            unlockedHintTiersByPuzzle,
          },
        },
        unlockedHintTiersByPuzzle,
        consumedDialogueTriggerIds: unique([
          ...paidState.consumedDialogueTriggerIds,
          firstHintTrigger,
        ]),
        echo: {
          ...paidState.echo,
          lastDialogue: shouldTriggerFirstHintDialogue
            ? firstHintLine
            : paidState.echo.lastDialogue,
          dialogueHistory: shouldTriggerFirstHintDialogue
            ? [
                ...paidState.echo.dialogueHistory,
                firstHintLine,
              ].slice(-80)
            : paidState.echo.dialogueHistory,
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
            state.progressionState.resources.memoryShards
              .discoveredShardIds,
            CHAPTER_01_MANHWA_PAGES,
          )
        : 'locked';
      if (
        !page
        || (pageStatus !== 'restored' && pageStatus !== 'questioned')
        || state.progressionState.manhwa.viewedPageIds.includes(pageId)
      ) {
        return;
      }
      const timestamp = new Date().toISOString();
      const unlockedPageIds = unique([
        ...state.progressionState.manhwa.unlockedPageIds,
        pageId,
      ]);
      const viewedPageIds = unique([
        ...state.progressionState.manhwa.viewedPageIds,
        pageId,
      ]);
      const pageUnlockedAt = {
        ...state.progressionState.manhwa.pageUnlockedAt,
        [pageId]:
          state.progressionState.manhwa.pageUnlockedAt[pageId]
          ?? timestamp,
      };
      const pageViewedAt = {
        ...state.progressionState.manhwa.pageViewedAt,
        [pageId]:
          state.progressionState.manhwa.pageViewedAt[pageId]
          ?? timestamp,
      };
      const reopenedLine = page.dialogue.ar;
      set({
        progressionState: {
          ...state.progressionState,
          manhwa: {
            ...state.progressionState.manhwa,
            unlockedPageIds,
            viewedPageIds,
            pageUnlockedAt,
            pageViewedAt,
          },
        },
        unlockedManhwaPageIds: unlockedPageIds,
        viewedManhwaPageIds: viewedPageIds,
        manhwaPageUnlockedAt: pageUnlockedAt,
        manhwaPageViewedAt: pageViewedAt,
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
