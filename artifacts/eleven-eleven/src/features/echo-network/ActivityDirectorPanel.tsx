import { useMemo, useState } from 'react';
import {
  recommendActivity,
  type ActivityBudget,
  type DirectedActivity,
} from '../../domain/echo-network/activityDirector';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import { GameButton, GlassPanel } from '../../ui/design-system';

export function ActivityDirectorPanel({
  locale,
  storyCompleted,
  dailyCompleted,
  weeklyCompletedStages,
  weeklyTotalStages,
  onlineAvailable,
  onChoose,
}: {
  locale: NetworkLocale;
  storyCompleted: number;
  dailyCompleted: boolean;
  weeklyCompletedStages: number;
  weeklyTotalStages: number;
  onlineAvailable: boolean;
  onChoose: (activity: DirectedActivity) => void;
}) {
  const [budget, setBudget] = useState<ActivityBudget>(15);
  const [recent, setRecent] = useState<DirectedActivity[]>([]);
  const recommendation = useMemo(() => recommendActivity({
    budgetMinutes: budget,
    storyCompleted,
    storyTotal: 20,
    dailyCompleted,
    weeklyCompletedStages,
    weeklyTotalStages,
    onlineAvailable,
    friendsOnline: 0,
    recentActivities: recent,
  }), [budget, dailyCompleted, onlineAvailable, recent, storyCompleted, weeklyCompletedStages, weeklyTotalStages]);

  return (
    <GlassPanel tone="rare" eyebrow="ACTIVITY DIRECTOR" title={locale === 'ar' ? 'كم لديك من الوقت؟' : 'How much time do you have?'}>
      <div className="echo-network-time-options" role="radiogroup" aria-label={locale === 'ar' ? 'الوقت المتاح' : 'Available time'}>
        {([5, 15, 30] as const).map((minutes) => (
          <GameButton
            key={minutes}
            size="sm"
            variant={budget === minutes ? 'rare' : 'ghost'}
            onClick={() => setBudget(minutes)}
          >
            {minutes} {locale === 'ar' ? 'دقائق' : 'min'}
          </GameButton>
        ))}
      </div>
      <div className="echo-network-recommendation">
        <span aria-hidden="true">11:11</span>
        <div><strong>{recommendation.title[locale]}</strong><p>{recommendation.reason[locale]}</p><small>≈ {recommendation.estimatedMinutes} min</small></div>
        <GameButton
          variant="rare"
          onClick={() => {
            setRecent((value) => [recommendation.activity, ...value].slice(0, 5));
            onChoose(recommendation.activity);
          }}
        >
          {locale === 'ar' ? 'ابدأ النشاط' : 'Start activity'}
        </GameButton>
      </div>
    </GlassPanel>
  );
}
