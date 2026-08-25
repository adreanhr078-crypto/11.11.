import { useId, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { EchoPresence } from '../../ui/presentation/EchoPresence';
import {
  resolveEchoCue,
  toEchoEventEnvelope,
  type EchoEventEnvelope,
  type EchoCue,
} from '../../domain/echo/echoDirector';
import { useStoryPuzzleStore } from '../../features/story-puzzles/storyPuzzleStore';
import { cx } from '../../ui/design-system';
import './mini-echo-companion.css';

export interface MiniEchoCompanionProps {
  /**
   * The parent derives this from the verified experience entitlement. A local
   * completion animation can never make the companion appear early.
   */
  available: boolean;
  locale: 'ar' | 'en';
  objectiveKind?: 'read' | 'solve' | 'complete';
  /** Surface-owned, non-authoritative activity such as a legal chess move. */
  event?: EchoEventEnvelope | null;
  className?: string;
  onSuggestedRoute?: (route: NonNullable<EchoCue['suggestedRoute']>) => void;
}

const COPY = {
  ar: {
    label: 'إيكو — ماذا أفعل الآن؟',
    title: 'إيكو',
    eyebrow: 'EX-011 // رابط الهدف',
    close: 'إغلاق مساعدة إيكو',
    action: 'افتح الدليل التالي',
  },
  en: {
    label: 'Echo — what should I do now?',
    title: 'Echo',
    eyebrow: 'EX-011 // OBJECTIVE LINK',
    close: 'Close Echo help',
    action: 'Open the next clue',
  },
} as const;

/**
 * A deliberately quiet companion dock. It owns no progression and never
 * floats above navigation: its parent places it beside a verified objective
 * on desktop and in normal document flow on touch layouts.
 */
export function MiniEchoCompanion({
  available,
  locale,
  objectiveKind = 'read',
  event,
  className,
  onSuggestedRoute,
}: MiniEchoCompanionProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const latestActivity = useStoryPuzzleStore((state) => state.latestActivity);
  const cue = useMemo(() => resolveEchoCue(
    event ?? (latestActivity ? toEchoEventEnvelope(latestActivity) : null),
    locale,
    objectiveKind,
  ), [event, latestActivity, locale, objectiveKind]);
  const copy = COPY[locale];
  const ActionChevron = locale === 'ar' ? ChevronLeft : ChevronRight;

  if (!available) return null;

  return (
    <aside
      className={cx('mini-echo-companion', className)}
      aria-label={copy.label}
      data-expression={cue.expression}
      data-gesture={cue.gesture}
      data-expanded={expanded}
    >
      <div className="mini-echo-companion__signal" aria-hidden="true" />
      <button
        type="button"
        className="mini-echo-companion__trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={expanded ? copy.close : copy.label}
        onClick={() => setExpanded((current) => !current)}
      >
        <span key={cue.cueId} className="mini-echo-companion__portrait" aria-hidden="true">
          <EchoPresence variant="mini" showTelemetry={false} label={copy.title} />
        </span>
        <span className="mini-echo-companion__identity">
          <Radio size={12} aria-hidden="true" />
          {copy.title}
        </span>
      </button>

      {expanded && (
        <section
          id={panelId}
          className="mini-echo-companion__panel"
          role="region"
          aria-label={copy.title}
        >
          <p className="mini-echo-companion__eyebrow">{copy.eyebrow}</p>
          <p className="mini-echo-companion__cue">{cue.text}</p>
          <p className="mini-echo-companion__caption">{cue.caption}</p>
          {cue.suggestedRoute && onSuggestedRoute && (
            <button
              type="button"
              className="mini-echo-companion__action"
              onClick={() => {
                setExpanded(false);
                onSuggestedRoute(cue.suggestedRoute!);
              }}
            >
              <span>{copy.action}</span>
              <ActionChevron size={16} aria-hidden="true" />
            </button>
          )}
        </section>
      )}
    </aside>
  );
}
