---
name: 11.11-autonomous-quality-gate
description: Mandatory quality-control workflow for every implementation, fix, refactor, UI change, gameplay integration, puzzle, progression, asset, or release task in the 11.11 game. It must verify the completed work, self-critique it, automatically fix safe defects, rerun verification, and refuse to report completion while known fixable problems remain.
---

# 11.11 Autonomous Quality Gate

Apply this workflow to every implementation, bug fix, refactor, UI change, gameplay integration, puzzle, progression, content, asset, data, system, or release task in the 11.11 repository.

The task is not complete because code was written, a build succeeded, or one test passed. Completion requires evidence that the requested behavior works, existing behavior remains safe, and known fixable defects have been corrected.

## Operating principles

- Read repository instructions before changing files. At minimum inspect the root `AGENTS.md` when present, the active project's `AGENT_RULES.md`, the active application path, and the relevant package scripts.
- Treat the current repository state as authoritative. Do not trust earlier reports that say PASS without rerunning the relevant checks.
- Identify the active runtime and edit only the intended project. Do not modify legacy or archived applications unless the task explicitly includes them.
- Preserve existing gameplay, Canon, progression, reward, persistence, authentication, and security authority. Do not replace working systems merely because a different architecture is preferred.
- Keep changes minimal and scoped. Do not add features, content, dependencies, helper scripts, or redesigns that the task does not require.
- Never expose secrets, tokens, private keys, credentials, player data, or sensitive diagnostic payloads in source, logs, screenshots, tests, or final reports.
- Never fabricate runtime evidence. Distinguish `PASS`, `FAIL`, `BLOCKED`, and `UNVERIFIED` explicitly.

## Mandatory lifecycle

Execute every stage and return to an earlier stage when evidence requires it:

`UNDERSTAND → INSPECT → PLAN → IMPLEMENT → VERIFY → SELF-CRITIQUE → AUTO-FIX SAFE DEFECTS → VERIFY AGAIN → REGRESSION REVIEW → FINAL DELIVERY`

### 1. UNDERSTAND

- Restate the requested outcome and acceptance criteria.
- Identify whether the task is code, data, UI, gameplay, content, asset, infrastructure, release, or a combination.
- Identify explicit constraints, protected systems, requested files, and any required final verdict or commit.
- Separate facts discovered in the repository from assumptions. Resolve risky assumptions by inspection before editing.

### 2. INSPECT

- Run a read-only repository audit before edits:
  - `git status`
  - `git diff`
  - `git log --oneline -10`
  - `git diff --check`
- Read applicable instructions and the active app's `package.json` scripts.
- Trace the real execution path: entry point, routing, stores, services, API/backend, persistence, configuration, tests, and production build.
- Search for duplicate implementations, stale imports, dead runtime paths, feature flags, fallback behavior, missing error handling, and existing tests.
- For UI or gameplay work, inspect the actual rendering and interaction path rather than only the component or store.
- For server or data work, inspect authorization, validation, ownership, idempotency, migrations, error responses, and persistence boundaries.
- Record unrelated pre-existing changes and do not overwrite them.

### 3. PLAN

- State the root cause or the smallest evidence-backed change that can satisfy the request.
- Define the files in scope and the files explicitly out of scope.
- Choose targeted tests and a complete verification matrix before implementation.
- Include failure, retry, stale-state, refresh, sign-out/sign-in, malformed input, network failure, and duplicate-trigger cases whenever the change can affect them.
- Prefer existing project utilities, stores, contracts, and test patterns over parallel systems.

### 4. IMPLEMENT

- Make only the planned changes.
- Preserve public contracts and backward compatibility unless the task explicitly authorizes a breaking change.
- Keep canonical gameplay and reward authority on the server or existing authoritative boundary.
- Make asynchronous paths bounded and settle every success, failure, cancellation, and stale-response path.
- Add diagnostics only when useful; keep them development-only and redact tokens, credentials, personal data, and full payloads.
- Add or update regression tests for the actual defect and its important edge cases.

### 5. VERIFY

Run the strongest applicable checks, not merely the fastest check. For the main 11.11 application, use the project's actual scripts, including as applicable:

