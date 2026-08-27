---
name: 11-11-react-patterns
description: Apply the established 11.11 React 19 + TypeScript patterns for components, hooks, state, forms, routing, and data fetching. Use before authoring or refactoring any React surface in the 11.11 project. Enforces Zustand for client state, TanStack Query for server state, wouter for routing, react-hook-form + Zod for forms, Radix UI primitives for accessible widgets, and Framer Motion for purposeful animation. Do not modify frozen game logic, puzzle canon, or other locked systems unless the task explicitly scopes to React UI only.
---

# 11.11 React Patterns

11.11 uses a deliberate, opinionated React 19 stack. Follow these patterns exactly to stay aligned with the rest of the application. New contributors should read this skill before writing any component, hook, or store.

## Active implementation facts

- **React version:** `react@^19.2.7` and `react-dom@^19.2.7`. The codebase uses function components, hooks, and React 19 features (e.g., `use()`, automatic batching, ref-as-prop).
- **TypeScript:** `~5.9.2`, strict mode enabled, `noUncheckedIndexedAccess` enforced. Named exports only; default exports are forbidden.
- **Routing:** `wouter@^3.3.5`. Use `wouter` hooks (`useLocation`, `useRoute`, `useParams`) and `<Route>`/`<Switch>` from `wouter` or `wouter/static`. The shell exposes `screenRegistry.ts` and `navigationRegistry.ts` for screen and entry registration.
- **Client state:** `zustand@^5.0.14` with the `useUiPreferencesStore` pattern. Stores live under `src/stores/` or feature-local `*.store.ts` files. Stores must be small, focused, and serializable; persist only via the project's storage adapter.
- **Server state:** `@tanstack/react-query@^5.x`. Use `useQuery`, `useMutation`, and `useInfiniteQuery` for all network reads/writes. Keep query keys stable, narrow, and co-located in `src/infrastructure/*/queries.ts`.
- **Forms:** `react-hook-form@^7.x` with `zod@^3.x` resolvers. Each form gets its own `*.schema.ts` next to the form file, with the same shape used for both client validation and server request bodies.
- **Accessible primitives:** `@radix-ui/*` (toast, separator, slot, etc.) for dialogs, dropdowns, tooltips, popovers, tabs, accordions, sliders, switch, radio, and toast. Always wrap Radix primitives in a 11.11-styled component, never expose them raw to the player.
- **Animation:** `framer-motion@^12.x` for purposeful, interruptible motion. Use `AnimatePresence` for mount/unmount transitions. Respect `useReducedMotion()` from `framer-motion`. Reserve perpetual motion for cinematic surfaces only.
- **Styling:** `tailwindcss@^4.x` via `@tailwindcss/vite`, with `class-variance-authority` + `clsx` + `tailwind-merge` (`cn` helper) for variant composition. No inline `style` props except for true dynamic values (positions, transforms).
- **Icons:** `lucide-react@^1.x`. Never import a new icon library. New icons must be created from `lucide-react` primitives or as 11.11-native SVGs.
- **Testing:** `tsx --test` for unit tests in `src/__tests__/`. Vitest for realtime worker tests. Playwright (E2E) for browser flows.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the existing feature module, store, and screen before changing React code.
3. Identify the smallest change that satisfies the task. Do not refactor unrelated files.
4. Follow the layering: `src/domain/` (pure logic) → `src/infrastructure/` (I/O) → `src/features/` (UI feature modules) → `src/app/` (shell + screens).
5. Run `npm run typecheck` after the change. Fix every new error, not just the ones you introduced.
6. Run `npm test` and update tests alongside behavior changes.
7. Run `npm run build` to catch build-only failures.
8. Run `npm run agent:postflight`. If it fails, do not declare success.

## Component rules

