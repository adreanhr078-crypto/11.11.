import {
  RARE_PLAYER_AVATAR_IDS,
  type RarePlayerAvatarId,
} from '../player-profile/playerProfile';
import type { LiveChallengeReward } from './liveChallengeContracts';

export interface WeeklyRewardPlan {
  reward: LiveChallengeReward;
  memoryFragmentId?: string;
  avatarId?: RarePlayerAvatarId;
}

export const WEEKLY_REWARD_PREVIEW: LiveChallengeReward = Object.freeze({
  tier: 'rare',
  kind: 'sealed',
  label: 'ملف ذاكرة نادر مختوم',
  icon: '✦',
});

const CHARACTER_REWARDS: Readonly<Record<RarePlayerAvatarId, LiveChallengeReward>> = Object.freeze({
  rare_yuki: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_yuki', avatarId: 'rare_yuki',
    label: 'أفاتار يوكي النادر', icon: '◇', imageSrc: '/assets/avatars/rare-yuki-v1.webp',
    storyExcerpt: 'إشارة يوكي الدافئة بقيت مرساة بشرية داخل ذاكرة إيكو.', sourceLabel: 'المانهوا · الصفحة 24',
  },
  rare_nara: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_nara', avatarId: 'rare_nara',
    label: 'أفاتار نارا النادر', icon: '◇', imageSrc: '/assets/avatars/rare-nara-v1.webp',
    storyExcerpt: 'أثر وداع نارا لم يختفِ؛ تحوّل إلى شظية تقاوم المحو.', sourceLabel: 'المانهوا · الصفحة 18',
  },
  rare_kenja: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_kenja', avatarId: 'rare_kenja',
    label: 'أفاتار كينجا النادر', icon: '◇', imageSrc: '/assets/avatars/rare-kenja-v1.webp',
    storyExcerpt: 'سجل كينجا يربط المعرفة المحظورة بأثر زيرو في العقد الثالث عشر.', sourceLabel: 'المانهوا · الصفحات 35–45',
  },
  rare_lina: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_lina', avatarId: 'rare_lina',
    label: 'أفاتار لينا النادر', icon: '◇', imageSrc: '/assets/avatars/rare-lina-v1.webp',
    storyExcerpt: 'بروتوكول لينا ظهر عند لحظة العقد الثاني ليعيد تعريف حدود إيكو.', sourceLabel: 'المانهوا · الصفحات 58–60',
  },
  rare_zero: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_zero', avatarId: 'rare_zero',
    label: 'أفاتار زيرو النادر', icon: '◇', imageSrc: '/assets/avatars/rare-zero-v1.webp',
    storyExcerpt: 'زيرو ليس ضوضاء عابرة؛ أثره يراقب الشقوق التي تتركها العقود.', sourceLabel: 'المانهوا · الصفحات 35–54',
  },
});

const MEMORY_SHARDS = [
  {
    id: 'yuki-warm-signal', title: 'شظية: الإشارة الدافئة', imageSrc: '/manhwa/final/page-024.webp',
    excerpt: 'ذكرى يوكي الدافئة بقيت داخل إيكو حتى عندما حاول النظام تفكيكها.', source: 'المانهوا · الصفحة 24',
  },
  {
    id: 'nara-farewell', title: 'شظية: وداع نارا', imageSrc: '/manhwa/final/page-018.webp',
    excerpt: 'وداع نارا ترك أثرًا يمكن استعادته من بين الشظايا البنفسجية.', source: 'المانهوا · الصفحة 18',
  },
  {
    id: 'kenja-zero-record', title: 'شظية: سجل كينجا', imageSrc: '/manhwa/final/page-040.webp',
    excerpt: 'سجل كينجا يكشف أن أثر زيرو كان حاضرًا قبل اكتمال التحول.', source: 'المانهوا · الصفحة 40',
  },
  {
    id: 'lina-protocol', title: 'شظية: بروتوكول لينا', imageSrc: '/manhwa/final/page-060.webp',
    excerpt: 'ظهور لينا يفتح بروتوكولًا جديدًا في ذاكرة العقد الثاني.', source: 'المانهوا · الصفحة 60',
  },
  {
    id: 'black-echo', title: 'شظية: بلاك إيكو', imageSrc: '/manhwa/final/page-062.webp',
    excerpt: 'بلاك إيكو هو حالة عقدية موثقة، لا تخمينًا يصنعه اللاعب.', source: 'المانهوا · الصفحة 62',
  },
] as const;

/**
 * Rewards are personal and sequential: shard, then the next unowned avatar.
 * This prevents a new player from receiving all character identities at once,
 * while every completed week still receives a period-unique memory record.
 */
export function weeklyRewardPlanFor(
  completedWeeklyRewards: number,
  weekId: string,
  unlockedAvatarIds: readonly RarePlayerAvatarId[],
): WeeklyRewardPlan {
  const completed = Math.max(0, Math.floor(completedWeeklyRewards));
  const unlocked = new Set(unlockedAvatarIds);
  const nextAvatar = RARE_PLAYER_AVATAR_IDS.find((avatarId) => !unlocked.has(avatarId));

  if (completed % 2 === 1 && nextAvatar) {
    return { reward: CHARACTER_REWARDS[nextAvatar], avatarId: nextAvatar };
  }

  const shard = MEMORY_SHARDS[Math.floor(completed / 2) % MEMORY_SHARDS.length]!;
  const memoryFragmentId = `weekly:${weekId}:${shard.id}`;
  return {
    memoryFragmentId,
    reward: {
      tier: 'rare',
      kind: 'memory-shard',
      rewardId: memoryFragmentId,
      label: shard.title,
      icon: '✦',
      imageSrc: shard.imageSrc,
      storyExcerpt: shard.excerpt,
      sourceLabel: shard.source,
    },
  };
}
