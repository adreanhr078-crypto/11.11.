import { FINAL_MANHWA_ASSET_ROOT } from '../../content/manhwa/finalManhwa';
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

const OPENING_MANHWA_IMAGES = Object.freeze([
  `${FINAL_MANHWA_ASSET_ROOT}/page-007.webp`,
  `${FINAL_MANHWA_ASSET_ROOT}/page-009.webp`,
] as const);

const OPENING_SOURCE_LABELS = Object.freeze([
  'المانهوا المصححة · الصفحة 7',
  'المانهوا المصححة · الصفحة 9',
] as const);

/**
 * The `rare_*` values are durable player-profile compatibility keys. The
 * corrected publication has no approved character-avatar mapping yet, so the
 * live reward surface deliberately presents neutral archive signals instead
 * of inferring a person, transformation, or unreleased reveal from old art.
 */
const CHARACTER_REWARDS: Readonly<Record<RarePlayerAvatarId, LiveChallengeReward>> = Object.freeze({
  rare_yuki: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_yuki', avatarId: 'rare_yuki',
    label: 'شارة أرشيف نادرة 01', icon: '◇', imageSrc: OPENING_MANHWA_IMAGES[0],
    storyExcerpt: 'إشارة افتتاح محفوظة من بوابة 11:11؛ لا تمثل كشفاً سردياً جديداً.', sourceLabel: OPENING_SOURCE_LABELS[0],
  },
  rare_nara: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_nara', avatarId: 'rare_nara',
    label: 'شارة أرشيف نادرة 02', icon: '◇', imageSrc: OPENING_MANHWA_IMAGES[1],
    storyExcerpt: 'أثر آمن من الأرشيف المصحح، مخصص للواجهة فقط حتى اعتماد خريطة الشخصيات.', sourceLabel: OPENING_SOURCE_LABELS[1],
  },
  rare_kenja: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_kenja', avatarId: 'rare_kenja',
    label: 'شارة أرشيف نادرة 03', icon: '◇', imageSrc: OPENING_MANHWA_IMAGES[0],
    storyExcerpt: 'نبضة مرجعية من الافتتاح؛ لا تثبت هوية شخص أو دوراً في القصة.', sourceLabel: OPENING_SOURCE_LABELS[0],
  },
  rare_lina: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_lina', avatarId: 'rare_lina',
    label: 'شارة أرشيف نادرة 04', icon: '◇', imageSrc: OPENING_MANHWA_IMAGES[1],
    storyExcerpt: 'شظية واجهة محايدة من الإصدار المصحح، بلا علاقة أو تحول سردي معتمد.', sourceLabel: OPENING_SOURCE_LABELS[1],
  },
  rare_zero: {
    tier: 'rare', kind: 'avatar', rewardId: 'avatar:rare_zero', avatarId: 'rare_zero',
    label: 'شارة أرشيف نادرة 05', icon: '◇', imageSrc: OPENING_MANHWA_IMAGES[0],
    storyExcerpt: 'تردد مبكر من الأرشيف؛ يعرض الغموض فقط ولا يكشف كياناً أو عقداً.', sourceLabel: OPENING_SOURCE_LABELS[0],
  },
});

/**
 * These IDs are retained to avoid mutating historic weekly receipts. Their
 * player-facing copy and art are versioned-neutral opening fragments.
 */
const MEMORY_SHARDS = [
  {
    id: 'yuki-warm-signal', title: 'شظية: نبض الافتتاح', imageSrc: OPENING_MANHWA_IMAGES[0],
    excerpt: 'نبضة افتتاحية تعيد ترتيب الإشارة من دون إضافة كشف أو شخصية جديدة.', source: OPENING_SOURCE_LABELS[0],
  },
  {
    id: 'nara-farewell', title: 'شظية: نافذة الأرشيف', imageSrc: OPENING_MANHWA_IMAGES[1],
    excerpt: 'نافذة موثقة من الأرشيف المصحح؛ الهدف منها تدريب القراءة البصرية لا تأويل القصة.', source: OPENING_SOURCE_LABELS[1],
  },
  {
    id: 'kenja-zero-record', title: 'شظية: مسار الإشارة', imageSrc: OPENING_MANHWA_IMAGES[0],
    excerpt: 'مسار إشارة قصير يربط الملاحظة بالحل من دون كشف مرحلة لاحقة.', source: OPENING_SOURCE_LABELS[0],
  },
  {
    id: 'lina-protocol', title: 'شظية: مفتاح الوصول', imageSrc: OPENING_MANHWA_IMAGES[1],
    excerpt: 'مفتاح واجهة محايد يوضح أن الأرشيف يستجيب للترتيب الصحيح فقط.', source: OPENING_SOURCE_LABELS[1],
  },
  {
    id: 'black-echo', title: 'شظية: أثر صامت', imageSrc: OPENING_MANHWA_IMAGES[0],
    excerpt: 'أثر هادئ من الافتتاح يحافظ على الغموض إلى أن تعتمد مراجعة الـCanon الصفحات التالية.', source: OPENING_SOURCE_LABELS[0],
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
