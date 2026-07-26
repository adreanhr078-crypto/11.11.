import type {
  CampaignInteractionStage,
  CampaignLocalizedText,
  CampaignPuzzleDefinition,
  PuzzleTemplateId,
} from './campaignContracts';

type InteractionMode = CampaignInteractionStage['mode'];

export interface PuzzleTemplateDefinition {
  id: PuzzleTemplateId;
  label: CampaignLocalizedText;
  supportedModes: readonly InteractionMode[];
  allowsMultipleStages: boolean;
}

function template(
  id: PuzzleTemplateId,
  ar: string,
  en: string,
  supportedModes: readonly InteractionMode[],
  allowsMultipleStages = false,
): PuzzleTemplateDefinition {
  return {
    id,
    label: { ar, en },
    supportedModes,
    allowsMultipleStages,
  };
}

export const PUZZLE_TEMPLATE_REGISTRY = Object.freeze({
  visual_sequence: template('visual_sequence', 'تسلسل بصري', 'Visual sequence', ['sequence']),
  corrupted_text: template('corrupted_text', 'نص مشوّش', 'Corrupted text', ['sequence']),
  file_reconstruction: template('file_reconstruction', 'إعادة بناء ملف', 'File reconstruction', ['multi']),
  mirror_matching: template('mirror_matching', 'مطابقة مرآة', 'Mirror matching', ['single']),
  spatial_logic: template('spatial_logic', 'منطق مكاني', 'Spatial logic', ['match']),
  evidence_matching: template('evidence_matching', 'مطابقة أدلة', 'Evidence matching', ['match']),
  authentic_memory_detection: template('authentic_memory_detection', 'تمييز ذكرى', 'Authentic memory detection', ['single']),
  grid_path: template('grid_path', 'مسار شبكي', 'Grid path', ['path']),
  seven_segment: template('seven_segment', 'شاشة رقمية', 'Seven segment display', ['rings']),
  multi_stage_reconstruction: template(
    'multi_stage_reconstruction',
    'إعادة بناء متعددة',
    'Multi-stage reconstruction',
    ['sequence'],
    true,
  ),
  sorting: template('sorting', 'فرز', 'Sorting', ['single']),
  letter_path: template('letter_path', 'مسار حروف', 'Letter path', ['path']),
  network_connection: template('network_connection', 'توصيل شبكة', 'Network connection', ['path']),
  silhouette_analysis: template('silhouette_analysis', 'تحليل ظل', 'Silhouette analysis', ['single']),
  memory_trail: template('memory_trail', 'أثر ذاكرة', 'Memory trail', ['path']),
  document_jigsaw: template('document_jigsaw', 'وثيقة ممزقة', 'Document jigsaw', ['sequence']),
  memory_clustering: template('memory_clustering', 'تجميع ذكريات', 'Memory clustering', ['multi']),
  sentence_reconstruction: template('sentence_reconstruction', 'ترميم جملة', 'Sentence reconstruction', ['sequence']),
  rotating_clock: template('rotating_clock', 'حلقات زمن', 'Rotating clock', ['rings']),
  page_reconstruction: template(
    'page_reconstruction',
    'إعادة بناء صفحة',
    'Page reconstruction',
    ['sequence', 'single'],
    true,
  ),
}) satisfies Readonly<Record<PuzzleTemplateId, PuzzleTemplateDefinition>>;

export function validatePuzzleTemplateCompatibility(
  puzzle: CampaignPuzzleDefinition,
): void {
  const definition = PUZZLE_TEMPLATE_REGISTRY[puzzle.template];
  if (!definition) {
    throw new Error(`${puzzle.id} references an unknown puzzle template`);
  }
  if (!definition.allowsMultipleStages && puzzle.stages.length !== 1) {
    throw new Error(`${puzzle.id} uses multiple stages in a single-stage template`);
  }
  for (const stage of puzzle.stages) {
    if (!definition.supportedModes.includes(stage.mode)) {
      throw new Error(
        `${puzzle.id} uses ${stage.mode} with ${definition.id}`,
      );
    }
  }
}
