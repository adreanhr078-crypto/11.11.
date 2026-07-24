import {
  Bell,
  BookOpen,
  Brain,
  ChevronLeft,
  Film,
  Flower2,
  Gem,
  Home,
  Languages,
  LockKeyhole,
  MessageCircle,
  Moon,
  Pause,
  Play,
  Puzzle,
  Route,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sun,
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
  | 'investigation'
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
    screenIds: ['dashboard', 'cinematic', 'dialogue', 'day', 'wishes'],
    actionId: 'navigation.open-story',
    label: { ar: 'القصة', en: 'Story' },
    description: {
      ar: 'متابعة الفصل والمشاهد والحوارات',
      en: 'Continue chapters, scenes, and dialogue',
    },
    tooltip: { ar: 'القصة', en: 'Story' },
    tone: 'danger',
    glyph: BookOpen,
  },
  'category-memory': {
    id: 'category-memory',
    systemId: 'memory',
    screenIds: ['memories', 'flowers'],
    actionId: 'navigation.open-memory',
    label: { ar: 'الذاكرة', en: 'Memory' },
    description: {
      ar: 'عرض الذكريات المستعادة والشظايا',
      en: 'View recovered memories and fragments',
    },
    tooltip: { ar: 'الذاكرة', en: 'Memory' },
    tone: 'memory',
    glyph: Brain,
  },
  'category-investigation': {
    id: 'category-investigation',
    systemId: 'investigation',
    screenIds: ['puzzles', 'overview'],
    actionId: 'navigation.open-investigation',
    label: { ar: 'التحقيق', en: 'Investigation' },
    description: {
      ar: 'إعادة بناء الأدلة والأحداث المفقودة',
      en: 'Reconstruct evidence and missing events',
    },
    tooltip: { ar: 'التحقيق', en: 'Investigation' },
    tone: 'memory',
    glyph: Search,
  },
  'category-characters': {
    id: 'category-characters',
    systemId: 'characters',
    screenIds: ['night'],
    actionId: 'navigation.open-characters',
    label: { ar: 'الشخصيات', en: 'Characters' },
    description: {
      ar: 'ملفات الشخصيات والعلاقات وتطور Echo',
      en: 'Character files, relationships, and Echo evolution',
    },
    tooltip: { ar: 'الشخصيات', en: 'Characters' },
    tone: 'rare',
    glyph: Users,
  },
  'category-progress': {
    id: 'category-progress',
    systemId: 'progress',
    screenIds: ['achievements'],
    actionId: 'navigation.open-progress',
    label: { ar: 'التقدم', en: 'Progress' },
    description: {
      ar: 'الإنجازات وحالة الرحلة والسجلات',
      en: 'Achievements, journey status, and records',
    },
    tooltip: { ar: 'التقدم', en: 'Progress' },
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
      ar: 'تخصيص اللعبة والصوت والجودة',
      en: 'Customize game, audio, and quality',
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
  'screen-dashboard': {
    id: 'screen-dashboard',
    systemId: 'story',
    screenIds: ['dashboard'],
    actionId: 'navigation.open-dashboard',
    label: { ar: 'نظام Echo', en: 'Echo system' },
    description: {
      ar: 'الحالة الحالية ومسار الرحلة',
      en: 'Current status and journey path',
    },
    tooltip: { ar: 'نظام Echo', en: 'Echo system' },
    tone: 'danger',
    glyph: Sparkles,
  },
  'screen-cinematic': {
    id: 'screen-cinematic',
    systemId: 'story',
    screenIds: ['cinematic'],
    actionId: 'navigation.open-cinematic',
    label: { ar: 'المشاهد', en: 'Cinematics' },
    description: {
      ar: 'تشغيل المشاهد والحلقات المستعادة',
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
    systemId: 'investigation',
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
  'screen-dialogue': {
    id: 'screen-dialogue',
    systemId: 'story',
    screenIds: ['dialogue'],
    actionId: 'navigation.open-dialogue',
    label: { ar: 'التواصل مع Echo', en: 'Echo dialogue' },
    description: {
      ar: 'الحوار والخيارات والقرارات',
      en: 'Dialogue, choices, and decisions',
    },
    tooltip: { ar: 'التواصل مع Echo', en: 'Echo dialogue' },
    tone: 'memory',
    glyph: MessageCircle,
  },
  'screen-day': {
    id: 'screen-day',
    systemId: 'story',
    screenIds: ['day'],
    actionId: 'navigation.open-day-path',
    label: { ar: 'المسار النهاري', en: 'Day path' },
    description: {
      ar: 'حالة الرحلة خارج طور 11:11',
      en: 'Journey state outside the 11:11 phase',
    },
    tooltip: { ar: 'المسار النهاري', en: 'Day path' },
    tone: 'progression',
    glyph: Sun,
  },
  'screen-wishes': {
    id: 'screen-wishes',
    systemId: 'story',
    screenIds: ['wishes'],
    actionId: 'navigation.open-wishes',
    label: { ar: 'الأمنيات', en: 'Wishes' },
    description: {
      ar: 'الروابط الشخصية التي تؤثر في الرحلة',
      en: 'Personal bonds that affect the journey',
    },
    tooltip: { ar: 'الأمنيات', en: 'Wishes' },
    tone: 'rare',
    glyph: Sparkles,
  },
  'screen-flowers': {
    id: 'screen-flowers',
    systemId: 'memory',
    screenIds: ['flowers'],
    actionId: 'navigation.open-memory-flower',
    label: { ar: 'زهرة الذاكرة', en: 'Memory flower' },
    description: {
      ar: 'قراءة نمو الذاكرة وحالتها',
      en: 'Read memory growth and condition',
    },
    tooltip: { ar: 'زهرة الذاكرة', en: 'Memory flower' },
    tone: 'rare',
    glyph: Flower2,
  },
  'screen-achievements': {
    id: 'screen-achievements',
    systemId: 'progress',
    screenIds: ['achievements'],
    actionId: 'navigation.open-achievements',
    label: { ar: 'الإنجازات', en: 'Achievements' },
    description: {
      ar: 'الإنجازات المكتشفة وتقدمها',
      en: 'Discovered achievements and their progress',
    },
    tooltip: { ar: 'الإنجازات', en: 'Achievements' },
    tone: 'progression',
    glyph: Trophy,
  },
  'screen-night': {
    id: 'screen-night',
    systemId: 'characters',
    screenIds: ['night'],
    actionId: 'navigation.open-echo-evolution',
    label: { ar: 'تطور Echo', en: 'Echo evolution' },
    description: {
      ar: 'تحولات Echo وتأثير حالته النفسية',
      en: 'Echo transformations and emotional effects',
    },
    tooltip: { ar: 'تطور Echo', en: 'Echo evolution' },
    tone: 'danger',
    glyph: Moon,
  },
  'screen-overview': {
    id: 'screen-overview',
    systemId: 'investigation',
    screenIds: ['overview'],
    actionId: 'navigation.open-system-journal',
    label: { ar: 'سجل النظام', en: 'System journal' },
    description: {
      ar: 'الأحداث والقرارات المكتشفة',
      en: 'Discovered events and decisions',
    },
    tooltip: { ar: 'سجل النظام', en: 'System journal' },
    tone: 'neutral',
    glyph: ScrollText,
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
  'utility-language': {
    id: 'utility-language',
    systemId: 'shell',
    screenIds: ['*'],
    actionId: 'shell.toggle-language',
    label: { ar: 'اللغة', en: 'Language' },
    description: {
      ar: 'تغيير لغة واجهة اللعبة',
      en: 'Change the game interface language',
    },
    tooltip: { ar: 'تبديل اللغة', en: 'Switch language' },
    tone: 'neutral',
    glyph: Languages,
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
  'resource-crystal': {
    id: 'resource-crystal',
    systemId: 'economy',
    screenIds: ['dashboard', 'puzzles'],
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
      ar: 'يتطلب شرط فتح إضافيًا',
      en: 'Requires an additional unlock condition',
    },
    tooltip: { ar: 'غير متاح بعد', en: 'Not available yet' },
    tone: 'neutral',
    glyph: LockKeyhole,
  },
  'status-route': {
    id: 'status-route',
    systemId: 'progress',
    screenIds: ['dashboard'],
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