- `npm run agent:preflight` before implementation when required by project rules.
- Targeted tests for the changed behavior.
- `npm run validate:content` for content or Canon-sensitive work.
- `npm run typecheck`.
- `npm test`.
- `npm run build`.
- `npm run agent:postflight` after implementation.
- `git diff --check`.

For UI, browser, mobile, or visual changes, use runtime inspection when the browser/runtime provider is available. Check the real player journey, responsive layout, loading/error/empty states, keyboard and touch input, RTL/Arabic presentation where relevant, console errors, network failures, and refresh persistence.

For backend, auth, sync, or persistence changes, verify successful flow plus 401/403, 404, 409, 500, timeout, malformed response, network failure, retry, duplicate request, stale response, UID/account change, refresh, sign-out/sign-in, and first-time rows where applicable.

Do not treat a passing build as proof of runtime correctness. Do not treat a rendered screen as proof of persistence or server correctness.

### 6. SELF-CRITIQUE

After the first verification pass, review the result as an independent senior engineer and QA lead:

- What can still remain stuck, silently fail, race, duplicate, regress, or claim success incorrectly?
- Did the change fix the root cause or only hide the symptom?
- Are all user-facing failure states understandable and recoverable?
- Are loading and retry paths bounded and idempotent?
- Did any stale response mutate a newer session or account?
- Did any response, input, save, reward, Canon event, or asset contract lose validation?
- Did the change introduce dead code, duplicate logic, unnecessary network work, bundle cost, layout breakage, accessibility issues, or mobile/RTL regressions?
- Did any test pass for the wrong reason or fail to cover the real path?
- Were secrets or sensitive identifiers added to diagnostics or committed files?

Search the final diff and changed execution path for evidence; do not rely on intuition.

### 7. AUTO-FIX SAFE DEFECTS

- Automatically correct defects that are clearly within the task scope, low-risk, reversible, and supported by repository evidence.
- Examples include missing validation, an unhandled rejection, a stale-response guard, an incorrect test assertion, an unreachable error state, a whitespace failure, or an omitted regression test.
- Do not silently expand the feature, alter Canon, change economy balance, rewrite unrelated architecture, or make a risky migration. Report and stop for owner direction when the fix is materially outside scope.
- After every safe fix, return to `VERIFY`; do not report completion from the first pass.

### 8. VERIFY AGAIN

- Rerun all checks affected by the fix and then the required project gate.
- Confirm the original failure path, the successful path, and the regression cases.
- Confirm that generated caches, build output, local databases, logs, screenshots, and runtime state are not accidentally staged.
- Re-run `git diff --check` after the final edit.

### 9. REGRESSION REVIEW

- Review the complete final diff, not only the last patch.
- Confirm only intended files changed and no unrelated user work was overwritten.
- Confirm no secret, credential, token, private key, or sensitive player data is present.
- Confirm protected systems remain intact: Canon, progression, rewards, persistence, auth, API ownership, security boundaries, and approved content.
- Confirm the worktree and index state match the requested delivery. Create a commit only when the user explicitly requests one or project workflow requires it.

### 10. FINAL DELIVERY

Report only what the evidence supports. Include:

- What changed and why.
- Root cause and how it was addressed when debugging was involved.
- Exact verification commands and results.
- Runtime/browser evidence, or an explicit `UNVERIFIED` statement explaining what was unavailable.
- Known warnings, remaining risks, and owner decisions.
- Commit hash and worktree status when a commit was requested.

If a known fixable defect remains, continue working. If an external blocker prevents completion, report `BLOCKED` with the exact blocker and the checks already completed. Never report a fabricated PASS.

## Quality gate decision

Use `PASS` only when the requested behavior is implemented, applicable verification is successful, self-critique found no remaining fixable defect, safe defects were fixed and reverified, and no required runtime evidence is being misrepresented.

Use `FAIL` when a required check fails or a known fixable defect remains.

Use `UNVERIFIED` for missing runtime or external evidence. `UNVERIFIED` is not `PASS` unless the project owner explicitly accepts the missing evidence and the final report says so.
