import type {
  SeasonActivityDefinition,
  SeasonDefinition,
} from './contracts';

export const ECHO_SEASON_DURATION_DAYS = 56;
export const ECHO_SEASON_EPOCH_MS = Date.parse('2026-08-10T11:11:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1_000;
const SEASON_MS = ECHO_SEASON_DURATION_DAYS * DAY_MS;
const CHARACTER_ROTATION = ['yuki', 'nara', 'kenja', 'lina', 'zero', 'echo'] as const;

const WEEK_COPY = [
  ['الأثر الدافئ', 'Warm Trace'],
  ['الوداع الذي لم يُسجّل', 'The Unrecorded Farewell'],
  ['سجل الحارس', 'The Warden Record'],
  ['بروتوكول لينا', 'Lina Protocol'],
  ['صفر داخل الضوضاء', 'Zero in the Noise'],
  ['صوت Echo الآخر', 'The Other Echo'],
] as const;

function seasonActivities(index: number): readonly SeasonActivityDefinition[] {
  const investigations = WEEK_COPY.map(([ar, en], week) => ({
    id: `season-${index + 1}-week-${week + 1}`,
    week: week + 1,
    kind: 'investigation' as const,
    title: { ar, en },
    description: {
      ar: 'قضية ذاكرة آمنة للـCanon تتغير أدلتها حسب أداء الفريق.',
      en: 'A Canon-safe memory case whose evidence adapts to the team.',
    },
    focusCharacter: CHARACTER_ROTATION[(index + week) % CHARACTER_ROTATION.length]!,
  }));
  return Object.freeze([
    ...investigations,
    {
      id: `season-${index + 1}-global-finale`,
      week: 7,
      kind: 'community-finale' as const,
      title: { ar: 'الاختراق العالمي', en: 'Global Breach' },
      description: {
        ar: 'تجتمع مساهمات اللاعبين لفتح القضية التعاونية الأخيرة.',
        en: 'Player contributions unlock the final cooperative case.',
      },
      focusCharacter: 'echo' as const,
    },
    {
      id: `season-${index + 1}-recovery`,
      week: 8,
      kind: 'recovery' as const,
      title: { ar: 'نافذة الاستدراك', en: 'Recovery Window' },
      description: {
        ar: 'أسبوع هادئ لإكمال ما فات قبل انتقال الموسم إلى الأرشيف.',
        en: 'A calm catch-up week before the season enters the archive.',
      },
      focusCharacter: 'echo' as const,
    },
  ]);
}

export function seasonAt(now = Date.now()): SeasonDefinition {
  const safeNow = Math.max(ECHO_SEASON_EPOCH_MS, now);
  const index = Math.floor((safeNow - ECHO_SEASON_EPOCH_MS) / SEASON_MS);
  const startsAtMs = ECHO_SEASON_EPOCH_MS + index * SEASON_MS;
  const endsAtMs = startsAtMs + SEASON_MS;
  return {
    id: `echo-fractures-s${String(index + 1).padStart(2, '0')}`,
    version: 1,
    title: {
      ar: `شقوق Echo // الموسم ${index + 1}`,
      en: `Echo Fractures // Season ${index + 1}`,
    },
    startsAt: new Date(startsAtMs).toISOString(),
    endsAt: new Date(endsAtMs).toISOString(),
    archiveAt: new Date(endsAtMs).toISOString(),
    activities: seasonActivities(index),
  };
}

export function seasonWeekAt(now = Date.now()): number {
  const season = seasonAt(now);
  const elapsed = Math.max(0, now - Date.parse(season.startsAt));
  return Math.min(8, Math.floor(elapsed / (7 * DAY_MS)) + 1);
}

export function nextSignalResetAt(now = Date.now()): string {
  const current = new Date(now);
  const candidate = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate(),
    11,
    11,
  );
  return new Date(candidate > now ? candidate : candidate + DAY_MS).toISOString();
}
