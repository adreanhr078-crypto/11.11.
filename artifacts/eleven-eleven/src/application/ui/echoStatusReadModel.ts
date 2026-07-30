import type {
  EchoEvolutionStageDefinition,
} from '../../core/echoEvolutionTypes';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import {
  RUNTIME_ECHO_EVOLUTION_STAGES,
} from '../../domain/echo/echoEvolutionDefinitions';
import {
  RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
  type RuntimeKnowledgeNodeDefinition,
} from '../../domain/narrative/knowledgeRegistry';

export type EchoStatusLocale = 'ar' | 'en';

export type EchoStatusMetricKey =
  | 'humanity'
  | 'fear'
  | 'trust'
  | 'anger'
  | 'memoryStability'
  | 'corruption';

export interface EchoStatusMetricReadModel {
  key: EchoStatusMetricKey;
  label: string;
  value: number;
}

export interface EchoStatusKnowledgeReadModel {
  label: string;
  visibleCount: number;
  statusLabel: string;
}

export interface EchoStatusReadModel {
  stage: {
    /**
     * Only a published, player-visible stage ID is exposed. Unknown or hidden
     * IDs remain in the save but are replaced with null at the UI boundary.
     */
    stageId: string | null;
    label: string;
    visible: boolean;
  };
  metrics: Record<EchoStatusMetricKey, number>;
  metricItems: EchoStatusMetricReadModel[];
  knowledge: {
    player: EchoStatusKnowledgeReadModel;
    echo: EchoStatusKnowledgeReadModel;
  };
  copy: {
    panelTitle: string;
    stageHeading: string;
    metricsLabel: string;
    knowledgeLabel: string;
    announcement: string;
  };
}

export interface EchoStatusReadModelOptions {
  locale?: EchoStatusLocale;
  stageDefinitions?: readonly EchoEvolutionStageDefinition[];
  knowledgeDefinitions?: readonly RuntimeKnowledgeNodeDefinition[];
}

const COPY = {
  ar: {
    unknown: 'غير معروف',
    panelTitle: 'حالة Echo',
    stageHeading: 'مرحلة التطور الحالية',
    metricsLabel: 'المقاييس النفسية',
    knowledgeLabel: 'المعرفة المنشورة',
    playerKnowledge: 'معرفة اللاعب',
    echoKnowledge: 'معرفة Echo',
    noKnowledge: 'لا توجد معرفة منشورة',
    knowledgeCount: (count: number) => `${count} عناصر منشورة`,
    announcement: (stage: string) => `حالة Echo الحالية: ${stage}`,
    metrics: {
      humanity: 'الإنسانية',
      fear: 'الخوف',
      trust: 'الثقة',
      anger: 'الغضب',
      memoryStability: 'استقرار الذاكرة',
      corruption: 'الفساد',
    },
  },
  en: {
    unknown: 'Unknown',
    panelTitle: 'Echo status',
    stageHeading: 'Current evolution stage',
    metricsLabel: 'Psychological metrics',
    knowledgeLabel: 'Published knowledge',
    playerKnowledge: 'Player knowledge',
    echoKnowledge: 'Echo knowledge',
    noKnowledge: 'No published knowledge',
    knowledgeCount: (count: number) => `${count} published items`,
    announcement: (stage: string) => `Current Echo status: ${stage}`,
    metrics: {
      humanity: 'Humanity',
      fear: 'Fear',
      trust: 'Trust',
      anger: 'Anger',
      memoryStability: 'Memory stability',
      corruption: 'Corruption',
    },
  },
} as const;

const METRIC_ORDER: readonly EchoStatusMetricKey[] = [
  'humanity',
  'fear',
  'trust',
  'anger',
  'memoryStability',
  'corruption',
];

function clampMetric(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function visibleKnowledgeCount(
  nodeIds: readonly string[],
  audience: RuntimeKnowledgeNodeDefinition['audience'],
  definitions: readonly RuntimeKnowledgeNodeDefinition[],
): number {
  const acquiredIds = new Set(nodeIds);
  return new Set(
    definitions
      .filter((definition) => (
        definition.audience === audience
        && definition.published
        && definition.playerVisible
        && acquiredIds.has(definition.nodeId)
      ))
      .map((definition) => definition.nodeId),
  ).size;
}

/**
 * Canon-safe projection for Echo UI.
 *
 * This boundary accepts canonical progression only. It cannot read legacy
 * hope, ragePoints, transformationStage, or compatibility personality state.
 * Unknown future IDs remain persisted but never cross this player UI model.
 */
export function createEchoStatusReadModel(
  progressionState: GameProgressionState,
  options: EchoStatusReadModelOptions = {},
): EchoStatusReadModel {
  const locale = options.locale ?? 'ar';
  const copy = COPY[locale];
  const stageDefinitions = options.stageDefinitions
    ?? RUNTIME_ECHO_EVOLUTION_STAGES;
  const knowledgeDefinitions = options.knowledgeDefinitions
    ?? RUNTIME_NARRATIVE_KNOWLEDGE_NODES;
  const currentStage = stageDefinitions.find((definition) => (
    definition.stageId === progressionState.evolution.currentStageId
    && definition.published
    && definition.playerVisible
  ));
  const localizedStageLabel = currentStage?.safePlayerLabel[locale].trim();
  const stageLabel = localizedStageLabel || copy.unknown;
  const visibleStageId = localizedStageLabel
    ? currentStage?.stageId ?? null
    : null;
  const metrics = {
    humanity: clampMetric(progressionState.echo.humanity),
    fear: clampMetric(progressionState.echo.fear),
    trust: clampMetric(progressionState.echo.trust),
    anger: clampMetric(progressionState.echo.anger),
    memoryStability: clampMetric(
      progressionState.echo.memoryStability,
    ),
    corruption: clampMetric(progressionState.echo.corruption),
  };
  const playerKnowledgeCount = visibleKnowledgeCount(
    progressionState.story.narrative.knowledgeNodeIds,
    'player',
    knowledgeDefinitions,
  );
  const echoKnowledgeCount = visibleKnowledgeCount(
    progressionState.story.narrative.echoKnowledgeNodeIds,
    'echo',
    knowledgeDefinitions,
  );
  const knowledgeStatus = (count: number) => (
    count > 0 ? copy.knowledgeCount(count) : copy.noKnowledge
  );

  return {
    stage: {
      stageId: visibleStageId,
      label: stageLabel,
      visible: visibleStageId !== null,
    },
    metrics,
    metricItems: METRIC_ORDER.map((key) => ({
      key,
      label: copy.metrics[key],
      value: metrics[key],
    })),
    knowledge: {
      player: {
        label: copy.playerKnowledge,
        visibleCount: playerKnowledgeCount,
        statusLabel: knowledgeStatus(playerKnowledgeCount),
      },
      echo: {
        label: copy.echoKnowledge,
        visibleCount: echoKnowledgeCount,
        statusLabel: knowledgeStatus(echoKnowledgeCount),
      },
    },
    copy: {
      panelTitle: copy.panelTitle,
      stageHeading: copy.stageHeading,
      metricsLabel: copy.metricsLabel,
      knowledgeLabel: copy.knowledgeLabel,
      announcement: copy.announcement(stageLabel),
    },
  };
}