- One component per file. Co-locate `*.test.tsx` next to `Component.tsx`.
- File name = `PascalCase.tsx`. Export = named function: `export function PuzzleCard(...)`.
- Props type declared locally: `interface PuzzleCardProps { ... }`. No `React.FC`.
- Default to server-renderable, hydration-safe components. Avoid `useEffect` for data that can be derived or fetched on the server.
- Memoize only when measured: `useMemo`/`useCallback` for stable references passed to memoized children, never as a default.
- Lists use stable `key` props derived from domain IDs, not array indices.
- Empty/loading/error states are mandatory for every async surface.

## Hook rules

- Hooks are co-located with the feature (`src/features/<feature>/*.use.ts`) or shared in `src/lib/hooks/`.
- Custom hooks start with `use` and return a stable, named object — not a positional array, unless the value is intrinsically paired.
- Side effects inside `useEffect` must declare every dependency. No exhaustive-deps suppressions.
- Cleanup is mandatory: subscriptions, listeners, timers, abort controllers.
- Never call hooks conditionally. Use `useId`, `useSyncExternalStore`, or `use()` for new patterns.

## State rules

- Local UI state (`useState`, `useReducer`) for ephemeral view state only.
- Shared cross-component state goes in a Zustand store.
- Server data goes through React Query. Do not duplicate it into Zustand.
- Forms use `react-hook-form`; do not build ad-hoc input handlers.
- Persist Zustand state through the project's storage adapter only — never `localStorage` directly.

## Routing and screen rules

- Screens live under `src/features/screens/<Name>Screen.tsx`.
- Every screen is registered in `src/app/navigation/screenRegistry.ts`.
- Every nav entry is registered in `src/app/navigation/navigationRegistry.ts`.
- Bilingual copy uses the project's `t()` helper or the bilingual table under `src/i18n/`. No hardcoded player-facing strings.
- Each screen owns its loading, error, empty, offline, and permission-denied states.

## Form rules

- Schema first: define a Zod schema; infer the form value type via `z.infer<typeof schema>`.
- Use `zodResolver(schema)` with `useForm`.
- Field components live in `src/components/form/` and bind to `react-hook-form` via `Controller` only when no native input works.
- Submit handlers call the React Query mutation, surface server errors via `setError`, and trigger the authoritative success path (toast, navigation, reward receipt) — never grant XP, achievements, or rewards from the form.

## Animation rules

- `framer-motion` for entry, exit, completion, and reward moments.
- `prefers-reduced-motion` is honored automatically; provide a meaningful reduced-motion alternative.
- Do not animate decorative elements continuously. Perpetual motion competes with gameplay.
- Stagger durations stay short (≤ 300ms per step). Total choreography ≤ 1.2s unless cinematic.

## Accessibility rules (cross-reference `11-11-accessibility-testing`)

- Semantic HTML first. Use ARIA only when semantics are insufficient.
- Visible focus ring on every interactive element. Never `outline: none` without a replacement.
- Color-independent state cues (icon, label, shape) in addition to color.
- Touch targets ≥ 44px square.
- All player-facing copy is bilingual (`ar` and `en`).
- Keyboard navigation works for every interactive flow.

## Performance rules

- Lazy-load heavy surfaces with `React.lazy` + `<Suspense>`.
- Code-split by route via the router, not by component tree.
- Images: serve `WebP` when available, `loading="lazy"` for below-the-fold, explicit `width` and `height` to avoid CLS.
- For lists > 50 items, use virtualization (`@tanstack/react-virtual` or equivalent).
- Profile before optimizing: do not add `memo`/`useMemo` speculatively.

## Anti-patterns to refuse

- `React.FC` or `React.FunctionComponent` as a type.
- Default exports for components.
- `any` (use `unknown` + narrowing or a precise type).
- Inline object/array literals in JSX for hot paths.
- `useEffect` for derived state.
- Mutating Zustand state directly outside the store.
- Granting rewards, achievements, or XP from client code.
- Modifying frozen paths without explicit owner direction.
- Adding a new icon library.
- Hardcoded player-facing strings (English or Arabic).

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
- The frozen-source list at `artifacts/eleven-eleven/AGENT_RULES.md` section 6.
