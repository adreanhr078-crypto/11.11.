import {
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { GameTone } from './types';
import { cx, getNextEnabledIndex } from './utils';

export interface GameTabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface GameTabsProps {
  items: readonly GameTabItem[];
  value: string;
  onChange: (id: string) => void;
  tone?: GameTone;
  ariaLabel: string;
  className?: string;
}

export function GameTabs({
  items,
  value,
  onChange,
  tone = 'danger',
  ariaLabel,
  className,
}: GameTabsProps) {
  const instanceId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    direction: 1 | -1,
  ) => {
    const currentIndex = items.findIndex((item) => item.id === value);
    const nextIndex = getNextEnabledIndex(
      items.map((item) => Boolean(item.disabled)),
      Math.max(0, currentIndex),
      direction,
    );
    if (nextIndex < 0) return;
    event.preventDefault();
    onChange(items[nextIndex].id);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={cx('gds-tabs', className)}
      data-tone={tone}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            id={`${instanceId}-tab-${item.id}`}
            type="button"
            className="gds-tabs__trigger"
            role="tab"
            aria-selected={selected}
            aria-controls={`${instanceId}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') moveFocus(event, 1);
              if (event.key === 'ArrowLeft') moveFocus(event, -1);
              if (event.key === 'Home') {
                event.preventDefault();
                const first = getNextEnabledIndex(
                  items.map((candidate) => Boolean(candidate.disabled)),
                  -1,
                  1,
                );
                if (first >= 0) {
                  onChange(items[first].id);
                  refs.current[first]?.focus();
                }
              }
              if (event.key === 'End') {
                event.preventDefault();
                const last = getNextEnabledIndex(
                  items.map((candidate) => Boolean(candidate.disabled)),
                  0,
                  -1,
                );
                if (last >= 0) {
                  onChange(items[last].id);
                  refs.current[last]?.focus();
                }
              }
            }}
          >
            {item.icon && (
              <span className="gds-tabs__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.badge && <small>{item.badge}</small>}
          </button>
        );
      })}
    </div>
  );
}

export interface GameTabPanelProps {
  tabId: string;
  activeId: string;
  children: ReactNode;
  className?: string;
}

export function GameTabPanel({
  tabId,
  activeId,
  children,
  className,
}: GameTabPanelProps) {
  if (tabId !== activeId) return null;
  return (
    <div className={cx('gds-tab-panel', className)} role="tabpanel">
      {children}
    </div>
  );
}

