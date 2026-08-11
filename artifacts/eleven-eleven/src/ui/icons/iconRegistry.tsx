import {
  Bell,
  BookOpen,
  Brain,
  ChevronLeft,
  Film,
  Gem,
  HeartPulse,
  Home,
  LockKeyhole,
  Medal,
  MessageCircle,
  Pause,
  Play,
  Puzzle,
  Route,
  RefreshCw,
  RadioTower,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { GameTone } from '../design-system/types';
import { cx } from '../design-system/utils';

export type GameSystemId =
  | 'shell'
  | 'story'
  | 'memory'
  | 'puzzles'
  | 'network'
  | 'echo-mind'
  | 'characters'
  | 'progress'
  | 'settings'
  | 'economy';

export interface GameIconDefinition {
  id: string;
  systemId: GameSystemId;
  screenIds: readonly string[];
  actionId: string;
  label: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  tooltip: {
    ar: string;
    en: string;
  };
  tone: GameTone;
  glyph: LucideIcon;
}

export const GAME_ICON_REGISTRY = {
  'category-story': {
    id: 'category-story',
    systemId: 'story',
    screenIds: ['psychological-state'],
    actionId: 'navigation.open-story',
    label: { ar: 'القصة', en: 'Story' },
    description: {
      ar: 'متابعة الحالة النفسية الحالية لـ Echo',
      en: 'View Echo current psychological state',
    },
    tooltip: { ar: 'القصة', en: 'Story' },
    tone: 'danger',
    glyph: BookOpen,
  },
  'category-memory': {
    id: 'category-memory',
    systemId: 'memory',
    screenIds: ['memories'],
    actionId: 'navigation.open-memory',
    label: { ar: 'الذكريات', en: 'Memories' },
    description: {
      ar: 'عرض الذكريات المستعادة والشظايا',
      en: 'View recovered memories and fragments',
    },
    tooltip: { ar: 'الذكريات', en: 'Memories' },
    tone: 'memory',
    glyph: Brain,
  },
  'category-puzzles': {
    id: 'category-puzzles',
    systemId: 'puzzles',
    screenIds: ['puzzles'],
    actionId: 'navigation.open-puzzles',
    label: { ar: 'الألغاز', en: 'Puzzles' },
    description: {
      ar: 'إعادة بناء الأحداث المفقودة وحل العقد',
      en: 'Reconstruct missing events and solve core puzzles',
    },
    tooltip: { ar: 'الألغاز', en: 'Puzzles' },
    tone: 'memory',
    glyph: Puzzle,
  },
  'category-echo-mind': {
    id: 'category-echo-mind',
    systemId: 'echo-mind',
    screenIds: ['echo-mind'],
    actionId: 'navigation.open-echo-mind',
    label: { ar: 'Echo Mind', en: 'Echo Mind' },
    description: {
      ar: 'التحدث مع Echo ومراجعة حالته ومرجعياته',
      en: 'Talk with Echo and review his state and references',
    },
    tooltip: { ar: 'Echo Mind', en: 'Echo Mind' },
    tone: 'danger',
    glyph: MessageCircle,
  },
  'category-characters': {
    id: 'category-characters',
    systemId: 'characters',
    screenIds: ['characters'],
    actionId: 'navigation.open-characters',
    label: { ar: 'الشخصيات', en: 'Characters' },
    description: {
      ar: 'ملفات الشخصيات والعلاقات وتأثيرها على الرحلة',
      en: 'Character files, relationships, and journey impact',
    },
    tooltip: { ar: 'الشخصيات', en: 'Characters' },
    tone: 'rare',
    glyph: Users,
  },
  'category-progress': {
    id: 'category-progress',
    systemId: 'progress',
    screenIds: ['leaderboard'],
    actionId: 'navigation.open-leaderboard',
    label: { ar: 'الترتيب العالمي', en: 'Leaderboard' },
    description: {
      ar: 'ترتيب اللاعبين حسب إجمالي نقاط الخبرة',
      en: 'Global player ranking by total XP',
    },
    tooltip: { ar: 'الترتيب العالمي', en: 'Leaderboard' },
    tone: 'progression',
    glyph: Trophy,
  },
  'category-settings': {
    id: 'category-settings',
    systemId: 'settings',
    screenIds: ['settings'],
    actionId: 'navigation.open-settings',
    label: { ar: 'الإعدادات', en: 'Settings' },
    description: {
      ar: 'الصوت والجودة واللغة وإمكانية الوصول',
      en: 'Audio, quality, language, and accessibility',
    },
    tooltip: { ar: 'الإعدادات', en: 'Settings' },
    tone: 'neutral',
    glyph: Settings,
  },
  'screen-main-menu': {
    id: 'screen-main-menu',
    systemId: 'shell',
    screenIds: ['main-menu'],
    actionId: 'navigation.open-main-menu',
    label: { ar: 'القائمة الرئيسية', en: 'Main menu' },
    description: {
      ar: 'بدء الرحلة أو استكمالها',
      en: 'Start or continue the journey',
    },
    tooltip: { ar: 'القائمة الرئيسية', en: 'Main menu' },
    tone: 'danger',
    glyph: Home,
  },
  'screen-gameplay': {
    id: 'screen-gameplay',
    systemId: 'story',
    screenIds: ['play', 'awakening-ward'],
    actionId: 'gameplay.enter-awakening-ward',
    label: { ar: 'ابدأ اللعبة', en: 'Start game' },
    description: {
      ar: 'الدخول إلى جناح الاستيقاظ A-01',
      en: 'Enter Awakening Ward A-01',
    },
    tooltip: { ar: 'ابدأ اللعبة', en: 'Start game' },
    tone: 'memory',
    glyph: Play,
  },
  'screen-dashboard': {
    id: 'screen-dashboard',
    systemId: 'story',
    screenIds: ['dashboard'],
    actionId: 'navigation.open-dashboard',
    label: { ar: 'نظام Echo', en: 'Echo system' },
    description: {
      ar: 'الحالة الحالية ومسار الرحلة',
      en: 'Current state and journey path',
    },
    tooltip: { ar: 'نظام Echo', en: 'Echo system' },
    tone: 'danger',
    glyph: Sparkles,
  },
  'screen-psychological-state': {
    id: 'screen-psychological-state',
    systemId: 'story',
    screenIds: ['psychological-state'],
    actionId: 'navigation.open-psychological-state',
    label: { ar: 'الحالة النفسية', en: 'Psychological state' },
    description: {
      ar: 'قراءة مشاعر Echo وتأثير القرارات عليها',
      en: 'Read Echo emotions and how decisions affect them',
    },
    tooltip: { ar: 'الحالة النفسية', en: 'Psychological state' },
    tone: 'danger',
    glyph: HeartPulse,
  },
  'screen-cinematic': {
    id: 'screen-cinematic',
    systemId: 'story',
    screenIds: ['cinematic'],
    actionId: 'navigation.open-cinematic',
    label: { ar: 'المشهد السينمائي', en: 'Cinematic scene' },
    description: {
      ar: 'تشغيل الحلقات والمشاهد المستعادة',
      en: 'Play recovered scenes and episodes',
    },
    tooltip: { ar: 'المشاهد السينمائية', en: 'Cinematics' },
    tone: 'rare',
    glyph: Film,
  },
  'screen-memory': {
    id: 'screen-memory',
    systemId: 'memory',
    screenIds: ['memories'],
    actionId: 'navigation.open-memories',
    label: { ar: 'الذكريات', en: 'Memories' },
    description: {
      ar: 'عرض الذكريات المستعادة والشظايا',
      en: 'View recovered memories and fragments',
    },
    tooltip: { ar: 'الذكريات', en: 'Memories' },
    tone: 'memory',
    glyph: Brain,
  },
  'screen-puzzles': {
    id: 'screen-puzzles',
    systemId: 'puzzles',
    screenIds: ['puzzles'],
    actionId: 'navigation.open-puzzles',
    label: { ar: 'الألغاز', en: 'Puzzles' },
    description: {
      ar: 'إعادة بناء الأحداث المفقودة',
      en: 'Reconstruct missing events',
    },
    tooltip: { ar: 'الألغاز', en: 'Puzzles' },
    tone: 'memory',
    glyph: Puzzle,
  },
  'category-network': {
    id: 'category-network',
    systemId: 'network',
    screenIds: ['echo-network'],
    actionId: 'navigation.open-echo-network',
    label: { ar: 'شبكة Echo', en: 'Echo Network' },
    description: {
      ar: 'الشطرنج والتعاون والمواسم ومجتمع الإشارة',
      en: 'Chess, cooperation, seasons, and the Signal community',
    },
    tooltip: { ar: 'شبكة Echo', en: 'Echo Network' },
    tone: 'rare',
    glyph: RadioTower,
  },
  'screen-live-challenges': {
    id: 'screen-live-challenges',
    systemId: 'progress',
    screenIds: ['live-challenges'],
    actionId: 'navigation.open-live-challenges',
    label: { ar: 'الإشارات الحية', en: 'Live Signals' },
    description: {
      ar: 'إشارة 11:11 اليومية وتجربة النظام الأسبوعية',
      en: 'Daily 11:11 signal and weekly system trial',
    },
    tooltip: { ar: 'الإشارات الحية', en: 'Live Signals' },
    tone: 'danger',
    glyph: Puzzle,
  },
  'screen-echo-network': {
    id: 'screen-echo-network',
    systemId: 'network',
    screenIds: ['echo-network'],
    actionId: 'navigation.open-echo-network',
    label: { ar: 'شبكة Echo', en: 'Echo Network' },
    description: {
      ar: 'مركز اللعب المتجدد والأنشطة الاجتماعية الآمنة',
      en: 'The hub for renewable play and safe social activity',
    },
    tooltip: { ar: 'فتح شبكة Echo', en: 'Open Echo Network' },
    tone: 'rare',
    glyph: RadioTower,
  },
  'screen-echo-mind': {
    id: 'screen-echo-mind',
    systemId: 'echo-mind',
    screenIds: ['echo-mind'],
    actionId: 'navigation.open-echo-mind',
    label: { ar: 'Echo Mind', en: 'Echo Mind' },
    description: {
      ar: 'التواصل المباشر مع Echo وتتبع ردوده',
      en: 'Direct communication with Echo and response tracking',
    },
    tooltip: { ar: 'Echo Mind', en: 'Echo Mind' },
    tone: 'danger',
    glyph: MessageCircle,
  },
  'screen-dialogue': {
    id: 'screen-dialogue',
    systemId: 'story',
    screenIds: ['dialogue'],
    actionId: 'navigation.open-dialogue',
    label: { ar: 'الحوار', en: 'Dialogue' },
    description: {
      ar: 'الحوار والخيارات والقرارات',
      en: 'Dialogue, choices, and decisions',
    },
    tooltip: { ar: 'الحوار', en: 'Dialogue' },
    tone: 'memory',
    glyph: MessageCircle,
  },
  'screen-characters': {
    id: 'screen-characters',
    systemId: 'characters',
    screenIds: ['characters', 'profile'],
    actionId: 'navigation.open-characters',
    label: { ar: 'الشخصيات', en: 'Characters' },
    description: {
      ar: 'ملفات الشخصيات وأثرها على Echo',
      en: 'Character files and their impact on Echo',
    },
    tooltip: { ar: 'الشخصيات', en: 'Characters' },
    tone: 'rare',
    glyph: Users,
  },
  'screen-progress': {
    id: 'screen-progress',
    systemId: 'progress',
    screenIds: ['progress'],
    actionId: 'navigation.open-progress',
    label: { ar: 'التقدم', en: 'Progress' },
    description: {
      ar: 'تقدم الرحلة والإنجازات والنهايات المؤهلة',
      en: 'Journey progress, achievements, and eligible endings',
    },
    tooltip: { ar: 'التقدم', en: 'Progress' },
    tone: 'progression',
    glyph: Trophy,
  },
  'screen-leaderboard': {
    id: 'screen-leaderboard',
    systemId: 'progress',
    screenIds: ['leaderboard'],
    actionId: 'navigation.open-leaderboard',
    label: { ar: 'الترتيب العالمي', en: 'Leaderboard' },
    description: {
      ar: 'ترتيب اللاعبين حسب إجمالي نقاط الخبرة',
      en: 'Global player ranking by total XP',
    },
    tooltip: { ar: 'الترتيب العالمي', en: 'Leaderboard' },
    tone: 'progression',
    glyph: Medal,
  },
  'screen-settings': {
    id: 'screen-settings',
    systemId: 'settings',
    screenIds: ['settings'],
    actionId: 'navigation.open-settings',
    label: { ar: 'الإعدادات', en: 'Settings' },
    description: {
      ar: 'تخصيص اللعبة والصوت والجودة',
      en: 'Customize game, audio, and quality',
    },
    tooltip: { ar: 'الإعدادات', en: 'Settings' },
    tone: 'neutral',
    glyph: Settings,
  },
  'utility-pause': {
    id: 'utility-pause',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.open-pause',
    label: { ar: 'الإيقاف', en: 'Pause' },
    description: {
      ar: 'إيقاف التجربة وفتح خيارات النظام',
      en: 'Pause the experience and open system options',
    },
    tooltip: { ar: 'قائمة الإيقاف', en: 'Pause menu' },
    tone: 'neutral',
    glyph: Pause,
  },
  'utility-resume': {
    id: 'utility-resume',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.resume',
    label: { ar: 'استمرار اللعبة', en: 'Resume game' },
    description: {
      ar: 'العودة مباشرة إلى التجربة',
      en: 'Return directly to the experience',
    },
    tooltip: { ar: 'استمرار اللعبة', en: 'Resume game' },
    tone: 'danger',
    glyph: Play,
  },
  'utility-back': {
    id: 'utility-back',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.go-back',
    label: { ar: 'رجوع', en: 'Back' },
    description: {
      ar: 'العودة إلى الشاشة السابقة',
      en: 'Return to the previous screen',
    },
    tooltip: { ar: 'رجوع', en: 'Back' },
    tone: 'neutral',
    glyph: ChevronLeft,
  },
  'utility-close': {
    id: 'utility-close',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.close-overlay',
    label: { ar: 'إغلاق', en: 'Close' },
    description: {
      ar: 'إغلاق النافذة الحالية',
      en: 'Close the current overlay',
    },
    tooltip: { ar: 'إغلاق', en: 'Close' },
    tone: 'neutral',
    glyph: X,
  },
  'utility-notifications': {
    id: 'utility-notifications',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.open-notifications',
    label: { ar: 'الإشعارات', en: 'Notifications' },
    description: {
      ar: 'عرض أحداث النظام الجديدة',
      en: 'View new system events',
    },
    tooltip: { ar: 'الإشعارات', en: 'Notifications' },
    tone: 'neutral',
    glyph: Bell,
  },
  'utility-refresh': {
    id: 'utility-refresh',
    systemId: 'shell',
    screenIds: ['leaderboard'],
    actionId: 'leaderboard.refresh',
    label: { ar: 'تحديث', en: 'Refresh' },
    description: {
      ar: 'تحديث بيانات الترتيب العالمي',
      en: 'Refresh global leaderboard data',
    },
    tooltip: { ar: 'تحديث الترتيب', en: 'Refresh leaderboard' },
    tone: 'neutral',
    glyph: RefreshCw,
  },
  'resource-crystal': {
    id: 'resource-crystal',
    systemId: 'economy',
    screenIds: ['psychological-state', 'puzzles', 'progress'],
    actionId: 'economy.view-crystals',
    label: { ar: 'بلورات Echo', en: 'Echo crystals' },
    description: {
      ar: 'رصيد البلورات المتاح',
      en: 'Available crystal balance',
    },
    tooltip: { ar: 'بلورات Echo', en: 'Echo crystals' },
    tone: 'rare',
    glyph: Gem,
  },
  'status-locked': {
    id: 'status-locked',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'status.locked',
    label: { ar: 'مقفل', en: 'Locked' },
    description: {
      ar: 'يتطلب شرط فتح إضافي',
      en: 'Requires an additional unlock condition',
    },
    tooltip: { ar: 'غير متاح بعد', en: 'Not available yet' },
    tone: 'neutral',
    glyph: LockKeyhole,
  },
  'status-route': {
    id: 'status-route',
    systemId: 'progress',
    screenIds: ['psychological-state', 'progress'],
    actionId: 'progress.view-current-route',
    label: { ar: 'مسار الرحلة', en: 'Journey route' },
    description: {
      ar: 'الفصل الحالي والتقدم الفعلي',
      en: 'Current chapter and actual progress',
    },
    tooltip: { ar: 'مسار الرحلة', en: 'Journey route' },
    tone: 'progression',
    glyph: Route,
  },
} as const satisfies Record<string, GameIconDefinition>;

export type GameIconId = keyof typeof GAME_ICON_REGISTRY;

export const GAME_ICON_IDS = Object.freeze(
  Object.keys(GAME_ICON_REGISTRY) as GameIconId[],
);

export function getGameIconDefinition(
  id: GameIconId,
): GameIconDefinition {
  return GAME_ICON_REGISTRY[id];
}

export interface GameIconProps {
  id: GameIconId;
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  decorative?: boolean;
  title?: string;
}

export function GameIcon({
  id,
  className,
  size = '1em',
  strokeWidth = 1.8,
  decorative = true,
  title,
}: GameIconProps) {
  const definition = getGameIconDefinition(id);
  const Glyph = definition.glyph;
  const accessibleLabel = title ?? definition.label.ar;

  return (
    <Glyph
      className={cx('game-icon', className)}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : accessibleLabel}
      role={decorative ? undefined : 'img'}
    />
  );
}

export interface GameIconLabelProps {
  iconId: GameIconId;
  label?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function GameIconLabel({
  iconId,
  label,
  description,
  className,
  compact = false,
}: GameIconLabelProps) {
  const definition = getGameIconDefinition(iconId);

  return (
    <span
      className={cx('game-icon-label', className)}
      data-compact={compact || undefined}
    >
      <GameIcon id={iconId} className="game-icon-label__glyph" />
      <span className="game-icon-label__copy">
        <strong>{label ?? definition.label.ar}</strong>
        {!compact && (
          <small>{description ?? definition.description.ar}</small>
        )}
      </span>
    </span>
  );
}
