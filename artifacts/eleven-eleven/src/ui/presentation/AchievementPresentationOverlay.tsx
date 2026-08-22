import { useEffect } from 'react';
import { useStoryPuzzleStore } from '../../features/story-puzzles/storyPuzzleStore';
import { useAchievementPresentationQueue } from '../../application/ui/achievementPresentationQueue';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import { playAchievementUnlockSound } from '../../infrastructure/audio/puzzleRewardAudio';

export function AchievementPresentationOverlay() {
  const current = useAchievementPresentationQueue((state) => state.queue[0] ?? null);
  const dismiss = useAchievementPresentationQueue((state) => state.actions.dismiss);
  const rewardOpen = useStoryPuzzleStore((state) => state.latestReward !== null);
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);
  const locale = useUiPreferencesStore((state) => state.locale);
  const copy = locale === 'ar'
    ? {
      priority: 'سجل النظام // أولوية',
      updated: 'تم تحديث سجل النظام',
      unlocked: 'تم فتح إنجاز',
      cosmetic: 'تمت إضافة سجل تجميلي',
      dismiss: 'تخطي / متابعة',
      dismissLabel: 'تخطي رسالة الإنجاز ومتابعة اللعب',
      label: (title: string) => `تم فتح إنجاز: ${title}`,
    }
    : {
      priority: 'SYSTEM RECORD // PRIORITY',
      updated: 'SYSTEM RECORD UPDATED',
      unlocked: 'ACHIEVEMENT UNLOCKED',
      cosmetic: 'COSMETIC RECORD ADDED',
      dismiss: 'SKIP / CONTINUE',
      dismissLabel: 'Dismiss achievement and continue playing',
      label: (title: string) => `Achievement unlocked: ${title}`,
    };

  useEffect(() => {
    if (!current || rewardOpen) return undefined;
    if (audioEnabled) {
      playAchievementUnlockSound(current.tier, sfxVolume);
    }
    const duration = current.tier === 'system' ? 5200 : current.tier === 'rare' ? 3400 : 2200;
    const timer = window.setTimeout(dismiss, duration);
    return () => window.clearTimeout(timer);
  }, [audioEnabled, current, dismiss, rewardOpen, sfxVolume]);

  if (!current || rewardOpen) return null;

  return (
    <div
      className="achievement-presentation"
      data-tier={current.tier}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      lang={locale}
      role="status"
      aria-live="assertive"
      aria-label={copy.label(current.title)}
    >
      <div className="achievement-presentation__scan" aria-hidden="true" />
      <div className="achievement-presentation__emblem" aria-hidden="true">
        <span>{current.icon}</span>
      </div>
      <div className="achievement-presentation__copy">
        <small>{current.tier === 'system' ? copy.priority : copy.updated}</small>
        <strong>{copy.unlocked}</strong>
        <h2>{current.title}</h2>
        <p>{current.description}</p>
        {current.rewardCosmetics.length > 0 && (
          <span className="achievement-presentation__reward">{copy.cosmetic}</span>
        )}
      </div>
      <button type="button" aria-label={copy.dismissLabel} onClick={dismiss}>{copy.dismiss}</button>
    </div>
  );
}
