import type { LocalizedCopy } from './contracts';

export type ActivityBudget = 5 | 15 | 30;
export type DirectedActivity =
  | 'story'
  | 'daily'
  | 'weekly'
  | 'chess'
  | 'coop'
  | 'community';

export interface ActivityDirectorInput {
  budgetMinutes: ActivityBudget;
  storyCompleted: number;
  storyTotal: number;
  dailyCompleted: boolean;
  weeklyCompletedStages: number;
  weeklyTotalStages: number;
  onlineAvailable: boolean;
  friendsOnline: number;
  recentActivities: readonly DirectedActivity[];
}

export interface ActivityRecommendation {
  activity: DirectedActivity;
  estimatedMinutes: number;
  title: LocalizedCopy;
  reason: LocalizedCopy;
}

const PRESENTATION: Record<DirectedActivity, Omit<ActivityRecommendation, 'activity'>> = {
  story: {
    estimatedMinutes: 12,
    title: { ar: 'استعد الذكرى التالية', en: 'Recover the next memory' },
    reason: { ar: 'القصة هي المسار الأساسي لتطور Echo.', en: 'Story remains Echo’s main growth path.' },
  },
  daily: {
    estimatedMinutes: 5,
    title: { ar: 'التقط إشارة اليوم', en: 'Catch today’s signal' },
    reason: { ar: 'لغز قصير ومتجدد بلا عقوبة عند تفويته.', en: 'A short fresh puzzle with no missed-day penalty.' },
  },
  weekly: {
    estimatedMinutes: 25,
    title: { ar: 'واصل القضية الأسبوعية', en: 'Continue the weekly case' },
    reason: { ar: 'مرحلة محفوظة تقربك من شظية أو مظهر نادر.', en: 'A saved stage toward a rare shard or cosmetic.' },
  },
  chess: {
    estimatedMinutes: 15,
    title: { ar: 'ادخل شطرنج العقد', en: 'Enter Contract Chess' },
    reason: { ar: 'اختبار إتقان عادل بقواعد واضحة.', en: 'A fair mastery test with clear rules.' },
  },
  coop: {
    estimatedMinutes: 18,
    title: { ar: 'افتح اختراقًا تعاونيًا', en: 'Open a cooperative breach' },
    reason: { ar: 'هناك أصدقاء متصلون وأدلة لا يراها لاعب واحد.', en: 'Friends are online and no one player sees every clue.' },
  },
  community: {
    estimatedMinutes: 5,
    title: { ar: 'راجع لوحة الإشارة', en: 'Review the Signal Board' },
    reason: { ar: 'اطلع على أخبار الموسم وألغاز المجتمع المعتمدة.', en: 'See season news and approved community puzzles.' },
  },
};

function wasRecent(activity: DirectedActivity, recent: readonly DirectedActivity[]): boolean {
  return recent.slice(0, 3).includes(activity);
}

export function recommendActivity(input: ActivityDirectorInput): ActivityRecommendation {
  let activity: DirectedActivity;
  if (input.budgetMinutes === 5 && !input.dailyCompleted) {
    activity = 'daily';
  } else if (
    input.onlineAvailable
    && input.friendsOnline > 0
    && input.budgetMinutes >= 15
    && !wasRecent('coop', input.recentActivities)
  ) {
    activity = 'coop';
  } else if (
    input.budgetMinutes >= 30
    && input.weeklyCompletedStages < input.weeklyTotalStages
    && !wasRecent('weekly', input.recentActivities)
  ) {
    activity = 'weekly';
  } else if (
    input.storyCompleted < input.storyTotal
    && !wasRecent('story', input.recentActivities)
  ) {
    activity = 'story';
  } else if (input.onlineAvailable && input.budgetMinutes >= 15) {
    activity = wasRecent('chess', input.recentActivities) ? 'coop' : 'chess';
  } else {
    activity = input.dailyCompleted ? 'community' : 'daily';
  }
  return { activity, ...PRESENTATION[activity] };
}
