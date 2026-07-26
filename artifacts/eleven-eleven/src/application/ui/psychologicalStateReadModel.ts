import type { GameState } from '../../core/gameTypes';
import type {
  EmotionDimension,
} from '../../domain/emotion/emotionVisualSystem';
import type { GameTone } from '../../ui/design-system/types';

export interface PsychologicalStateChannel {
  id: EmotionDimension;
  label: string;
  value: number;
  level: string;
  tone: GameTone;
}

export interface PsychologicalStateReadModel {
  title: string;
  summary: string;
  guidance: string;
  dominantLabel: string;
  channels: PsychologicalStateChannel[];
}

const CHANNELS: Array<{
  id: EmotionDimension;
  label: string;
  tone: GameTone;
}> = [
  { id: 'humanity', label: 'الإنسانية', tone: 'progression' },
  { id: 'trust', label: 'الثقة', tone: 'memory' },
  { id: 'fear', label: 'الخوف', tone: 'danger' },
  { id: 'anger', label: 'الغضب', tone: 'danger' },
  { id: 'sadness', label: 'الحزن', tone: 'rare' },
  { id: 'corruption', label: 'الفساد', tone: 'rare' },
];

function levelFor(value: number): string {
  if (value >= 75) return 'مرتفع جدًا';
  if (value >= 50) return 'مرتفع';
  if (value >= 25) return 'متوسط';
  return 'منخفض';
}

function presentationFor(
  dominant: EmotionDimension | null,
): Pick<
  PsychologicalStateReadModel,
  'title' | 'summary' | 'guidance' | 'dominantLabel'
> {
  switch (dominant) {
    case 'humanity':
      return {
        title: 'Echo يتمسك بإنسانيته',
        summary: 'الذكريات الإنسانية تمنحه وضوحًا أكبر أمام ضغط النظام.',
        guidance: 'قرارات الرحمة والروابط الصادقة تعزز هذا الاتجاه.',
        dominantLabel: 'الإنسانية',
      };
    case 'trust':
      return {
        title: 'Echo يستجيب للرابط بينكما',
        summary: 'الثقة أصبحت العامل الأقوى في طريقته لفهم الأحداث.',
        guidance: 'اختياراتك القادمة قد تثبت هذا الرابط أو تزعزعه.',
        dominantLabel: 'الثقة',
      };
    case 'fear':
      return {
        title: 'الخوف يضغط على وعي Echo',
        summary: 'الإشارات المحيطة تبدو أكثر تهديدًا كلما ارتفع خوفه.',
        guidance: 'المواجهة الهادئة وكشف الحقائق قد يقللان هذا الضغط.',
        dominantLabel: 'الخوف',
      };
    case 'anger':
      return {
        title: 'الغضب يقود استجابة Echo',
        summary: 'ردوده أصبحت أكثر حدة تجاه النظام والذكريات المؤلمة.',
        guidance: 'القرارات الانتقامية قد تدفع الحالة إلى نقطة يصعب الرجوع عنها.',
        dominantLabel: 'الغضب',
      };
    case 'sadness':
      return {
        title: 'Echo يحمل أثرًا عاطفيًا ثقيلًا',
        summary: 'الحزن يبطئ استجابته ويغير الطريقة التي يستقبل بها الذكريات.',
        guidance: 'استعادة الروابط الإنسانية قد تمنحه مساحة للتعافي.',
        dominantLabel: 'الحزن',
      };
    case 'corruption':
      return {
        title: 'الفساد يتداخل مع هوية Echo',
        summary: 'إشارة النظام تؤثر بوضوح في حضوره واستجاباته.',
        guidance: 'كل قرار قادم مهم للحفاظ على ما تبقى من هويته.',
        dominantLabel: 'الفساد',
      };
    default:
      return {
        title: 'حالة Echo متوازنة حاليًا',
        summary: 'لا توجد عاطفة واحدة تسيطر على استجابته في هذه اللحظة.',
        guidance: 'الذكريات والقرارات القادمة ستحدد اتجاه حالته النفسية.',
        dominantLabel: 'متوازنة',
      };
  }
}

export function createPsychologicalStateReadModel(
  state: GameState,
  dominantEmotion: EmotionDimension | null,
): PsychologicalStateReadModel {
  return {
    ...presentationFor(dominantEmotion),
    channels: CHANNELS.map((channel) => ({
      ...channel,
      value: state.echo.personality[channel.id],
      level: levelFor(state.echo.personality[channel.id]),
    })),
  };
}
