# UI Governance Audit — Phase 1

## Scope

This audit covers the active application shell, primary navigation, core screen
entry points, shared overlays, and actionable icon usage. Narrative, memory,
dialogue, cinematic, decision, progression, and persistence domain systems were
not changed.

## Navigation decision

The persistent game navigation has exactly six player-facing categories:

1. Story
2. Memory
3. Investigation
4. Characters
5. Progress
6. Settings

Each category owns one landing screen. Additional screens are available only
inside that category's submenu. A category with only one screen does not open a
redundant submenu.

## Single source of truth

- `GAME_SCREEN_DEFINITIONS` owns screen metadata and lazy component loading.
- `NAVIGATION_CATEGORIES` owns the six primary categories and landing screens.
- `GAME_ICON_REGISTRY` owns icon identity, system ownership, screen ownership,
  action identity, labels, descriptions, tooltips, tone, and glyph.
- `shellStore` stores runtime UI state only. It no longer defines a second list
  of screens or a second navigation model.

## Merged duplicate behavior

- The former bottom primary shortcuts and separate "more" menu were merged into
  the six-category navigation.
- The Echo dashboard's duplicate screen navigation was replaced with
  non-interactive journey context.
- The memory timeline preview no longer contains repeated buttons that all
  execute the same navigation action.
- Modal, drawer, notification, cinematic playback, main-menu, and shell actions
  now consume registered icons instead of local text glyphs.

## Visibility rules

- Persistent: six named categories, current screen identity, chapter progress,
  resource balance, system time, language, and pause.
- Submenu: cinematics, dialogue, day path, wishes, flowers, and system record.
- Context only: current chapter, recovered memory counts, latest decision, and
  world stability on the Echo dashboard.
- Hidden when space is constrained: the dashboard context rail. It is removed
  as a unit rather than collapsing into unexplained icon-only controls.

## Deprecation candidates — not deleted

The following areas should be assessed during later screen migrations. No file
or feature was removed in Phase 1:

- legacy navigation components that are not mounted by `ApplicationShell`;
- legacy screen-local SVG/icon implementations that are outside the active
  shell path;
- screen-local controls that represent an existing registered action;
- old layout variants superseded by the current cinematic shell.

Before deletion, each candidate must pass an import/reference audit, be listed
in a deletion report, and receive explicit approval.

## Player-facing rule

Every persistent or primary action must provide:

`Icon ID -> System -> Screen -> Action -> Label/Tooltip`

Decorative marks are permitted only when they have no action and are hidden from
assistive technology. Placeholder story/content values remain separate from
navigation semantics.
